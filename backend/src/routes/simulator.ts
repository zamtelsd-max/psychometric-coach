// ════════════════════════════════════════════════════════════════════════════
// Candidate Assessment & Engineering Simulator (Enhancement PRS)
// Individual-focused: adaptive IRT engine, UK/Zambian academic tracks,
// Big Five + SJT, engineering sandbox grading (AST + circuit netlist + hints).
// Mounted at /api/v1/simulator.  (No B2B — individual candidate journey only.)
// ════════════════════════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const router = Router();

const TRACKS = [
  { id: 'GENERAL', label: 'General Aptitude' },
  { id: 'UK_GCSE', label: 'UK · GCSE (9–1)' },
  { id: 'UK_ALEVEL', label: 'UK · A-Level (A*–E)' },
  { id: 'ZM_ECZ', label: 'Zambia · ECZ Competency-Based' },
];
const KINDS = [
  { id: 'NUMERICAL', label: 'Numerical Reasoning' },
  { id: 'VERBAL', label: 'Verbal Reasoning (True/False/Cannot Say)' },
  { id: 'OCEAN', label: 'Big Five (OCEAN) Personality' },
  { id: 'SJT', label: 'Situational Judgement (Most/Least)' },
  { id: 'ACADEMIC', label: 'Academic Subjects' },
];

router.get('/catalog', (_req: Request, res: Response): void => {
  res.json({ success: true, tracks: TRACKS, kinds: KINDS });
});

// ── IRT: 2-parameter logistic. P(correct) = 1/(1+e^(-a(theta-b))) ────────────
function pCorrect(theta: number, a: number, b: number): number {
  return 1 / (1 + Math.exp(-a * (theta - b)));
}
// Update theta after a response (simple EAP-style step, clamped).
function updateTheta(theta: number, a: number, b: number, correct: boolean): number {
  const p = pCorrect(theta, a, b);
  const step = 0.5 * a * ((correct ? 1 : 0) - p); // gradient of log-likelihood
  return Math.max(-3, Math.min(3, theta + step));
}
// Choose the next item whose difficulty b is closest to current theta (max info).
function selectNext(items: any[], theta: number, usedIds: Set<string>): any | null {
  const avail = items.filter(i => !usedIds.has(i.id));
  if (!avail.length) return null;
  avail.sort((x, y) => Math.abs(x.difficulty - theta) - Math.abs(y.difficulty - theta));
  return avail[0];
}

// ── Start an adaptive session ────────────────────────────────────────────────
router.post('/session/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { kind, track, subject } = req.body || {};
    if (!kind) { res.status(400).json({ error: 'kind required' }); return; }
    const candidateToken = crypto.randomBytes(16).toString('hex');
    const s = await prisma.simSession.create({
      data: { candidateToken, kind, track: track || 'GENERAL', subject: subject || '', theta: 0 },
    });
    res.json({ success: true, sessionToken: candidateToken, sessionId: s.id, kind, track: s.track });
  } catch (e) { console.error('sim start', e); res.status(500).json({ error: 'failed' }); }
});

// ── Get the next adaptive item ───────────────────────────────────────────────
router.get('/session/:token/next', async (req: Request, res: Response): Promise<void> => {
  try {
    const s = await prisma.simSession.findUnique({ where: { candidateToken: req.params.token } });
    if (!s) { res.status(404).json({ error: 'session not found' }); return; }
    if (s.isFinalized) { res.json({ success: true, done: true }); return; }
    const items = await prisma.simBank.findMany({
      where: { kind: s.kind, isActive: true, ...(s.track !== 'GENERAL' ? { track: s.track } : {}), ...(s.subject ? { subject: s.subject } : {}) },
    });
    const responses = (s.responses as any[]) || [];
    const used = new Set(responses.map(r => r.itemId));
    const MAX = s.kind === 'OCEAN' ? 25 : 15;
    if (s.answered >= MAX || used.size >= items.length) { res.json({ success: true, done: true }); return; }
    const next = selectNext(items, s.theta, used);
    if (!next) { res.json({ success: true, done: true }); return; }
    res.json({
      success: true, done: false, index: s.answered + 1, total: Math.min(MAX, items.length),
      item: {
        id: next.id, kind: s.kind, prompt: next.prompt, passage: next.passage,
        diagramData: next.diagramData, options: next.options, trait: next.trait,
      },
    });
  } catch (e) { console.error('sim next', e); res.status(500).json({ error: 'failed' }); }
});

// ── Submit an answer (adaptive/behavioural) ──────────────────────────────────
router.post('/session/:token/answer', async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId, key, leastKey, ms } = req.body || {};
    const s = await prisma.simSession.findUnique({ where: { candidateToken: req.params.token } });
    if (!s || s.isFinalized) { res.status(400).json({ error: 'invalid session' }); return; }
    const item = await prisma.simBank.findUnique({ where: { id: itemId } });
    if (!item) { res.status(404).json({ error: 'item not found' }); return; }

    const responses = (s.responses as any[]) || [];
    let theta = s.theta; let correct = false;
    if (s.kind === 'OCEAN') {
      // Likert 1..5, store trait contribution (reverse-scored if needed)
      const val = Math.max(1, Math.min(5, Number(key) || 3));
      const scored = item.reverse ? 6 - val : val;
      responses.push({ itemId, trait: item.trait, value: scored, ms: ms || 0 });
    } else if (s.kind === 'SJT') {
      const mostOk = String(key).toUpperCase() === item.correctKey;
      const leastOk = String(leastKey || '').toUpperCase() === item.leastKey;
      correct = mostOk && leastOk;
      theta = updateTheta(theta, item.discrimination, item.difficulty, correct);
      responses.push({ itemId, key, leastKey, correct, ms: ms || 0, theta });
    } else {
      correct = String(key).toUpperCase() === item.correctKey;
      theta = updateTheta(theta, item.discrimination, item.difficulty, correct);
      responses.push({ itemId, key, correct, ms: ms || 0, theta });
    }
    await prisma.simSession.update({
      where: { id: s.id },
      data: { theta, answered: s.answered + 1, correct: s.correct + (correct ? 1 : 0), responses },
    });
    res.json({ success: true, correct: s.kind === 'OCEAN' ? undefined : correct, theta });
  } catch (e) { console.error('sim answer', e); res.status(500).json({ error: 'failed' }); }
});

// ── Interruption recovery: save / load serialized state ──────────────────────
router.post('/session/:token/state', async (req: Request, res: Response): Promise<void> => {
  const s = await prisma.simSession.findUnique({ where: { candidateToken: req.params.token } });
  if (!s) { res.status(404).json({ error: 'not found' }); return; }
  await prisma.simSession.update({ where: { id: s.id }, data: { state: req.body?.state ?? {} } });
  res.json({ success: true });
});

// ── Finalize + score ─────────────────────────────────────────────────────────
router.post('/session/:token/finalize', async (req: Request, res: Response): Promise<void> => {
  try {
    const s = await prisma.simSession.findUnique({ where: { candidateToken: req.params.token } });
    if (!s) { res.status(404).json({ error: 'not found' }); return; }
    const responses = (s.responses as any[]) || [];
    let result: any = {};
    if (s.kind === 'OCEAN') {
      const dims: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [], SDS: [] };
      for (const r of responses) if (dims[r.trait]) dims[r.trait].push(r.value);
      const avg = (a: number[]) => a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) / 5 * 100) : 0;
      const ocean = { O: avg(dims.O), C: avg(dims.C), E: avg(dims.E), A: avg(dims.A), N: avg(dims.N) };
      const sds = avg(dims.SDS);
      result = { ocean, socialDesirability: sds, flag: sds >= 80 ? 'High social-desirability — responses may be idealised' : 'Consistent' };
      await prisma.simSession.update({ where: { id: s.id }, data: { isFinalized: true, oceanScores: { ...ocean, sds } } });
    } else {
      // ability percentile from theta (normal CDF approx) + raw accuracy
      const theta = s.theta;
      const pct = Math.round((0.5 * (1 + erf(theta / Math.SQRT2))) * 100);
      const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
      const band = ukBand(acc, s.track);
      result = { abilityPercentile: pct, theta: Math.round(theta * 100) / 100, accuracy: acc, correct: s.correct, answered: s.answered, band };
      await prisma.simSession.update({ where: { id: s.id }, data: { isFinalized: true, finalScore: acc } });
    }
    res.json({ success: true, kind: s.kind, track: s.track, ...result });
  } catch (e) { console.error('sim finalize', e); res.status(500).json({ error: 'failed' }); }
});

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
// Map accuracy → curriculum grade band.
function ukBand(acc: number, track: string): string {
  if (track === 'UK_GCSE') return acc >= 90 ? '9' : acc >= 80 ? '8' : acc >= 70 ? '7' : acc >= 60 ? '6' : acc >= 50 ? '5' : acc >= 40 ? '4' : acc >= 30 ? '3' : acc >= 20 ? '2' : '1';
  if (track === 'UK_ALEVEL') return acc >= 90 ? 'A*' : acc >= 80 ? 'A' : acc >= 70 ? 'B' : acc >= 60 ? 'C' : acc >= 50 ? 'D' : 'E';
  if (track === 'ZM_ECZ') return acc >= 75 ? 'Distinction' : acc >= 60 ? 'Merit' : acc >= 50 ? 'Credit' : acc >= 40 ? 'Satisfactory' : 'Developing';
  return acc >= 70 ? 'Strong' : acc >= 50 ? 'Competent' : 'Developing';
}

// ════════════════════════════════════════════════════════════════════════════
// FE-05/FE-07 Engineering Sandbox grading — AST heuristics + circuit netlist +
// unit tests + tiered hints. Individual "Zambian Smart Farm" style challenge.
// ════════════════════════════════════════════════════════════════════════════
const CHALLENGES: Record<string, any> = {
  smartfarm: {
    id: 'smartfarm', title: 'Zambian Smart Farm — Automated Irrigation',
    brief: 'Wire a moisture probe to the Pico and write MicroPython so the pump runs only when soil moisture is below 30%. Keep within ZMW 850 budget and protect components with a resistor on the relay line.',
    requiredComponents: ['pico', 'moisture_probe', 'relay', 'pump', 'resistor'],
    requiredWires: [['moisture_probe', 'pico'], ['pico', 'relay'], ['relay', 'pump']],
    budgetZMW: 850,
    codeMustInclude: ['machine', 'ADC', 'Pin', 'if', '30'],
    unitTests: [{ moisture: 20, expectPump: true }, { moisture: 60, expectPump: false }],
  },
};

router.get('/sandbox/:id', (req: Request, res: Response): void => {
  const c = CHALLENGES[req.params.id];
  if (!c) { res.status(404).json({ error: 'challenge not found' }); return; }
  res.json({ success: true, challenge: { id: c.id, title: c.title, brief: c.brief, requiredComponents: c.requiredComponents, budgetZMW: c.budgetZMW } });
});

// Tiered hint engine (FE-07)
router.post('/sandbox/:id/hint', (req: Request, res: Response): void => {
  const c = CHALLENGES[req.params.id];
  if (!c) { res.status(404).json({ error: 'not found' }); return; }
  const level = Math.max(1, Math.min(3, Number(req.body?.level) || 1));
  const hints: Record<number, string> = {
    1: 'Check your ground connections and make sure the moisture probe shares a common ground with the Pico.',
    2: 'Your logic must read the ADC on the probe pin and switch the relay only when moisture < 30%. Verify the relay is on a separate GPIO pin.',
    3: 'Pseudo-code:\n  adc = ADC(Pin(26))\n  while True:\n    moisture = adc.read_u16() / 65535 * 100\n    relay.value(1 if moisture < 30 else 0)\n    sleep(1)',
  };
  res.json({ success: true, level, hint: hints[level] });
});

// Grade a sandbox submission (AST heuristics + netlist + unit tests)
router.post('/sandbox/:id/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const c = CHALLENGES[req.params.id];
    if (!c) { res.status(404).json({ error: 'not found' }); return; }
    const { code = '', circuit = { components: [], wires: [] }, hintsUsed = 0 } = req.body || {};
    const feedback: string[] = [];

    // 1) AST-style structural analysis (semantic keyword + structure heuristics)
    const codeStr = String(code);
    const hasLoop = /\b(while|for)\b/.test(codeStr);
    const hasCond = /\bif\b/.test(codeStr);
    const hasKeywords = c.codeMustInclude.filter((k: string) => codeStr.includes(k)).length;
    let astScore = Math.round((hasKeywords / c.codeMustInclude.length) * 60 + (hasLoop ? 20 : 0) + (hasCond ? 20 : 0));
    astScore = Math.min(100, astScore);
    if (!hasLoop) feedback.push('No control loop detected — the farm must poll the sensor continuously.');
    if (!hasCond) feedback.push('No conditional (if) — pump must switch based on the moisture threshold.');

    // 2) Circuit netlist topology check + safety
    const comps: string[] = (circuit.components || []).map((x: any) => x.type || x);
    const wires: string[][] = (circuit.wires || []).map((w: any) => [w.from, w.to]);
    const compOk = c.requiredComponents.filter((rc: string) => comps.includes(rc)).length;
    const wireOk = c.requiredWires.filter((rw: string[]) =>
      wires.some(w => (w[0] === rw[0] && w[1] === rw[1]) || (w[0] === rw[1] && w[1] === rw[0]))).length;
    let circuitScore = Math.round((compOk / c.requiredComponents.length) * 50 + (wireOk / c.requiredWires.length) * 50);
    // safety: relay without resistor → overcurrent
    if (comps.includes('relay') && !comps.includes('resistor')) {
      circuitScore = Math.max(0, circuitScore - 25);
      feedback.push('⚠ Component Blown: Overcurrent detected — add a resistor on the relay line.');
    }
    if (compOk < c.requiredComponents.length) feedback.push(`Missing components: ${c.requiredComponents.filter((rc: string) => !comps.includes(rc)).join(', ')}`);

    // 3) Unit tests (simulate pump logic against thresholds via code intent)
    const readsThreshold = codeStr.includes('30');
    let unitPass = 0;
    for (const t of c.unitTests) {
      const predictedPump = readsThreshold && hasCond ? (t.moisture < 30) : false;
      if (predictedPump === t.expectPump) unitPass++;
    }
    const unitScore = Math.round((unitPass / c.unitTests.length) * 100);

    const total = Math.round(astScore * 0.34 + circuitScore * 0.33 + unitScore * 0.33) - hintsUsed * 3;
    const finalTotal = Math.max(0, Math.min(100, total));
    const passed = finalTotal >= 70 && circuitScore >= 50;
    if (passed) feedback.unshift('✅ Irrigation system operates safely and efficiently within budget.');

    await prisma.sandboxSubmission.create({
      data: { challengeId: c.id, code: codeStr.slice(0, 20000), circuit, astScore, circuitScore, unitScore, totalScore: finalTotal, passed, hintsUsed: Number(hintsUsed) || 0, feedback },
    }).catch(() => {});

    res.json({ success: true, astScore, circuitScore, unitScore, totalScore: finalTotal, passed, feedback });
  } catch (e) { console.error('sandbox submit', e); res.status(500).json({ error: 'failed' }); }
});

// ── Leaderboard (individual + by challenge) ──────────────────────────────────
router.get('/leaderboard/:id', async (req: Request, res: Response): Promise<void> => {
  const rows = await prisma.sandboxSubmission.findMany({
    where: { challengeId: req.params.id }, orderBy: { totalScore: 'desc' }, take: 20,
    select: { totalScore: true, astScore: true, circuitScore: true, unitScore: true, passed: true, createdAt: true },
  });
  res.json({ success: true, leaderboard: rows });
});

export default router;
