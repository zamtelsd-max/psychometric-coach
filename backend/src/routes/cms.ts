// SRS FR-6 — CMS Studio: media dropzone storage, dimension-aware serving
// (FR-6.3), and sanitized rich-text case studies (FR-6.2).
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const adminOnly = (req: AuthRequest, res: Response, next: () => void): void => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) { res.status(403).json({ error: 'admin only' }); return; }
  next();
};

// FR-6.3 fluid image optimization: record natural dimensions at upload so the
// layout system can reserve exact space (no CLS) and clients scale fluidly.
function pngSize(b: Buffer) { return b.length > 24 && b.toString('hex', 0, 8) === '89504e470d0a1a0a' ? { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } : null; }
function jpegSize(b: Buffer) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let o = 2;
  while (o + 9 < b.length) {
    if (b[o] !== 0xff) { o++; continue; }
    const marker = b[o + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: b.readUInt16BE(o + 5), w: b.readUInt16BE(o + 7) };
    o += 2 + b.readUInt16BE(o + 2);
  }
  return null;
}
function svgSize(b: Buffer) {
  const s = b.toString('utf8', 0, Math.min(b.length, 4000));
  const w = /<svg[^>]*width=["']([\d.]+)/.exec(s), h = /<svg[^>]*height=["']([\d.]+)/.exec(s);
  const vb = /viewBox=["'][\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)["']/.exec(s);
  if (w && h) return { w: Math.round(+w[1]), h: Math.round(+h[1]) };
  if (vb) return { w: Math.round(+vb[1]), h: Math.round(+vb[2]) };
  return null;
}
// FR-6.2 hygiene: baseline sanitizer for stored rich text
function sanitizeHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+\s*=\s*"[^"]*"/gi, '').replace(/javascript:/gi, '');
}

// POST /api/v1/cms/media — FR-6.1 multi-format dropzone upload (base64 JSON)
router.post('/media', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { filename, mime, dataBase64 } = req.body as { filename: string; mime: string; dataBase64: string };
  if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(mime)) { res.status(400).json({ error: 'PNG, JPEG or SVG only' }); return; }
  const buf = Buffer.from(dataBase64 || '', 'base64');
  if (!buf.length) { res.status(400).json({ error: 'empty file' }); return; }
  if (buf.length > 6 * 1024 * 1024) { res.status(413).json({ error: 'max 6MB per asset' }); return; }
  const dims = pngSize(buf) || jpegSize(buf) || svgSize(buf);
  const a = await prisma.mediaAsset.create({ data: { filename: String(filename || 'asset').slice(0, 120), mime, sizeBytes: buf.length, width: dims?.w ?? null, height: dims?.h ?? null, data: dataBase64, uploadedBy: req.user!.id } });
  res.json({ asset: { id: a.id, filename: a.filename, mime: a.mime, width: a.width, height: a.height, sizeBytes: a.sizeBytes } });
});

// GET /api/v1/cms/media — admin library list
router.get('/media', authenticate, adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  const rows = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, filename: true, mime: true, width: true, height: true, sizeBytes: true, createdAt: true } });
  res.json({ assets: rows });
});

// GET /api/v1/cms/media/:id — PUBLIC serving for live test administration,
// immutable cache + dimension headers for the fluid layout system (FR-6.3)
router.get('/media/:id', async (req: Request, res: Response): Promise<void> => {
  const a = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
  if (!a) { res.status(404).send('not found'); return; }
  res.setHeader('Content-Type', a.mime);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Img-Width', String(a.width ?? ''));
  res.setHeader('X-Img-Height', String(a.height ?? ''));
  res.send(Buffer.from(a.data, 'base64'));
});

// DELETE /api/v1/cms/media/:id
router.delete('/media/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.mediaAsset.deleteMany({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Case studies (FR-6.2): rich text for deep industrial scenarios
router.post('/cases', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, bodyHtml } = req.body as { title: string; bodyHtml: string };
  if (!title || !bodyHtml) { res.status(400).json({ error: 'title and content required' }); return; }
  const c = await prisma.caseStudy.create({ data: { title: String(title).slice(0, 160), bodyHtml: sanitizeHtml(String(bodyHtml)), createdBy: req.user!.id } });
  res.json({ case: { id: c.id, title: c.title } });
});
router.get('/cases', authenticate, adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ cases: await prisma.caseStudy.findMany({ orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, createdAt: true, updatedAt: true, bodyHtml: true } }) });
});
router.put('/cases/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, bodyHtml } = req.body as { title: string; bodyHtml: string };
  const c = await prisma.caseStudy.update({ where: { id: req.params.id }, data: { title: String(title).slice(0, 160), bodyHtml: sanitizeHtml(String(bodyHtml)) } });
  res.json({ case: { id: c.id, title: c.title } });
});
router.delete('/cases/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.caseStudy.deleteMany({ where: { id: req.params.id } });
  res.json({ ok: true });
});


// ── CMS-in-questions hookup (SRS §5 integration): attach media + case studies ──
router.patch('/questions/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { imageUrl, caseStudyId } = req.body as { imageUrl?: string; caseStudyId?: string | null };
  const data: any = {};
  if (imageUrl !== undefined) {
    if (imageUrl && !/^\/api\/v1\/cms\/media\/[a-z0-9]+$/.test(imageUrl)) { res.status(400).json({ error: 'imageUrl must be a CMS media URL (/api/v1/cms/media/<id>)' }); return; }
    data.imageUrl = imageUrl || null;
  }
  if (caseStudyId !== undefined) data.caseStudyId = caseStudyId;
  const q = await prisma.question.update({ where: { id: req.params.id }, data, select: { id: true, text: true, imageUrl: true, caseStudyId: true } });
  res.json({ question: q });
});
router.get('/questions', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const q = String(req.query.q || '');
  res.json({ questions: await prisma.question.findMany({ where: { text: { contains: q, mode: 'insensitive' } }, orderBy: { createdAt: 'asc' }, take: 20, select: { id: true, text: true, imageUrl: true, caseStudyId: true, subSkill: true } }) });
});
router.get('/cases/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const c = await prisma.caseStudy.findUnique({ where: { id: req.params.id }, select: { id: true, title: true, bodyHtml: true } });
  if (!c) { res.status(404).json({ error: 'not found' }); return; }
  res.json({ case: c });
});

export default router;
