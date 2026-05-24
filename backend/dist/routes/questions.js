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
// GET /questions/categories — must be BEFORE /:id
router.get('/categories', async (_req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            include: {
                _count: { select: { questions: { where: { isActive: true } } } },
            },
            orderBy: { name: 'asc' },
        });
        res.json(categories.map((c) => ({ ...c, questionCount: c._count.questions })));
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// GET /questions/diagnostic — 20-question diagnostic set
router.get('/diagnostic', auth_1.authenticate, async (req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany({ select: { id: true, name: true }, take: 10 });
        const questionIds = [];
        for (const cat of categories) {
            const qs = await prisma_1.default.question.findMany({
                where: { categoryId: cat.id, isActive: true },
                take: 2,
                orderBy: { difficulty: 'asc' },
                select: { id: true },
            });
            questionIds.push(...qs.map((q) => q.id));
        }
        const questions = await prisma_1.default.question.findMany({
            where: { id: { in: questionIds } },
            include: { category: { select: { name: true, slug: true, icon: true } } },
        });
        // Shuffle
        const shuffled = questions.sort(() => Math.random() - 0.5);
        res.json(shuffled);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch diagnostic questions' });
    }
});
// GET /questions — adaptive fetch
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const category = req.query.category;
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const mode = req.query.mode || 'PRACTICE';
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : undefined;
        // Find category by slug if provided
        let categoryId;
        if (category) {
            const cat = await prisma_1.default.category.findFirst({
                where: { OR: [{ slug: category }, { id: category }] },
            });
            categoryId = cat?.id;
        }
        // Get adaptive question IDs
        const ids = await (0, adaptive_1.getAdaptiveQuestions)(req.user.id, categoryId, limit, mode);
        const questions = await prisma_1.default.question.findMany({
            where: {
                id: { in: ids },
                ...(difficulty ? { difficulty } : {}),
            },
            include: { category: { select: { name: true, slug: true, icon: true } } },
        });
        // Maintain adaptive order
        const ordered = ids
            .map((id) => questions.find((q) => q.id === id))
            .filter(Boolean);
        res.json(ordered);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// POST /questions/:id/flag
router.post('/:id/flag', auth_1.authenticate, async (req, res) => {
    try {
        const question = await prisma_1.default.question.update({
            where: { id: req.params.id },
            data: { flagCount: { increment: 1 } },
            select: { id: true, flagCount: true },
        });
        res.json(question);
    }
    catch {
        res.status(500).json({ error: 'Failed to flag question' });
    }
});
exports.default = router;
//# sourceMappingURL=questions.js.map