// SRS Addendum §FR-11 — Dodo Payments webhook handlers
// FR-11.1 verify signature; FR-11.2 subscription.created → paid; FR-11.3 cancelled → downgrade.
// Raw body is preserved on req.rawBody (see index.ts json verify hook).
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const router = Router();
const WEBHOOK_SECRET = process.env.DODO_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET || '';

// Dodo signs payloads with a webhook key; docs specify HMAC-SHA256 base64 over
// the raw body in the `webhook-signature` header. Verification is skipped
// (with a startup warning) only when no key is configured — e.g. local dev.
function verifyDodoSignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) return true;
  const sig = (req.headers['webhook-signature'] || req.headers['x-dodo-signature'] || '') as string;
  if (!sig) return false;
  const digest = crypto.createHmac('sha256', WEBHOOK_SECRET).update((req as any).rawBody ?? '').digest('base64');
  try { return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(sig)); } catch { return false; }
}

router.post('/dodo', (req: Request, res: Response): void => {
  if (!verifyDodoSignature(req)) { res.status(401).json({ error: 'invalid webhook signature' }); return; }
  const event = req.body as { type?: string; data?: any };
  const type = event?.type || '';
  const subscriptionId: string | undefined = event?.data?.subscription_id || event?.data?.id;
  const customerEmail: string | undefined = event?.data?.customer?.email;

  (async () => {
    const enterprise = subscriptionId
      ? await prisma.enterprise.findFirst({ where: { dodoSubscriptionId: subscriptionId } })
      : customerEmail ? await prisma.enterprise.findFirst({ where: { ownerEmail: customerEmail } }) : null;
    if (!enterprise) { res.json({ received: true, matched: false }); return; }

    if (type === 'subscription.created' || type === 'subscription.active' || type === 'payment.succeeded') {
      // FR-11.2 — switch on paid, lift trial limit filters
      await prisma.enterprise.update({ where: { id: enterprise.id }, data: { isPaidSubscriber: true, isTrialActive: false, dodoSubscriptionId: subscriptionId ?? enterprise.dodoSubscriptionId } });
    } else if (type === 'subscription.cancelled' || type === 'subscription.expired' || type === 'payment.failed') {
      // FR-11.3 — lock premium MSR utilities, drop to standard tier; learning records untouched
      await prisma.enterprise.update({ where: { id: enterprise.id }, data: { isPaidSubscriber: false } });
    }
    res.json({ received: true, matched: true, type });
  })().catch(() => res.status(500).json({ error: 'webhook processing failed' }));
});

export default router;
