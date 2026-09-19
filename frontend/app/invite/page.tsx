// v9 'use client';
import { useEffect, useState } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';

export default function InvitePage() {
  const [token, setToken] = useState('');
  const [phase, setPhase] = useState<'load' | 'ready' | 'done' | 'error'>('load');
  const [data, setData] = useState<any>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t') || '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/testbuilder/public/${token}`).then(r => r.json()).then(d => {
      if (d.error) { setErrMsg(d.error); setPhase('error'); } else { setData(d); setPhase('ready'); }
    }).catch(() => { setErrMsg('Could not load this invite.'); setPhase('error'); });
  }, [token]);

  const submit = async () => {
    try { await fetch(`${API}/testbuilder/public/${token}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) }); } catch {}
    setPhase('done');
  };

  if (phase === 'load') return <main style={{ minHeight: '100vh', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif' }}>Loading your assessment…</main>;
  if (phase === 'error') return <main style={{ minHeight: '100vh', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif' }}>{errMsg}</main>;
  if (phase === 'done') return <main style={{ minHeight: '100vh', background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 54 }}>✓</div><h1>Submitted</h1><p>Thank you — the recruiting team will review your responses.</p></div></main>;

  const q = data.questions[idx];
  return (
    <main style={{ minHeight: '100vh', background: BRAND, color: '#f1f5f9', fontFamily: 'Inter,system-ui,sans-serif', padding: '30px 16px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, background: GOLD, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND, fontWeight: 900 }}>P</div>
          <span style={{ fontWeight: 800 }}>PsychometricCoach · Candidate Assessment</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '12px 0 4px' }}>{data.test.title}</h1>
        <p style={{ color: '#cbd5e1', fontSize: 14, margin: '0 0 20px' }}>Invitation for <b>{data.candidate}</b> · Question {idx + 1} of {data.questions.length}</p>
        <div style={{ background: 'rgba(15,23,42,.5)', border: '1px solid rgba(212,175,55,.3)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>{q.questionText}</p>
        </div>
        {(q.options || []).map((o: any) => (
          <label key={o.label} onClick={() => setAnswers({ ...answers, [q.id]: o.label })}
            style={{ display: 'flex', gap: 10, alignItems: 'center', background: answers[q.id] === o.label ? 'rgba(212,175,55,.15)' : 'rgba(15,23,42,.5)', border: `1px solid ${answers[q.id] === o.label ? GOLD : 'rgba(255,255,255,.08)'}`, borderRadius: 12, padding: 13, marginBottom: 8, cursor: 'pointer', fontSize: 14.5 }}>
            <b style={{ color: GOLD }}>{o.label}</b> {o.content ?? o}
          </label>
        ))}
        <button onClick={() => (idx + 1 >= data.questions.length ? submit() : setIdx(idx + 1))} style={{ marginTop: 12, background: GOLD, color: BRAND, fontWeight: 800, padding: '12px 26px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15 }}>
          {idx + 1 >= data.questions.length ? 'Submit assessment' : 'Next question →'}
        </button>
      </div>
    </main>
  );
}
