import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const B2B_ENABLED = process.env.FF_B2B !== 'off';

// Seeded Fisher–Yates shuffle for per-candidate uniqueness (SR-B2B-14/15)
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rand = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 0xffffffff; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── Recruiter: create an assessment (issues per-candidate token) SR-X-01 ──
router.post('/assessments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!B2B_ENABLED) { res.status(404).json({ error: 'B2B disabled' }); return; }
  const { candidateEmail, role, difficulty, jobFamily, count } = req.body || {};
  if (!candidateEmail || !role) { res.status(400).json({ error: 'candidateEmail and role required' }); return; }
  const candidateToken = crypto.randomBytes(20).toString('hex');
  const seed = crypto.randomBytes(8).toString('hex');
  const fam = jobFamily || 'General';
  // Pull a pool for the (role, difficulty) cell, then seeded-shuffle for uniqueness
  const pool = await prisma.interviewQuestion.findMany({
    where: { jobFamily: fam, ...(difficulty ? { tier: difficulty } : {}) },
    select: { questionText: true },
  });
  const fallback = pool.length ? pool : await prisma.interviewQuestion.findMany({ select: { questionText: true }, take: 60 });
  const picked = seededShuffle(fallback, seed + candidateToken).slice(0, Math.min(count || 6, 12));
  const assessment = await prisma.assessment.create({
    data: {
      recruiterId: req.user?.id, recruiterEmail: req.user?.email || 'recruiter',
      candidateEmail: String(candidateEmail).toLowerCase(), candidateToken, role,
      difficulty: difficulty || 'Mid', jobFamily: fam, seed,
      questions: { create: picked.map((q, i) => ({ ordinal: i + 1, questionText: q.questionText })) },
    },
    include: { questions: true },
  });
  const link = `https://www.psychometriccoach.com/screening/${assessment.id}?t=${candidateToken}`;
  res.json({ success: true, assessmentId: assessment.id, candidateToken, inviteLink: link, questions: assessment.questions.length });
});

// ── Recruiter: list own assessments + violation summary (dashboard) ──
router.get('/assessments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await prisma.assessment.findMany({
    where: { recruiterId: req.user?.id },
    include: { _count: { select: { violations: true, questions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ assessments: rows });
});

router.get('/assessments/:id/report', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const a = await prisma.assessment.findFirst({ where: { id: req.params.id, recruiterId: req.user?.id },
    include: { violations: { orderBy: { createdAt: 'desc' } }, questions: { orderBy: { ordinal: 'asc' } } } });
  if (!a) { res.status(404).json({ error: 'not found' }); return; }
  const counts: Record<string, number> = {};
  a.violations.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
  res.json({ assessment: a, violationCounts: counts, totalViolations: a.violations.length });
});

// ── Candidate: verify token + fetch the assessment (SR-X-01) ──
router.get('/candidate/:id', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.t || '');
  const a = await prisma.assessment.findUnique({ where: { id: req.params.id },
    include: { questions: { orderBy: { ordinal: 'asc' }, select: { id: true, ordinal: true, questionText: true } } } });
  if (!a || a.candidateToken !== token) { res.status(403).json({ error: 'Invalid assessment link or token' }); return; }
  if (a.status === 'completed') { res.status(410).json({ error: 'This assessment has already been submitted.' }); return; }
  res.json({ assessment: { id: a.id, role: a.role, difficulty: a.difficulty, jobFamily: a.jobFamily,
    readingSec: a.readingSec, speakingSec: a.speakingSec, status: a.status, questions: a.questions } });
});

router.post('/candidate/:id/start', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.body?.t || '');
  const a = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!a || a.candidateToken !== token) { res.status(403).json({ error: 'Invalid token' }); return; }
  if (a.status === 'pending') await prisma.assessment.update({ where: { id: a.id }, data: { status: 'in_progress', startedAt: new Date() } });
  res.json({ success: true });
});

router.post('/candidate/:id/answer', async (req: Request, res: Response): Promise<void> => {
  const { t, questionId, answer } = req.body || {};
  const a = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!a || a.candidateToken !== t) { res.status(403).json({ error: 'Invalid token' }); return; }
  await prisma.assessmentQuestion.update({ where: { id: questionId }, data: { answer: String(answer || ''), answeredAt: new Date() } }).catch(() => {});
  res.json({ success: true });
});

router.post('/candidate/:id/submit', async (req: Request, res: Response): Promise<void> => {
  const { t } = req.body || {};
  const a = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!a || a.candidateToken !== t) { res.status(403).json({ error: 'Invalid token' }); return; }
  await prisma.assessment.update({ where: { id: a.id }, data: { status: 'completed', completedAt: new Date() } });
  res.json({ success: true });
});

// ── Violation logging (SR-B2B-16/17/18) — silent async, NEVER auto-terminates ──
router.post('/:assessmentId/log-violation', async (req: Request, res: Response): Promise<void> => {
  const { t, type, detail } = req.body || {};
  const a = await prisma.assessment.findUnique({ where: { id: req.params.assessmentId } });
  if (!a || a.candidateToken !== t) { res.status(403).json({ error: 'Invalid token' }); return; }
  const correlationId = crypto.randomBytes(6).toString('hex');
  await prisma.violationLog.create({ data: { assessmentId: a.id, type: String(type || 'UNKNOWN'), detail: detail || null, correlationId } });
  res.json({ logged: true }); // silent; no termination (SR-B2B-18)
});

export default router;
