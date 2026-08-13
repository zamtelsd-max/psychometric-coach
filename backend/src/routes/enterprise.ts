import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Dodo Payments config (hosted checkout; merchant-of-record cards) ───────────
const DODO = {
  base: process.env.DODO_BASE || 'https://test.dodopayments.com',
  key: process.env.DODO_API_KEY || '',
  products: {
    'shl-prep': process.env.DODO_PROD_SHL || 'pdt_0NlIpwjo94EOSBoCZ21M7',
    'korn-ferry-prep': process.env.DODO_PROD_KORNFERRY || 'pdt_0NlIpwpMdGmwD5ibjBGbR',
    'predictive-index-prep': process.env.DODO_PROD_PI || 'pdt_0NlIpwuCZBRWgvqBDjeZB',
  } as Record<string, string>,
  premiumProduct: process.env.DODO_PROD_PREMIUM || 'pdt_0NlIpwfCbROEWm1DoCMQe',
  auditProduct: process.env.DODO_PROD_AUDIT || 'pdt_0NlIpwz0Ct7nof4BIOeaq',
};
async function dodoCheckout(productId: string, returnUrl: string, metadata: Record<string, string>): Promise<{ url?: string; sessionId?: string; error?: string }> {
  if (!DODO.key) return { error: 'Dodo not configured' };
  try {
    const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 20000);
    const r = await fetch(`${DODO.base}/checkouts`, {
      method: 'POST', signal: ac.signal,
      headers: { 'Authorization': `Bearer ${DODO.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_cart: [{ product_id: productId, quantity: 1 }], return_url: returnUrl, metadata }),
    });
    clearTimeout(to);
    const d: any = await r.json().catch(() => ({}));
    if (d.checkout_url) return { url: d.checkout_url, sessionId: d.session_id };
    return { error: d.error || 'checkout failed' };
  } catch (e: any) { return { error: e?.message || 'request failed' }; }
}

// ── ZynlePay (mobile-money C2B) config ──────────────────────────────────────
const ZP = {
  base: process.env.ZYNLEPAY_BASE || 'https://sandbox.zynlepay.com/zynlepay/jsonapi',
  merchantId: process.env.ZYNLEPAY_MERCHANT_ID || 'MEC01780',
  apiId: process.env.ZYNLEPAY_API_ID || '2399b583-b0ca-4e0b-9175-d81b3d75d79f',
  apiKey: process.env.ZYNLEPAY_API_KEY || 'f56b9ef1-d0b8-4892-b70b-3f98432780b9',
};
async function usdToZmw(usd: number): Promise<number> {
  const rate = Number(process.env.USD_ZMW_RATE || 26);
  return Math.round(usd * rate * 100) / 100;
}
// Initiate a ZynlePay mobile-money collection (async push; rc 120 = approve on phone)
async function zynleInitiate(params: { amountZmw: number; phone: string; reference: string; email: string; }): Promise<{ code: string; raw: any }> {
  const body = { auth: { 'merchant-id': ZP.merchantId, 'api-id': ZP.apiId, 'api-key': ZP.apiKey }, data: {
    method: 'runBillPayment', channel: 'momo', reference_no: params.reference, amount: String(params.amountZmw),
    currency: 'ZMW', phone_number: String(params.phone), first_name: 'Psychometric', last_name: 'Coach', email: params.email,
  } };
  try {
    const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 30000);
    const r = await fetch(ZP.base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
    clearTimeout(to);
    const data: any = await r.json().catch(() => ({}));
    const code = String(data?.response?.data?.response_code ?? data?.response_code ?? '');
    return { code, raw: data };
  } catch (e: any) {
    return { code: '', raw: { error: e?.message || 'request failed' } };
  }
}

// Feature flags (SR-X-04) — independently togglable
const FLAGS = {
  passports: process.env.FF_PASSPORTS !== 'off',
  audit: process.env.FF_AUDIT !== 'off',
  matcher: process.env.FF_MATCHER !== 'off',
};
router.get('/flags', (_req, res) => res.json({ flags: FLAGS }));

const emailUser = (to: string, subject: string, body: string) => {
  try { exec(`gsk vm_email send "${to}" -s ${JSON.stringify(subject)} -b ${JSON.stringify(body)} -f $OPENCLAW_VM_NAME`, () => {}); } catch {}
};

// ════════════════════════════════════════════════════════════════════════════
// 3.1.3 DIGITAL PASSPORTS — prep manuals with single-use 72h signed URLs
// ════════════════════════════════════════════════════════════════════════════
router.get('/passports', async (_req, res) => {
  if (!FLAGS.passports) { res.json({ passports: [] }); return; }
  const passports = await prisma.digitalPassport.findMany({
    where: { active: true },
    select: { id: true, slug: true, title: true, provider: true, description: true, priceUsd: true },
    orderBy: { priceUsd: 'asc' },
  });
  res.json({ passports });
});

// Purchase completion → issue single-use, 72h signed URL (SR-B2C-10..14)
router.post('/passports/:slug/purchase', async (req: Request, res: Response): Promise<void> => {
  if (!FLAGS.passports) { res.status(404).json({ error: 'disabled' }); return; }
  const { email, providerRef } = req.body || {};
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const passport = await prisma.digitalPassport.findUnique({ where: { slug: req.params.slug } });
  if (!passport || !passport.active) { res.status(404).json({ error: 'Passport not found' }); return; }

  const signedToken = crypto.randomBytes(24).toString('hex');
  const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // exactly 72h
  const purchase = await prisma.passportPurchase.create({
    data: { passportId: passport.id, email: String(email).toLowerCase(), amount: passport.priceUsd,
      provider: 'zynlepay', providerRef: providerRef || null, status: 'paid', signedToken, tokenExpiry },
  });
  const link = `https://www.psychometriccoach.com/api/v1/enterprise/passports/download/${signedToken}`;
  emailUser(email, `Your ${passport.title} is ready`,
    `Thank you for your purchase.\n\nDownload your ${passport.provider} prep manual (valid 72 hours, single use):\n${link}\n\n— Psychometric Coach`);
  res.json({ success: true, purchaseId: purchase.id, downloadUrl: link, expiresAt: tokenExpiry });
});

// ZynlePay checkout — mobile money C2B, issues signed URL only on payment success
router.post('/passports/:slug/checkout', async (req: Request, res: Response): Promise<void> => {
  if (!FLAGS.passports) { res.status(404).json({ error: 'disabled' }); return; }
  const { email, phone, operator } = req.body || {};
  if (!email || !phone || !operator) { res.status(400).json({ error: 'email, phone and operator (airtel|mtn|zamtel) are required' }); return; }
  const passport = await prisma.digitalPassport.findUnique({ where: { slug: req.params.slug } });
  if (!passport || !passport.active) { res.status(404).json({ error: 'Passport not found' }); return; }

  const reference = 'PP' + crypto.randomBytes(5).toString('hex').toUpperCase();
  const amountZmw = await usdToZmw(passport.priceUsd);
  const signedToken = crypto.randomBytes(24).toString('hex');
  const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const purchase = await prisma.passportPurchase.create({
    data: { passportId: passport.id, email: String(email).toLowerCase(), amount: passport.priceUsd,
      provider: 'zynlepay', providerRef: reference, status: 'initiated', signedToken, tokenExpiry },
  });
  const pay = await zynleInitiate({ amountZmw, phone: String(phone), reference, email: String(email) });
  if (pay.code === '120') {
    // async push sent; wait for callback/status to confirm before releasing download
    await prisma.passportPurchase.update({ where: { id: purchase.id }, data: { status: 'pending' } });
    res.json({ success: true, pending: true, reference, amountZmw,
      message: 'Payment request sent. Approve the prompt on your phone, then your download link will be ready.' });
    return;
  }
  await prisma.passportPurchase.update({ where: { id: purchase.id }, data: { status: 'failed' } });
  res.status(402).json({ success: false, error: 'Payment could not be initiated. Check the number/operator and try again.', code: pay.code });
});

// ZynlePay callback — confirms payment (rc 100 / SUCCESS) then releases the signed URL
router.post('/passports/callback', async (req: Request, res: Response): Promise<void> => {
  const d = req.body?.response?.data || req.body?.data || req.body || {};
  const ref = d.reference_no || d.referenceNo; const rc = String(d.response_code ?? '');
  if (ref) {
    const p = await prisma.passportPurchase.findFirst({ where: { providerRef: String(ref) }, include: { passport: true } });
    if (p && p.status !== 'paid' && (rc === '100' || String(d.status).toUpperCase() === 'SUCCESS')) {
      await prisma.passportPurchase.update({ where: { id: p.id }, data: { status: 'paid' } });
      const link = `https://www.psychometriccoach.com/api/v1/enterprise/passports/download/${p.signedToken}`;
      emailUser(p.email, `Your ${p.passport.title} is ready`,
        `Payment received (ref ${ref}).\n\nDownload your ${p.passport.provider} prep manual (valid 72 hours, single use):\n${link}\n\n— Psychometric Coach`);
    }
  }
  res.json({ response_code: 130 });
});

// Poll purchase status by reference — returns the download link once paid
router.get('/passports/status/:ref', async (req: Request, res: Response): Promise<void> => {
  const p = await prisma.passportPurchase.findFirst({ where: { providerRef: req.params.ref } });
  if (!p) { res.status(404).json({ error: 'not found' }); return; }
  res.json({ status: p.status,
    downloadUrl: p.status === 'paid' ? `https://www.psychometriccoach.com/api/v1/enterprise/passports/download/${p.signedToken}` : null,
    expiresAt: p.status === 'paid' ? p.tokenExpiry : null });
});

// ── Dodo hosted checkout for a passport (cards / international) ────────────────
router.post('/passports/:slug/dodo-checkout', async (req: Request, res: Response): Promise<void> => {
  if (!FLAGS.passports) { res.status(404).json({ error: 'disabled' }); return; }
  const { email } = req.body || {};
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const passport = await prisma.digitalPassport.findUnique({ where: { slug: req.params.slug } });
  if (!passport || !passport.active) { res.status(404).json({ error: 'Passport not found' }); return; }
  const productId = DODO.products[req.params.slug];
  if (!productId) { res.status(400).json({ error: 'No Dodo product mapped for this passport' }); return; }
  const reference = 'PP' + crypto.randomBytes(5).toString('hex').toUpperCase();
  const signedToken = crypto.randomBytes(24).toString('hex');
  const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await prisma.passportPurchase.create({
    data: { passportId: passport.id, email: String(email).toLowerCase(), amount: passport.priceUsd,
      provider: 'dodo', providerRef: reference, status: 'pending', signedToken, tokenExpiry },
  });
  const ret = `https://www.psychometriccoach.com/passports?ref=${reference}`;
  const co = await dodoCheckout(productId, ret, { reference, kind: 'passport', slug: req.params.slug, email: String(email).toLowerCase() });
  if (co.error || !co.url) { res.status(502).json({ error: co.error || 'Could not start checkout' }); return; }
  res.json({ success: true, reference, checkoutUrl: co.url });
});

// ── Dodo webhook — confirm payment, release signed URL / activate plan ────────
router.post('/dodo/webhook', async (req: Request, res: Response): Promise<void> => {
  const evt = req.body || {};
  const type = evt.type || evt.event_type || '';
  const data = evt.data || evt;
  const meta = data?.metadata || data?.payment?.metadata || {};
  const paid = /succeeded|completed|active|paid/i.test(String(type)) || /succeeded|completed|paid/i.test(String(data?.status));
  try {
    if (paid && meta.kind === 'passport' && meta.reference) {
      const p = await prisma.passportPurchase.findFirst({ where: { providerRef: String(meta.reference) }, include: { passport: true } });
      if (p && p.status !== 'paid') {
        await prisma.passportPurchase.update({ where: { id: p.id }, data: { status: 'paid' } });
        const link = `https://www.psychometriccoach.com/api/v1/enterprise/passports/download/${p.signedToken}`;
        emailUser(p.email, `Your ${p.passport.title} is ready`, `Payment received.\n\nDownload your ${p.passport.provider} prep manual (valid 72 hours, single use):\n${link}\n\n— Psychometric Coach`);
      }
    }
    if (paid && meta.kind === 'premium' && meta.userId) {
      const until = new Date(); until.setMonth(until.getMonth() + 1);
      await prisma.user.update({ where: { id: String(meta.userId) }, data: { plan: 'PREMIUM', planExpiresAt: until } }).catch(() => {});
    }
  } catch (e) { /* idempotent; ignore */ }
  res.json({ received: true });
});

// ── Dodo checkout to upgrade the logged-in user to PREMIUM ──────────────────
router.post('/premium/dodo-checkout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const ret = 'https://www.psychometriccoach.com/dashboard?upgraded=1';
  const co = await dodoCheckout(DODO.premiumProduct, ret, { kind: 'premium', userId: req.user!.id, email: req.user!.email });
  if (co.error || !co.url) { res.status(502).json({ error: co.error || 'Could not start checkout' }); return; }
  res.json({ success: true, checkoutUrl: co.url });
});

// Single-use signed download (SR-B2C-12/13/14)
router.get('/passports/download/:token', async (req: Request, res: Response): Promise<void> => {
  const p = await prisma.passportPurchase.findUnique({ where: { signedToken: req.params.token }, include: { passport: true } });
  if (!p) { res.status(404).send('Invalid or unknown download link.'); return; }
  if (p.downloadedAt) { res.status(410).send('This link has already been used. Download links are single-use.'); return; }
  if (p.tokenExpiry < new Date()) { res.status(410).send('This download link has expired (links are valid for 72 hours).'); return; }
  // mark used BEFORE redirect (single-use)
  await prisma.passportPurchase.update({ where: { id: p.id }, data: { downloadedAt: new Date() } });
  res.redirect(302, p.passport.fileUrl);
});

// ════════════════════════════════════════════════════════════════════════════
// 3.1.2 HUMAN-IN-THE-LOOP AUDIT (order-bump add-on) — SR-B2C-05..09
// ════════════════════════════════════════════════════════════════════════════
// Triggered when a qualifying payment carries the human-audit metadata key.
router.post('/audit/enqueue', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!FLAGS.audit) { res.status(404).json({ error: 'disabled' }); return; }
  const { sessionId, recordingRef } = req.body || {};
  const correlationId = crypto.randomBytes(6).toString('hex');
  let transcript: string | null = null; let analytics: any = null;
  if (sessionId) {
    const sess = await prisma.interviewSession.findUnique({ where: { id: sessionId }, include: { responses: true } }).catch(() => null);
    if (sess) {
      transcript = (sess.responses || []).map((r: any) => `Q: ${r.questionText}\nA: ${r.answer || ''}`).join('\n\n');
      analytics = { aggregateScore: (sess as any).aggregateScore, responses: (sess.responses || []).length };
    }
  }
  const ticket = await prisma.auditTicket.create({
    data: { userId: req.user?.id, email: req.user?.email || 'unknown', sessionId: sessionId || null,
      recordingRef: recordingRef || null, transcript, analytics, correlationId, status: 'open' },
  });
  // notify review team (SR-B2C-07)
  emailUser(process.env.AUDIT_REVIEW_EMAIL || 'zamtel.sd@gmail.com',
    `New human-audit ticket ${ticket.id}`, `A paid human-audit ticket was created.\nCorrelation: ${correlationId}\nUser: ${ticket.email}\nSession: ${sessionId || 'n/a'}`);
  res.json({ success: true, ticketId: ticket.id, correlationId });
});

// ════════════════════════════════════════════════════════════════════════════
// 3.2 AI RESUME-TO-INTERVIEW MATCHER — SR-B2C-15..20
// (server-side analysis; email-gate; pre-inits interview from gaps)
// ════════════════════════════════════════════════════════════════════════════
const HARD_SKILLS = ['javascript','typescript','python','java','sql','react','node','aws','docker','kubernetes','excel','powerbi','tableau','salesforce','sap','accounting','audit','forecasting','marketing','seo','crm','leadership','project management','agile','scrum','data analysis','machine learning','communication','negotiation','sales'];
const SOFT_SKILLS = ['leadership','communication','teamwork','problem solving','adaptability','time management','collaboration','critical thinking','creativity','empathy','initiative','resilience','stakeholder'];

function analyseResume(resumeText: string, jobDesc: string) {
  const rt = resumeText.toLowerCase(); const jd = jobDesc.toLowerCase();
  const foundHard = HARD_SKILLS.filter(s => rt.includes(s));
  const foundSoft = SOFT_SKILLS.filter(s => rt.includes(s));
  // required = skills mentioned in the JD
  const requiredHard = HARD_SKILLS.filter(s => jd.includes(s));
  const requiredSoft = SOFT_SKILLS.filter(s => jd.includes(s));
  const required = [...new Set([...requiredHard, ...requiredSoft])];
  const have = [...new Set([...foundHard, ...foundSoft])];
  const gaps = required.filter(s => !have.includes(s));
  const matched = required.filter(s => have.includes(s));
  const score = required.length ? Math.round((matched.length / required.length) * 100) : Math.min(60 + have.length * 3, 92);
  // infer job family
  let jobFamily = 'General';
  if (/(engineer|developer|software|programming)/.test(jd)) jobFamily = 'Software Engineering';
  else if (/(sales|distribution|account executive)/.test(jd)) jobFamily = 'Sales & Distribution';
  else if (/(finance|accounting|audit|analyst)/.test(jd)) jobFamily = 'Finance';
  else if (/(marketing|brand|seo|content)/.test(jd)) jobFamily = 'Marketing';
  else if (/(data|analytics|scientist)/.test(jd)) jobFamily = 'Data & Analytics';
  else if (/(operations|logistics|supply)/.test(jd)) jobFamily = 'Operations';
  else if (/(hr|human resources|recruit|people)/.test(jd)) jobFamily = 'Human Resources';
  else if (/(nurse|doctor|clinical|health|patient)/.test(jd)) jobFamily = 'Healthcare';
  else if (/(support|customer service|helpdesk)/.test(jd)) jobFamily = 'Customer Service';
  const tier = /(senior|lead|head|director|principal|manager)/.test(jd) ? 'Senior' : /(junior|graduate|entry)/.test(jd) ? 'Junior' : 'Mid';
  return { score, hardSkills: foundHard, softSkills: foundSoft, gaps, jobFamily, tier, matched };
}

// SR-B2C-17/18: analysis runs on server; result held behind email gate
router.post('/matcher/analyze', async (req: Request, res: Response): Promise<void> => {
  if (!FLAGS.matcher) { res.status(404).json({ error: 'disabled' }); return; }
  const { resumeText, jobDescription } = req.body || {};
  if (!resumeText || !jobDescription) { res.status(400).json({ error: 'resumeText and jobDescription are required' }); return; }
  if (String(resumeText).length > 200000) { res.status(413).json({ error: 'Resume too large (max ~5 MB text).' }); return; }
  const a = analyseResume(String(resumeText), String(jobDescription));
  const match = await prisma.resumeMatch.create({
    data: { jobDescription: String(jobDescription).slice(0, 4000), matchScore: a.score,
      hardSkills: a.hardSkills, softSkills: a.softSkills, gaps: a.gaps, jobFamily: a.jobFamily, tier: a.tier },
  });
  // SR-B2C funnel: return only a teaser until email gate satisfied
  res.json({ matchId: match.id, score: a.score, gated: true,
    teaser: { strengthsCount: a.matched.length, gapsCount: a.gaps.length, jobFamily: a.jobFamily, tier: a.tier } });
});

// SR-B2C: gate satisfaction → full analysis + CTA params for pre-init interview
router.post('/matcher/:matchId/unlock', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body || {};
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const match = await prisma.resumeMatch.findUnique({ where: { id: req.params.matchId } });
  if (!match) { res.status(404).json({ error: 'not found' }); return; }
  await prisma.resumeMatch.update({ where: { id: match.id }, data: { email: String(email).toLowerCase(), gateSatisfied: true } });
  res.json({ success: true, analysis: {
    score: match.matchScore, hardSkills: match.hardSkills, softSkills: match.softSkills, gaps: match.gaps,
    jobFamily: match.jobFamily, tier: match.tier,
  }, interviewParams: { jobFamily: match.jobFamily, tier: match.tier, matchId: match.id } });
});

export default router;
