// SRS final four: FR-3 competency baselines + gap analysis, FR-9.1 pricing, FR-9.3 banners
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const adminOnly = (req: AuthRequest, res: Response, next: () => void): void => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) { res.status(403).json({ error: 'admin only' }); return; }
  next();
};

// ── FR-9.1 base price management ──
router.get('/pricing', async (_req: Request, res: Response): Promise<void> => {
  const p = (await prisma.platformPricing.findUnique({ where: { id: 'singleton' } })) ?? { enterpriseMonthlyUsd: 29, candidateLinkUsd: 4 };
  res.json({ pricing: p });
});
router.put('/pricing', authenticate, adminOnly, [body('enterpriseMonthlyUsd').isFloat({ min: 0 }), body('candidateLinkUsd').isFloat({ min: 0 })], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req); if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { enterpriseMonthlyUsd, candidateLinkUsd } = req.body;
  const p = await prisma.platformPricing.upsert({ where: { id: 'singleton' }, update: { enterpriseMonthlyUsd, candidateLinkUsd, updatedBy: req.user!.id }, create: { id: 'singleton', enterpriseMonthlyUsd, candidateLinkUsd, updatedBy: req.user!.id } });
  res.json({ pricing: p });
});

// ── FR-9.3 promo banners ──
router.get('/banners/active', async (req: Request, res: Response): Promise<void> => {
  const plan = String(req.query.plan || 'FREE').toUpperCase();
  const rows = await prisma.promoBanner.findMany({ where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
  res.json({ banners: rows.filter(b => b.audience === 'ALL' || (b.audience === 'TRIAL' && ['FREE', 'TRIAL'].includes(plan))) });
});
router.get('/banners', authenticate, adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ banners: await prisma.promoBanner.findMany({ orderBy: { createdAt: 'desc' } }) });
});
router.post('/banners', authenticate, adminOnly, [body('message').isString().notEmpty()], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req); if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { message, ctaText = '', ctaUrl = '', audience = 'ALL', expiresAt } = req.body;
  const b = await prisma.promoBanner.create({ data: { message, ctaText, ctaUrl, audience, expiresAt: expiresAt ? new Date(expiresAt) : null, createdBy: req.user!.id } });
  res.json({ banner: b });
});
router.delete('/banners/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.promoBanner.deleteMany({ where: { id: req.params.id } }); res.json({ ok: true });
});

// ── FR-3.1 competency frameworks ──
router.get('/competency-roles', authenticate, adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ roles: await prisma.competencyRole.findMany({ orderBy: { createdAt: 'desc' } }) });
});
router.post('/competency-roles', authenticate, adminOnly, [body('name').isString().notEmpty(), body('baselines').isObject()], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req); if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { name, baselines } = req.body;
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(baselines)) if (Number(v) >= 0 && Number(v) <= 100) clean[String(k).trim()] = Number(v);
  const r = await prisma.competencyRole.create({ data: { name: String(name).slice(0, 120), baselines: clean as any, createdBy: req.user!.id } });
  res.json({ role: r });
});
router.delete('/competency-roles/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.competencyRole.deleteMany({ where: { id: req.params.id } }); res.json({ ok: true });
});

// ── FR-3.2/3.3 dynamic score verification + machine-readable gap analysis ──
router.post('/gap-analysis', authenticate, adminOnly, [body('email').isEmail(), body('roleId').isString().notEmpty()], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req); if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { email, roleId } = req.body as { email: string; roleId: string };
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) { res.status(404).json({ error: 'user not found' }); return; }
  const role = await prisma.competencyRole.findUnique({ where: { id: roleId } });
  if (!role) { res.status(404).json({ error: 'role not found' }); return; }
  const attempts = await prisma.attempt.findMany({ where: { userId: user.id }, select: { isCorrect: true, question: { select: { subSkill: true } } }, orderBy: { createdAt: 'desc' }, take: 1000 });
  const agg = new Map<string, { c: number; t: number }>();
  for (const a of attempts) { const e = agg.get(a.question.subSkill) ?? { c: 0, t: 0 }; e.t++; if (a.isCorrect) e.c++; agg.set(a.question.subSkill, e); }
  const baselines = (role.baselines ?? {}) as Record<string, number>;
  const scores: Record<string, number> = {}; const gaps: string[] = [];
  for (const [skill, base] of Object.entries(baselines)) {
    const e = agg.get(skill); const pct = e && e.t ? Math.round((e.c / e.t) * 100) : 0;
    scores[skill] = pct; if (pct < Number(base)) gaps.push(skill);
  }
  const record = await prisma.gapAnalysisRecord.create({ data: { userId: user.id, roleTitle: role.name, scores: scores as any, gaps: gaps as any, belowThreshold: gaps.length > 0 } });
  res.json({ analysis: { roleTitle: role.name, scores, gaps, belowThreshold: gaps.length > 0, recordId: record.id } });
});

export default router;
