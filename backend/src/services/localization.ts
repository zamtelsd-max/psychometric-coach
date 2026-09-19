// SRS Addendum §FR-2 — Geographic Content Localization
// Geo lookup (link param → CDN geo headers), token replacement
// ([LocalName1], [LocalCompany1], …), and currency calibration.
import prisma from '../lib/prisma';

export interface LocalizationSet { [token: string]: string }

export function detectRegion(req: any): string {
  // 1. explicit link parameter wins (FR-2.1 "or link parameters")
  const qp = (req.query?.region || req.query?.geo) as string | undefined;
  if (qp && /^[A-Za-z]{2}$/.test(qp)) return qp.toUpperCase();
  // 2. CDN/proxy geo headers (Cloudflare / Vercel / nginx geoip2 style)
  const h = req.headers || {};
  const cf = (h['cf-ipcountry'] || h['x-vercel-ip-country'] || h['geo-country'] || h['x-geo-country']) as string | undefined;
  if (cf && /^[A-Za-z]{2}$/.test(cf)) return cf.toUpperCase();
  return 'GLOBAL';
}

export async function getLocalizationSet(region: string): Promise<LocalizationSet> {
  const rows = await prisma.localizationAsset.findMany({ where: { OR: [{ region }, { region: 'GLOBAL' }] } });
  const set: LocalizationSet = {};
  for (const r of rows) if (!(r.token in set) || r.region === region) set[r.token] = r.value;
  return set;
}

// Swap [LocalName1] / [LocalCompany1] / [LocalCurrency] placeholders (FR-2.2)
// and calibrate bare money figures to the region's symbol (FR-2.3).
export function localizeText(text: string, set: LocalizationSet): string {
  let out = text.replace(/\[Local(\w+)\]/g, (_, token: string) => set[`Local${token}`] ?? `[Local${token}]`);
  const cur = set['LocalCurrency'];
  if (cur) {
    // "25,000 baseline units" / "currency equivalent to 25,000 baseline units" → localized amount
    out = out.replace(/currency equivalent to ([\d,]+) baseline units/g, (_, n: string) => `${cur}${n}`);
    out = out.replace(/\b([\d]{1,3}(?:,\d{3})+|\d+)\s*(?:baseline units|units)\b/g, (_, n: string) => `${cur}${n}`);
  }
  return out;
}

export function localizeQuestion(q: { questionText: string; [k: string]: any }, set: LocalizationSet) {
  return { ...q, questionText: localizeText(q.questionText, set) };
}

export function currencySymbolFor(region: string): string {
  const map: Record<string, string> = { ZM: 'K', US: '$', UK: '£', EU: '€' };
  return map[region] ?? '$';
}
