"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'psychometric-coach-super-secret-jwt-key-2026';
const COST_PER_1K_IMPRESSIONS = 2.50; // $2.50 USD per 1,000 impressions (Banner CPM base rate)
// ── Advertiser auth middleware ────────────────────────────────────────────────
function adAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!payload.advertiserId) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        req.advertiserId = payload.advertiserId;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
// ── Public: serve active ads for display ─────────────────────────────────────
// GET /ads/serve?slot=BANNER&page=dashboard — returns one active ad for the slot
router.get('/serve', async (req, res) => {
    try {
        const { slot = 'BANNER', page } = req.query;
        const now = new Date();
        const ad = await prisma_1.prisma.ad.findFirst({
            where: {
                status: 'APPROVED',
                slot: slot,
                OR: [{ startDate: null }, { startDate: { lte: now } }],
                AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
            },
            select: {
                id: true, headline: true, bodyText: true, ctaText: true, ctaUrl: true,
                imageUrl: true, slot: true, advertiser: { select: { companyName: true } },
            },
            orderBy: { impressions: 'asc' }, // round-robin: least shown first
        });
        if (!ad) {
            res.status(204).end();
            return;
        }
        // Record impression async (don't wait)
        prisma_1.prisma.adEvent.create({
            data: {
                adId: ad.id,
                type: 'IMPRESSION',
                page: page || null,
                userAgent: req.headers['user-agent'] || null,
                ip: (req.ip || '').replace('::ffff:', ''),
            },
        }).then(() => prisma_1.prisma.ad.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } }))
            .catch(() => { });
        res.json(ad);
    }
    catch {
        res.status(500).json({ error: 'Failed to serve ad' });
    }
});
// POST /ads/click/:id — record a click
router.post('/click/:id', async (req, res) => {
    try {
        const ad = await prisma_1.prisma.ad.findUnique({
            where: { id: req.params.id },
            select: { id: true, ctaUrl: true, status: true },
        });
        if (!ad || ad.status !== 'APPROVED') {
            res.status(404).json({ error: 'Ad not found' });
            return;
        }
        await prisma_1.prisma.adEvent.create({
            data: {
                adId: ad.id,
                type: 'CLICK',
                page: req.body.page || null,
                userAgent: req.headers['user-agent'] || null,
                ip: (req.ip || '').replace('::ffff:', ''),
            },
        });
        await prisma_1.prisma.ad.update({ where: { id: ad.id }, data: { clicks: { increment: 1 } } });
        res.json({ url: ad.ctaUrl });
    }
    catch {
        res.status(500).json({ error: 'Failed to record click' });
    }
});
// ── Advertiser registration & login ──────────────────────────────────────────
// POST /ads/advertiser/register
router.post('/advertiser/register', [
    (0, express_validator_1.body)('companyName').notEmpty().trim(),
    (0, express_validator_1.body)('contactName').notEmpty().trim(),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('website').optional().isURL(),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { companyName, contactName, email, password, phone, website } = req.body;
    try {
        const existing = await prisma_1.prisma.advertiser.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const advertiser = await prisma_1.prisma.advertiser.create({
            data: { companyName, contactName, email, passwordHash, phone, website },
            select: { id: true, companyName: true, contactName: true, email: true, verified: true },
        });
        const token = jsonwebtoken_1.default.sign({ advertiserId: advertiser.id }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ advertiser, token });
    }
    catch {
        res.status(500).json({ error: 'Registration failed' });
    }
});
// POST /ads/advertiser/login
router.post('/advertiser/login', [(0, express_validator_1.body)('email').isEmail(), (0, express_validator_1.body)('password').notEmpty()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        const advertiser = await prisma_1.prisma.advertiser.findUnique({ where: { email } });
        if (!advertiser) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const ok = await bcryptjs_1.default.compare(password, advertiser.passwordHash);
        if (!ok) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ advertiserId: advertiser.id }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            token,
            advertiser: { id: advertiser.id, companyName: advertiser.companyName, email: advertiser.email, verified: advertiser.verified },
        });
    }
    catch {
        res.status(500).json({ error: 'Login failed' });
    }
});
// GET /ads/advertiser/me
router.get('/advertiser/me', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const advertiser = await prisma_1.prisma.advertiser.findUnique({
            where: { id: advertiserId },
            select: { id: true, companyName: true, contactName: true, email: true, phone: true, website: true, verified: true, createdAt: true },
        });
        if (!advertiser) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(advertiser);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// ── Advertiser: manage their ads ─────────────────────────────────────────────
// GET /ads/advertiser/ads — list my ads
router.get('/advertiser/ads', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const ads = await prisma_1.prisma.ad.findMany({
            where: { advertiserId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(ads);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/advertiser/ads — create new ad
router.post('/advertiser/ads', adAuth, [
    (0, express_validator_1.body)('title').notEmpty().trim(),
    (0, express_validator_1.body)('headline').notEmpty().trim().isLength({ max: 80 }),
    (0, express_validator_1.body)('bodyText').notEmpty().trim().isLength({ max: 200 }),
    (0, express_validator_1.body)('ctaText').optional().trim().isLength({ max: 30 }),
    (0, express_validator_1.body)('ctaUrl').isURL(),
    (0, express_validator_1.body)('slot').isIn(['BANNER', 'SIDEBAR', 'IN_FEED', 'FOOTER_BANNER']),
    (0, express_validator_1.body)('budget').isFloat({ min: 100 }),
    (0, express_validator_1.body)('startDate').optional().isISO8601(),
    (0, express_validator_1.body)('endDate').optional().isISO8601(),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const advertiserId = req.advertiserId;
    const { title, headline, bodyText, ctaText, ctaUrl, imageUrl, slot, budget, startDate, endDate, targetPages } = req.body;
    try {
        const ad = await prisma_1.prisma.ad.create({
            data: {
                advertiserId,
                title,
                headline,
                bodyText,
                ctaText: ctaText || 'Learn More',
                ctaUrl,
                imageUrl,
                slot: slot,
                budget: Number(budget),
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                targetPages: targetPages || [],
                status: 'DRAFT',
            },
        });
        res.status(201).json(ad);
    }
    catch {
        res.status(500).json({ error: 'Failed to create ad' });
    }
});
// PATCH /ads/advertiser/ads/:id — update draft ad
router.patch('/advertiser/ads/:id', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const ad = await prisma_1.prisma.ad.findFirst({ where: { id: req.params.id, advertiserId } });
        if (!ad) {
            res.status(404).json({ error: 'Ad not found' });
            return;
        }
        if (!['DRAFT', 'REJECTED'].includes(ad.status)) {
            res.status(400).json({ error: 'Can only edit DRAFT or REJECTED ads' });
            return;
        }
        const { title, headline, bodyText, ctaText, ctaUrl, imageUrl, slot, budget, startDate, endDate } = req.body;
        const updated = await prisma_1.prisma.ad.update({
            where: { id: ad.id },
            data: {
                ...(title && { title }),
                ...(headline && { headline }),
                ...(bodyText && { bodyText }),
                ...(ctaText && { ctaText }),
                ...(ctaUrl && { ctaUrl }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(slot && { slot: slot }),
                ...(budget && { budget: Number(budget) }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
            },
        });
        res.json(updated);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/advertiser/ads/:id/submit — submit draft for review
router.post('/advertiser/ads/:id/submit', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const ad = await prisma_1.prisma.ad.findFirst({ where: { id: req.params.id, advertiserId } });
        if (!ad) {
            res.status(404).json({ error: 'Ad not found' });
            return;
        }
        if (!['DRAFT', 'REJECTED'].includes(ad.status)) {
            res.status(400).json({ error: 'Only DRAFT or REJECTED ads can be submitted' });
            return;
        }
        const updated = await prisma_1.prisma.ad.update({ where: { id: ad.id }, data: { status: 'PENDING' } });
        res.json(updated);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/advertiser/ads/:id/pause — toggle pause
router.post('/advertiser/ads/:id/pause', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const ad = await prisma_1.prisma.ad.findFirst({ where: { id: req.params.id, advertiserId } });
        if (!ad) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        if (!['APPROVED', 'PAUSED'].includes(ad.status)) {
            res.status(400).json({ error: 'Only APPROVED or PAUSED ads can be toggled' });
            return;
        }
        const updated = await prisma_1.prisma.ad.update({
            where: { id: ad.id },
            data: { status: ad.status === 'APPROVED' ? 'PAUSED' : 'APPROVED' },
        });
        res.json(updated);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /ads/advertiser/ads/:id/stats — detailed stats
router.get('/advertiser/ads/:id/stats', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const ad = await prisma_1.prisma.ad.findFirst({ where: { id: req.params.id, advertiserId } });
        if (!ad) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const events = await prisma_1.prisma.adEvent.findMany({
            where: { adId: ad.id },
            select: { type: true, createdAt: true },
        });
        // Daily breakdown for last 30 days
        const dailyMap = new Map();
        events.forEach(e => {
            const day = e.createdAt.toISOString().slice(0, 10);
            if (!dailyMap.has(day))
                dailyMap.set(day, { impressions: 0, clicks: 0 });
            const d = dailyMap.get(day);
            if (e.type === 'IMPRESSION')
                d.impressions++;
            else
                d.clicks++;
        });
        const daily = Array.from(dailyMap.entries())
            .map(([date, d]) => ({ date, ...d }))
            .sort((a, b) => a.date.localeCompare(b.date));
        const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
        const estimatedReach = Math.round(ad.impressions * 1.2);
        res.json({
            ad: { id: ad.id, title: ad.title, status: ad.status, budget: ad.budget, spent: ad.spent },
            impressions: ad.impressions,
            clicks: ad.clicks,
            ctr: Math.round(ctr * 100) / 100,
            estimatedReach,
            costPer1kImpressions: COST_PER_1K_IMPRESSIONS,
            daily,
        });
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /ads/advertiser/payments — list payments
router.get('/advertiser/payments', adAuth, async (req, res) => {
    const advertiserId = req.advertiserId;
    try {
        const payments = await prisma_1.prisma.adPayment.findMany({
            where: { advertiserId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(payments);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/advertiser/payments — submit payment
router.post('/advertiser/payments', adAuth, [(0, express_validator_1.body)('amount').isFloat({ min: 100 }), (0, express_validator_1.body)('method').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CARD'])], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const advertiserId = req.advertiserId;
    const { amount, method, reference, adId, notes } = req.body;
    try {
        const payment = await prisma_1.prisma.adPayment.create({
            data: {
                advertiserId,
                adId: adId || null,
                amount: Number(amount),
                method: method,
                reference: reference || null,
                notes: notes || null,
            },
        });
        res.status(201).json(payment);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// ── Admin routes (requires admin JWT) ────────────────────────────────────────
// GET /ads/admin/pending — all pending ads
router.get('/admin/pending', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const ads = await prisma_1.prisma.ad.findMany({
            where: { status: 'PENDING' },
            include: { advertiser: { select: { companyName: true, email: true, verified: true } } },
            orderBy: { createdAt: 'asc' },
        });
        res.json(ads);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /ads/admin/all — all ads
router.get('/admin/all', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const ads = await prisma_1.prisma.ad.findMany({
            include: { advertiser: { select: { companyName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(ads);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/admin/ads/:id/approve
router.post('/admin/ads/:id/approve', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const ad = await prisma_1.prisma.ad.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED' },
        });
        res.json(ad);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/admin/ads/:id/reject
router.post('/admin/ads/:id/reject', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    const { reason } = req.body;
    try {
        const ad = await prisma_1.prisma.ad.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED', rejectedNote: reason || 'Does not meet our advertising standards.' },
        });
        res.json(ad);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /ads/admin/advertisers — all advertisers
router.get('/admin/advertisers', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const advertisers = await prisma_1.prisma.advertiser.findMany({
            include: { _count: { select: { ads: true, payments: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(advertisers);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/admin/advertisers/:id/verify
router.post('/admin/advertisers/:id/verify', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const a = await prisma_1.prisma.advertiser.update({ where: { id: req.params.id }, data: { verified: true } });
        res.json(a);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /ads/admin/payments — all payments
router.get('/admin/payments', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const payments = await prisma_1.prisma.adPayment.findMany({
            include: { advertiser: { select: { companyName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        res.json(payments);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// POST /ads/admin/payments/:id/confirm
router.post('/admin/payments/:id/confirm', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const payment = await prisma_1.prisma.adPayment.update({
            where: { id: req.params.id },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });
        // If linked to an ad, top up budget
        if (payment.adId) {
            await prisma_1.prisma.ad.update({
                where: { id: payment.adId },
                data: { budget: { increment: payment.amount } },
            });
        }
        res.json(payment);
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /ads/admin/stats — revenue dashboard
router.get('/admin/stats', auth_1.authenticate, async (req, res) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const [totalAds, activeAds, pendingAds, totalAdvertisers, payments, adAgg] = await Promise.all([
            prisma_1.prisma.ad.count(),
            prisma_1.prisma.ad.count({ where: { status: 'APPROVED' } }),
            prisma_1.prisma.ad.count({ where: { status: 'PENDING' } }),
            prisma_1.prisma.advertiser.count(),
            prisma_1.prisma.adPayment.findMany({ where: { status: 'CONFIRMED' } }),
            prisma_1.prisma.ad.aggregate({ _sum: { impressions: true, clicks: true, spent: true } }),
        ]);
        const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
        res.json({
            totalAds, activeAds, pendingAds, totalAdvertisers, totalRevenue,
            totalImpressions: adAgg._sum.impressions || 0,
            totalClicks: adAgg._sum.clicks || 0,
            totalSpent: adAgg._sum.spent || 0,
            ctr: adAgg._sum.impressions
                ? (((adAgg._sum.clicks || 0) / adAgg._sum.impressions) * 100).toFixed(2)
                : '0.00',
        });
    }
    catch {
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
//# sourceMappingURL=ads.js.map