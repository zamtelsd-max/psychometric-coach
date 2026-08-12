import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// ── Panel Matrix (SRS): 4 archetypes, each leads 1 round of 4 questions ──────
export const PANEL = [
  { archetype: 'TECH_LEAD',        name: 'Panelist 1 · Technical Lead',      role: 'Technical Lead',        focus: 'hard skills, foundational concepts & architecture', avatar: '🧑\u200d💻' },
  { archetype: 'HR_MANAGER',       name: 'Panelist 2 · HR & Culture Manager', role: 'HR & Culture Manager',  focus: 'culture fit, ethics & behavioural competencies',    avatar: '🧑\u200d💼' },
  { archetype: 'PRODUCT_MANAGER',  name: 'Panelist 3 · Project/Product Manager', role: 'Product Manager',    focus: 'execution, agility & prioritisation',               avatar: '📋' },
  { archetype: 'EXEC_DIRECTOR',    name: 'Panelist 4 · Executive Director',   role: 'Executive Director',    focus: 'strategy, vision & ROI',                            avatar: '👔' },
];
const QUESTIONS_PER_ROUND = 4;
const TOTAL_TURNS = 16;

function isPaid(plan?: string) { return plan && !['FREE', 'TRIAL'].includes(plan); }

// STAR detection + scoring heuristics (semantic keyword + structure analysis)
function analyseAnswer(text: string, expectedKeywords: string): {
  technical: number; structural: number; fluency: number;
  star: { situation: boolean; task: boolean; action: boolean; result: boolean };
  feedback: string;
} {
  const t = (text || '').toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const wc = words.length;

  // Technical: semantic keyword overlap
  const kws = (expectedKeywords || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const hit = kws.filter(k => k && t.includes(k)).length;
  let technical = kws.length ? Math.round((hit / kws.length) * 100) : Math.min(100, Math.round(wc / 1.2));
  technical = Math.max(15, Math.min(100, technical + (wc >= 40 ? 10 : 0)));

  // STAR structure
  const situation = /\b(when|situation|context|at my|during|while|role|project|company|faced|challenge)\b/.test(t);
  const task = /\b(task|goal|objective|needed to|responsible|had to|my job|required|target)\b/.test(t);
  const action = /\b(i (did|led|built|implemented|created|organised|analysed|decided|coordinated|developed|designed|drove)|steps|approach|strategy|first,|then|so i)\b/.test(t);
  const result = /\b(result|outcome|achieved|increased|reduced|improved|delivered|%|percent|saved|grew|success|impact|learned)\b/.test(t);
  const starCount = [situation, task, action, result].filter(Boolean).length;
  const structural = Math.round((starCount / 4) * 100);

  // Delivery & fluency: penalise fillers + reward adequate length/structure
  const fillers = (t.match(/\b(um|uh|like|you know|basically|literally|kind of|sort of)\b/g) || []).length;
  let fluency = 80 - fillers * 6 + (wc >= 30 && wc <= 220 ? 15 : 0) - (wc < 15 ? 25 : 0);
  fluency = Math.max(10, Math.min(100, fluency));

  const missing: string[] = [];
  if (!situation) missing.push('Situation');
  if (!task) missing.push('Task');
  if (!action) missing.push('Action');
  if (!result) missing.push('Result');
  let feedback = '';
  if (wc < 15) feedback = 'Answer is quite short — expand with a concrete example.';
  else if (missing.length === 0) feedback = 'Strong STAR-structured answer covering Situation, Task, Action and Result.';
  else feedback = `Good, but strengthen your STAR structure — missing: ${missing.join(', ')}.`;
  if (technical < 50 && kws.length) feedback += ' Bring in more role-relevant specifics/keywords.';

  return { technical, structural, fluency, star: { situation, task, action, result }, feedback };
}

router.use(authenticate);

// GET panel definition + job families
router.get('/panel', async (_req: AuthRequest, res: Response) => {
  const families = await prisma.interviewQuestion.findMany({ select: { jobFamily: true }, distinct: ['jobFamily'] });
  res.json({ panel: PANEL, questionsPerRound: QUESTIONS_PER_ROUND, totalTurns: TOTAL_TURNS,
    jobFamilies: families.map(f => f.jobFamily).sort(), tiers: ['Junior', 'Mid', 'Senior', 'Executive'] });
});

// POST start a new interview session
router.post('/start', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isPaid(req.user!.plan)) { res.status(402).json({ error: 'Virtual Interview Panel is a premium feature. Upgrade to unlock.' , upgrade: true }); return; }
  const { jobFamily, tier } = req.body || {};
  const s = await prisma.interviewSession.create({ data: {
    userId: req.user!.id, jobFamily: jobFamily || 'General', tier: tier || 'Mid',
    status: 'in_progress', currentRound: 1, currentTurn: 0,
  } });
  const q = await nextQuestion(s.id, s.jobFamily, s.tier, 1, 0);
  res.status(201).json({ session: { id: s.id, jobFamily: s.jobFamily, tier: s.tier, round: 1, turn: 0, totalTurns: TOTAL_TURNS }, panel: PANEL, question: q });
});

// helper: pick the next question for the given round/turn
async function nextQuestion(sessionId: string, jobFamily: string, tier: string, round: number, turnDone: number) {
  const panelist = PANEL[round - 1];
  // questions already used in this session
  const used = await prisma.interviewResponse.findMany({ where: { sessionId }, select: { questionText: true } });
  const usedSet = new Set(used.map(u => u.questionText));
  // candidates for this archetype, prefer jobFamily + tier
  let pool = await prisma.interviewQuestion.findMany({ where: { archetype: panelist.archetype, jobFamily } });
  if (pool.length < QUESTIONS_PER_ROUND) {
    const generic = await prisma.interviewQuestion.findMany({ where: { archetype: panelist.archetype, jobFamily: 'General' } });
    pool = [...pool, ...generic];
  }
  const avail = pool.filter(q => !usedSet.has(q.questionText));
  const pick = (avail.length ? avail : pool)[Math.floor(Math.random() * (avail.length ? avail.length : pool.length))];
  const turnInRound = turnDone % QUESTIONS_PER_ROUND;
  return pick ? {
    panelist: { archetype: panelist.archetype, name: panelist.name, role: panelist.role, avatar: panelist.avatar, focus: panelist.focus },
    round, questionNumber: turnDone + 1, questionInRound: turnInRound + 1,
    questionId: pick.id, questionText: pick.questionText, expectedKeywords: pick.expectedKeywords,
  } : null;
}

// POST answer a question → score it, advance
router.post('/:id/answer', async (req: AuthRequest, res: Response): Promise<void> => {
  const { transcript, questionId, questionText, expectedKeywords } = req.body || {};
  const s = await prisma.interviewSession.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!s || s.status !== 'in_progress') { res.status(404).json({ error: 'Session not found or completed' }); return; }
  const round = s.currentRound; const panelist = PANEL[round - 1];
  const a = analyseAnswer(transcript || '', expectedKeywords || '');
  await prisma.interviewResponse.create({ data: {
    sessionId: s.id, round, turn: s.currentTurn + 1, archetype: panelist.archetype,
    questionText: questionText || '', transcript: transcript || '',
    technicalScore: a.technical, structuralScore: a.structural, fluencyScore: a.fluency,
    starSituation: a.star.situation, starTask: a.star.task, starAction: a.star.action, starResult: a.star.result,
    feedback: a.feedback,
  } });

  const newTurn = s.currentTurn + 1;
  const newRound = Math.floor(newTurn / QUESTIONS_PER_ROUND) + 1;
  const done = newTurn >= TOTAL_TURNS;

  if (done) {
    // finalise: aggregate scoring per SRS weights (+ progressive growth vs history)
    const resps = await prisma.interviewResponse.findMany({ where: { sessionId: s.id } });
    const avg = (f: (r: any) => number) => resps.length ? resps.reduce((x, r) => x + f(r), 0) / resps.length : 0;
    const techAvg = avg(r => r.technicalScore), structAvg = avg(r => r.structuralScore), fluAvg = avg(r => r.fluencyScore);
    // progressive growth: delta vs user's previous completed session aggregate
    const prev = await prisma.interviewSession.findFirst({ where: { userId: req.user!.id, status: 'completed', NOT: { id: s.id } }, orderBy: { completedAt: 'desc' } });
    const baseComposite = techAvg * 0.41 + structAvg * 0.29 + fluAvg * 0.18; // 35/25/15 re-normalised to the 3 measurable dims (non-verbal 15% + growth 10% below)
    const growth = prev?.aggregateScore != null ? Math.max(0, Math.min(100, 50 + (baseComposite - prev.aggregateScore))) : 60;
    const aggregate = Math.round(techAvg * 0.35 + structAvg * 0.25 + fluAvg * 0.15 + 70 * 0.15 + growth * 0.10);
    const summary = buildSummary(techAvg, structAvg, fluAvg, aggregate, resps);
    await prisma.interviewSession.update({ where: { id: s.id }, data: {
      status: 'completed', currentTurn: newTurn, aggregateScore: aggregate,
      technicalAvg: Math.round(techAvg), structuralAvg: Math.round(structAvg), fluencyAvg: Math.round(fluAvg),
      growthDelta: Math.round(growth - 50), summary, completedAt: new Date(),
    } });
    res.json({ done: true, score: { technical: a.technical, structural: a.structural, fluency: a.fluency, star: a.star }, feedback: a.feedback,
      result: { aggregate, technicalAvg: Math.round(techAvg), structuralAvg: Math.round(structAvg), fluencyAvg: Math.round(fluAvg), growthDelta: Math.round(growth - 50), summary } });
    return;
  }

  await prisma.interviewSession.update({ where: { id: s.id }, data: { currentTurn: newTurn, currentRound: newRound } });
  const q = await nextQuestion(s.id, s.jobFamily, s.tier, newRound, newTurn);
  res.json({ done: false, score: { technical: a.technical, structural: a.structural, fluency: a.fluency, star: a.star }, feedback: a.feedback,
    progress: { round: newRound, turn: newTurn, totalTurns: TOTAL_TURNS }, question: q });
});

function buildSummary(t: number, s: number, f: number, agg: number, resps: any[]): string {
  const starGaps = ['starSituation', 'starTask', 'starAction', 'starResult']
    .filter(k => resps.filter(r => r[k]).length < resps.length * 0.6)
    .map(k => k.replace('star', ''));
  const band = agg >= 80 ? 'Strong hire-ready' : agg >= 65 ? 'Promising — polish needed' : agg >= 50 ? 'Developing' : 'Needs significant practice';
  let out = `Overall: ${band} (${agg}%). Technical ${Math.round(t)}%, Structure ${Math.round(s)}%, Delivery ${Math.round(f)}%.`;
  if (starGaps.length) out += ` Consistently strengthen: ${starGaps.join(', ')} in your STAR answers.`;
  else out += ' Your answers were well-structured throughout.';
  return out;
}

// GET a user's session history + a completed session detail
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  const rows = await prisma.interviewSession.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ sessions: rows });
});
router.get('/sessions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const s = await prisma.interviewSession.findFirst({ where: { id: req.params.id, userId: req.user!.id }, include: { responses: { orderBy: { turn: 'asc' } } } });
  if (!s) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ session: s });
});

export default router;
