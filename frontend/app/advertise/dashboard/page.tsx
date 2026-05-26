'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { advertiserApi } from '../../../lib/adsApi';
import { useCurrency } from '../../../hooks/useCurrency';
import CurrencySelector from '../../../components/CurrencySelector';

interface Ad { id: string; title: string; headline: string; slot: string; status: string; budget: number; spent: number; impressions: number; clicks: number; createdAt: string; rejectedNote?: string; }
interface Payment { id: string; amount: number; method: string; status: string; createdAt: string; reference?: string; }
interface Advertiser { id: string; companyName: string; email: string; verified: boolean; }

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
};

const SLOT_LABELS: Record<string, string> = {
  BANNER: '📰 Banner', SIDEBAR: '📌 Sidebar', IN_FEED: '📋 In-Feed', FOOTER_BANNER: '📍 Footer',
};

const PAYMENT_BANKS = [
  { name: 'Zanaco Bank', acc: '1234567890', branch: 'Cairo Road, Lusaka' },
  { name: 'Standard Chartered', acc: '9876543210', branch: 'Lusaka Main' },
];
const MOBILE_MONEY = [
  { name: 'Airtel Money', number: '097XXXXXXX' },
  { name: 'MTN MoMo', number: '096XXXXXXX' },
  { name: 'Zamtel Kwacha', number: '095XXXXXXX' },
];

export default function AdvertiserDashboard() {
  const router = useRouter();
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ads' | 'payments'>('ads');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adToken');
    if (!token) { router.replace('/advertise/login'); return; }
    Promise.all([advertiserApi.me(), advertiserApi.myAds(), advertiserApi.payments()])
      .then(([me, myAds, myPay]) => {
        setAdvertiser(me.data);
        setAds(myAds.data);
        setPayments(myPay.data);
      })
      .catch(() => { localStorage.removeItem('adToken'); router.replace('/advertise/login'); })
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => { localStorage.removeItem('adToken'); localStorage.removeItem('adUser'); router.push('/advertise/login'); };

  const handleSubmitAd = async (id: string) => {
    setActionLoading(id);
    try { await advertiserApi.submitAd(id); const r = await advertiserApi.myAds(); setAds(r.data); } catch {}
    setActionLoading(null);
  };

  const handlePauseAd = async (id: string) => {
    setActionLoading(id);
    try { await advertiserApi.pauseAd(id); const r = await advertiserApi.myAds(); setAds(r.data); } catch {}
    setActionLoading(null);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      await advertiserApi.submitPayment({
        amount: Number(payForm.amount),
        method: payForm.method,
        reference: payForm.reference,
        notes: payForm.notes,
      });
      setPaySuccess(true);
      const r = await advertiserApi.payments();
      setPayments(r.data);
    } catch {}
    setPayLoading(false);
  };

  const { format, currency } = useCurrency();
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalSpent = ads.reduce((s, a) => s + a.spent, 0);
  const confirmedCredit = payments.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + p.amount, 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0A528A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/advertise" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0A528A] rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
          <span className="font-bold text-gray-800 text-sm hidden sm:block">Advertiser Portal</span>
        </Link>
        <div className="flex items-center gap-4">
          {advertiser && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{advertiser.companyName}</p>
              <p className="text-xs text-gray-400">{advertiser.verified ? '✅ Verified' : '⏳ Pending Verification'}</p>
            </div>
          )}
          <CurrencySelector />
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl px-3 py-2">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: '👁️' },
            { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: '🖱️' },
            { label: 'CTR', value: totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%` : '0%', icon: '📊' },
            { label: 'Credit Balance', value: format(confirmedCredit - totalSpent), icon: '💰' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-lg mb-1">{s.icon}</p>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setTab('ads')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'ads' ? 'bg-white text-[#0A528A] shadow-sm' : 'text-gray-500'}`}>My Ads</button>
            <button onClick={() => setTab('payments')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'payments' ? 'bg-white text-[#0A528A] shadow-sm' : 'text-gray-500'}`}>Payments</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPayModal(true)} className="bg-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-green-700">💳 Top Up Balance</button>
            <Link href="/advertise/create-ad" className="bg-[#0A528A] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-900">+ New Ad</Link>
          </div>
        </div>

        {/* Ads tab */}
        {tab === 'ads' && (
          <div className="space-y-3">
            {ads.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-bold text-gray-900 mb-2">No ads yet</h3>
                <p className="text-gray-500 text-sm mb-6">Create your first ad to start reaching learners.</p>
                <Link href="/advertise/create-ad" className="bg-[#0A528A] text-white font-bold px-6 py-3 rounded-xl text-sm">Create Your First Ad →</Link>
              </div>
            ) : ads.map(ad => (
              <div key={ad.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-400">{SLOT_LABELS[ad.slot]}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[ad.status] || 'bg-gray-100 text-gray-500'}`}>{ad.status}</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{ad.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{ad.headline}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">{format(ad.budget)}</p>
                    <p className="text-xs text-gray-400">budget</p>
                  </div>
                </div>

                {ad.status === 'REJECTED' && ad.rejectedNote && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-3 text-xs text-red-700">
                    <strong>Rejected:</strong> {ad.rejectedNote}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="text-sm font-bold text-gray-900">{ad.impressions.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Impressions</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="text-sm font-bold text-gray-900">{ad.clicks.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Clicks</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="text-sm font-bold text-gray-900">
                      {ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400">CTR</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {['DRAFT', 'REJECTED'].includes(ad.status) && (
                    <button onClick={() => handleSubmitAd(ad.id)} disabled={actionLoading === ad.id}
                      className="flex-1 bg-[#0A528A] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-900 disabled:opacity-50">
                      {actionLoading === ad.id ? 'Submitting…' : '🚀 Submit for Review'}
                    </button>
                  )}
                  {['APPROVED', 'PAUSED'].includes(ad.status) && (
                    <button onClick={() => handlePauseAd(ad.id)} disabled={actionLoading === ad.id}
                      className="flex-1 border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50">
                      {actionLoading === ad.id ? '…' : ad.status === 'APPROVED' ? '⏸ Pause' : '▶ Resume'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments tab */}
        {tab === 'payments' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 mb-3">Payment Instructions</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-xs text-[#0A528A]">
                <strong>All billing is in USD.</strong> If paying via local bank transfer or mobile money, convert using today's exchange rate. After paying, submit your payment record below with the reference number.
              </div>
              <p className="text-xs text-gray-500 mb-4">Send proof of payment to <a href="mailto:support@psycometriccoach.online" className="text-[#0A528A]">support@psycometriccoach.online</a>. Balance activated within 24 hours.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {PAYMENT_BANKS.map(b => (
                  <div key={b.name} className="bg-blue-50 rounded-xl p-3">
                    <p className="font-semibold text-[#0A528A] text-sm">{b.name}</p>
                    <p className="text-xs text-gray-600 mt-1">A/C: <span className="font-mono font-bold">{b.acc}</span></p>
                    <p className="text-xs text-gray-500">{b.branch}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Mobile Money:</p>
              <div className="flex flex-wrap gap-2">
                {MOBILE_MONEY.map(m => (
                  <div key={m.name} className="bg-gray-50 rounded-xl px-3 py-2 text-xs">
                    <span className="font-semibold">{m.name}:</span> {m.number}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 mb-3">Submit Payment Record</h3>
              {paySuccess ? (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-bold text-green-700">Payment submitted!</p>
                  <p className="text-xs text-green-600 mt-1">We'll confirm and credit your account within 24 hours.</p>
                  <button onClick={() => setPaySuccess(false)} className="mt-3 text-xs text-green-700 underline">Submit another</button>
                </div>
              ) : (
                <form onSubmit={handlePayment} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (USD $) *</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                        <input type="number" min="10" step="1" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl pl-6 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                          placeholder="25" required />
                      </div>
                      {Number(payForm.amount) > 0 && currency.code !== 'USD' && (
                        <p className="text-[10px] text-gray-400 mt-1">≈ {format(Number(payForm.amount))} at today's rate</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Method *</label>
                      <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]">
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Reference / Transaction ID</label>
                    <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                      placeholder="e.g. TXN123456" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (optional)</label>
                    <textarea value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                      rows={2} placeholder="Any additional info" />
                  </div>
                  <button type="submit" disabled={payLoading || !payForm.amount}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all text-sm">
                    {payLoading ? 'Submitting…' : 'Submit Payment Record'}
                  </button>
                </form>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">No payments yet.</div>
            ) : payments.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">${p.amount.toFixed(2)} USD</p>
                  <p className="text-xs text-gray-500">{p.method.replace('_', ' ')} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  {p.reference && <p className="text-xs text-gray-400 font-mono">Ref: {p.reference}</p>}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
