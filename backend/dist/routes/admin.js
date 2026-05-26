"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER')];
// GET /admin/stats
router.get('/stats', ...adminOnly, async (_req, res) => {
    try {
        const [totalUsers, totalQuestions, totalAttempts, totalExams] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.question.count({ where: { isActive: true } }),
            prisma_1.default.attempt.count(),
            prisma_1.default.mockExam.count({ where: { completedAt: { not: null } } }),
        ]);
        const newUsersToday = await prisma_1.default.user.count({
            where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        });
        const premiumUsers = await prisma_1.default.user.count({ where: { plan: 'PREMIUM' } });
        res.json({ totalUsers, totalQuestions, totalAttempts, totalExams, newUsersToday, premiumUsers });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
// GET /admin/questions
router.get('/questions', ...adminOnly, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const categoryId = req.query.categoryId;
        const search = req.query.search;
        const where = {
            ...(categoryId ? { categoryId } : {}),
            ...(search ? { text: { contains: search, mode: 'insensitive' } } : {}),
        };
        const [questions, total] = await Promise.all([
            prisma_1.default.question.findMany({
                where,
                skip,
                take: limit,
                include: { category: { select: { name: true, slug: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.question.count({ where }),
        ]);
        res.json({ questions, total, page, pages: Math.ceil(total / limit) });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// POST /admin/questions
router.post('/questions', ...adminOnly, [
    (0, express_validator_1.body)('categoryId').notEmpty(),
    (0, express_validator_1.body)('text').notEmpty(),
    (0, express_validator_1.body)('options').isArray({ min: 4, max: 4 }),
    (0, express_validator_1.body)('explanation').notEmpty(),
    (0, express_validator_1.body)('subSkill').notEmpty(),
    (0, express_validator_1.body)('difficulty').isInt({ min: 1, max: 10 }),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    try {
        const question = await prisma_1.default.question.create({
            data: {
                categoryId: req.body.categoryId,
                subSkill: req.body.subSkill,
                text: req.body.text,
                options: req.body.options,
                explanation: req.body.explanation,
                difficulty: req.body.difficulty,
                discrimination: req.body.discrimination ?? 1.0,
                timeLimit: req.body.timeLimit ?? 60,
                tags: req.body.tags ?? [],
            },
            include: { category: { select: { name: true } } },
        });
        res.status(201).json(question);
    }
    catch {
        res.status(500).json({ error: 'Failed to create question' });
    }
});
// PUT /admin/questions/:id
router.put('/questions/:id', ...adminOnly, async (req, res) => {
    try {
        const question = await prisma_1.default.question.update({
            where: { id: req.params.id },
            data: {
                ...(req.body.text && { text: req.body.text }),
                ...(req.body.options && { options: req.body.options }),
                ...(req.body.explanation && { explanation: req.body.explanation }),
                ...(req.body.difficulty && { difficulty: req.body.difficulty }),
                ...(req.body.subSkill && { subSkill: req.body.subSkill }),
                ...(req.body.tags && { tags: req.body.tags }),
                ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
                ...(req.body.timeLimit && { timeLimit: req.body.timeLimit }),
            },
        });
        res.json(question);
    }
    catch {
        res.status(500).json({ error: 'Failed to update question' });
    }
});
// DELETE /admin/questions/:id
router.delete('/questions/:id', ...adminOnly, async (req, res) => {
    try {
        await prisma_1.default.question.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        res.json({ message: 'Question deactivated' });
    }
    catch {
        res.status(500).json({ error: 'Failed to delete question' });
    }
});
// GET /admin/users
router.get('/users', ...adminOnly, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    plan: true,
                    streakDays: true,
                    readinessScore: true,
                    createdAt: true,
                    lastActiveAt: true,
                    _count: { select: { attempts: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.user.count(),
        ]);
        res.json({ users, total, page, pages: Math.ceil(total / limit) });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// GET /admin/activity — recent attempts, active users, mock exams
router.get('/activity', ...adminOnly, async (_req, res) => {
    try {
        const [recentAttempts, recentExams, activeToday, activeLast7d, topCategories] = await Promise.all([
            // Last 50 question attempts
            prisma_1.default.attempt.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    isCorrect: true,
                    mode: true,
                    timeTaken: true,
                    createdAt: true,
                    user: { select: { id: true, name: true, email: true } },
                    question: { select: { text: true, category: { select: { name: true, icon: true } } } },
                },
            }),
            // Last 20 mock exams — fetch exams then join user names manually
            prisma_1.default.mockExam.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    score: true,
                    totalQ: true,
                    userId: true,
                    completedAt: true,
                    createdAt: true,
                },
            }).then(async (exams) => {
                const userIds = [...new Set(exams.map((e) => e.userId))];
                const users = await prisma_1.default.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, name: true, email: true },
                });
                const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
                return exams.map((e) => ({ ...e, user: userMap[e.userId] ?? null }));
            }),
            // Users active today
            prisma_1.default.user.count({
                where: {
                    lastActiveAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            // Users active last 7 days
            prisma_1.default.user.count({
                where: {
                    lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            // Top categories by attempt count
            prisma_1.default.attempt.groupBy({
                by: ['questionId'],
                _count: { questionId: true },
                orderBy: { _count: { questionId: 'desc' } },
                take: 100,
            }).then(async (grouped) => {
                const qIds = grouped.map((g) => g.questionId);
                const questions = await prisma_1.default.question.findMany({
                    where: { id: { in: qIds } },
                    select: { categoryId: true, category: { select: { name: true, icon: true } } },
                });
                const catCounts = {};
                for (const q of questions) {
                    const key = q.categoryId;
                    if (!catCounts[key])
                        catCounts[key] = { name: q.category.name, icon: q.category.icon || '', count: 0 };
                    catCounts[key].count++;
                }
                return Object.values(catCounts)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);
            }),
        ]);
        res.json({ recentAttempts, recentExams, activeToday, activeLast7d, topCategories });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});
// GET /admin/flags
router.get('/flags', ...adminOnly, async (_req, res) => {
    try {
        const flagged = await prisma_1.default.question.findMany({
            where: { flagCount: { gt: 0 }, isActive: true },
            include: { category: { select: { name: true } } },
            orderBy: { flagCount: 'desc' },
            take: 50,
        });
        res.json(flagged);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch flagged questions' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map