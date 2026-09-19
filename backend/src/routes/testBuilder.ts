// SRS FR-1 — Test Architect Engine: custom test assembly, unique URL tokens,
// bulk candidate invites with email routing, public prospect screens.
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { detectRegion, getLocalizationSet, localizeQuestion } from '../services/localization';

const router = Router();

async function mailRelay(to: string, subject: string, html: string): Promise<boolean> {
  const url = process.env.MAIL_RELAY_URL, secret = process.env.MAIL_RELAY_SECRET;
  if (!url || !secret) return false;
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify({ to, subject, html }) });
    return r.ok;
  } catch { return false; }
}

// POST /api/v1/testbuilder — FR-1.1 assemble a test from the question bank
router.post('/', authenticate, [body('title').isString().notEmpty(), body('questionIds').isArray({ min: 1 })], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { title, description = '', questionIds, isPublic = true } = req.body;
  const test = await prisma.customTest.create({ data: { title, description, questionIds, isPublic, createdBy: req.user!.id, linkToken: crypto.randomBytes(12).toString('hex') } });
  res.json({ test, inviteUrl: `/invite/${test.linkToken}` });
});

// GET /api/v1/testbuilder — list my assembled tests
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ tests: await prisma.customTest.findMany({ where: { createdBy: req.user!.id }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { links: true } } } }) });
});

// GET /api/v1/testbuilder/bank — question bank picker feed (FR-1.1 / §5)
router.get('/bank', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const q = await prisma.question.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' }, take: 400, select: { id: true, text: true, subSkill: true, difficulty: true, categoryId: true } });
  res.json({ questions: q });
});

// POST /api/v1/testbuilder/:id/invites — FR-1.3 bulk candidate invites
router.post('/:id/invites', authenticate, [body('emails').isArray({ min: 1 })], async (req: AuthRequest, res: Response): Promise<void> => {
  const test = await prisma.customTest.findFirst({ where: { id: req.params.id, createdBy: req.user!.id } });
  if (!test) { res.status(404).json({ error: 'test not found' }); return; }
  const emails = (req.body.emails as string[]).slice(0, 500);
  const frontend = process.env.FRONTEND_URL || 'https://www.psychometriccoach.com';
  const links = [];
  for (const email of emails) {
    const link = await prisma.testLink.create({ data: { token: crypto.randomBytes(12).toString('hex'), testId: test.id, candidateEmail: email } });
    const url = `${frontend}/invite/${link.token}`;
    const sent = await mailRelay(email, `Your assessment invite: ${test.title}`, `<h2>${test.title}</h2><p>You have been invited to complete an assessment. Start here: <a href="${url}">${url}</a></p>`);
    if (sent) await prisma.testLink.update({ where: { id: link.id }, data: { inviteSentAt: new Date() } });
    links.push({ email, token: link.token, url, emailed: sent });
  }
  res.json({ links });
});

// GET /api/v1/testbuilder/public/:token — FR-1.4 prospect screen data (FR-2 localized)
router.get('/public/:token', async (req: Request, res: Response): Promise<void> => {
  const link = await prisma.testLink.findUnique({ where: { token: req.params.token }, include: { test: true } });
  if (!link || (link.expiresAt && link.expiresAt < new Date())) { res.status(404).json({ error: 'invite link invalid or expired' }); return; }
  const set = await getLocalizationSet(detectRegion(req));
  const rows = await prisma.question.findMany({ where: { id: { in: link.test.questionIds }, isActive: true } });
  const byId = new Map(rows.map(r => [r.id, r]));
  const questions = link.test.questionIds.map(id => byId.get(id)).filter(Boolean).map(q => localizeQuestion({ id: q!.id, questionText: q!.text, options: q!.options, timeLimit: q!.timeLimit }, set));
  await prisma.testLink.update({ where: { id: link.id }, data: { usedCount: { increment: 1 } } });
  res.json({ test: { title: link.test.title, description: link.test.description }, candidate: link.candidateEmail, questions });
});

// POST /api/v1/testbuilder/public/:token/submit — candidate submission store
router.post('/public/:token/submit', async (req: Request, res: Response): Promise<void> => {
  const link = await prisma.testLink.findUnique({ where: { token: req.params.token } });
  if (!link) { res.status(404).json({ error: 'invalid link' }); return; }
  await prisma.testLink.update({ where: { id: link.id }, data: { responses: req.body?.answers ?? {}, submittedAt: new Date() } });
  res.json({ ok: true });
});

export default router;
