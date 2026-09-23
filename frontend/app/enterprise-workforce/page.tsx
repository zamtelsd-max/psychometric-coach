'use client';
import { useEffect, useState } from 'react';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const fontStack = "Inter, Roboto, system-ui, sans-serif";
const hdr = (): Record<string, string> => { const t = (typeof window !== 'undefined' && localStorage.getItem('psy_token')) || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };

type Dept = { department: string; candidates: number; aggregateCompetenceAvg: number; projectedProductivityLossPct: number; burnoutRiskIndicator: string };

export default function EnterpriseWorkforcePage() {
  const [tax, setTax] = useState<{ departments: string[]; tiers: string[] }>({ departments: [], tiers: [] });
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgId, setOrgId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', targetDepartment: '', targetTier: '', industryField: 'General' });
  const [invite, setInvite] = useState<any>(null);
  const [report, setReport] = useState<Dept[]>([]);
  const [training, setTraining] = useState<any>(null);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('psy_token')) { setAuthed(false); return; }
    fetch(`${API}/enterprise-v2/taxonomy`).then(r => r.json()).then(d => setTax({ departments: d.departments || [], tiers: d.tiers || [] })).catch(() => {});
    loadOrgs();
  }, []);

  const loadOrgs = () => fetch(`${API}/enterprise-v2/orgs`, { headers: hdr() }).then(r => r.json()).then(d => { setOrgs(d.orgs || []); if (d.orgs?.[0] && !orgId) setOrgId(d.orgs[0].id); }).catch(() => {});

  const createOrg = async () => {
    setErr(''); setMsg('');
    if (!companyName.trim()) return;
    const r = await fetch(`${API}/enterprise-v2/orgs`, { method: 'POST', headers: hdr(), body: JSON.stringify({ companyName }) });
    const d = await r.json();
    if (d.success) { setMsg(`Organization "${d.org.companyName}" created.`); setCompanyName(''); loadOrgs(); setOrgId(d.org.id); }
    else setErr(d.error || 'Failed to create organization.');
  };

  const createSession = async () => {
    setErr(''); setMsg(''); setInvite(null);
    if (!orgId || !form.targetDepartment || !form.targetTier) { setErr('Select organization, department and tier.'); return; }
    const r = await fetch(`${API}/enterprise-v2/sessions`, { method: 'POST', headers: hdr(), body: JSON.stringify({ orgId, ...form }) });
    const d = await r.json();
    if (d.success) { setInvite(d); setMsg('Assessment session created (100 questions).'); }
    else setErr(d.error || 'Failed to create session.');
  };

  const loadReport = async () => {
    setErr('');
    if (!orgId) return;
    const r = await fetch(`${API}/enterprise-v2/orgs/${orgId}/report`, { headers: hdr() });
    const d = await r.json();
    if (d.success) setReport(d.departments || []);
    else setErr(d.error || 'Failed to load report.');
  };

  const requestTraining = async (dept?: string) => {
    setTraining(null); setErr('');
    const r = await fetch(`${API}/enterprise-v2/orgs/${orgId}/training-request`, { method: 'POST', headers: hdr(), body: JSON.stringify({ departmentKey: dept || '' }) });
    const d = await r.json();
    if (d.success) setTraining(d); else setErr(d.error || 'Training request failed.');
  };

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 1px 12px rgba(0,0,0,0.05)', maxWidth: 720 };
  const input: React.CSSProperties = { width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 10, fontFamily: fontStack };
  const btn: React.CSSProperties = { background: BRAND, color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 9, fontWeight: 800, cursor: 'pointer' };

  if (!authed) return <div style={{ fontFamily: fontStack, padding: 40, textAlign: 'center' }}><h2 style={{ color: BRAND }}>Please sign in as an enterprise administrator.</h2><a href="/login" style={{ color: GOLD }}>Go to login →</a></div>;

  // SVG bar chart (§6 — vector, no raster)
  const maxLoss = Math.max(10, ...report.map(d => d.projectedProductivityLossPct));
  const barColor = (b: string) => b === 'HIGH' ? '#dc2626' : b === 'MEDIUM' ? '#d97706' : '#059669';

  return (
    <div style={{ fontFamily: fontStack, background: '#f5f7fa', minHeight: '100vh', padding: '32px 16px', color: '#0f172a' }}>
      <div style={{ maxWidth: 720, margin: '0 auto 20px' }}>
        <h1 style={{ color: BRAND, fontSize: 26, fontWeight: 900 }}>Enterprise Workforce Assessment</h1>
        <p style={{ color: '#64748b' }}>100-question adaptive talent simulation · corporate talent intelligence</p>
      </div>
      {msg && <div style={{ ...card, background: '#dcfce7', color: '#166534', padding: 12 }}>{msg}</div>}
      {err && <div style={{ ...card, background: '#fef2f2', color: '#991b1b', padding: 12 }}>{err}</div>}

      <div style={card}>
        <h3 style={{ color: BRAND, marginBottom: 12 }}>① Organizations</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input style={{ ...input, marginBottom: 0 }} placeholder="New company name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          <button style={btn} onClick={createOrg}>Create</button>
        </div>
        {orgs.length > 0 && (
          <select style={input} value={orgId} onChange={e => setOrgId(e.target.value)}>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.companyName} ({o._count?.sessions || 0} sessions)</option>)}
          </select>
        )}
      </div>

      <div style={card}>
        <h3 style={{ color: BRAND, marginBottom: 12 }}>② Assign 100-Question Assessment</h3>
        <input style={input} placeholder="Candidate name" value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} />
        <input style={input} placeholder="Candidate email" value={form.candidateEmail} onChange={e => setForm({ ...form, candidateEmail: e.target.value })} />
        <select style={input} value={form.targetDepartment} onChange={e => setForm({ ...form, targetDepartment: e.target.value })}>
          <option value="">Select department…</option>
          {tax.departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select style={input} value={form.targetTier} onChange={e => setForm({ ...form, targetTier: e.target.value })}>
          <option value="">Select corporate tier…</option>
          {tax.tiers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={input} placeholder="Industry field (e.g. Telecom, Banking)" value={form.industryField} onChange={e => setForm({ ...form, industryField: e.target.value })} />
        <button style={btn} onClick={createSession}>Generate Assessment Link</button>
        {invite && (
          <div style={{ marginTop: 14, padding: 14, background: '#f1f5f9', borderRadius: 10 }}>
            <b>Assessment link ({invite.totalQuestions} questions):</b>
            <div style={{ wordBreak: 'break-all', fontSize: 13, color: BRAND, marginTop: 6 }}>{invite.examLink}</div>
            <button style={{ ...btn, marginTop: 8, padding: '6px 12px', fontSize: 13 }} onClick={() => navigator.clipboard?.writeText(invite.examLink)}>Copy link</button>
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ color: BRAND, marginBottom: 12 }}>③ Corporate Talent Report</h3>
        <button style={btn} onClick={loadReport}>Load department analytics</button>
        {report.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <svg viewBox={`0 0 700 ${report.length * 46 + 20}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Projected productivity loss by department">
              {report.map((d, i) => {
                const y = i * 46 + 10; const w = (d.projectedProductivityLossPct / maxLoss) * 420;
                return (
                  <g key={d.department}>
                    <text x={0} y={y + 16} fontSize={12} fill="#334155" fontFamily={fontStack}>{d.department.slice(0, 24)}</text>
                    <rect x={230} y={y + 4} width={Math.max(2, w)} height={18} rx={4} fill={barColor(d.burnoutRiskIndicator)} />
                    <text x={230 + Math.max(2, w) + 6} y={y + 17} fontSize={11} fill="#64748b" fontFamily={fontStack}>{d.projectedProductivityLossPct}% loss · avg {d.aggregateCompetenceAvg}% · {d.candidates} cand · {d.burnoutRiskIndicator}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>Aggregated indices only — raw candidate telemetry is never exposed (GDPR/CCPA).</div>
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ color: BRAND, marginBottom: 8 }}>④ Request Bespoke Training</h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>One-click compile skill-gap telemetry (competencies below 80%) and transmit to the fulfillment desk.</p>
        <button style={{ ...btn, background: GOLD, color: BRAND }} onClick={() => requestTraining()}>Request Bespoke Training</button>
        {training && (
          <div style={{ marginTop: 14, padding: 14, background: '#fff7ed', borderRadius: 10 }}>
            <b style={{ color: '#92400e' }}>{training.message}</b>
            {training.skillGaps?.length > 0 && <ul style={{ margin: '8px 0 0 18px', color: '#7c2d12' }}>{training.skillGaps.map((g: any) => <li key={g.competency}>{g.competency} — {Number(g.avg).toFixed(0)}%</li>)}</ul>}
          </div>
        )}
      </div>
    </div>
  );
}
