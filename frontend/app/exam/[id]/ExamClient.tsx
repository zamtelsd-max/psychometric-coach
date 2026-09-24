'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const BLOCK_SIZE = 10;


// Blueprint typography (§6): Inter/Roboto, 720px / 80ch max line-length
const fontStack = "Inter, Roboto, system-ui, sans-serif";

type Q = { id: string; ordinal: number; block: number; scenario: string; options: { key: string; label: string }[]; competency: string };

// §8 — passive telemetry tracker per question (TTFC, dwell, toggles) → sendBeacon
class Telemetry {
  sessionUuid: string; questionIndex: number; init: number;
  ttfc: number | null = null; toggles = 0; last: string | null = null; focusLoss = 0;
  constructor(sessionUuid: string, questionIndex: number) { this.sessionUuid = sessionUuid; this.questionIndex = questionIndex; this.init = performance.now(); }
  onSelect(v: string) {
    if (this.ttfc == null) this.ttfc = Math.round(performance.now() - this.init);
    if (this.last != null && this.last !== v) this.toggles++;
    this.last = v;
  }
  onBlur() { this.focusLoss++; }
  ship() {
    const dwell = Math.round(performance.now() - this.init);
    const payload = {
      gatewayHeader: { sessionUuid: this.sessionUuid, clientTimestampIso: new Date().toISOString() },
      telemetryPayload: {
        questionIndex: this.questionIndex,
        timeToFirstClickMilliseconds: this.ttfc ?? dwell,
        totalDwellTimeMilliseconds: dwell,
        answerStateToggles: this.toggles,
        uiAnomaliesDetected: { erraticCursorSpam: false, viewportFocusLossCounter: this.focusLoss },
      },
    };
    try { navigator.sendBeacon(`${API}/exams/telemetry`, JSON.stringify(payload)); } catch {}
  }
}

export default function ExamClient() {
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  const [session, setSession] = useState<any>(null);
  const [total, setTotal] = useState(100);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(1); // 1-based question ordinal
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const cache = useRef<Record<number, Q[]>>({});        // block → questions
  const tele = useRef<Telemetry | null>(null);
  const [ready, setReady] = useState(false);

  const blockOf = (ord: number) => Math.ceil(ord / BLOCK_SIZE);

  // fetch a block (with rolling pre-cache §3.2)
  const fetchBlockFor = useCallback(async (sid: string, block: number, t: string) => {
    if (!sid || block < 1 || block > 10 || cache.current[block]) return;
    try {
      const r = await fetch(`${API}/enterprise-v2/exam/${sid}/block/${block}?t=${encodeURIComponent(t)}`);
      const d = await r.json();
      if (d.success) cache.current[block] = d.questions;
    } catch {}
  }, []);
  const fetchBlock = useCallback((block: number, t: string) => fetchBlockFor(id, block, t), [fetchBlockFor, id]);

  useEffect(() => {
    // resolve id + token. Prefer a single combined param ?k=<id>.<token> (no '&', unbreakable
    // when links are pasted into chat/address bars), else ?id=&t=, else /exam/<id> path.
    const qs = new URLSearchParams(window.location.search);
    const parts = window.location.pathname.split('/').filter(Boolean);
    const pathSeg = parts[parts.indexOf('exam') + 1] || '';
    let pathId = ''; let t = '';
    const combined = qs.get('k') || '';
    if (combined && combined.includes('.')) {
      const dot = combined.indexOf('.');
      pathId = combined.slice(0, dot);
      t = combined.slice(dot + 1);
    } else {
      pathId = qs.get('id') || (pathSeg && pathSeg !== 'entry' ? pathSeg : '');
      t = qs.get('t') || '';
    }
    setId(pathId);
    setToken(t);
    if (!pathId || pathId === 'entry') { setErr('Missing assessment id.'); setLoading(false); return; }
    (async () => {
      try {
        const r = await fetch(`${API}/enterprise-v2/exam/${pathId}?t=${encodeURIComponent(t)}`);
        const d = await r.json();
        if (!d.success) { setErr('This assessment link is invalid or expired.'); setLoading(false); return; }
        setSession(d.session);
        if (d.session.totalQuestions) setTotal(d.session.totalQuestions);
        if (d.session.isFinalized) { setErr('This assessment has already been completed.'); setLoading(false); return; }
        setIdx(d.session.currentQuestionIndex || 1);
        // §3.2 — first 10 within a 2.5s window, then prefetch block 2
        await fetchBlockFor(pathId, blockOf(d.session.currentQuestionIndex || 1), t);
        setReady(true); setLoading(false);
        fetchBlockFor(pathId, blockOf(d.session.currentQuestionIndex || 1) + 1, t); // silent pre-cache
      } catch { setErr('Could not load the assessment.'); setLoading(false); }
    })();
  }, [fetchBlockFor]);

  const current: Q | undefined = cache.current[blockOf(idx)]?.find(q => q.ordinal === idx);

  // init telemetry per question + prefetch next block when near boundary
  useEffect(() => {
    if (!current || !session) return;
    tele.current = new Telemetry(id, idx);
    const onBlur = () => tele.current?.onBlur();
    window.addEventListener('blur', onBlur);
    // pre-cache next block when entering last 3 of current block
    if (idx % BLOCK_SIZE >= (BLOCK_SIZE - 2) || idx % BLOCK_SIZE === 0) fetchBlock(blockOf(idx) + 1, token);
    return () => window.removeEventListener('blur', onBlur);
  }, [idx, current, session, id, token, fetchBlock]);

  const choose = (key: string) => { setAnswers(a => ({ ...a, [idx]: key })); tele.current?.onSelect(key); };

  const submitAnswer = async () => {
    const key = answers[idx];
    if (!key) return;
    tele.current?.ship();
    try { await fetch(`${API}/enterprise-v2/exam/${id}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ordinal: idx, answerKey: key }) }); } catch {}
    if (idx >= total) { await finalize(); return; }
    const next = idx + 1;
    if (!cache.current[blockOf(next)]) await fetchBlock(blockOf(next), token);
    setIdx(next);
  };

  const finalize = async () => {
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/enterprise-v2/exam/${id}/finalize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      setResult(await r.json());
    } catch { setErr('Submission failed. Please retry.'); }
    setSubmitting(false);
  };

  const wrap: React.CSSProperties = { fontFamily: fontStack, minHeight: '100vh', background: '#f5f7fa', color: '#0f172a' };
  const card: React.CSSProperties = { maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' };

  if (loading) return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div>Loading your assessment…</div></div>;
  if (err) return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={card}><h2 style={{ color: BRAND }}>⚠️ {err}</h2></div></div>;

  if (result) {
    const passed = result.passed;
    return (
      <div style={{ ...wrap, padding: '40px 16px' }}>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 60 }}>{passed ? '🏆' : '📋'}</div>
            <h1 style={{ color: BRAND, fontSize: 26, fontWeight: 900, margin: '8px 0' }}>Assessment Complete</h1>
            <div style={{ fontSize: 44, fontWeight: 900, color: passed ? '#059669' : BRAND }}>{Number(result.grade).toFixed(2)}%</div>
            <p style={{ color: '#475569' }}>Pass boundary: {result.passBoundary}%</p>
          </div>
          {passed && result.certificate && (
            <div style={{ marginTop: 20, padding: 20, border: `2px solid ${GOLD}`, borderRadius: 12, textAlign: 'center' }}>
              <h3 style={{ color: BRAND }}>Certificate of Completion issued ✅</h3>
              <p style={{ fontSize: 13, color: '#475569' }}>Confirmation stamp: <b>{result.certificate.confirmationStamp}</b></p>
              <a href={result.certificate.verifyUrl} style={{ display: 'inline-block', marginTop: 10, background: BRAND, color: '#fff', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>View / verify certificate</a>
            </div>
          )}
          {result.upskillingRecommended && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff7ed', borderRadius: 10 }}>
              <b style={{ color: '#92400e' }}>Recommended upskilling areas</b>
              <ul style={{ margin: '8px 0 0 18px', color: '#7c2d12' }}>
                {result.skillGaps.map((g: any) => <li key={g.competency}>{g.competency} — {Number(g.avg).toFixed(0)}%</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!ready || !current) return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div>Preparing questions…</div></div>;

  const pct = Math.round((idx / total) * 100);
  return (
    <div style={{ ...wrap, padding: '28px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, color: BRAND }}>{session?.trackTitle}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Question {idx} / {total}</div>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto 16px', height: 6, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: GOLD, borderRadius: 99, transition: 'width .3s' }} />
      </div>
      <div style={card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: 0.5 }}>{current.competency}</div>
        <p style={{ fontSize: 17, lineHeight: 1.6, margin: '10px 0 20px', maxWidth: '80ch' }}>{current.scenario}</p>
        <div className="exam-options">
          {current.options.map(o => (
            <label key={o.key}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', border: `2px solid ${answers[idx] === o.key ? BRAND : '#e2e8f0'}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer', background: answers[idx] === o.key ? '#f1f5f9' : '#fff' }}>
              <input className="exam-option-input" type="radio" name={`q${idx}`} value={o.key}
                checked={answers[idx] === o.key} onChange={() => choose(o.key)} style={{ marginTop: 3 }} />
              <span><b>{o.key}.</b> {o.label}</span>
            </label>
          ))}
        </div>
        <button disabled={!answers[idx] || submitting} onClick={submitAnswer}
          style={{ marginTop: 12, width: '100%', background: answers[idx] ? BRAND : '#cbd5e1', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: answers[idx] ? 'pointer' : 'not-allowed' }}>
          {submitting ? 'Submitting…' : idx >= total ? 'Finish & Submit' : 'Next Question →'}
        </button>
      </div>
    </div>
  );
}
