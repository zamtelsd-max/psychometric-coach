// SRS Addendum §1.1 — Post-Training Certification Grading Engine
// Deterministic routing: <80 → NONE/remediation; 80–99.99 → GOLD; exactly 100 → PLATINUM.
import prisma from '../lib/prisma';

export interface ExamVerdict {
  final_percentage: number;
  badge_tier: 'NONE' | 'GOLD' | 'PLATINUM';
  status_code: 'REMEDIATION_REQUIRED' | 'PASSED_WITH_GOLD_BADGE' | 'PASSED_WITH_PLATINUM_BADGE';
  is_upskilled: boolean;
}

export function evaluateExamSubmission(rawScore: number, _employeeId: string, _courseId: string): ExamVerdict {
  const finalPercentage = Math.round(parseFloat(String(rawScore)) * 100) / 100;

  if (finalPercentage < 80.0) {
    return { final_percentage: finalPercentage, badge_tier: 'NONE', status_code: 'REMEDIATION_REQUIRED', is_upskilled: false };
  }
  if (finalPercentage <= 99.99) {
    return { final_percentage: finalPercentage, badge_tier: 'GOLD', status_code: 'PASSED_WITH_GOLD_BADGE', is_upskilled: true };
  }
  return { final_percentage: 100, badge_tier: 'PLATINUM', status_code: 'PASSED_WITH_PLATINUM_BADGE', is_upskilled: true };
}

// Persist the verdict: upsert the certification, award XP on success (FR-4.3),
// keep the gap open on failure (FR-7.4 remediation reset).
export async function recordCertification(employeeId: string, courseId: string, rawScore: number) {
  const verdict = evaluateExamSubmission(rawScore, employeeId, courseId);
  const cert = await prisma.employeeCertification.upsert({
    where: { employeeId_courseId: { employeeId, courseId } },
    update: { examScore: verdict.final_percentage, badgeTier: verdict.badge_tier, certifiedAt: new Date() },
    create: { employeeId, courseId, examScore: verdict.final_percentage, badgeTier: verdict.badge_tier },
  });
  const xpAward = verdict.badge_tier === 'PLATINUM' ? 500 : verdict.badge_tier === 'GOLD' ? 250 : 25;
  if (xpAward > 0) await prisma.user.update({ where: { id: employeeId }, data: { xpPoints: { increment: xpAward } } });
  return { ...verdict, certificationId: cert.certificationId, xpAwarded: xpAward };
}
