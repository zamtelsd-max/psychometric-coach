'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { advertiserApi } from '../../../lib/adsApi';
import { useCurrency } from '../../../hooks/useCurrency';
import CurrencySelector from '../../../components/CurrencySelector';

const SLOT_CPM: Record<string, number> = {
  BANNER: 2.50, SIDEBAR: 1.75, IN_FEED: 2.00, FOOTER_BANNER: 1.25,
};

export default function CreateAdPage() {
  const router = useRouter();
  const { format, currency } = useCurrency();
  const [form, setForm] = useState({
    title: '', headline: '', bodyText: '', ctaText: 'Learn More',
    ctaUrl: '', imageUrl: '', slot: 'BANNER', budget: '25',
    startDate: '', endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.headline || !form.bodyText || !form.ctaUrl || !form.slot || !form.budget) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true); setError('');
    try {
      await advertiserApi.createAd({
        ...form,
        budget: Number(form.budget),
        ctaText: form.ctaText || 'Learn More',
        imageUrl: form.imageUrl || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      router.push('/advertise/dashboard');
    } catch {
      setError('Failed to create ad. Please check your inputs and try again.');
      setLoading(false);
    }
  };

  // Estimated impressions based on CPM for selected slot
  const cpm = SLOT_CPM[form.slot] || 2.50;
  const ESTIMATED_IMPRESSIONS = Number(form.budget) > 0 ? Math.round((Number(form.budget) / cpm) * 1000) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/advertise/dashboard" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <h1 className="font-bold text-gray-900">Create New Ad</h1>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-2">
          <CurrencySelector />
        </div>
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 space-y-5">
            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

            {/* Ad content */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Ad Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Campaign Name * <span className="font-normal text-gray-400">(internal only)</span></label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                    placeholder="e.g. Q3 Brand Campaign" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Headline * <span className="font-normal text-gray-400">(max 80 chars)</span></label>
                  <input value={form.headline} onChange={e => set('headline', e.target.value)} maxLength={80}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                    placeholder="e.g. Unlock Your Career Potential with Zanaco" required />
                  <p className="text-[10px] text-gray-400 mt-1">{form.headline.length}/80</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Body Text * <span className="font-normal text-gray-400">(max 200 chars)</span></label>
                  <textarea value={form.bodyText} onChange={e => set('bodyText', e.target.value)} maxLength={200} rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                    placeholder="e.g. Open a Zanaco account today and get competitive interest rates plus exclusive benefits for young professionals." required />
                  <p className="text-[10px] text-gray-400 mt-1">{form.bodyText.length}/200</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">CTA Button Text</label>
                    <input value={form.ctaText} onChange={e => set('ctaText', e.target.value)} maxLength={30}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                      placeholder="Learn More" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Destination URL *</label>
                    <input type="url" value={form.ctaUrl} onChange={e => set('ctaUrl', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                      placeholder="https://..." required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image URL <span className="font-normal text-gray-400">(optional, recommended)</span></label>
                  <input type="url" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                    placeholder="https://your-cdn.com/banner.jpg" />
                  <p className="text-[10px] text-gray-400 mt-1">Recommended: 800×400px JPEG/PNG · max 2MB · host on your own CDN or Cloudinary</p>
                </div>
              </div>
            </div>

            {/* Ad slot */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Ad Placement</h2>
              <div className="space-y-2">
                {[
                  { value: 'BANNER',        label: '📰 Banner',        desc: 'Top of page · Highest visibility' },
                  { value: 'SIDEBAR',       label: '📌 Sidebar',       desc: 'Right sidebar on desktop' },
                  { value: 'IN_FEED',       label: '📋 In-Feed',       desc: 'Between content cards · Native feel' },
                  { value: 'FOOTER_BANNER', label: '📍 Footer Banner', desc: 'Bottom of page · Broad reach' },
                ].map(s => (
                  <label key={s.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.slot === s.value ? 'border-[#0A528A] bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="slot" value={s.value} checked={form.slot === s.value} onChange={e => set('slot', e.target.value)} className="sr-only" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#0A528A]">{format(SLOT_CPM[s.value])}</p>
                      <p className="text-[10px] text-gray-400">per 1,000 imp</p>
                    </div>
                    {form.slot === s.value && <span className="text-[#0A528A] text-lg ml-1">✓</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Budget & dates */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Budget & Schedule</h2>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Total Budget (USD $) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input type="number" min="10" step="1" value={form.budget} onChange={e => set('budget', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]" required />
                </div>
                {Number(form.budget) > 0 && (
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <p className="text-[#0A528A] font-semibold">≈ {ESTIMATED_IMPRESSIONS.toLocaleString()} estimated impressions</p>
                    <p className="text-gray-400">≈ {format(Number(form.budget))} {currency.code !== 'USD' ? `(at today's rate)` : ''}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Leave dates blank to run until budget is exhausted.</p>
            </div>

            <button onClick={submit} disabled={loading}
              className="w-full bg-[#0A528A] text-white font-bold py-4 rounded-2xl hover:bg-blue-900 disabled:opacity-50 transition-all text-base">
              {loading ? 'Saving…' : 'Save Ad as Draft'}
            </button>
            <p className="text-center text-xs text-gray-400">Your ad is saved as a draft. Submit it for review from the dashboard.</p>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Preview</p>
              <div className="bg-gray-100 rounded-2xl p-3 mb-3">
                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-2 px-1">Sponsored</p>
                <div className="bg-white rounded-xl p-3">
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="preview" className="w-full h-24 object-cover rounded-lg mb-3" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <p className="font-bold text-gray-900 text-sm leading-snug mb-1">{form.headline || 'Your headline here…'}</p>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{form.bodyText || 'Your description goes here…'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-400">Ad</p>
                    <span className="bg-[#0A528A] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">{form.ctaText || 'Learn More'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-xs text-[#0A528A]">
                <p className="font-bold mb-2">💡 Tips for great ads:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Keep headlines action-oriented</li>
                  <li>• Use a clear, specific CTA</li>
                  <li>• Include a high-quality image</li>
                  <li>• Link to a relevant landing page</li>
                  <li>• Minimum budget $10 USD recommended</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
