// SRS FR-8.1/8.2 — shared MSR compiler + monthly scheduler (node-cron, 1st of month)
import cron from 'node-cron';
import prisma from '../lib/prisma';

export interface MsrPayload {
  enterprise: string; month: string;
  activeSkillGaps: string[]; candidateSuccessRate: number;
  badges: { gold: number; platinum: number }; completions: number;
  generatedAt: string;
}

export async function compileMsr(enterpriseId: string, enterpriseName: string): Promise<MsrPayload> {
  const since = new Date(); since.setMonth(since.getMonth() - 1);
  const [certs, attempts] = await Promise.all([
    prisma.employeeCertification.findMany({ where: { employee: { email: { not: '' } }, certifiedAt: { gte: since } } }),
    prisma.attempt.count({ where: { createdAt: { gte: since } } }),
  ]);
  // Gap engine hook: derive from failed-module remediations as the gap engine fills in
  const activeSkillGaps = [...new Set(
    (await prisma.employeeCertification.findMany({ where: { badgeTier: 'NONE', certifiedAt: { gte: since } }, select: { courseId: true } })).map(c => c.courseId)
  )];
  return {
    enterprise: enterpriseName, month: new Date().toISOString().slice(0, 7),
    activeSkillGaps: activeSkillGaps.length ? activeSkillGaps : ['Awaiting first evaluation data'],
    candidateSuccessRate: attempts ? Math.round((certs.filter(c => c.badgeTier !== 'NONE').length / attempts) * 100) : 0,
    badges: { gold: certs.filter(c => c.badgeTier === 'GOLD').length, platinum: certs.filter(c => c.badgeTier === 'PLATINUM').length },
    completions: attempts, generatedAt: new Date().toISOString(),
  };
}

async function emailMsr(ownerEmail: string, enterpriseName: string, msr: MsrPayload): Promise<boolean> {
  const url = process.env.MAIL_RELAY_URL, secret = process.env.MAIL_RELAY_SECRET;
  if (!url || !secret) return false;
  const html = `<h1>Monthly Status Report — ${enterpriseName}</h1><p>Period: ${msr.month}</p>
  <ul><li>Completions: ${msr.completions}</li><li>Success rate: ${msr.candidateSuccessRate}%</li>
  <li>Gold badges: ${msr.badges.gold} · Platinum: ${msr.badges.platinum}</li></ul>
  <p>Full export is available on your Enterprise Hub dashboard.</p>`;
  try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify({ to: ownerEmail, subject: `Your MSR is ready — ${enterpriseName} (${msr.month})`, html })); return r.ok; } catch { return false; }
}

export async function compileAndStoreAllMsrs(): Promise<{ compiled: number; emailed: number }> {
  const enterprises = await prisma.enterprise.findMany({ where: { OR: [{ isPaidSubscriber: true }, { isTrialActive: true }] } });
  const month = new Date().toISOString().slice(0, 7);
  let compiled = 0, emailed = 0;
  for (const e of enterprises) {
    try {
      const msr = await compileMsr(e.id, e.name);
      await prisma.monthlyReport.upsert({
        where: { enterpriseId_month: { enterpriseId: e.id, month } },
        update: { data: msr },
        create: { enterpriseId: e.id, month, data: msr },
      });
      compiled++;
      const sent = await emailMsr(e.ownerEmail, e.name, msr);
      if (sent) { await prisma.monthlyReport.update({ where: { enterpriseId_month: { enterpriseId: e.id, month } }, data: { emailedAt: new Date() } }); emailed++; }
    } catch (err) { console.error(`MSR compile failed for ${e.name}:`, err); }
  }
  return { compiled, emailed };
}

export function startMsrScheduler() {
  if (process.env.MSR_CRON_ENABLED === 'false') return;
  // 07:00 Africa/Lusaka on the 1st of every month (FR-8.2)
  cron.schedule('0 7 1 * *', () => { compileAndStoreAllMsrs().then(r => console.log(`[msr-cron] compiled ${r.compiled}, emailed ${r.emailed}`)); }, { timezone: 'Africa/Lusaka' });
  console.log('[msr-cron] scheduled: 1st of month @ 07:00 Africa/Lusaka');
}
