import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

const adminOnly = [authenticate, requireRole('ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER')];

// GET /admin/stats
router.get('/stats', ...adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalQuestions, totalAttempts, totalExams] = await Promise.all([
      prisma.user.count(),
      prisma.question.count({ where: { isActive: true } }),
      prisma.attempt.count(),
      prisma.mockExam.count({ where: { completedAt: { not: null } } }),
    ]);

    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });

    const premiumUsers = await prisma.user.count({ where: { plan: 'PREMIUM' } });

    res.json({ totalUsers, totalQuestions, totalAttempts, totalExams, newUsersToday, premiumUsers });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /admin/questions
router.get('/questions', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { text: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({ questions, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /admin/questions
router.post(
  '/questions',
  ...adminOnly,
  [
    body('categoryId').notEmpty(),
    body('text').notEmpty(),
    body('options').isArray({ min: 4, max: 4 }),
    body('explanation').notEmpty(),
    body('subSkill').notEmpty(),
    body('difficulty').isInt({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const question = await prisma.question.create({
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
    } catch {
      res.status(500).json({ error: 'Failed to create question' });
    }
  }
);

// PUT /admin/questions/:id
router.put('/questions/:id', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const question = await prisma.question.update({
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
  } catch {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /admin/questions/:id
router.delete('/questions/:id', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.question.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Question deactivated' });
  } catch {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// GET /admin/users
router.get('/users', ...adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count(),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/flags
router.get('/flags', ...adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flagged = await prisma.question.findMany({
      where: { flagCount: { gt: 0 }, isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { flagCount: 'desc' },
      take: 50,
    });
    res.json(flagged);
  } catch {
    res.status(500).json({ error: 'Failed to fetch flagged questions' });
  }
});

export default router;
