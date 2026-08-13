'use client';
import { useEffect, useState } from 'react';
import { enterpriseApi } from '../../../lib/api';

const BRAND = '#1B365D', GOLD = '#D4AF37';

export default function PassportsPage() {
  const [passports, setPassports] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('airtel');
  const [bump, setBump] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => { enterpriseApi.passports().then(r => setPassports(r.data.passports || [])).catch(() => {}); }, []);

  const buy = async (slug: string) => {
    setErr('');
    if (!email.trim()) { setErr('Enter your email to receive the download link.'); return; }
    if (!phone.trim()) { setErr('Enter your mobile-money number.'); return; }
    setBusy(slug);
    try { const { data } = await enterpriseApi.checkoutPassport(slug, email, phone, operator); setResult(data); }
    catch (e: any) { setErr(e?.response?.data?.error || 'Payment could not be completed — approve the prompt on your phone and try again.'); }
    finally { setBusy(null); }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 20 }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Prep Passports</span>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 4px' }}>Instant psychometric prep manuals</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 18 }}>Buy once, download instantly. Secure link valid 72 hours, single-use.</p>

      {result ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>✓</div>
          <h2 style={{ fontWeight: 900, color: '#166534' }}>Purchase complete</h2>
          <p style={{ color: '#166534', fontSize: 14, margin: '8px 0' }}>Your secure download link (also emailed) — valid 72 hours, single use:</p>
          <a href={result.downloadUrl} style={{ display: 'inline-block', background: BRAND, color: '#fff', fontWeight: 800, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>⬇ Download now</a>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>Expires {new Date(result.expiresAt).toLocaleString()}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 16 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email for your download link"
              style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={operator} onChange={e => setOperator(e.target.value)} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}>
                <option value="airtel">Airtel Money</option>
                <option value="mtn">MTN MoMo</option>
                <option value="zamtel">Zamtel Kwacha</option>
              </select>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile money number (e.g. 097…)"
                style={{ flex: 1, padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 }} />
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>You&apos;ll get a prompt on your phone to approve the payment.</p>
          </div>
          {passports.map(p => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: 'uppercase' }}>{p.provider}</span>
                  <h3 style={{ fontWeight: 800, color: BRAND, margin: '2px 0' }}>{p.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{p.description}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: BRAND }}>${p.priceUsd}</div>
                  <button onClick={() => buy(p.slug)} disabled={busy === p.slug} style={{ marginTop: 6, background: GOLD, color: BRAND, fontWeight: 800, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, opacity: busy === p.slug ? 0.6 : 1 }}>{busy === p.slug ? 'Processing…' : 'Pay & download'}</button>
                </div>
              </div>
            </div>
          ))}
          {/* SR-B2C-01..04 order-bump widget */}
          <label style={{ display: 'flex', gap: 12, alignItems: 'start', border: '1px solid rgba(27,54,93,.3)', background: 'rgba(27,54,93,.06)', backdropFilter: 'blur(4px)', borderRadius: 14, padding: 16, cursor: 'pointer', marginTop: 8 }}>
            <input type="checkbox" checked={bump} onChange={e => setBump(e.target.checked)} style={{ accentColor: GOLD, width: 20, height: 20, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, color: BRAND }}>⭐ Add a human expert review (+$19)</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Get a personalised 3-point behavioural adjustment list from our review team within 24 hours.</div>
            </div>
          </label>
          {err && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{err}</p>}
        </>
      )}
    </div>
  );
}
