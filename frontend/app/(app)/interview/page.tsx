'use client';

import { useEffect, useState, useRef } from 'react';
import { interviewApi } from '@/lib/api';

interface Panelist { archetype: string; name: string; role: string; avatar: string; focus: string; }
interface Question { panelist: Panelist; round: number; questionNumber: number; questionInRound: number; questionId: string; questionText: string; expectedKeywords?: string; }

const NAVY = '#1B365D', GOLD = '#D4AF37', INK = '#212529', BG = '#F8F9FA';

export default function InterviewPage() {
  const [panel, setPanel] = useState<Panelist[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [jobFamily, setJobFamily] = useState('General');
  const [tier, setTier] = useState('Mid');
  const [stage, setStage] = useState<'setup' | 'interview' | 'result'>('setup');
  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const [progress, setProgress] = useState({ round: 1, turn: 0, totalTurns: 16 });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [upgrade, setUpgrade] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    interviewApi.panel().then(r => {
      setPanel(r.data.panel); setFamilies(r.data.jobFamilies || []); setTiers(r.data.tiers || []);
      if (r.data.jobFamilies?.length) setJobFamily(r.data.jobFamilies.includes('General') ? 'General' : r.data.jobFamilies[0]);
    }).catch(() => {});
  }, []);

  const start = async () => {
    setBusy(true); setError(''); setUpgrade(false);
    try {
      const r = await interviewApi.start({ jobFamily, tier });
      setSessionId(r.data.session.id); setQuestion(r.data.question);
      setProgress({ round: 1, turn: 0, totalTurns: r.data.session.totalTurns });
      setStage('interview'); setLastFeedback(null); setAnswer('');
    } catch (e: any) {
      if (e?.response?.status === 402) { setUpgrade(true); setError(e.response.data?.error || 'Premium feature'); }
      else setError(e?.response?.data?.error || 'Could not start interview');
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!answer.trim() || busy || !question) return;
    setBusy(true);
    try {
      const r = await interviewApi.answer(sessionId, { transcript: answer, questionText: question.questionText, expectedKeywords: question.expectedKeywords });
      setLastFeedback({ score: r.data.score, feedback: r.data.feedback });
      if (r.data.done) { setResult(r.data.result); setStage('result'); }
      else { setQuestion(r.data.question); setProgress(r.data.progress); setAnswer(''); setTimeout(() => answerRef.current?.focus(), 100); }
    } catch (e: any) { setError(e?.response?.data?.error || 'Could not submit'); }
    finally { setBusy(false); }
  };

  const pct = Math.round((progress.turn / progress.totalTurns) * 100);

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 60px' }}>
      <div style={{ background: NAVY, borderRadius: 20, padding: '26px 24px', color: '#fff', marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Virtual Interview Panel</h1>
        <p style={{ fontSize: 13.5, opacity: .9, margin: '6px 0 0' }}>Face a live 4-panelist interview — 4 rounds, 16 questions — with instant STAR-based scoring and coaching.</p>
      </div>

      {/* Panel matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 22 }}>
        {panel.map(p => (
          <div key={p.archetype} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 30 }}>{p.avatar}</div>
            <p style={{ fontWeight: 800, color: NAVY, margin: '6px 0 2px', fontSize: 14 }}>{p.role}</p>
            <p style={{ fontSize: 11.5, color: '#6b7280', margin: 0 }}>{p.focus}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 14px' }}>Configure your interview</h2>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6 }}>Target job family</label>
        <select value={jobFamily} onChange={e => setJobFamily(e.target.value)} style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 14, fontSize: 14 }}>
          {families.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6 }}>Target tier</label>
        <select value={tier} onChange={e => setTier(e.target.value)} style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 18, fontSize: 14 }}>
          {tiers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {error && <div style={{ background: upgrade ? '#FFF7E6' : '#FEE2E2', color: upgrade ? '#92600A' : '#B91C1C', border: `1px solid ${upgrade ? GOLD : '#FCA5A5'}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>
          {error}{upgrade && <a href="/upgrade" style={{ display: 'block', marginTop: 6, fontWeight: 800, color: NAVY }}>→ Upgrade to unlock</a>}
        </div>}
        <button onClick={start} disabled={busy} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: NAVY, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: busy ? .6 : 1 }}>
          {busy ? 'Starting…' : 'Start Interview'}
        </button>
      </div>
    </div>
  );

  // ── INTERVIEW ──────────────────────────────────────────────────────────────
  if (stage === 'interview' && question) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 60px' }}>
      {/* progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
          <span>Round {progress.round} of 4 · Question {progress.turn + 1} of {progress.totalTurns}</span>
          <span style={{ fontWeight: 800, color: NAVY }}>{pct}%</span>
        </div>
        <div style={{ height: 7, background: '#e5e7eb', borderRadius: 20 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: NAVY, borderRadius: 20, transition: 'width .4s' }} />
        </div>
        {/* panel avatars */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          {panel.map((p, i) => (
            <div key={p.archetype} style={{ textAlign: 'center', opacity: i === progress.round - 1 ? 1 : .35, transform: i === progress.round - 1 ? 'scale(1.12)' : 'none', transition: 'all .3s' }}>
              <div style={{ fontSize: 26 }}>{p.avatar}</div>
              <div style={{ fontSize: 8.5, color: i === progress.round - 1 ? NAVY : '#9ca3af', fontWeight: 700, maxWidth: 60 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* current panelist question */}
      <div style={{ background: '#fff', border: `2px solid ${NAVY}`, borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{question.panelist.avatar}</span>
          <div>
            <p style={{ fontWeight: 800, color: NAVY, margin: 0, fontSize: 14 }}>{question.panelist.role}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{question.panelist.focus}</p>
          </div>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: INK, margin: 0, lineHeight: 1.5 }}>{question.questionText}</p>
      </div>

      {/* last feedback */}
      {lastFeedback && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#166534' }}>
          <b>Previous answer:</b> Tech {lastFeedback.score.technical}% · Structure {lastFeedback.score.structural}% · Delivery {lastFeedback.score.fluency}%. {lastFeedback.feedback}
        </div>
      )}

      <textarea ref={answerRef} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer using the STAR method — Situation, Task, Action, Result…"
        rows={7} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #d1d5db', fontSize: 14, resize: 'vertical', marginBottom: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{answer.trim().split(/\s+/).filter(Boolean).length} words · tip: cover S-T-A-R</span>
      </div>
      <button onClick={submit} disabled={busy || !answer.trim()} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: answer.trim() ? NAVY : '#9ca3af', color: '#fff', fontWeight: 800, fontSize: 15, cursor: answer.trim() ? 'pointer' : 'not-allowed', opacity: busy ? .6 : 1 }}>
        {busy ? 'Evaluating…' : progress.turn + 1 >= progress.totalTurns ? 'Submit Final Answer' : 'Submit & Next Question'}
      </button>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (stage === 'result' && result) {
    const ring = (v: number, label: string) => {
      const c = 2 * Math.PI * 34, off = c - (v / 100) * c;
      return (
        <div style={{ textAlign: 'center' }}>
          <svg width={84} height={84} viewBox="0 0 84 84">
            <circle cx={42} cy={42} r={34} fill="none" stroke="#e5e7eb" strokeWidth={9} />
            <circle cx={42} cy={42} r={34} fill="none" stroke={NAVY} strokeWidth={9} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 42 42)" />
            <text x={42} y={42} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill={NAVY}>{v}%</text>
          </svg>
          <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, margin: '4px 0 0' }}>{label}</p>
        </div>
      );
    };
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 60px' }}>
        <div style={{ background: NAVY, borderRadius: 20, padding: '26px 24px', color: '#fff', textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 12, opacity: .85, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Interview Complete</p>
          <p style={{ fontSize: 52, fontWeight: 900, margin: '4px 0', color: GOLD }}>{result.aggregate}%</p>
          <p style={{ fontSize: 13.5, opacity: .92, margin: 0 }}>{result.summary}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22, marginBottom: 16, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
          {ring(result.technicalAvg, 'Technical')}
          {ring(result.structuralAvg, 'STAR Structure')}
          {ring(result.fluencyAvg, 'Delivery')}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: result.growthDelta >= 0 ? '#16A34A' : '#DC2626', marginTop: 22 }}>{result.growthDelta >= 0 ? '+' : ''}{result.growthDelta}</div>
            <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, margin: '4px 0 0' }}>Growth vs last</p>
          </div>
        </div>
        <button onClick={() => { setStage('setup'); setResult(null); setLastFeedback(null); }} style={{ width: '100%', padding: 14, borderRadius: 12, border: `2px solid ${NAVY}`, background: '#fff', color: NAVY, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
          Practice Again
        </button>
      </div>
    );
  }

  return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading…</div>;
}
