// Employer profile & workspace — trial signup, all employee assessments in one place
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { compileMsr } from '../services/msr';

const router = Router();

async function resolveEnterprise(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return null;
  return prisma.enterprise.findFirst({ where: { ownerEmail: user.email } });
}

// GET /api/v1/employer/workspace — everything the employer sees after login
router.get('/workspace', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const ent = await resolveEnterprise(req.user!.id);
  if (!ent) { res.status(404).json({ error: 'No employer workspace — sign up as an employer or contact support', hasWorkspace: false }); return; }
  const daysLeft = ent.isTrialActive && ent.trialStartedAt
    ? Math.max(0, ent.trialDays - Math.floor((Date.now() - new Date(ent.trialStartedAt).getTime()) / 86400000))
    : null;
  const [tests, links, msr] = await Promise.all([
    prisma.customTest.findMany({ where: { createdBy: req.user!.id }, orderBy: { createdAt: 'desc' }, include: { links: true } }),
    prisma.testLink.findMany({ where: { test: { createdBy: req.user!.id } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    compileMsr(ent.id, ent.name).catch(() => null),
  ]);
  let screening: any[] = [];
  try { screening = await prisma.assessment.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { _count: { select: { violations: true, questions: true } } } }); } catch {}
  res.json({
    enterprise: { name: ent.name, isTrialActive: ent.isTrialActive, isPaidSubscriber: ent.isPaidSubscriber, trialDays: ent.trialDays, daysLeft },
    trial: { active: ent.isTrialActive && !ent.isPaidSubscriber, daysLeft,
      keepsOnUpgrade: ['MSR PDF/CSV export', 'Custom role baselines', 'Full 300+ question bank'],
      endsIfExpired: 'Enterprise tools lock; employee learning records are kept safe' },
    tools: { testBuilder: 'open', recruiterConsole: 'open', competencyBaselines: 'open', msrDashboard: 'open', msrExports: ent.isPaidSubscriber ? 'open' : 'gated' },
    customTests: tests.map(t => ({ id: t.id, title: t.title, candidates: t.links.length, submitted: t.links.filter(l => l.submittedAt).length, inviteUrl: `/invite?t=${t.linkToken}` })),
    candidateLinks: links.map(l => ({ email: l.candidateEmail, test: tests.find(t => t.id === l.testId)?.title || '', submitted: !!l.submittedAt, inviteUrl: `/invite?t=${l.token}` })),
    screeningAssessments: screening.map(a => ({ id: a.id, candidates: undefined, violations: (a as any)._count?.violations ?? 0, questions: (a as any)._count?.questions ?? 0 })),
    msr,
  });
});

export default router;
