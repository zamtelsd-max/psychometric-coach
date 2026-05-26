import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getAdaptiveQuestions } from '../services/adaptive';

const router = Router();

// In-memory cache for categories (changes rarely — refresh every 5 min)
let categoriesCache: { data: unknown; at: number } | null = null;
const CATEGORIES_TTL = 5 * 60 * 1000; // 5 minutes

// GET /questions/categories — must be BEFORE /:id
router.get('/categories', async (_req, res: Response): Promise<void> => {
  try {
    if (categoriesCache && Date.now() - categoriesCache.at < CATEGORIES_TTL) {
      res.set('X-Cache', 'HIT');
      res.json(categoriesCache.data);
      return;
    }
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { questions: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    const mapped = categories.map((c) => ({ ...c, questionCount: c._count.questions }));
    categoriesCache = { data: mapped, at: Date.now() };
    res.set('Cache-Control', 'public, max-age=300'); // 5 min browser cache
    res.set('X-Cache', 'MISS');
    res.json(mapped);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /questions/diagnostic — 20-question diagnostic set
router.get('/diagnostic', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true }, take: 10 });

    const questionIds: string[] = [];
    for (const cat of categories) {
      const qs = await prisma.question.findMany({
        where: { categoryId: cat.id, isActive: true },
        take: 2,
        orderBy: { difficulty: 'asc' },
        select: { id: true },
      });
      questionIds.push(...qs.map((q) => q.id));
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { category: { select: { name: true, slug: true, icon: true, assessmentType: true, isFreeTrialOnly: true, trialDurationMin: true, color: true } } },
    });

    // Shuffle
    const shuffled = questions.sort(() => Math.random() - 0.5);
    res.json(shuffled);
  } catch {
    res.status(500).json({ error: 'Failed to fetch diagnostic questions' });
  }
});

// GET /questions — adaptive fetch
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const mode = (req.query.mode as string) || 'PRACTICE';
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined;

    // Find category by slug if provided
    let categoryId: string | undefined;
    if (category) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ slug: category }, { id: category }] },
      });
      categoryId = cat?.id;
    }

    // Get adaptive question IDs
    const ids = await getAdaptiveQuestions(req.user!.id, categoryId, limit, mode);

    const questions = await prisma.question.findMany({
      where: {
        id: { in: ids },
        ...(difficulty ? { difficulty } : {}),
      },
      include: { category: { select: { name: true, slug: true, icon: true, assessmentType: true, isFreeTrialOnly: true, trialDurationMin: true, color: true } } },
    });

    // Maintain adaptive order
    const ordered = ids
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean);

    res.json(ordered);
  } catch {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /questions/:id/flag
router.post('/:id/flag', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { flagCount: { increment: 1 } },
      select: { id: true, flagCount: true },
    });
    res.json(question);
  } catch {
    res.status(500).json({ error: 'Failed to flag question' });
  }
});

export default router;
