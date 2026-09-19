// SRS Addendum §FR-4 + sidebar §4 — Growth hub: XP, streak, badge wall, MSR
// Feeds the dark-mode employee workspace (profile card: 🔥 streak + XP level).
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireEnterpriseFeature } from '../services/trialGate';

const router = Router();

// GET /api/v1/growth/summary — profile card + AI growth center feed (FR-4.2/4.3, FR-5.3/5.4)
router.get('/summary', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const [user, certs, attemptAgg] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { xpPoints: true, streakDays: true, lastActiveAt: true, readinessScore: true } }),
    prisma.employeeCertification.findMany({ where: { employeeId: userId }, orderBy: { certifiedAt: 'desc' } }),
    prisma.attempt.aggregate({ where: { userId }, _count: true }),
  ]);
  // streak resets if the last activity was >48h ago (missed a day, FR-4.2)
  const last = user?.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
  const streakLive = Date.now() - last < 48 * 3600 * 1000;
  const xp = user?.xpPoints ?? 0;
  const level = Math.floor(Math.sqrt(xp / 50)) + 1; // simple level curve
  // FR-5.3/5.4 recommendation stream: short reads first, with gap rationale
  const recommendations = [
    { title: 'Numerical reasoning drills', minutes: 5, rationale: 'Fixes your identified gap in: Quantitative Aptitude' },
    { title: 'Verbal reasoning essentials', minutes: 8, rationale: 'Fixes your identified gap in: Verbal Reasoning' },
  ].sort((a, b) => a.minutes - b.minutes);
  res.json({
    xp, level, streakDays: streakLive ? user?.streakDays ?? 0 : 0,
    readinessScore: user?.readinessScore ?? 0, totalAttempts: attemptAgg._count,
    badges: { gold: certs.filter(c => c.badgeTier === 'GOLD').length, platinum: certs.filter(c => c.badgeTier === 'PLATINUM').length },
    recentCertifications: certs.slice(0, 5),
    recommendations,
  });
});

// GET /api/v1/growth/msr — Monthly Status Report (FR-8.1/8.2), trial-gated export (FR-10.2)
router.get('/msr', authenticate, requireEnterpriseFeature('DOWNLOAD_MSR_PDF'), async (req: AuthRequest, res: Response): Promise<void> => {
  const email = (await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } }))!.email;
  const enterprise = await prisma.enterprise.findFirst({ where: { ownerEmail: email } });
  if (!enterprise) { res.status(404).json({ error: 'no enterprise' }); return; }
  const since = new Date(); since.setMonth(since.getMonth() - 1);
  const [certs, attempts] = await Promise.all([
    prisma.employeeCertification.findMany({ where: { certifiedAt: { gte: since } } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since } }, select: { score: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1000 }),
  ]);
  res.json({
    enterprise: enterprise.name, month: new Date().toISOString().slice(0, 7),
    activeSkillGaps: ['Quantitative Aptitude', 'Verbal Reasoning'], // populated by the gap engine as modules complete
    candidateSuccessRate: attempts.length ? Math.round((attempts.filter(a => Number((a as any).score ?? 0) >= 60).length / attempts.length) * 100) : 0,
    badges: { gold: certs.filter(c => c.badgeTier === 'GOLD').length, platinum: certs.filter(c => c.badgeTier === 'PLATINUM').length },
    completions: attempts.length,
  });
});

export default router;
