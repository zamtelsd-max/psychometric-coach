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
// POST /mock-exams/start
router.post('/start', auth_1.authenticate, [(0, express_validator_1.body)('categoryIds').isArray(), (0, express_validator_1.body)('questionCount').isInt({ min: 10, max: 100 })], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { categoryIds, questionCount } = req.body;
    try {
        const perCategory = Math.ceil(questionCount / categoryIds.length);
        const allQuestionIds = [];
        for (const catId of categoryIds) {
            const qs = await prisma_1.default.question.findMany({
                where: { categoryId: catId, isActive: true },
                take: perCategory,
                orderBy: { difficulty: 'asc' },
                select: { id: true },
            });
            allQuestionIds.push(...qs.map((q) => q.id));
        }
        // Shuffle and trim to questionCount
        const shuffled = allQuestionIds.sort(() => Math.random() - 0.5).slice(0, questionCount);
        const questions = await prisma_1.default.question.findMany({
            where: { id: { in: shuffled } },
            include: { category: { select: { name: true, slug: true, icon: true } } },
        });
        // Create exam record
        const categoryNames = await prisma_1.default.category.findMany({
            where: { id: { in: categoryIds } },
            select: { name: true },
        });
        const title = `Mock Exam — ${categoryNames.map((c) => c.name).join(', ')}`;
        const exam = await prisma_1.default.mockExam.create({
            data: {
                userId: req.user.id,
                title,
                categoryIds,
                totalQ: questions.length,
                duration: 0,
                answers: [],
            },
        });
        res.status(201).json({ exam, questions });
    }
    catch {
        res.status(500).json({ error: 'Failed to start exam' });
    }
});
// GET /mock-exams/history — before /:id
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const exams = await prisma_1.default.mockExam.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(exams);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch exam history' });
    }
});
// GET /mock-exams/:id
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const exam = await prisma_1.default.mockExam.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!exam) {
            res.status(404).json({ error: 'Exam not found' });
            return;
        }
        // Fetch questions for this exam based on categoryIds
        const questions = await prisma_1.default.question.findMany({
            where: { categoryId: { in: exam.categoryIds }, isActive: true },
            take: exam.totalQ,
            include: { category: { select: { name: true, slug: true, icon: true } } },
            orderBy: { difficulty: 'asc' },
        });
        res.json({ ...exam, questions });
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
});
// POST /mock-exams/:id/submit
router.post('/:id/submit', auth_1.authenticate, [(0, express_validator_1.body)('answers').isArray()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { answers } = req.body;
    try {
        const exam = await prisma_1.default.mockExam.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!exam) {
            res.status(404).json({ error: 'Exam not found' });
            return;
        }
        if (exam.completedAt) {
            res.status(400).json({ error: 'Exam already submitted' });
            return;
        }
        // Grade answers
        const questionIds = answers.map((a) => a.questionId);
        const questions = await prisma_1.default.question.findMany({ where: { id: { in: questionIds } } });
        const gradedAnswers = answers.map((a) => {
            const q = questions.find((qn) => qn.id === a.questionId);
            if (!q)
                return { ...a, correct: false };
            const opts = q.options;
            const correct = opts.find((o) => o.id === a.selected)?.isCorrect ?? false;
            return { questionId: a.questionId, selected: a.selected, correct, timeTaken: a.timeTaken };
        });
        const correct = gradedAnswers.filter((a) => a.correct).length;
        const score = (correct / gradedAnswers.length) * 100;
        const duration = gradedAnswers.reduce((sum, a) => sum + a.timeTaken, 0);
        const percentile = await (0, adaptive_1.calculatePercentile)(score, exam.categoryIds);
        const completedExam = await prisma_1.default.mockExam.update({
            where: { id: exam.id },
            data: {
                score,
                percentile,
                duration,
                completedAt: new Date(),
                answers: gradedAnswers,
            },
        });
        // Record attempts
        for (const a of gradedAnswers) {
            await prisma_1.default.attempt.create({
                data: {
                    userId: req.user.id,
                    questionId: a.questionId,
                    selectedOption: a.selected,
                    isCorrect: a.correct,
                    timeTaken: a.timeTaken,
                    sessionId: exam.id,
                    mode: 'MOCK',
                },
            });
        }
        res.json({
            exam: completedExam,
            score,
            percentile,
            correct,
            total: gradedAnswers.length,
            duration,
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});
exports.default = router;
//# sourceMappingURL=mockExams.js.map