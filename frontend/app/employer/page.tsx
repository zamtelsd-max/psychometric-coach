'use client';
// v9
import { useEffect, useState } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';

export default function EmployerPage() {
  const [mode, setMode] = useState<'decide' | 'signup' | 'dash'>('decide');
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '' });
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [ws, setWs] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('psy_token');
    if (t) fetch(`${API}/employer/workspace`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => { if (!d.error) { setWs(d); setMode('dash'); } else if (d.hasWorkspace === false) setMode('dash'); }).catch(() => {});
  }, []);

  const signup = async () => {
    setErr(''); setOk('');
    if (!form.name || !form.companyName || !form.email || form.password.length < 8) { setErr('All fields required (password min 8 chars).'); return; }
    try {
      const r = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, accountType: 'employer' }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setOk('🎉 Your 7-day enterprise trial has started! Check your email to verify, then sign in and return here — every assessment tool is open for you to try.');
    } catch (e: any) { setErr(e.message); }
  };

  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 16 } as const;
  const inp = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%' } as const;
  const btn = { background: GOLD, color: BRAND, fontWeight: 800, padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14.5 } as const;

  if (mode === 'dash' && ws) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0B1626,#12233f)', padding: '26px 18px 60px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Employer Workspace</span>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '12px 0 4px' }}>{ws.enterprise.name}</h1>
        {ws.trial.active && (
          <div style={{ background: 'rgba(212,175,55,.12)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, margin: '10px 0 16px', color: '#f1f5f9', fontSize: 14 }}>
            <b style={{ color: GOLD }}>⏳ {ws.trial.daysLeft} day{ws.trial.daysLeft === 1 ? '' : 's'} of your 7-day trial left.</b> You have full access to every assessment tool.
            <span style={{ color: '#94a3b8' }}> On upgrade you keep: {ws.trial.keepsOnUpgrade.join(' · ')}. Without it: {ws.trial.endsIfExpired}.</span>
            <a href="#upgrade" style={{ color: GOLD, fontWeight: 800, marginLeft: 8 }}>Upgrade now →</a>
          </div>
        )}
        {ws.enterprise.isPaidSubscriber && <p style={{ color: '#4ade80', fontWeight: 800 }}>✓ Paid subscription active — all premium tools unlocked.</p>}
        <div style={card}>
          <h3 style={{ fontWeight: 800, color: BRAND, marginBottom: 8 }}>🧪 Assessments & candidates</h3>
          {ws.customTests.length === 0 && <p style={{ color: '#64748b', fontSize: 13.5 }}>No tests yet — build one in the Enterprise Hub and invite candidates.</p>}
          {ws.customTests.map((t: any) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 6, fontSize: 13.5 }}>
              <b>{t.title}</b><span style={{ color: '#64748b' }}>{t.submitted}/{t.candidates} submitted</span>
              <a href={t.inviteUrl} style={{ color: BRAND, fontWeight: 700 }}>invite link</a>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={{ fontWeight: 800, color: BRAND, marginBottom: 8 }}>📈 Candidate link activity</h3>
          {ws.candidateLinks.slice(0, 10).map((l: any, i: number) => (
            <p key={i} style={{ fontSize: 13, margin: '4px 0' }}><b>{l.email}</b> · {l.test} · {l.submitted ? '✅ submitted' : '⏳ pending'}</p>
          ))}
          {!ws.candidateLinks.length && <p style={{ color: '#64748b', fontSize: 13.5 }}>No candidate links yet.</p>}
        </div>
        <div style={card}>
          <h3 style={{ fontWeight: 800, color: BRAND, marginBottom: 8 }}>📄 Reports</h3>
          <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 10 }}>{ws.msr ? `Completions this month: ${ws.msr.completions} · Success rate: ${ws.msr.candidateSuccessRate}% · Gold: ${ws.msr.badges.gold} · Platinum: ${ws.msr.badges.platinum}` : 'MSR compiles automatically on the 1st of each month.'}</p>
          <a href="/enterprise" style={{ color: BRAND, fontWeight: 800 }}>Open full Enterprise Hub (MSR exports, builder, CMS) →</a>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0B1626,#12233f)', padding: '30px 18px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ maxWidth: 460, margin: '0 auto', background: 'rgba(15,23,42,.6)', border: `1px solid ${GOLD}44`, borderRadius: 20, padding: 28 }}>
        <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>For Employers</span>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '12px 0 6px' }}>Start your 7-day free trial</h1>
        <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 14px' }}>Full access from minute one: build custom assessments from the 300+ question bank, bulk-invite employees, run proctored screens, and view team results. No card required.</p>
        {ok && <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 13.5 }}>{ok}</p>}
        {err && <p style={{ color: '#f87171', fontWeight: 700, fontSize: 13.5 }}>{err}</p>}
        {mode === 'decide' ? (
          <>
            <button onClick={() => setMode('signup')} style={{ ...btn, width: '100%' }}>Create employer account — 7 days free</button>
            <p style={{ color: '#94a3b8', fontSize: 12.5, marginTop: 10 }}>Already registered? <a href="/login" style={{ color: GOLD, fontWeight: 700 }}>Sign in</a> to open your workspace.</p>
          </>
        ) : (
          <>
            <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
            <input placeholder="Company name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
            <input placeholder="Work email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
            <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inp, marginBottom: 12 }} />
            <button onClick={signup} style={{ ...btn, width: '100%' }}>Start 7-day trial</button>
          </>
        )}
      </div>
    </div>
  );
}
