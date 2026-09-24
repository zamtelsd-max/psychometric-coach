'use client';
import { useEffect, useState } from 'react';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const hdr = (): Record<string, string> => { const t = (typeof window !== 'undefined' && localStorage.getItem('psy_token')) || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };
const font = "Inter, Roboto, system-ui, sans-serif";

const TRACKS = [{ id: 'ZM_ECZ', label: 'Zambia · ECZ CBA' }, { id: 'UK_GCSE', label: 'UK · GCSE' }, { id: 'UK_ALEVEL', label: 'UK · A-Level' }];
const SUBJECTS = ['Mathematics', 'Physics', 'Biology', 'Chemistry', 'Geography', 'Agricultural Science', 'Computer/Technology Studies'];

export default function TeacherDashboard() {
  const [authed, setAuthed] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', track: 'ZM_ECZ', subject: 'Mathematics' });
  const [sel, setSel] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [sheet, setSheet] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('psy_token')) { setAuthed(false); return; }
    load();
  }, []);
  const load = () => fetch(`${API}/teacher/classes`, { headers: hdr() }).then(r => r.json()).then(d => setClasses(d.classes || [])).catch(() => {});

  const create = async () => {
    setErr(''); setMsg('');
    if (!form.name.trim()) { setErr('Class name required.'); return; }
    const r = await fetch(`${API}/teacher/classes`, { method: 'POST', headers: hdr(), body: JSON.stringify(form) });
    const d = await r.json();
    if (d.success) { setMsg(`Class "${d.class.name}" created — join code ${d.class.joinCode}`); setForm({ ...form, name: '' }); load(); }
    else setErr(d.error || 'Failed.');
  };

  const openClass = async (c: any) => {
    setSel(c); setAnalytics(null); setSheet('');
    const r = await fetch(`${API}/teacher/classes/${c.id}/analytics`, { headers: hdr() });
    const d = await r.json();
    if (d.success) setAnalytics(d);
  };

  const genSheet = async () => {
    const r = await fetch(`${API}/teacher/classes/${sel.id}/generate-sheet`, { method: 'POST', headers: hdr(), body: JSON.stringify({ count: 10 }) });
    const d = await r.json();
    if (d.success) setSheet(d.sheet);
  };

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 22, marginBottom: 18, boxShadow: '0 1px 12px rgba(15,23,42,.05)' };
  const input: React.CSSProperties = { width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 10, fontFamily: font };
  const btn: React.CSSProperties = { background: BRAND, color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 9, fontWeight: 800, cursor: 'pointer' };

  if (!authed) return <div style={{ fontFamily: font, padding: 40, textAlign: 'center' }}><h2 style={{ color: BRAND }}>Please sign in as a teacher.</h2><a href="/login" style={{ color: GOLD }}>Go to login →</a></div>;

  const barColor = (a: number) => a < 50 ? '#dc2626' : a < 70 ? '#d97706' : '#15803d';

  return (
    <div className="pc-page max-w-4xl">
      <h1 className="pc-h1 mb-1">Teacher Dashboard</h1>
      <p className="pc-sub mb-6">Create classes, auto-detect problem areas, and generate exam sheets in one click.</p>
      {msg && <div style={{ ...card, background: '#ecfdf3', color: '#166534', padding: 12 }}>{msg}</div>}
      {err && <div style={{ ...card, background: '#fef2f2', color: '#991b1b', padding: 12 }}>{err}</div>}

      <div style={card}>
        <h3 style={{ color: BRAND, marginBottom: 12, fontWeight: 800 }}>① Create a class</h3>
        <input style={input} placeholder="Class name (e.g. Grade 12 Maths — Mkushi)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select style={input} value={form.track} onChange={e => setForm({ ...form, track: e.target.value })}>{TRACKS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          <select style={input} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <button style={btn} onClick={create}>Create class</button>
      </div>

      <div style={card}>
        <h3 style={{ color: BRAND, marginBottom: 12, fontWeight: 800 }}>② Your classes</h3>
        {classes.length === 0 ? <p style={{ color: '#64748b', fontSize: 14 }}>No classes yet. Create one above; share its join code with students.</p> :
          <div style={{ display: 'grid', gap: 10 }}>
            {classes.map(c => (
              <div key={c.id} onClick={() => openClass(c)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, border: `1px solid ${sel?.id === c.id ? BRAND : '#e2e8f0'}`, borderRadius: 10, cursor: 'pointer' }}>
                <div><b style={{ color: '#0f172a' }}>{c.name}</b><div style={{ fontSize: 12, color: '#64748b' }}>{c.subject} · {c.track} · {c.students} student{c.students === 1 ? '' : 's'}</div></div>
                <span style={{ fontFamily: 'monospace', background: '#eef3fb', color: BRAND, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>Join: {c.joinCode}</span>
              </div>
            ))}
          </div>}
      </div>

      {sel && analytics && (
        <div style={card}>
          <h3 style={{ color: BRAND, marginBottom: 6, fontWeight: 800 }}>③ {analytics.class.name} — analytics</h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Class average: <b>{analytics.classAverage}%</b> · {analytics.students} finalised · share join code <b style={{ fontFamily: 'monospace' }}>{analytics.class.joinCode}</b> with students (they enter it when starting a simulator test).</p>
          {analytics.subjectBreakdown.length === 0 ? <p style={{ color: '#64748b', fontSize: 14 }}>No finalised student results yet.</p> : (
            <div style={{ marginBottom: 14 }}>
              {analytics.subjectBreakdown.map((s: any) => (
                <div key={s.subject} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}><span>{s.subject}</span><span style={{ fontWeight: 700 }}>{s.accuracy}%</span></div>
                  <div style={{ height: 9, background: '#e2e8f0', borderRadius: 99 }}><div style={{ width: `${s.accuracy}%`, height: '100%', background: barColor(s.accuracy), borderRadius: 99 }} /></div>
                </div>
              ))}
            </div>
          )}
          {analytics.problemAreas.length > 0 && (
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <b style={{ color: '#92400e', fontSize: 13 }}>🔍 Problem areas (class &lt;60%)</b>
              <ul style={{ margin: '6px 0 0 18px', color: '#7c2d12', fontSize: 13 }}>{analytics.problemAreas.slice(0, 5).map((p: any, i: number) => <li key={i}>{p.subject}: {p.prompt.slice(0, 70)}… ({p.accuracy}%)</li>)}</ul>
            </div>
          )}
          <button style={{ ...btn, background: GOLD, color: BRAND }} onClick={genSheet}>📄 Generate assessment sheet (one click)</button>
          {sheet && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button style={{ ...btn, padding: '6px 12px', fontSize: 13 }} onClick={() => navigator.clipboard?.writeText(sheet)}>Copy</button>
                <button style={{ ...btn, padding: '6px 12px', fontSize: 13, background: '#fff', color: BRAND, border: '1px solid #e2e8f0' }} onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write('<pre style="font-family:Inter,sans-serif;white-space:pre-wrap;padding:24px;line-height:1.6">' + sheet.replace(/</g, '&lt;') + '</pre>'); w.print(); } }}>Print / PDF</button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, fontSize: 13, fontFamily: font, lineHeight: 1.6 }}>{sheet}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
