// SRS FR-5 + FR-7.1 — learning feed, module reader, completion + exam unlock,
// admin CRUD for the training bank.
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { buildFeed, computeDuration } from '../services/learning';

const router = Router();
const adminOnly = (req: AuthRequest, res: Response, next: () => void): void => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) { res.status(403).json({ error: 'admin only' }); return; }
  next();
};

// GET /api/v1/learning/feed — personalized, short-first stream (FR-5.3/5.4)
router.get('/feed', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(await buildFeed(req.user!.id));
});

// GET /api/v1/learning/module/:id — full sanitized content
router.get('/module/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const m = await prisma.learningModule.findFirst({ where: { id: req.params.id, isActive: true } });
  if (!m) { res.status(404).json({ error: 'module not found' }); return; }
  res.json({ module: { id: m.id, title: m.title, format: m.format, durationLabel: computeDuration(m.contentHtml, m.format).label, tags: m.tags, contentHtml: m.contentHtml } });
});

// POST /api/v1/learning/module/:id/complete — XP award (FR-4.3) + exam unlock (FR-7.1)
router.post('/module/:id/complete', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const m = await prisma.learningModule.findFirst({ where: { id: req.params.id, isActive: true } });
  if (!m) { res.status(404).json({ error: 'module not found' }); return; }
  const isNew = !(await prisma.moduleCompletion.findFirst({ where: { userId: req.user!.id, moduleId: m.id } }));
  if (isNew) {
    await prisma.moduleCompletion.create({ data: { userId: req.user!.id, moduleId: m.id } });
    const xp = m.format === 'COURSE' ? 60 : 25;
    await prisma.user.update({ where: { id: req.user!.id }, data: { xpPoints: { increment: xp } } });
  }
  // unlock rule: every active module sharing any tag with this module is done → exam unlocked for that gap
  const siblings = await prisma.learningModule.findMany({ where: { isActive: true, id: { not: m.id }, tags: { hasSome: m.tags } }, select: { id: true } });
  const done = await prisma.moduleCompletion.findMany({ where: { userId: req.user!.id, moduleId: { in: siblings.map(s => s.id) } }, select: { moduleId: true } });
  const examUnlocked = siblings.length === done.length;
  res.json({ ok: true, xpAwarded: isNew ? (m.format === 'COURSE' ? 60 : 25) : 0, examUnlocked, examCourseId: examUnlocked ? m.tags[0] : undefined });
});

// Admin CRUD — the training bank
router.get('/modules', authenticate, adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ modules: await prisma.learningModule.findMany({ orderBy: { createdAt: 'asc' } }) });
});
router.post('/modules', authenticate, adminOnly, [body('title').isString().notEmpty(), body('contentHtml').isString().notEmpty()], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { title, contentHtml, format = 'READ', tags = [] } = req.body;
  const { estMinutes } = computeDuration(String(contentHtml), String(format));
  const m = await prisma.learningModule.create({ data: { title, contentHtml, format, tags, estMinutes } });
  res.json({ module: m });
});
router.put('/modules/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, contentHtml, format = 'READ', tags = [], isActive = true } = req.body;
  const { estMinutes } = computeDuration(String(contentHtml), String(format));
  const m = await prisma.learningModule.update({ where: { id: req.params.id }, data: { title, contentHtml, format, tags, estMinutes, isActive } });
  res.json({ module: m });
});
router.delete('/modules/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.learningModule.deleteMany({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
