'use client';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const font = "Inter, Roboto, system-ui, sans-serif";

function TestRunner() {
  const [kind, setKind] = useState('');
  const [track, setTrack] = useState('GENERAL');
  const [token, setToken] = useState('');
  const [item, setItem] = useState<any>(null);
  const [idx, setIdx] = useState(0);
  const [total, setTotal] = useState(15);
  const [sel, setSel] = useState<string>('');
  const [least, setLeast] = useState<string>('');
  const [phase, setPhase] = useState<'loading' | 'run' | 'done' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [flags, setFlags] = useState(0);
  const startedAt = useRef(0);

  // ── NFR-01 anti-cheating: block copy/paste + right-click, flag tab-switch ──
  useEffect(() => {
    const block = (e: Event) => { e.preventDefault(); return false; };
    const onHide = () => { if (document.hidden) setFlags(f => f + 1); };
    document.addEventListener('copy', block); document.addEventListener('paste', block);
    document.addEventListener('contextmenu', block);
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('copy', block); document.removeEventListener('paste', block); document.removeEventListener('contextmenu', block); document.removeEventListener('visibilitychange', onHide); };
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const k = qs.get('kind') || 'NUMERICAL'; const t = qs.get('track') || 'GENERAL';
    const joinCode = qs.get('join') || '';
    setKind(k); setTrack(t);
    // interruption recovery
    const saved = localStorage.getItem('sim_token_' + k + '_' + t);
    (async () => {
      try {
        let tok = saved;
        if (!tok) {
          const r = await fetch(`${API}/simulator/session/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: k, track: t, joinCode }) });
          const d = await r.json();
          if (!d.success) { setErr('Could not start the assessment.'); setPhase('error'); return; }
          tok = d.sessionToken; localStorage.setItem('sim_token_' + k + '_' + t, tok!);
        }
        setToken(tok!);
        await loadNext(tok!);
      } catch { setErr('Could not start.'); setPhase('error'); }
    })();
  }, []);

  const loadNext = useCallback(async (tok: string) => {
    setSel(''); setLeast('');
    const r = await fetch(`${API}/simulator/session/${tok}/next`);
    const d = await r.json();
    if (d.done) { await finalize(tok); return; }
    setItem(d.item); setIdx(d.index); setTotal(d.total); startedAt.current = performance.now(); setPhase('run');
  }, []);

  const answer = async () => {
    if (!sel) return;
    if (kind === 'SJT' && !least) return;
    const ms = Math.round(performance.now() - startedAt.current);
    await fetch(`${API}/simulator/session/${token}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: item.id, key: sel, leastKey: least, ms }) }).catch(() => {});
    await loadNext(token);
  };

  const finalize = async (tok: string) => {
    const r = await fetch(`${API}/simulator/session/${tok}/finalize`, { method: 'POST' });
    setResult(await r.json());
    localStorage.removeItem('sim_token_' + kind + '_' + track);
    setPhase('done');
  };

  const wrap: React.CSSProperties = { fontFamily: font, minHeight: '100vh', background: '#f6f8fc', color: '#0f172a', padding: '28px 16px' };
  const card: React.CSSProperties = { maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(15,23,42,.06)' };

  if (phase === 'loading') return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Preparing your adaptive assessment…</div>;
  if (phase === 'error') return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={card}><h2 style={{ color: BRAND }}>⚠️ {err}</h2></div></div>;

  if (phase === 'done' && result) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 54 }}>{kind === 'OCEAN' ? '🧭' : '🏆'}</div>
            <h1 style={{ color: BRAND, fontSize: 26, fontWeight: 900, margin: '6px 0' }}>Assessment Complete</h1>
          </div>
          {kind === 'OCEAN' ? (
            <div style={{ marginTop: 12 }}>
              {Object.entries(result.ocean || {}).map(([k, v]: any) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <b>{({ O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism' } as any)[k]}</b><span>{v}%</span>
                  </div>
                  <div style={{ height: 10, background: '#e2e8f0', borderRadius: 99 }}><div style={{ width: `${v}%`, height: '100%', background: BRAND, borderRadius: 99 }} /></div>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: 12, background: result.socialDesirability >= 80 ? '#fff7ed' : '#ecfdf3', borderRadius: 10, fontSize: 13 }}>
                Social-desirability: <b>{result.socialDesirability}%</b> — {result.flag}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: BRAND }}>{result.accuracy}%</div>
              <p style={{ color: '#64748b' }}>{result.correct}/{result.answered} correct · ability percentile {result.abilityPercentile}%</p>
              <div style={{ display: 'inline-block', marginTop: 12, background: '#eef3fb', color: BRAND, fontWeight: 800, padding: '8px 20px', borderRadius: 99 }}>Grade band: {result.band}</div>
            </div>
          )}
          <a href="/simulator/" style={{ display: 'block', textAlign: 'center', marginTop: 20, color: BRAND, fontWeight: 700 }}>← Back to simulator</a>
        </div>
      </div>
    );
  }

  if (!item) return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading question…</div>;
  const pct = Math.round((idx / total) * 100);
  const isLikert = kind === 'OCEAN';
  const isSJT = kind === 'SJT';

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 720, margin: '0 auto 12px', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
        <span>{kind} {track !== 'GENERAL' ? `· ${track}` : ''}</span><span>Question {idx} / {total}</span>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto 16px', height: 6, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: GOLD, borderRadius: 99, transition: 'width .3s' }} />
      </div>
      <div style={card}>
        {item.passage ? <p style={{ background: '#f1f5f9', padding: 14, borderRadius: 10, fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 14 }}>{item.passage}</p> : null}
        <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 18, whiteSpace: 'pre-wrap', maxWidth: '80ch' }}>{item.prompt}</p>

        {isSJT && <p style={{ fontSize: 13, color: GOLD, fontWeight: 700, marginBottom: 6 }}>Pick the MOST effective (green) and LEAST effective (red).</p>}

        <div role="radiogroup" aria-label="Answer options">
          {(item.options || []).map((o: any, i: number) => {
            const active = sel === o.key;
            const leastActive = least === o.key;
            return (
              <div key={o.key}
                onClick={() => { if (isSJT) { if (least === o.key) return; setSel(o.key); } else setSel(o.key); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(o.key); } }}
                role="radio" aria-checked={active} tabIndex={0}
                style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '13px 15px', border: `2px solid ${active ? '#15803d' : leastActive ? '#dc2626' : '#e2e8f0'}`, borderRadius: 10, marginBottom: 9, cursor: 'pointer', background: active ? '#ecfdf3' : leastActive ? '#fef2f2' : '#fff', outline: 'none' }}>
                <b style={{ color: BRAND }}>{isLikert ? '' : o.key + '.'}</b>
                <span style={{ flex: 1 }}>{o.label}</span>
                {isSJT && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); if (sel === o.key) return; setLeast(o.key); }}
                    style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: leastActive ? '#dc2626' : '#fee2e2', color: leastActive ? '#fff' : '#991b1b' }}>Least</button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={answer} disabled={!sel || (isSJT && !least)}
          style={{ marginTop: 12, width: '100%', background: (sel && (!isSJT || least)) ? BRAND : '#cbd5e1', color: '#fff', border: 'none', padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: (sel && (!isSJT || least)) ? 'pointer' : 'not-allowed' }}>
          {idx >= total ? 'Finish' : 'Next →'}
        </button>
        {flags > 0 && <p style={{ marginTop: 10, fontSize: 12, color: '#b45309', textAlign: 'center' }}>⚠ {flags} focus-loss event{flags > 1 ? 's' : ''} logged (integrity monitoring active).</p>}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}><TestRunner /></Suspense>;
}
