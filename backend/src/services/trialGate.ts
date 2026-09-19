// SRS Addendum §1.2 — Enterprise Trial Feature Gatekeeping Engine
// Wraps premium routes: paid → allow; active trial → allow except gated
// premium features; expired → lock everything down to the individual tier.
export type GateFeature = 'DOWNLOAD_MSR_PDF' | 'CUSTOM_ROLE_BASELINE_MAPPING' | 'FULL_QUESTION_LIBRARY';
export type GateVerdict = 'ALLOW_ACCESS' | 'REJECT_ACCESS_REDIRECT_TO_DODO_CHECKOUT' | 'TRIAL_EXPIRED_LOCK_ALL_FEATURES';

const GATED_PREMIUM_FEATURES: GateFeature[] = ['DOWNLOAD_MSR_PDF', 'CUSTOM_ROLE_BASELINE_MAPPING'];

interface EnterpriseRecord {
  isPaidSubscriber: boolean;
  isTrialActive: boolean;
  trialStartedAt: Date | null;
  trialDays?: number | null;
}

export function verifyEnterpriseAccessGates(enterpriseRecord: EnterpriseRecord, requestedFeature?: GateFeature): GateVerdict {
  const today = new Date();

  if (enterpriseRecord.isPaidSubscriber === true) return 'ALLOW_ACCESS';

  if (enterpriseRecord.isTrialActive === true && enterpriseRecord.trialStartedAt) {
    const trialExpiryDate = new Date(enterpriseRecord.trialStartedAt);
    trialExpiryDate.setDate(trialExpiryDate.getDate() + (enterpriseRecord.trialDays ?? 30));
    if (today <= trialExpiryDate) {
      if (requestedFeature && GATED_PREMIUM_FEATURES.includes(requestedFeature)) {
        return 'REJECT_ACCESS_REDIRECT_TO_DODO_CHECKOUT';
      }
      return 'ALLOW_ACCESS';
    }
  }

  return 'TRIAL_EXPIRED_LOCK_ALL_FEATURES';
}

// Express middleware factory — resolves the caller's enterprise record, then
// enforces the verdict. 402 + { redirect } when a gated feature is hit on trial.
export function requireEnterpriseFeature(feature?: GateFeature) {
  return async (req: any, res: any, next: any): Promise<void> => {
    const enterprise = await resolveEnterpriseForUser(req.user?.id);
    if (!enterprise) { res.status(403).json({ error: 'No enterprise workspace' }); return; }
    const verdict = verifyEnterpriseAccessGates(enterprise, feature);
    if (verdict === 'ALLOW_ACCESS') { (req as any).enterprise = enterprise; next(); return; }
    if (verdict === 'REJECT_ACCESS_REDIRECT_TO_DODO_CHECKOUT') {
      res.status(402).json({ error: 'This feature requires an upgraded plan', redirect: '/enterprise/upgrade' });
      return;
    }
    res.status(403).json({ error: 'Trial expired — upgrade to restore enterprise tools', code: 'TRIAL_EXPIRED' });
  };
}

async function resolveEnterpriseForUser(userId?: string) {
  if (!userId) return null;
  const user = await (await import('../lib/prisma')).default.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return (await import('../lib/prisma')).default.enterprise.findFirst({ where: { ownerEmail: user.email } });
}
