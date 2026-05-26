"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const adaptive_1 = require("../services/adaptive");
const router = (0, express_1.Router)();
// POST /attempts
router.post('/', auth_1.authenticate, [
    (0, express_validator_1.body)('questionId').notEmpty(),
    (0, express_validator_1.body)('selectedOption').notEmpty(),
    (0, express_validator_1.body)('timeTaken').isInt({ min: 0 }),
    (0, express_validator_1.body)('mode').optional().customSanitizer((v) => v?.toUpperCase()).isIn(['DIAGNOSTIC', 'PRACTICE', 'TIMED', 'MOCK', 'REVIEW']),
    (0, express_validator_1.body)('confidence').optional().isInt({ min: 1, max: 5 }),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { questionId, selectedOption, timeTaken, confidence, sessionId, mode } = req.body;
    try {
        const question = await prisma_1.default.question.findUnique({ where: { id: questionId } });
        if (!question) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        const options = question.options;
        const selectedOpt = options.find((o) => o.id === selectedOption);
        const isCorrect = selectedOpt?.isCorrect ?? false;
        const attempt = await prisma_1.default.attempt.create({
            data: {
                userId: req.user.id,
                questionId,
                selectedOption,
                isCorrect,
                timeTaken,
                confidence: confidence ?? null,
                sessionId: sessionId ?? null,
                mode: mode ?? 'PRACTICE',
            },
        });
        // Update streak
        await updateStreak(req.user.id);
        // Async readiness update (fire and forget)
        (0, adaptive_1.updateReadinessScore)(req.user.id).catch(() => { });
        res.status(201).json({
            attempt,
            isCorrect,
            correctOptionId: options.find((o) => o.isCorrect)?.id,
            explanation: question.explanation,
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to record attempt' });
    }
});
// GET /attempts/stats
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const attempts = await prisma_1.default.attempt.findMany({
            where: { userId: req.user.id },
            include: {
                question: {
                    select: { categoryId: true, category: { select: { name: true, slug: true, icon: true } } },
                },
            },
        });
        const statsMap = new Map();
        for (const a of attempts) {
            const cid = a.question.categoryId;
            if (!statsMap.has(cid)) {
                statsMap.set(cid, {
                    categoryName: a.question.category.name,
                    slug: a.question.category.slug,
                    icon: a.question.category.icon,
                    correct: 0,
                    total: 0,
                    totalTime: 0,
                });
            }
            const s = statsMap.get(cid);
            s.total += 1;
            if (a.isCorrect)
                s.correct += 1;
            s.totalTime += a.timeTaken;
        }
        const stats = Array.from(statsMap.entries()).map(([categoryId, s]) => ({
            categoryId,
            categoryName: s.categoryName,
            slug: s.slug,
            icon: s.icon,
            accuracy: s.total > 0 ? s.correct / s.total : 0,
            avgTime: s.total > 0 ? s.totalTime / s.total : 0,
            total: s.total,
            correct: s.correct,
        }));
        const totalAttempts = stats.reduce((sum, s) => sum + s.total, 0);
        const totalCorrect = stats.reduce((sum, s) => sum + s.correct, 0);
        res.json({
            byCategory: stats,
            total: totalAttempts,
            correct: totalCorrect,
            accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
// GET /attempts/heatmap
router.get('/heatmap', auth_1.authenticate, async (req, res) => {
    try {
        const attempts = await prisma_1.default.attempt.findMany({
            where: { userId: req.user.id },
            include: {
                question: {
                    select: {
                        subSkill: true,
                        categoryId: true,
                        category: { select: { name: true } },
                    },
                },
            },
        });
        const heatmap = new Map();
        for (const a of attempts) {
            const key = `${a.question.categoryId}::${a.question.subSkill}`;
            if (!heatmap.has(key)) {
                heatmap.set(key, {
                    subSkill: a.question.subSkill,
                    categoryId: a.question.categoryId,
                    categoryName: a.question.category.name,
                    correct: 0,
                    total: 0,
                });
            }
            const h = heatmap.get(key);
            h.total += 1;
            if (a.isCorrect)
                h.correct += 1;
        }
        const result = Array.from(heatmap.values()).map((h) => ({
            ...h,
            accuracy: h.total > 0 ? h.correct / h.total : 0,
        }));
        res.json(result);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch heatmap' });
    }
});
// GET /attempts/history
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const limit = Math.min(200, parseInt(req.query.limit) || 50);
        const attempts = await prisma_1.default.attempt.findMany({
            where: { userId: req.user.id },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                question: {
                    select: {
                        text: true,
                        subSkill: true,
                        difficulty: true,
                        category: { select: { name: true, slug: true } },
                    },
                },
            },
        });
        res.json(attempts);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
async function updateStreak(userId) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        return;
    const now = new Date();
    const lastActive = user.lastActiveAt;
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let streakDays = user.streakDays;
    if (diffDays === 0) {
        // Same day — no change
    }
    else if (diffDays === 1) {
        streakDays += 1;
    }
    else {
        streakDays = 1;
    }
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { streakDays, lastActiveAt: now },
    });
}
exports.default = router;
//# sourceMappingURL=attempts.js.map