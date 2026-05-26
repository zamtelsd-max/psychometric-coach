// Currency utility — USD is the canonical base for all ad pricing
// Exchange rates are fetched from open.er-api.com (free, no key needed, updates daily)

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',          flag: '🇺🇸' },
  { code: 'ZMW', symbol: 'K',   name: 'Zambian Kwacha',     flag: '🇿🇲' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',      flag: '🇬🇧' },
  { code: 'EUR', symbol: '€',   name: 'Euro',               flag: '🇪🇺' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand', flag: '🇿🇦' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',    flag: '🇰🇪' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',     flag: '🇳🇬' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',       flag: '🇮🇳' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham',         flag: '🇦🇪' },
];

// Country → currency code mapping (used for auto-detect via IP)
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', ZM: 'ZMW', ZA: 'ZAR', KE: 'KES', NG: 'NGN',
  IN: 'INR', AE: 'AED', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', GR: 'EUR', FI: 'EUR',
  IE: 'EUR', SK: 'EUR', SI: 'EUR', LV: 'EUR', LT: 'EUR', EE: 'EUR',
  CY: 'EUR', MT: 'EUR', LU: 'EUR',
};

// Fallback rates vs USD (used if API fetch fails)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, ZMW: 27.5, GBP: 0.79, EUR: 0.92, ZAR: 18.6, KES: 129, NGN: 1600, INR: 83.5, AED: 3.67,
};

let ratesCache: Record<string, number> | null = null;
let ratesFetchedAt = 0;

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && now - ratesFetchedAt < 3600_000) return ratesCache; // 1h cache

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data.result === 'success') {
      ratesCache = data.rates;
      ratesFetchedAt = now;
      return data.rates;
    }
  } catch { /* use fallback */ }

  return FALLBACK_RATES;
}

export function convertFromUSD(usdAmount: number, toCurrency: string, rates: Record<string, number>): number {
  const rate = rates[toCurrency] ?? FALLBACK_RATES[toCurrency] ?? 1;
  return usdAmount * rate;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const rounded = currency.code === 'USD' || currency.code === 'GBP' || currency.code === 'EUR'
    ? amount.toFixed(2)
    : Math.round(amount).toLocaleString();
  return `${currency.symbol}${rounded}`;
}

// Auto-detect country from IP (ipapi.co free tier — no key, 1000 req/day)
export async function detectUserCurrency(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const code = data.country_code as string;
    return COUNTRY_TO_CURRENCY[code] || 'USD';
  } catch {
    return 'USD';
  }
}

export function getCurrencyByCode(code: string): Currency {
  return SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
}

// USD base prices for all ad products
export const USD_PRICES = {
  CPM_BANNER:       2.50,   // per 1,000 impressions
  CPM_SIDEBAR:      1.75,
  CPM_IN_FEED:      2.00,
  CPM_FOOTER:       1.25,
  PACKAGE_STARTER:  25,     // /month
  PACKAGE_GROWTH:   75,     // /month
  PACKAGE_ENTERPRISE: null, // custom
  BUDGET_MIN:       10,     // minimum budget
};
