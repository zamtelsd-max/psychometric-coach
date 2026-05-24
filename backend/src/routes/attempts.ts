import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateReadinessScore } from '../services/adaptive';

const router = Router();

// POST /attempts
router.post(
  '/',
  authenticate,
  [
    body('questionId').notEmpty(),
    body('selectedOption').notEmpty(),
    body('timeTaken').isInt({ min: 0 }),
    body('mode').optional().isIn(['DIAGNOSTIC', 'PRACTICE', 'TIMED', 'MOCK', 'REVIEW']),
    body('confidence').optional().isInt({ min: 1, max: 5 }),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { questionId, selectedOption, timeTaken, confidence, sessionId, mode } = req.body as {
      questionId: string;
      selectedOption: string;
      timeTaken: number;
      confidence?: number;
      sessionId?: string;
      mode?: string;
    };

    try {
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      const options = question.options as Array<{ id: string; text: string; isCorrect: boolean }>;
      const selectedOpt = options.find((o) => o.id === selectedOption);
      const isCorrect = selectedOpt?.isCorrect ?? false;

      const attempt = await prisma.attempt.create({
        data: {
          userId: req.user!.id,
          questionId,
          selectedOption,
          isCorrect,
          timeTaken,
          confidence: confidence ?? null,
          sessionId: sessionId ?? null,
          mode: (mode as any) ?? 'PRACTICE',
        },
      });

      // Update streak
      await updateStreak(req.user!.id);

      // Async readiness update (fire and forget)
      updateReadinessScore(req.user!.id).catch(() => {});

      res.status(201).json({
        attempt,
        isCorrect,
        correctOptionId: options.find((o) => o.isCorrect)?.id,
        explanation: question.explanation,
      });
    } catch {
      res.status(500).json({ error: 'Failed to record attempt' });
    }
  }
);

// GET /attempts/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user!.id },
      include: {
        question: {
          select: { categoryId: true, category: { select: { name: true, slug: true, icon: true } } },
        },
      },
    });

    const statsMap = new Map<
      string,
      { categoryName: string; slug: string; icon: string; correct: number; total: number; totalTime: number }
    >();

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
      const s = statsMap.get(cid)!;
      s.total += 1;
      if (a.isCorrect) s.correct += 1;
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

    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /attempts/heatmap
router.get('/heatmap', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user!.id },
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

    const heatmap = new Map<
      string,
      { subSkill: string; categoryId: string; categoryName: string; correct: number; total: number }
    >();

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
      const h = heatmap.get(key)!;
      h.total += 1;
      if (a.isCorrect) h.correct += 1;
    }

    const result = Array.from(heatmap.values()).map((h) => ({
      ...h,
      accuracy: h.total > 0 ? h.correct / h.total : 0,
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

// GET /attempts/history
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user!.id },
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const lastActive = user.lastActiveAt;
  const diffMs = now.getTime() - lastActive.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let streakDays = user.streakDays;
  if (diffDays === 0) {
    // Same day — no change
  } else if (diffDays === 1) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streakDays, lastActiveAt: now },
  });
}

export default router;
