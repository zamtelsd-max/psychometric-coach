// SRS Addendum §FR-9 — Admin promo & dynamic pricing: coupon validation + CRUD
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const ADMIN_ROLES = new Set(['ADMIN']);

// POST /api/v1/coupons/validate — checkout price check (FR-9.2 matrix lookup)
router.post('/validate', [body('code').isString().notEmpty(), body('basePrice').isFloat({ min: 0 })], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const { code, basePrice } = req.body as { code: string; basePrice: number };
  const c = await prisma.coupon.findUnique({ where: { couponCode: code.toUpperCase() } });
  if (!c || (c.expiresAt && c.expiresAt < new Date()) || (c.usageLimit !== null && c.usedCount >= c.usageLimit)) {
    res.status(404).json({ valid: false, error: 'invalid or expired coupon' }); return;
  }
  const value = Number(c.discountValue);
  const finalPrice = c.discountType === 'PERCENTAGE' ? Math.round(basePrice * (1 - value / 100) * 100) / 100 : Math.max(0, Math.round((basePrice - value) * 100) / 100);
  res.json({ valid: true, couponCode: c.couponCode, discountType: c.discountType, discountValue: value, dodoPriceOverrideId: c.dodoPriceOverrideId, finalPrice });
});

// GET /api/v1/coupons — admin list
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!ADMIN_ROLES.has(req.user!.role)) { res.status(403).json({ error: 'admin only' }); return; }
  res.json({ coupons: await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }) });
});

// POST /api/v1/coupons — admin create (FR-9.1/9.2)
router.post('/', authenticate, [
  body('couponCode').isString().notEmpty(), body('discountType').isIn(['PERCENTAGE', 'FLAT_FIXED']), body('discountValue').isFloat({ min: 0 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  if (!ADMIN_ROLES.has(req.user!.role)) { res.status(403).json({ error: 'admin only' }); return; }
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const b = req.body;
  try {
    const c = await prisma.coupon.upsert({
      where: { couponCode: String(b.couponCode).toUpperCase() },
      update: { discountType: b.discountType, discountValue: b.discountValue, dodoPriceOverrideId: b.dodoPriceOverrideId ?? null, expiresAt: b.expiresAt ? new Date(b.expiresAt) : null, usageLimit: b.usageLimit ?? null },
      create: { couponCode: String(b.couponCode).toUpperCase(), discountType: b.discountType, discountValue: b.discountValue, dodoPriceOverrideId: b.dodoPriceOverrideId ?? null, expiresAt: b.expiresAt ? new Date(b.expiresAt) : null, usageLimit: b.usageLimit ?? null },
    });
    res.json({ coupon: c });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'create failed' }); }
});

export default router;
