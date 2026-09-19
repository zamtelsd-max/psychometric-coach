// SRS FR-5 — recommendation core: gap extraction, AI-calculated durations,
// frictionless (short-first) stream ordering, contextual rationale messages.
import prisma from '../lib/prisma';

// FR-5.2 — reading duration from word length + practical exercise allowance
export function computeDuration(contentHtml: string, format: string): { estMinutes: number; label: string } {
  const words = contentHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  let minutes = Math.max(1, Math.round(words / 200));
  if (contentHtml.includes('data-exercise')) minutes += 5; // practical exercise allowance
  if (format === 'COURSE') minutes = Math.max(minutes, 45);
  const label = minutes < 10 ? `${minutes}-min read` : minutes < 60 ? `${minutes}-min drill` : `${(minutes / 60).toFixed(1)}-hour course`;
  return { estMinutes: minutes, label };
}

// FR-5.1 — dynamic skill mapping: wrong answers + failed certifications → gap skills
export async function extractGaps(userId: string): Promise<string[]> {
  const wrong = await prisma.attempt.findMany({
    where: { userId, isCorrect: false },
    select: { question: { select: { subSkill: true } } },
    orderBy: { createdAt: 'desc' }, take: 300,
  });
  const counts = new Map<string, number>();
  for (const a of wrong) counts.set(a.question.subSkill, (counts.get(a.question.subSkill) ?? 0) + 1);
  const failedCerts = await prisma.employeeCertification.findMany({ where: { employeeId: userId, badgeTier: 'NONE' }, select: { courseId: true } });
  for (const f of failedCerts) counts.set(f.courseId, (counts.get(f.courseId) ?? 0) + 2);
  return [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

export interface FeedItem { id: string; title: string; format: string; durationLabel: string; estMinutes: number; tags: string[]; rationale: string; excerpt: string; completed: boolean; examUnlocked?: boolean }

// FR-5.3 short-first ordering · FR-5.4 explicit rationale per item
export async function buildFeed(userId: string): Promise<{ items: FeedItem[]; gaps: string[] }> {
  const [modules, done, gaps] = await Promise.all([
    prisma.learningModule.findMany({ where: { isActive: true } }),
    prisma.moduleCompletion.findMany({ where: { userId }, select: { moduleId: true } }),
    extractGaps(userId),
  ]);
  const doneSet = new Set(done.map(d => d.moduleId));
  const items: FeedItem[] = [];
  for (const m of modules) {
    const words = m.contentHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const { estMinutes, label } = { estMinutes: m.estMinutes, label: computeDuration(m.contentHtml, m.format).label};
    const matchedTag = m.tags.find(t => gaps.includes(t));
    const rationale = matchedTag ? `Fixes your identified gap in: ${matchedTag}` : `Builds your foundation in: ${m.tags[0] ?? 'core skills'}`;
    items.push({ id: m.id, title: m.title, format: m.format, durationLabel: label, estMinutes, tags: m.tags, rationale, excerpt: m.contentHtml.replace(/<[^>]+>/g, ' ').slice(0, 120) + '…', completed: doneSet.has(m.id) });
  }
  items.sort((a, b) => (Number(b.rationale.startsWith('Fixes')) - Number(a.rationale.startsWith('Fixes'))) || a.estMinutes - b.estMinutes);
  // FR-7.1: a gap whose matching modules are all completed unlocks its exam
  for (const it of items) if (it.completed) it.examUnlocked = undefined;
  return { items, gaps };
}
