'use client';
import { useEffect, useState } from 'react';
import { screeningApi, enterpriseApi } from '../../../lib/api';

const BRAND = '#1B365D', GOLD = '#D4AF37';

export default function ScreeningAdminPage() {
  const [list, setList] = useState<any[]>([]);
  const [families, setFamilies] = useState<string[]>(['General', 'Software Engineering', 'Sales & Distribution', 'Finance', 'Marketing', 'Customer Service', 'Operations', 'Data & Analytics', 'Human Resources', 'Healthcare']);
  const [form, setForm] = useState({ candidateEmail: '', role: '', difficulty: 'Mid', jobFamily: 'General', count: 6 });
  const [invite, setInvite] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const refresh = () => screeningApi.listAssessments().then(r => setList(r.data.assessments || [])).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    setErr(''); if (!form.candidateEmail || !form.role) { setErr('Candidate email and role are required.'); return; }
    setLoading(true);
    try { const { data } = await screeningApi.createAssessment(form); setInvite(data.inviteLink); refresh(); }
    catch (e: any) { setErr(e?.response?.data?.error || 'Failed to create.'); }
    finally { setLoading(false); }
  };
  const openReport = async (id: string) => { const { data } = await screeningApi.report(id); setReport(data); };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 20 }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Enterprise Screening</span>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 16px' }}>Recruiter Console</h1>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Invite a candidate to a secure assessment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Candidate email" value={form.candidateEmail} onChange={e => setForm({ ...form, candidateEmail: e.target.value })} style={inp} />
          <input placeholder="Role (e.g. Sales Executive)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp} />
          <select value={form.jobFamily} onChange={e => setForm({ ...form, jobFamily: e.target.value })} style={inp}>{families.map(f => <option key={f}>{f}</option>)}</select>
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} style={inp}>{['Junior', 'Mid', 'Senior', 'Executive'].map(f => <option key={f}>{f}</option>)}</select>
          <input type="number" min={3} max={12} value={form.count} onChange={e => setForm({ ...form, count: +e.target.value })} style={inp} placeholder="# questions" />
          <button onClick={create} disabled={loading} style={{ background: BRAND, color: '#fff', fontWeight: 800, borderRadius: 10, border: 'none', cursor: 'pointer' }}>{loading ? 'Creating…' : 'Create & get link'}</button>
        </div>
        {err && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{err}</p>}
        {invite && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12, marginTop: 12, fontSize: 13, wordBreak: 'break-all' }}>Invite link (send to candidate):<br /><b>{invite}</b></div>}
      </div>

      <h3 style={{ fontWeight: 800, marginBottom: 10 }}>Assessments</h3>
      {list.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14 }}>No assessments yet.</p>}
      {list.map(a => (
        <div key={a.id} onClick={() => openReport(a.id)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><b>{a.candidateEmail}</b> · {a.role}<div style={{ fontSize: 12, color: '#64748b' }}>{a.jobFamily} · {a.difficulty} · {a._count?.questions} Q</div></div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: a.status === 'completed' ? '#16a34a' : a.status === 'in_progress' ? GOLD : '#94a3b8' }}>{a.status}</span>
            <div style={{ fontSize: 12, color: a._count?.violations ? '#dc2626' : '#94a3b8' }}>⚠ {a._count?.violations || 0} flags</div>
          </div>
        </div>
      ))}

      {report && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={() => setReport(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 560, width: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 900, color: BRAND }}>{report.assessment.candidateEmail}</h3>
            <p style={{ color: '#64748b', fontSize: 13 }}>{report.assessment.role} · {report.assessment.status}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
              {Object.entries(report.violationCounts).map(([k, v]: any) => <span key={k} style={{ background: '#fef2f2', color: '#b91c1c', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>{k.replace(/_/g, ' ')}: {v}</span>)}
              {report.totalViolations === 0 && <span style={{ color: '#16a34a', fontSize: 13 }}>✓ No integrity flags</span>}
            </div>
            <h4 style={{ fontWeight: 800, fontSize: 14, margin: '10px 0 6px' }}>Answers</h4>
            {report.assessment.questions.map((q: any) => (
              <div key={q.id} style={{ borderTop: '1px solid #f1f5f9', padding: '8px 0' }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{q.ordinal}. {q.questionText}</p>
                <p style={{ fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap' }}>{q.answer || <i style={{ color: '#94a3b8' }}>no answer</i>}</p>
              </div>
            ))}
            <button onClick={() => setReport(null)} style={{ marginTop: 12, background: BRAND, color: '#fff', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
const inp: React.CSSProperties = { padding: 11, border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14 };
