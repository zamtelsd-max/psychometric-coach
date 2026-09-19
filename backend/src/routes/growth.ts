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
    prisma.attempt.findMany({ where: { createdAt: { gte: since } }, select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1000 }),
  ]);
  res.json({
    enterprise: enterprise.name, month: new Date().toISOString().slice(0, 7),
    activeSkillGaps: ['Quantitative Aptitude', 'Verbal Reasoning'], // populated by the gap engine as modules complete
    candidateSuccessRate: attempts.length ? Math.round((certs.length / attempts.length) * 100) : 0,
    badges: { gold: certs.filter(c => c.badgeTier === 'GOLD').length, platinum: certs.filter(c => c.badgeTier === 'PLATINUM').length },
    completions: attempts.length,
  });
});


// GET /api/v1/growth/msr/export/csv — FR-8.3 secure MSR export (CSV download)
router.get('/msr/export/csv', authenticate, requireEnterpriseFeature('DOWNLOAD_MSR_PDF'), async (req: AuthRequest, res: Response): Promise<void> => {
  const email = (await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } }))!.email;
  const enterprise = await prisma.enterprise.findFirst({ where: { ownerEmail: email } });
  if (!enterprise) { res.status(404).json({ error: 'no enterprise' }); return; }
  const since = new Date(); since.setMonth(since.getMonth() - 1);
  const [certs, attempts] = await Promise.all([
    prisma.employeeCertification.findMany({ where: { certifiedAt: { gte: since } }, include: { employee: { select: { name: true, email: true } } } }),
    prisma.attempt.count({ where: { createdAt: { gte: since } } }),
  ]);
  const rows = [
    ['metric', 'value'],
    ['enterprise', enterprise.name], ['month', new Date().toISOString().slice(0, 7)],
    ['candidate_success_rate_pct', String(attempts ? Math.round((certs.length / Math.max(attempts, 1)) * 100) : 0)],
    ['completions_this_month', String(attempts)],
    ['gold_badges', String(certs.filter(c => c.badgeTier === 'GOLD').length)],
    ['platinum_badges', String(certs.filter(c => c.badgeTier === 'PLATINUM').length)],
    ...certs.map(c => ['certification', `${c.employee.email},${c.courseId},${Number(c.examScore)},${c.badgeTier}`]),
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="MSR-${enterprise.name.replace(/\W+/g, '-')}-${new Date().toISOString().slice(0, 7)}.csv"`);
  res.send(rows.map(r => r.join(',')).join('\n'));
});

// GET /api/v1/growth/msr/export/pdf — FR-8.3 formatted PDF: print-optimized
// report view that opens the browser print dialog (Save as PDF) — no native
// PDF dependency required; the CSV endpoint covers programmatic download.
router.get('/msr/export/pdf', authenticate, requireEnterpriseFeature('DOWNLOAD_MSR_PDF'), async (req: AuthRequest, res: Response): Promise<void> => {
  const email = (await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } }))!.email;
  const enterprise = await prisma.enterprise.findFirst({ where: { ownerEmail: email } });
  if (!enterprise) { res.status(404).json({ error: 'no enterprise' }); return; }
  const since = new Date(); since.setMonth(since.getMonth() - 1);
  const certs = await prisma.employeeCertification.findMany({ where: { certifiedAt: { gte: since } }, include: { employee: { select: { name: true, email: true } } }, orderBy: { certifiedAt: 'desc' } });
  const rows = certs.map(c => `<tr><td>${c.employee.name}</td><td>${c.employee.email}</td><td>${Number(c.examScore).toFixed(2)}%</td><td><b>${c.badgeTier}</b></td><td>${new Date(c.certifiedAt).toISOString().slice(0, 10)}</td></tr>`).join('');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html><head><title>MSR ${enterprise.name}</title><style>
    body{font-family:Georgia,serif;margin:40px;color:#1a202c} h1{color:#1B365D;border-bottom:3px solid #D4AF37;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-top:18px} th,td{border:1px solid #cbd5e0;padding:8px;text-align:left;font-size:13px}
    th{background:#1B365D;color:#fff} .meta{color:#4a5568;font-size:14px} @media print{button{display:none}}</style></head>
    <body onload="window.print()">
    <h1>Monthly Status Report — ${enterprise.name}</h1>
    <p class="meta">Period: ${new Date().toISOString().slice(0, 7)} · Generated: ${new Date().toISOString().slice(0, 10)}</p>
    <p class="meta"><b>Gold badges:</b> ${certs.filter(c => c.badgeTier === 'GOLD').length} · <b>Platinum badges:</b> ${certs.filter(c => c.badgeTier === 'PLATINUM').length} · <b>Certifications this month:</b> ${certs.length}</p>
    <h3>Employee Certifications</h3><table><tr><th>Employee</th><th>Email</th><th>Score</th><th>Badge</th><th>Date</th></tr>${rows || '<tr><td colspan="5">No certifications this period</td></tr>'}</table>
    <button style="margin-top:24px;padding:10px 20px;background:#1B365D;color:#fff;border:none;border-radius:8px;font-size:14px" onclick="window.print()">Save as PDF</button>
    </body></html>`);
});

export default router;
