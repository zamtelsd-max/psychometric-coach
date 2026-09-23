// ════════════════════════════════════════════════════════════════════════════
// Enterprise Blueprint v4.0 — B2B Workforce Assessment Ecosystem
// 100-Q adaptive simulation, passive telemetry, corporate reports, certificates.
// Mounted at /api/v1/enterprise-v2 and /api/v1/exams (telemetry).
// ════════════════════════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── constants from blueprint ─────────────────────────────────────────────────
const QUESTIONS_PER_EXAM = 100;
const BLOCK_SIZE = 10;
const CERT_PASS_BOUNDARY = 81.0;      // §2.1 certificate iff grade >= 81.00%
const UPSKILL_BENCHMARK = 80.0;       // §4.2 upskilling trigger below 80.00%
const RAW_LOG_TTL_HOURS = 24;         // §5.2 GDPR raw purge

const DEPARTMENTS = [
  'Executive / Leadership', 'Finance & Accounting', 'Human Resources (HR)',
  'Marketing', 'Sales', 'Operations & Production', 'Information Tech (IT)', 'Customer Support',
];
const TIERS = ['Operations', 'Mid Management', 'Senior Management', 'Executive'];

// Base-62 encoder for the cryptographic confirmation stamp (§2.2)
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function base62(buf: Buffer): string {
  let num = BigInt('0x' + buf.toString('hex'));
  if (num === 0n) return '0';
  let out = '';
  while (num > 0n) { out = B62[Number(num % 62n)] + out; num /= 62n; }
  return out;
}

// ── Department taxonomy (§4.1) ───────────────────────────────────────────────
router.get('/taxonomy', (_req: Request, res: Response): void => {
  res.json({ success: true, departments: DEPARTMENTS, tiers: TIERS });
});

// ── Org registration / lookup (admin) ────────────────────────────────────────
router.post('/orgs', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyName, licenseTier } = req.body || {};
    if (!companyName) { res.status(400).json({ error: 'companyName required' }); return; }
    const org = await prisma.enterpriseOrg.create({
      data: { companyName: String(companyName), ownerEmail: req.user?.email || '', licenseTier: licenseTier || 'Enterprise Premium' },
    });
    res.json({ success: true, org });
  } catch (e) { console.error('org create', e); res.status(500).json({ error: 'failed' }); }
});

router.get('/orgs', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const orgs = await prisma.enterpriseOrg.findMany({
    where: { ownerEmail: req.user?.email || '__none__' }, orderBy: { createdAt: 'desc' },
    include: { _count: { select: { sessions: true } } },
  });
  res.json({ success: true, orgs });
});

// ── Scenario generation (§3.1 dynamic threading) ─────────────────────────────
// Deterministic per-session generator: block N context mutates block N+1
// (risk factor / cash constraints / operational bottlenecks).
function mulberry32(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

const COMPETENCIES: Record<string, string[]> = {
  'Executive / Leadership': ['Strategic Vision', 'Crisis Governance', 'Stakeholder Alignment', 'Systemic Compliance'],
  'Finance & Accounting': ['Cash-Flow Control', 'Risk Modeling', 'Regulatory Reporting', 'Budget Forecasting'],
  'Human Resources (HR)': ['Talent Acquisition', 'Conflict Resolution', 'Compliance', 'Workforce Planning'],
  'Marketing': ['Brand Strategy', 'Analytics', 'Channel Mix', 'Positioning'],
  'Sales': ['Pipeline Management', 'Negotiation', 'Account Growth', 'Closing Discipline'],
  'Operations & Production': ['Supply Chain', 'Throughput Optimization', 'Quality Control', 'Bottleneck Removal'],
  'Information Tech (IT)': ['Infrastructure', 'Cybersecurity', 'Incident Response', 'Architecture'],
  'Customer Support': ['SLA Management', 'Escalation Handling', 'Retention', 'Empathy Ops'],
};
const RISK_FACTORS = ['budget overrun', 'talent attrition', 'compliance breach', 'market shock', 'system outage', 'supply disruption'];

function buildScenario(dept: string, tier: string, industry: string, ordinal: number, prevRisk: string, rand: () => number) {
  const comps = COMPETENCIES[dept] || ['General'];
  const competency = comps[Math.floor(rand() * comps.length)];
  const risk = RISK_FACTORS[Math.floor(rand() * RISK_FACTORS.length)];
  const cash = Math.floor(rand() * 900 + 100) * 1000;
  const carry = prevRisk ? ` A prior decision left an unresolved ${prevRisk}.` : '';
  const scenario =
    `[${dept} · ${tier} · ${industry}] Q${ordinal}. You face a ${risk} scenario affecting ${competency}. ` +
    `Available operating cash is $${cash.toLocaleString()} and an operational bottleneck is emerging.${carry} ` +
    `Which course of action best protects long-range value while maintaining ${competency}?`;
  const correctKey = ['A', 'B', 'C', 'D'][Math.floor(rand() * 4)];
  const options = [
    { key: 'A', label: `Prioritise immediate ${competency} stabilisation, absorbing short-term cost.` },
    { key: 'B', label: `Escalate to leadership and defer action pending fuller data.` },
    { key: 'C', label: `Reallocate the $${cash.toLocaleString()} to the highest-severity bottleneck first.` },
    { key: 'D', label: `Maintain status quo and monitor the ${risk} for one cycle.` },
  ];
  return { scenario, options, correctKey, competency, riskFactor: risk };
}

// ── Admin: create a 100-Q candidate session (§3, §4) ─────────────────────────
router.post('/sessions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orgId, candidateName, candidateEmail, targetDepartment, targetTier, industryField } = req.body || {};
    if (!orgId || !targetDepartment || !targetTier) { res.status(400).json({ error: 'orgId, targetDepartment, targetTier required' }); return; }
    if (!TIERS.includes(targetTier)) { res.status(400).json({ error: 'invalid targetTier' }); return; }
    const org = await prisma.enterpriseOrg.findUnique({ where: { id: orgId } });
    if (!org) { res.status(404).json({ error: 'org not found' }); return; }

    const accessToken = crypto.randomBytes(20).toString('hex');
    const seed = crypto.randomBytes(8).toString('hex');
    const rand = mulberry32(seed + accessToken);
    const trackTitle = `${targetDepartment} — ${targetTier}`;

    const qData: any[] = [];
    let prevRisk = '';
    for (let i = 1; i <= QUESTIONS_PER_EXAM; i++) {
      const s = buildScenario(targetDepartment, targetTier, industryField || 'General', i, prevRisk, rand);
      prevRisk = s.riskFactor; // §3.1 block N mutates N+1
      qData.push({
        ordinal: i, block: Math.ceil(i / BLOCK_SIZE), scenario: s.scenario,
        options: s.options, correctKey: s.correctKey, competency: s.competency, riskFactor: s.riskFactor,
      });
    }

    const session = await prisma.candidateSession.create({
      data: {
        orgId, candidateName: candidateName || '', candidateEmail: (candidateEmail || '').toLowerCase(),
        targetDepartment, targetTier, industryField: industryField || 'General',
        accessToken, trackTitle, questions: { create: qData },
      },
    });
    const link = `https://www.psychometriccoach.com/exam/entry/?k=${session.id}.${accessToken}`;
    res.json({ success: true, sessionId: session.id, accessToken, examLink: link, totalQuestions: QUESTIONS_PER_EXAM });
  } catch (e) { console.error('session create', e); res.status(500).json({ error: 'failed' }); }
});

// ── Candidate: session meta (no answers) ─────────────────────────────────────
router.get('/exam/:id', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.t || '');
  const s = await prisma.candidateSession.findUnique({ where: { id: req.params.id } });
  if (!s || s.accessToken !== token) { res.status(403).json({ error: 'invalid session' }); return; }
  res.json({
    success: true,
    session: {
      id: s.id, candidateName: s.candidateName, trackTitle: s.trackTitle,
      targetDepartment: s.targetDepartment, targetTier: s.targetTier,
      totalQuestions: QUESTIONS_PER_EXAM, blockSize: BLOCK_SIZE,
      currentQuestionIndex: s.currentQuestionIndex, isFinalized: s.isFinalized,
    },
  });
});

// ── Candidate: fetch a block of 10 (§3.2 rolling pre-cache) ──────────────────
router.get('/exam/:id/block/:block', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.t || '');
  const block = Math.max(1, Math.min(10, parseInt(req.params.block, 10) || 1));
  const s = await prisma.candidateSession.findUnique({ where: { id: req.params.id } });
  if (!s || s.accessToken !== token) { res.status(403).json({ error: 'invalid session' }); return; }
  if (s.startedAt == null) await prisma.candidateSession.update({ where: { id: s.id }, data: { startedAt: new Date() } });
  const qs = await prisma.sessionQuestion.findMany({
    where: { sessionId: s.id, block }, orderBy: { ordinal: 'asc' },
    select: { id: true, ordinal: true, block: true, scenario: true, options: true, competency: true },
  });
  res.json({ success: true, block, blockSize: BLOCK_SIZE, questions: qs });
});

// ── Candidate: submit an answer ──────────────────────────────────────────────
router.post('/exam/:id/answer', async (req: Request, res: Response): Promise<void> => {
  const { token, ordinal, answerKey } = req.body || {};
  const s = await prisma.candidateSession.findUnique({ where: { id: req.params.id } });
  if (!s || s.accessToken !== token) { res.status(403).json({ error: 'invalid session' }); return; }
  if (s.isFinalized) { res.status(409).json({ error: 'session finalized' }); return; }
  const q = await prisma.sessionQuestion.findFirst({ where: { sessionId: s.id, ordinal: Number(ordinal) } });
  if (!q) { res.status(404).json({ error: 'question not found' }); return; }
  const isCorrect = String(answerKey).toUpperCase() === q.correctKey;
  await prisma.sessionQuestion.update({ where: { id: q.id }, data: { answerKey: String(answerKey).toUpperCase(), isCorrect, answeredAt: new Date() } });
  await prisma.candidateSession.update({ where: { id: s.id }, data: { currentQuestionIndex: Math.max(s.currentQuestionIndex, Number(ordinal) + 1) } });
  res.json({ success: true });
});

// ── Grading worker + certificate (§2.1, §2.2) ────────────────────────────────
router.post('/exam/:id/finalize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body || {};
    const s = await prisma.candidateSession.findUnique({ where: { id: req.params.id } });
    if (!s || s.accessToken !== token) { res.status(403).json({ error: 'invalid session' }); return; }

    const qs = await prisma.sessionQuestion.findMany({ where: { sessionId: s.id } });
    const answered = qs.length || 1;
    const correct = qs.filter(q => q.isCorrect).length;
    const grade = Math.round((correct / answered) * 10000) / 100; // 2dp

    await prisma.candidateSession.update({
      where: { id: s.id }, data: { isFinalized: true, finalizedAt: new Date(), rawScore: grade as any },
    });

    // per-competency aggregation → corporate report + skill gaps
    const byComp: Record<string, { c: number; t: number }> = {};
    for (const q of qs) { const k = q.competency || 'General'; byComp[k] = byComp[k] || { c: 0, t: 0 }; byComp[k].t++; if (q.isCorrect) byComp[k].c++; }
    const skillGaps = Object.entries(byComp)
      .map(([k, v]) => ({ competency: k, avg: Math.round((v.c / v.t) * 10000) / 100 }))
      .filter(x => x.avg < UPSKILL_BENCHMARK); // §4.2

    // §2.1 certificate iff grade >= 81.00% (idempotent ledger hash)
    let certificate = null;
    if (grade >= CERT_PASS_BOUNDARY) {
      const ledgerHash = crypto.createHash('sha256').update(`${s.id}|${grade}|cert`).digest('hex');
      const existing = await prisma.certificate.findUnique({ where: { sessionId: s.id } }).catch(() => null);
      if (existing) certificate = existing;
      else {
        const stamp = base62(crypto.randomBytes(16));
        certificate = await prisma.certificate.create({
          data: {
            sessionId: s.id, candidateName: s.candidateName || 'Candidate', trackTitle: s.trackTitle,
            finalGrade: grade as any, confirmationStamp: stamp, ledgerHash,
          },
        }).catch(async () => prisma.certificate.findUnique({ where: { sessionId: s.id } }));
      }
    }

    res.json({
      success: true, grade, passed: grade >= CERT_PASS_BOUNDARY, passBoundary: CERT_PASS_BOUNDARY,
      skillGaps, upskillingRecommended: skillGaps.length > 0,
      certificate: certificate ? { id: certificate.id, confirmationStamp: certificate.confirmationStamp, verifyUrl: `https://www.psychometriccoach.com/verify-certificate/entry/?stamp=${certificate.confirmationStamp}` } : null,
    });
  } catch (e) { console.error('finalize', e); res.status(500).json({ error: 'failed' }); }
});

// ── Public certificate verification (§2) ─────────────────────────────────────
router.get('/verify-certificate/:stamp', async (req: Request, res: Response): Promise<void> => {
  const c = await prisma.certificate.findUnique({ where: { confirmationStamp: req.params.stamp } });
  if (!c) { res.status(404).json({ success: false, valid: false, error: 'not found' }); return; }
  res.json({
    success: true, valid: true,
    certificate: { candidateName: c.candidateName, trackTitle: c.trackTitle, finalGrade: c.finalGrade, confirmationStamp: c.confirmationStamp, issuedAt: c.issuedAt.toISOString() },
  });
});

// ── Enterprise admin: aggregated department report (§5.2 no raw telemetry) ────
router.get('/orgs/:orgId/report', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await prisma.enterpriseOrg.findUnique({ where: { id: req.params.orgId } });
    if (!org) { res.status(404).json({ error: 'org not found' }); return; }
    const sessions = await prisma.candidateSession.findMany({
      where: { orgId: org.id, isFinalized: true },
      select: { id: true, targetDepartment: true, rawScore: true },
    });
    const byDept: Record<string, number[]> = {};
    for (const s of sessions) { (byDept[s.targetDepartment] ||= []).push(Number(s.rawScore)); }
    const departments = Object.entries(byDept).map(([dept, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const productivityLoss = Math.max(0, Math.round((100 - avg) * 0.6 * 100) / 100);
      const burnout = avg < 60 ? 'HIGH' : avg < 75 ? 'MEDIUM' : 'LOW';
      return { department: dept, candidates: scores.length, aggregateCompetenceAvg: Math.round(avg * 100) / 100, projectedProductivityLossPct: productivityLoss, burnoutRiskIndicator: burnout };
    });
    // §5.2 — aggregated indices only; NO raw candidate telemetry exposed.
    res.json({ success: true, org: { id: org.id, companyName: org.companyName }, departments, totalFinalized: sessions.length });
  } catch (e) { console.error('report', e); res.status(500).json({ error: 'failed' }); }
});

// ── §4.2 Request Bespoke Training (one-click skill-gap compile → fulfillment) ─
router.post('/orgs/:orgId/training-request', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentKey } = req.body || {};
    const org = await prisma.enterpriseOrg.findUnique({ where: { id: req.params.orgId } });
    if (!org) { res.status(404).json({ error: 'org not found' }); return; }
    const sessions = await prisma.candidateSession.findMany({
      where: { orgId: org.id, isFinalized: true, ...(departmentKey ? { targetDepartment: departmentKey } : {}) },
      include: { questions: { select: { competency: true, isCorrect: true } } },
    });
    const byComp: Record<string, { c: number; t: number }> = {};
    for (const s of sessions) for (const q of s.questions) { const k = q.competency; byComp[k] = byComp[k] || { c: 0, t: 0 }; byComp[k].t++; if (q.isCorrect) byComp[k].c++; }
    const skillGapData = Object.entries(byComp)
      .map(([k, v]) => ({ competency: k, avg: v.t ? Math.round((v.c / v.t) * 10000) / 100 : 0 }))
      .filter(x => x.avg < UPSKILL_BENCHMARK).sort((a, b) => a.avg - b.avg);
    const tr = await prisma.trainingRequest.create({
      data: { orgId: org.id, departmentKey: departmentKey || '', requestedBy: req.user?.email || '', skillGapData },
    });
    res.json({ success: true, requestId: tr.id, skillGaps: skillGapData, message: 'Skill-gap telemetry compiled and transmitted to the fulfillment desk.' });
  } catch (e) { console.error('training-request', e); res.status(500).json({ error: 'failed' }); }
});

// ════════════════════════════════════════════════════════════════════════════
// §7.2 / §8 — Passive telemetry ingestion (mounted separately at /api/v1/exams)
// ════════════════════════════════════════════════════════════════════════════
export const telemetryRouter = Router();
telemetryRouter.post('/telemetry', async (req: Request, res: Response): Promise<void> => {
  try {
    // sendBeacon posts text/plain; body may be raw string
    let body: any = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const gh = body?.gatewayHeader || {}; const tp = body?.telemetryPayload || {};
    const sessionId = gh.sessionUuid;
    if (!sessionId || tp.questionIndex == null) { res.status(204).end(); return; }
    const s = await prisma.candidateSession.findUnique({ where: { id: sessionId } }).catch(() => null);
    if (!s) { res.status(204).end(); return; } // fail-soft for beacons
    await prisma.passiveInteractionLog.create({
      data: {
        sessionId,
        questionNumber: Number(tp.questionIndex) || 0,
        timeToFirstClickMs: Number(tp.timeToFirstClickMilliseconds) || 0,
        totalDwellTimeMs: Number(tp.totalDwellTimeMilliseconds) || 0,
        toggleCount: Number(tp.answerStateToggles) || 0,
        readingCadenceCharsPerSec: tp.readingCadenceCharsPerSec != null ? (Number(tp.readingCadenceCharsPerSec) as any) : null,
        erraticCursorSpam: !!tp?.uiAnomaliesDetected?.erraticCursorSpam,
        viewportFocusLossCounter: Number(tp?.uiAnomaliesDetected?.viewportFocusLossCounter) || 0,
      },
    }).catch(() => {});
    res.status(204).end();
  } catch { res.status(204).end(); }
});

// ── §5.2 GDPR purge: destroy raw logs older than 24h (idempotent) ────────────
export async function purgeStaleTelemetry(): Promise<number> {
  const cutoff = new Date(Date.now() - RAW_LOG_TTL_HOURS * 3600 * 1000);
  const r = await prisma.passiveInteractionLog.deleteMany({ where: { capturedAt: { lt: cutoff } } });
  return r.count;
}
router.post('/admin/purge-telemetry', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  const n = await purgeStaleTelemetry();
  res.json({ success: true, purged: n });
});

export default router;
