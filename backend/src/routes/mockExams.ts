import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculatePercentile } from '../services/adaptive';

const router = Router();

// POST /mock-exams/start
router.post(
  '/start',
  authenticate,
  [body('categoryIds').isArray(), body('questionCount').isInt({ min: 10, max: 100 })],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { categoryIds, questionCount } = req.body as { categoryIds: string[]; questionCount: number };

    try {
      const perCategory = Math.ceil(questionCount / categoryIds.length);

      const allQuestionIds: string[] = [];
      for (const catId of categoryIds) {
        const qs = await prisma.question.findMany({
          where: { categoryId: catId, isActive: true },
          take: perCategory,
          orderBy: { difficulty: 'asc' },
          select: { id: true },
        });
        allQuestionIds.push(...qs.map((q) => q.id));
      }

      // Shuffle and trim to questionCount
      const shuffled = allQuestionIds.sort(() => Math.random() - 0.5).slice(0, questionCount);

      const questions = await prisma.question.findMany({
        where: { id: { in: shuffled } },
        include: { category: { select: { name: true, slug: true, icon: true } } },
      });

      // Create exam record
      const categoryNames = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { name: true },
      });
      const title = `Mock Exam — ${categoryNames.map((c) => c.name).join(', ')}`;

      const exam = await prisma.mockExam.create({
        data: {
          userId: req.user!.id,
          title,
          categoryIds,
          totalQ: questions.length,
          duration: 0,
          answers: [],
        },
      });

      res.status(201).json({ exam, questions });
    } catch {
      res.status(500).json({ error: 'Failed to start exam' });
    }
  }
);

// GET /mock-exams/history — before /:id
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exams = await prisma.mockExam.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(exams);
  } catch {
    res.status(500).json({ error: 'Failed to fetch exam history' });
  }
});

// GET /mock-exams/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exam = await prisma.mockExam.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }
    // Fetch questions for this exam based on categoryIds
    const questions = await prisma.question.findMany({
      where: { categoryId: { in: exam.categoryIds }, isActive: true },
      take: exam.totalQ,
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy: { difficulty: 'asc' },
    });
    res.json({ ...exam, questions });
  } catch {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// POST /mock-exams/:id/submit
router.post(
  '/:id/submit',
  authenticate,
  [body('answers').isArray()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { answers } = req.body as {
      answers: Array<{ questionId: string; selected: string; timeTaken: number }>;
    };

    try {
      const exam = await prisma.mockExam.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
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
      const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });

      const gradedAnswers = answers.map((a) => {
        const q = questions.find((qn) => qn.id === a.questionId);
        if (!q) return { ...a, correct: false };
        const opts = q.options as Array<{ id: string; isCorrect: boolean }>;
        const correct = opts.find((o) => o.id === a.selected)?.isCorrect ?? false;
        return { questionId: a.questionId, selected: a.selected, correct, timeTaken: a.timeTaken };
      });

      const correct = gradedAnswers.filter((a) => a.correct).length;
      const score = (correct / gradedAnswers.length) * 100;
      const duration = gradedAnswers.reduce((sum, a) => sum + a.timeTaken, 0);

      const percentile = await calculatePercentile(score, exam.categoryIds);

      const completedExam = await prisma.mockExam.update({
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
        await prisma.attempt.create({
          data: {
            userId: req.user!.id,
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
    } catch {
      res.status(500).json({ error: 'Failed to submit exam' });
    }
  }
);

export default router;
