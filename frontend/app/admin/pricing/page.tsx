'use client';
// v9
import { useEffect, useState } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';
const hdr = (): Record<string, string> => { const t = localStorage.getItem('psy_token') || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };

export default function PricingStudioPage() {
  const [price, setPrice] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState({ message: '', ctaText: '', ctaUrl: '', audience: 'ALL' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const load = () => {
    fetch(`${API}/platform/pricing`).then(r => r.json()).then(d => setPrice(d.pricing)).catch(() => {});
    fetch(`${API}/platform/banners`, { headers: hdr() }).then(r => r.json()).then(d => setBanners(d.banners || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const savePricing = async () => {
    setErr(''); setMsg('');
    try {
      const r = await fetch(`${API}/platform/pricing`, { method: 'PUT', headers: hdr(), body: JSON.stringify({ enterpriseMonthlyUsd: +price.enterpriseMonthlyUsd, candidateLinkUsd: +price.candidateLinkUsd }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setMsg('Base prices updated.'); setPrice(d.pricing);
    } catch (e: any) { setErr(e.message); }
  };
  const addBanner = async () => {
    setErr(''); setMsg('');
    if (!form.message) { setErr('Banner message required.'); return; }
    try {
      const r = await fetch(`${API}/platform/banners`, { method: 'POST', headers: hdr(), body: JSON.stringify(form) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setMsg('Promo banner is live.'); setForm({ message: '', ctaText: '', ctaUrl: '', audience: 'ALL' }); load();
    } catch (e: any) { setErr(e.message); }
  };
  const delBanner = async (id: string) => { await fetch(`${API}/platform/banners/${id}`, { method: 'DELETE', headers: hdr() }).catch(() => {}); load(); };
  const inp = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%' } as const;
  const btn = { background: GOLD, color: BRAND, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14 } as const;
  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20 } as const;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Super Admin Suite</span>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 16px' }}>💲 Price &amp; Promo Studio</h1>
      {(msg || err) && <p style={{ color: err ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{err || msg}</p>}
      {price && (
        <div style={card}>
          <h3 style={{ fontWeight: 800, marginBottom: 10 }}>Base subscription prices (USD)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 13 }}>Enterprise monthly<br /><input type="number" step="0.01" value={price.enterpriseMonthlyUsd} onChange={e => setPrice({ ...price, enterpriseMonthlyUsd: e.target.value })} style={inp} /></label>
            <label style={{ fontSize: 13 }}>Per candidate link<br /><input type="number" step="0.01" value={price.candidateLinkUsd} onChange={e => setPrice({ ...price, candidateLinkUsd: e.target.value })} style={inp} /></label>
          </div>
          <button onClick={savePricing} style={btn}>Save prices</button>
        </div>
      )}
      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>📣 Promo banners <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>(shown in-app; TRIAL targets free/trial users)</span></h3>
        <input placeholder="Banner message (e.g. 20% off Enterprise this month — code GROW20)" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 8, marginBottom: 10 }}>
          <input placeholder="CTA text (optional)" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} style={inp} />
          <input placeholder="CTA URL (optional)" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} style={inp} />
          <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} style={inp}><option value="ALL">Everyone</option><option value="TRIAL">Trial users</option></select>
        </div>
        <button onClick={addBanner} style={btn}>Publish banner</button>
        {banners.map(b => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 8, fontSize: 13.5 }}>
            <span><b>{b.message.slice(0, 70)}</b> · {b.audience}{b.ctaText ? ` · “${b.ctaText}”` : ''}</span>
            <button onClick={() => delBanner(b.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Unpublish</button>
          </div>
        ))}
      </div>
    </div>
  );
}
