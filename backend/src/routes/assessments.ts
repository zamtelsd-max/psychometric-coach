// SRS Addendum §FR-7 — Post-training certification exam (submit + my certs)
// Grading per the deterministic engine in services/certification.ts
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { recordCertification } from '../services/certification';

const router = Router();

// POST /api/v1/assessments/submit — certification exam submission
router.post('/submit', authenticate, [
  body('courseId').isString().notEmpty(),
  body('score').isFloat({ min: 0, max: 100 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  try {
    const { courseId, score } = req.body as { courseId: string; score: number };
    // NFR-1.2 data isolation: the record is written against the session user only
    const result = await recordCertification(req.user!.id, courseId, Number(score));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'certification failed' });
  }
});

// GET /api/v1/assessments/my-certifications — badge wall for the dark-mode hub
router.get('/my-certifications', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await prisma.employeeCertification.findMany({ where: { employeeId: req.user!.id }, orderBy: { certifiedAt: 'desc' } });
  res.json({ certifications: rows, gold: rows.filter(r => r.badgeTier === 'GOLD').length, platinum: rows.filter(r => r.badgeTier === 'PLATINUM').length });
});

export default router;
