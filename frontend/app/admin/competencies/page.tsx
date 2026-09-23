'use client';
import { useEffect, useState } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const hdr = (): Record<string, string> => { const t = localStorage.getItem('psy_token') || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };

export default function CompetenciesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [rows, setRows] = useState([{ skill: '', min: 70 }]);
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const load = () => fetch(`${API}/platform/competency-roles`, { headers: hdr() }).then(r => r.json()).then(d => setRoles(d.roles || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const createRole = async () => {
    setErr(''); setMsg('');
    const baselines: Record<string, number> = {};
    for (const r of rows) if (r.skill.trim()) baselines[r.skill.trim()] = Number(r.min) || 0;
    if (!name || !Object.keys(baselines).length) { setErr('Role name and at least one skill baseline are required.'); return; }
    try {
      const r = await fetch(`${API}/platform/competency-roles`, { method: 'POST', headers: hdr(), body: JSON.stringify({ name, baselines }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setMsg(`Framework “${name}” saved.`); setName(''); setRows([{ skill: '', min: 70 }]); load();
    } catch (e: any) { setErr(e.message); }
  };
  const runAnalysis = async () => {
    setErr(''); setMsg(''); setAnalysis(null);
    if (!email || !roleId) { setErr('Pick a role and enter the employee email.'); return; }
    try {
      const r = await fetch(`${API}/platform/gap-analysis`, { method: 'POST', headers: hdr(), body: JSON.stringify({ email, roleId }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setAnalysis(d.analysis); setMsg('Gap analysis computed and stored (machine-readable).');
    } catch (e: any) { setErr(e.message); }
  };
  const inp = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%' } as const;
  const btn = { background: GOLD, color: BRAND, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14 } as const;
  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20 } as const;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Enterprise Management</span>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 16px' }}>🎯 Competency Baselines</h1>
      {(msg || err) && <p style={{ color: err ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{err || msg}</p>}
      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>New role framework</h3>
        <input placeholder="Role title (e.g. Branch Sales Manager)" value={name} onChange={e => setName(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 8, marginBottom: 8 }}>
            <input placeholder="Skill (e.g. Numerical Reasoning)" value={r.skill} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, skill: e.target.value } : x))} style={inp} />
            <input type="number" min={0} max={100} value={r.min} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, min: +e.target.value } : x))} style={inp} />
            <button onClick={() => setRows(rows.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <button onClick={() => setRows([...rows, { skill: '', min: 70 }])} style={{ ...btn, background: '#e2e8f0', color: '#334155', marginRight: 10 }}>+ Add skill row</button>
        <button onClick={createRole} style={btn}>Save framework</button>
        {roles.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {roles.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 6, fontSize: 13.5 }}>
                <b>{r.name}</b>
                <span style={{ color: '#64748b' }}>{Object.entries(r.baselines || {}).map(([k, v]) => `${k}: ${v}%`).join(' · ')}</span>
                <button onClick={async () => { await fetch(`${API}/platform/competency-roles/${r.id}`, { method: 'DELETE', headers: hdr() }); load(); }} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>Run gap analysis (FR-3.2/3.3)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 8, marginBottom: 12 }}>
          <input placeholder="Employee email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          <select value={roleId} onChange={e => setRoleId(e.target.value)} style={inp}><option value="">Choose role framework…</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <button onClick={runAnalysis} style={btn}>Analyze</button>
        </div>
        {analysis && (
          <div style={{ border: `1px solid ${analysis.belowThreshold ? '#f59e0b' : '#22c55e'}`, borderRadius: 12, padding: 14, fontSize: 14 }}>
            <b>{analysis.roleTitle}</b> — {analysis.belowThreshold ? '⚠️ below threshold on ' + analysis.gaps.length + ' skill(s)' : '✅ meets all baselines'}
            <table style={{ width: '100%', marginTop: 10, borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>{Object.entries(analysis.scores as Record<string, number>).map(([k, v]) => (
                <tr key={k}><td style={{ padding: 6, borderBottom: '1px solid #f1f5f9' }}>{k}</td><td style={{ padding: 6, borderBottom: '1px solid #f1f5f9', fontWeight: 800, color: analysis.gaps.includes(k) ? '#dc2626' : '#16a34a' }}>{v}%</td></tr>
              ))}</tbody>
            </table>
            {analysis.gaps.length > 0 && <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12.5 }}>Machine-readable gap record stored — AI Growth Center will recommend matching modules.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
