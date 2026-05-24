import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /bookmarks
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      include: {
        question: {
          include: { category: { select: { name: true, slug: true, icon: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookmarks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /bookmarks
router.post(
  '/',
  authenticate,
  [body('questionId').notEmpty()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { questionId, note } = req.body as { questionId: string; note?: string };

    try {
      const bookmark = await prisma.bookmark.upsert({
        where: { userId_questionId: { userId: req.user!.id, questionId } },
        create: { userId: req.user!.id, questionId, note: note ?? null },
        update: { note: note ?? null },
      });
      res.status(201).json(bookmark);
    } catch {
      res.status(500).json({ error: 'Failed to create bookmark' });
    }
  }
);

// DELETE /bookmarks/:questionId
router.delete('/:questionId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.bookmark.deleteMany({
      where: { userId: req.user!.id, questionId: req.params.questionId },
    });
    res.json({ message: 'Bookmark removed' });
  } catch {
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

export default router;
