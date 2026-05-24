"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const adaptive_1 = require("../services/adaptive");
const router = (0, express_1.Router)();
// GET /profile
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                plan: true,
                planExpiresAt: true,
                streakDays: true,
                lastActiveAt: true,
                diagnosticDone: true,
                readinessScore: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Radar chart data (per category accuracy)
        const categories = await prisma_1.default.category.findMany({ select: { id: true, name: true } });
        const radarData = await Promise.all(categories.map(async (cat) => {
            const attempts = await prisma_1.default.attempt.findMany({
                where: { userId: req.user.id, question: { categoryId: cat.id } },
                select: { isCorrect: true },
            });
            const accuracy = attempts.length > 0 ? attempts.filter((a) => a.isCorrect).length / attempts.length : 0;
            return { category: cat.name, accuracy: Math.round(accuracy * 100), attempts: attempts.length };
        }));
        const weaknesses = await (0, adaptive_1.detectWeaknesses)(req.user.id);
        res.json({ user, radarData, weaknesses });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// GET /profile/study-plan
router.get('/study-plan', auth_1.authenticate, async (req, res) => {
    try {
        let studyPlan = await prisma_1.default.studyPlan.findUnique({ where: { userId: req.user.id } });
        if (!studyPlan) {
            const tasks = await (0, adaptive_1.generateStudyPlan)(req.user.id);
            studyPlan = await prisma_1.default.studyPlan.findUnique({ where: { userId: req.user.id } });
        }
        res.json(studyPlan?.plan ?? []);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch study plan' });
    }
});
// GET /profile/progress?days=30
router.get('/progress', auth_1.authenticate, async (req, res) => {
    try {
        const days = Math.min(90, parseInt(req.query.days) || 30);
        const since = new Date();
        since.setDate(since.getDate() - days);
        const attempts = await prisma_1.default.attempt.findMany({
            where: { userId: req.user.id, createdAt: { gte: since } },
            select: { isCorrect: true, timeTaken: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        // Group by day
        const dayMap = new Map();
        for (const a of attempts) {
            const day = a.createdAt.toISOString().split('T')[0];
            if (!dayMap.has(day))
                dayMap.set(day, { correct: 0, total: 0 });
            const d = dayMap.get(day);
            d.total += 1;
            if (a.isCorrect)
                d.correct += 1;
        }
        const trend = Array.from(dayMap.entries()).map(([date, d]) => ({
            date,
            accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
            questionsAttempted: d.total,
        }));
        res.json(trend);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
exports.default = router;
//# sourceMappingURL=profile.js.map