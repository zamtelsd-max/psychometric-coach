'use client';

import { useEffect, useState, useRef } from 'react';
import { interviewApi } from '@/lib/api';

interface Panelist { archetype: string; name: string; role: string; avatar: string; focus: string; }
interface Question { panelist: Panelist; round: number; questionNumber: number; questionInRound: number; questionId: string; questionText: string; expectedKeywords?: string; }

const NAVY = '#1B365D', GOLD = '#D4AF37', INK = '#212529', BG = '#F8F9FA';

// Cartoon avatar image per archetype
const AVATAR: Record<string, string> = {
  TECH_LEAD: '/panelists/tech_lead.jpg',
  HR_MANAGER: '/panelists/hr_manager.jpg',
  PRODUCT_MANAGER: '/panelists/product_manager.jpg',
  EXEC_DIRECTOR: '/panelists/exec_director.jpg',
};
function PanelAvatar({ archetype, emoji, size = 56, active = true, speaking = false }: { archetype: string; emoji?: string; size?: number; active?: boolean; speaking?: boolean }) {
  const src = AVATAR[archetype];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: `2.5px solid ${active ? GOLD : '#e5e7eb'}`, background: '#fff',
      boxShadow: active ? `0 2px 10px ${NAVY}22` : 'none',
      animation: speaking ? 'speakNod 1.4s ease-in-out infinite' : 'none',
      transformOrigin: 'bottom center' }}>
      {src ? <img src={src} alt={archetype} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: size * 0.5 }}>{emoji}</div>}
    </div>
  );
}

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
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseAnswerRef = useRef('');

  useEffect(() => {
    interviewApi.panel().then(r => {
      setPanel(r.data.panel); setFamilies(r.data.jobFamilies || []); setTiers(r.data.tiers || []);
      if (r.data.jobFamilies?.length) setJobFamily(r.data.jobFamilies.includes('General') ? 'General' : r.data.jobFamilies[0]);
    }).catch(() => {});
    interviewApi.sessions().then(r => setHistory(r.data.sessions || [])).catch(() => {});
    // Web Speech API support detection
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    baseAnswerRef.current = answer ? answer + ' ' : '';
    rec.onresult = (e: any) => {
      let finalTx = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTx += t + ' '; else interim += t;
      }
      if (finalTx) baseAnswerRef.current += finalTx;
      setAnswer((baseAnswerRef.current + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start(); setListening(true);
  };
  const stopVoice = () => { try { recognitionRef.current?.stop(); } catch {} setListening(false); };

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
    stopVoice();
    setBusy(true);
    try {
      const r = await interviewApi.answer(sessionId, { transcript: answer, questionText: question.questionText, expectedKeywords: question.expectedKeywords });
      setLastFeedback({ score: r.data.score, feedback: r.data.feedback });
      if (r.data.done) { setResult(r.data.result); setStage('result'); interviewApi.sessions().then(h => setHistory(h.data.sessions || [])).catch(() => {}); }
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
            <PanelAvatar archetype={p.archetype} emoji={p.avatar} size={64} />
            <p style={{ fontWeight: 800, color: NAVY, margin: '8px 0 2px', fontSize: 14 }}>{p.role}</p>
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

      {/* ── Interview History ── */}
      {history.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: 0 }}>Your interview history</h2>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{history.filter(h => h.status === 'completed').length} completed</span>
          </div>
          {/* trend sparkline of aggregate scores */}
          {(() => {
            const done = history.filter(h => h.status === 'completed' && h.aggregateScore != null).slice(0, 12).reverse();
            if (done.length < 2) return null;
            const W = 640, H = 90, pad = 8;
            const xs = (W - pad * 2) / (done.length - 1);
            const max = Math.max(...done.map(d => d.aggregateScore), 100);
            const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
            const path = done.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(pad + i * xs).toFixed(1)} ${y(d.aggregateScore).toFixed(1)}`).join(' ');
            return (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 6px', fontWeight: 700 }}>Score trend (last {done.length})</p>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                  <path d={`${path} L ${(pad + (done.length - 1) * xs).toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`} fill={NAVY} opacity={0.08} />
                  <path d={path} fill="none" stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  {done.map((d, i) => <circle key={i} cx={pad + i * xs} cy={y(d.aggregateScore)} r={3} fill={GOLD} />)}
                </svg>
              </div>
            );
          })()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 8).map(h => (
              <div key={h.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: h.status === 'completed' ? NAVY : '#e5e7eb', color: h.status === 'completed' ? GOLD : '#9ca3af', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                  {h.status === 'completed' && h.aggregateScore != null ? `${h.aggregateScore}%` : '…'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: INK, margin: 0, fontSize: 13.5 }}>{h.jobFamily} · {h.tier}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                    {new Date(h.createdAt).toLocaleDateString()} · {h.status === 'completed' ? `Tech ${h.technicalAvg ?? '-'}% · STAR ${h.structuralAvg ?? '-'}% · Delivery ${h.fluencyAvg ?? '-'}%` : 'In progress'}
                  </p>
                </div>
                {h.status === 'completed' && h.growthDelta != null && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: h.growthDelta >= 0 ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                    {h.growthDelta >= 0 ? '▲' : '▼'}{Math.abs(h.growthDelta)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
            <div key={p.archetype} style={{ textAlign: 'center', opacity: i === progress.round - 1 ? 1 : .4, transform: i === progress.round - 1 ? 'scale(1.1)' : 'none', transition: 'all .3s' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><PanelAvatar archetype={p.archetype} emoji={p.avatar} size={46} active={i === progress.round - 1} /></div>
              <div style={{ fontSize: 8.5, color: i === progress.round - 1 ? NAVY : '#9ca3af', fontWeight: 700, maxWidth: 60, marginTop: 3 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Immersive scene: room backdrop + speaking panelist + speech bubble */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 16, border: `1px solid #e5e7eb`,
        backgroundImage: 'url(/panelists/room.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(27,54,93,.30) 0%, rgba(248,249,250,.86) 62%, #F8F9FA 100%)' }} />
        <div style={{ position: 'relative', padding: '20px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div key={question.questionNumber} style={{ animation: 'popIn .35s ease' }}>
              <PanelAvatar archetype={question.panelist.archetype} emoji={question.panelist.avatar} size={62} speaking />
            </div>
            {/* speech bubble */}
            <div key={'b' + question.questionNumber} style={{ position: 'relative', flex: 1, background: '#fff', border: `2px solid ${NAVY}`, borderRadius: 16, padding: '13px 15px', animation: 'bubbleIn .4s ease' }}>
              <span style={{ position: 'absolute', left: -9, top: 16, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: `9px solid ${NAVY}` }} />
              <span style={{ position: 'absolute', left: -6, top: 17, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '7px solid #fff' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontWeight: 800, color: NAVY, fontSize: 13 }}>{question.panelist.role}</span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>· asking…</span>
              </div>
              <p style={{ fontSize: 15.5, fontWeight: 600, color: INK, margin: 0, lineHeight: 1.5 }}>{question.questionText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* last feedback */}
      {lastFeedback && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#166534' }}>
          <b>Previous answer:</b> Tech {lastFeedback.score.technical}% · Structure {lastFeedback.score.structural}% · Delivery {lastFeedback.score.fluency}%. {lastFeedback.feedback}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <textarea ref={answerRef} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type or speak your answer using the STAR method — Situation, Task, Action, Result…"
          rows={7} style={{ width: '100%', padding: 14, paddingRight: 54, borderRadius: 12, border: listening ? `2px solid ${GOLD}` : '1px solid #d1d5db', fontSize: 14, resize: 'vertical', marginBottom: 6 }} />
        {voiceSupported && (
          <button onClick={toggleVoice} title={listening ? 'Stop recording' : 'Speak your answer'}
            style={{ position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: listening ? GOLD : NAVY, color: '#fff', fontSize: 17, display: 'grid', placeItems: 'center',
              boxShadow: listening ? `0 0 0 4px ${GOLD}44` : 'none', animation: listening ? 'pulse 1.2s infinite' : 'none' }}>
            {listening ? '⏹' : '🎤'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: listening ? GOLD : '#9ca3af', fontWeight: listening ? 700 : 400 }}>
          {listening ? '● Listening… speak now' : `${answer.trim().split(/\s+/).filter(Boolean).length} words · tip: cover S-T-A-R`}
        </span>
        {voiceSupported && <span style={{ fontSize: 10, color: '#9ca3af' }}>🎤 voice input available</span>}
      </div>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 0 4px ${GOLD}44}50%{box-shadow:0 0 0 8px ${GOLD}22}}
        @keyframes speakNod{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-2px) rotate(-1.5deg)}50%{transform:translateY(1px) rotate(0deg)}75%{transform:translateY(-2px) rotate(1.5deg)}}
        @keyframes popIn{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes bubbleIn{0%{transform:translateX(10px) scale(.96);opacity:0}100%{transform:translateX(0) scale(1);opacity:1}}
      `}</style>
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
