// ════════════════════════════════════════════════════════════════════════════
// Teacher Automation Suite (Enhancement PRS FE-07)
// Classes with join codes, auto-aggregated structural problem areas, and
// one-click assessment sheets formatted for ECZ / UK examination standards.
// Mounted at /api/v1/teacher.
// ════════════════════════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Create a class (teacher) ─────────────────────────────────────────────────
router.post('/classes', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, track, subject } = req.body || {};
    if (!name) { res.status(400).json({ error: 'class name required' }); return; }
    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const c = await prisma.teacherClass.create({
      data: { teacherId: req.user!.id, name, track: track || 'ZM_ECZ', subject: subject || '', joinCode },
    });
    res.json({ success: true, class: c });
  } catch (e) { console.error('class create', e); res.status(500).json({ error: 'failed' }); }
});

router.get('/classes', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const classes = await prisma.teacherClass.findMany({ where: { teacherId: req.user!.id }, orderBy: { createdAt: 'desc' } });
  const withCounts = await Promise.all(classes.map(async c => ({
    ...c, students: await prisma.simSession.count({ where: { classId: c.id } }),
  })));
  res.json({ success: true, classes: withCounts });
});

// ── Class analytics: aggregate structural problem areas across students ──────
router.get('/classes/:id/analytics', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const c = await prisma.teacherClass.findFirst({ where: { id: req.params.id, teacherId: req.user!.id } });
    if (!c) { res.status(404).json({ error: 'class not found' }); return; }
    const sessions = await prisma.simSession.findMany({ where: { classId: c.id, isFinalized: true } });

    // per-item accuracy across the class → identify weakest topics/items
    const itemStat: Record<string, { correct: number; total: number }> = {};
    const scores: number[] = [];
    for (const s of sessions) {
      if (s.finalScore != null) scores.push(Number(s.finalScore));
      for (const r of ((s.responses as any[]) || [])) {
        if (typeof r.correct !== 'boolean') continue;
        itemStat[r.itemId] = itemStat[r.itemId] || { correct: 0, total: 0 };
        itemStat[r.itemId].total++; if (r.correct) itemStat[r.itemId].correct++;
      }
    }
    const ids = Object.keys(itemStat);
    const items = ids.length ? await prisma.simBank.findMany({ where: { id: { in: ids } } }) : [];
    const byId = new Map(items.map(i => [i.id, i]));
    // group by subject → avg accuracy
    const bySubject: Record<string, { correct: number; total: number }> = {};
    const weakItems: any[] = [];
    for (const id of ids) {
      const it = byId.get(id); if (!it) continue;
      const sub = it.subject || 'General';
      bySubject[sub] = bySubject[sub] || { correct: 0, total: 0 };
      bySubject[sub].correct += itemStat[id].correct; bySubject[sub].total += itemStat[id].total;
      const acc = Math.round((itemStat[id].correct / itemStat[id].total) * 100);
      if (acc < 60) weakItems.push({ prompt: it.prompt, subject: sub, accuracy: acc });
    }
    const subjects = Object.entries(bySubject).map(([subject, v]) => ({
      subject, accuracy: Math.round((v.correct / v.total) * 100), attempts: v.total,
    })).sort((a, b) => a.accuracy - b.accuracy);
    weakItems.sort((a, b) => a.accuracy - b.accuracy);

    res.json({
      success: true,
      class: { id: c.id, name: c.name, track: c.track, joinCode: c.joinCode },
      students: sessions.length,
      classAverage: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      subjectBreakdown: subjects,
      problemAreas: weakItems.slice(0, 10),
    });
  } catch (e) { console.error('class analytics', e); res.status(500).json({ error: 'failed' }); }
});

// ── One-click assessment sheet (ECZ / UK formatted) from weakest topics ──────
router.post('/classes/:id/generate-sheet', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const c = await prisma.teacherClass.findFirst({ where: { id: req.params.id, teacherId: req.user!.id } });
    if (!c) { res.status(404).json({ error: 'class not found' }); return; }
    const count = Math.max(5, Math.min(30, Number(req.body?.count) || 10));

    // Pull items in the class's track/subject, prioritising the weakest areas
    const pool = await prisma.simBank.findMany({
      where: { kind: 'ACADEMIC', track: c.track, ...(c.subject ? { subject: c.subject } : {}), isActive: true },
    });
    const picked = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));

    const trackLabel = ({ UK_GCSE: 'GCSE (9–1)', UK_ALEVEL: 'GCE A-Level (A*–E)', ZM_ECZ: 'ECZ Competency-Based Assessment' } as any)[c.track] || c.track;
    const header = `${trackLabel}\n${c.subject || 'General'} — Class Assessment: ${c.name}\nName: __________________________   Date: ____________   Time: 40 min\n\nInstructions: Answer ALL questions. Circle the correct letter.\n`;
    const questions = picked.map((q, i) => {
      const opts = (q.options as any[]).map(o => `   (${o.key}) ${o.label}`).join('\n');
      return `${i + 1}. ${q.prompt}\n${opts}`;
    });
    const answerKey = picked.map((q, i) => `${i + 1}. ${q.correctKey}`).join('   ');
    const sheet = `${header}\n${questions.join('\n\n')}\n\n\n────────────────────────────────\nANSWER KEY (teacher): ${answerKey}`;

    res.json({ success: true, format: trackLabel, questionCount: picked.length, sheet });
  } catch (e) { console.error('generate sheet', e); res.status(500).json({ error: 'failed' }); }
});

export default router;
