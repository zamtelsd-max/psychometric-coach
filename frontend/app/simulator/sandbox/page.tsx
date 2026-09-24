'use client';
import { useEffect, useState, Suspense } from 'react';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const font = "Inter, Roboto, system-ui, sans-serif";

const PALETTE = [
  { type: 'pico', label: 'Raspberry Pi Pico', icon: '🔲', cost: 250 },
  { type: 'moisture_probe', label: 'Moisture Probe', icon: '🌡️', cost: 120 },
  { type: 'relay', label: 'Relay Module', icon: '🔌', cost: 90 },
  { type: 'pump', label: 'Water Pump', icon: '💧', cost: 180 },
  { type: 'resistor', label: 'Resistor', icon: '➰', cost: 15 },
  { type: 'solar', label: 'Solar Regulator', icon: '☀️', cost: 200 },
];

const STARTER = `from machine import Pin, ADC
from time import sleep

adc = ADC(Pin(26))       # moisture probe
relay = Pin(15, Pin.OUT) # pump relay

while True:
    moisture = adc.read_u16() / 65535 * 100
    if moisture < 30:
        relay.value(1)   # pump ON
    else:
        relay.value(0)   # pump OFF
    sleep(1)`;

function Sandbox() {
  const [challenge, setChallenge] = useState<any>(null);
  const [placed, setPlaced] = useState<{ type: string; label: string; icon: string; cost: number }[]>([]);
  const [wires, setWires] = useState<[string, string][]>([]);
  const [wireA, setWireA] = useState('');
  const [code, setCode] = useState(STARTER);
  const [result, setResult] = useState<any>(null);
  const [terminal, setTerminal] = useState('');
  const [hint, setHint] = useState<{ level: number; hint: string } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id') || 'smartfarm';
    fetch(`${API}/simulator/sandbox/${id}`).then(r => r.json()).then(d => setChallenge(d.challenge)).catch(() => {});
  }, []);

  const spent = placed.reduce((s, c) => s + c.cost, 0);
  const budget = challenge?.budgetZMW || 850;

  const addComp = (c: any) => { if (!placed.find(p => p.type === c.type)) setPlaced([...placed, c]); };
  const removeComp = (type: string) => { setPlaced(placed.filter(p => p.type !== type)); setWires(wires.filter(w => w[0] !== type && w[1] !== type)); };
  const clickForWire = (type: string) => {
    if (!wireA) { setWireA(type); return; }
    if (wireA === type) { setWireA(''); return; }
    if (!wires.find(w => (w[0] === wireA && w[1] === type) || (w[0] === type && w[1] === wireA))) setWires([...wires, [wireA, type]]);
    setWireA('');
  };

  const getHint = async () => {
    const level = Math.min(3, (hint?.level || 0) + 1);
    const id = challenge?.id || 'smartfarm';
    const r = await fetch(`${API}/simulator/sandbox/${id}/hint`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level }) });
    setHint(await r.json()); setHintsUsed(h => h + 1);
  };

  const run = async () => {
    setRunning(true); setTerminal('');
    const id = challenge?.id || 'smartfarm';
    // 1) real code execution against unit tests (live terminal output)
    try {
      const ex = await fetch(`${API}/simulator/sandbox/${id}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const ed = await ex.json();
      if (ed.success) setTerminal(`$ micropython main.py\n${ed.terminal}\n\n${ed.passed}/${ed.total} unit tests passed`);
    } catch {}
    // 2) full grade (AST + circuit + unit + safety)
    const circuit = { components: placed.map(p => ({ type: p.type })), wires: wires.map(w => ({ from: w[0], to: w[1] })) };
    const r = await fetch(`${API}/simulator/sandbox/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, circuit, hintsUsed }) });
    setResult(await r.json()); setRunning(false);
  };

  if (!challenge) return <div style={{ fontFamily: font, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading sandbox…</div>;

  return (
    <div style={{ fontFamily: font, minHeight: '100vh', background: '#0e1c30', color: '#e2e8f0', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <a href="/simulator/" style={{ color: GOLD, fontSize: 13, textDecoration: 'none' }}>← Simulator</a>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '8px 0 4px' }}>🛠️ {challenge.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: '80ch' }}>{challenge.brief}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }} className="sandbox-grid">
          {/* Circuit builder */}
          <div style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <b style={{ color: '#fff' }}>Hardware canvas</b>
              <span style={{ fontSize: 12, color: spent > budget ? '#f87171' : '#4ade80' }}>ZMW {spent} / {budget}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {PALETTE.map(c => (
                <button key={c.type} onClick={() => addComp(c)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
                  {c.icon} {c.label} <span style={{ color: '#94a3b8' }}>K{c.cost}</span>
                </button>
              ))}
            </div>
            <div style={{ minHeight: 160, background: 'rgba(0,0,0,.25)', borderRadius: 10, padding: 12, border: '1px dashed rgba(255,255,255,.15)' }}>
              {placed.length === 0 ? <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Click components above to add them, then click two to wire them.</p> :
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {placed.map(c => (
                    <div key={c.type} onClick={() => clickForWire(c.type)}
                      style={{ background: wireA === c.type ? GOLD : 'rgba(212,175,55,.15)', color: wireA === c.type ? BRAND : '#fff', borderRadius: 8, padding: '10px 12px', fontSize: 13, cursor: 'pointer', position: 'relative' }}>
                      {c.icon} {c.label}
                      <span onClick={(e) => { e.stopPropagation(); removeComp(c.type); }} style={{ marginLeft: 8, color: '#f87171', fontWeight: 900 }}>×</span>
                    </div>
                  ))}
                </div>}
            </div>
            {wires.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                <b>Wires:</b> {wires.map((w, i) => <span key={i} style={{ display: 'inline-block', background: 'rgba(255,255,255,.08)', borderRadius: 6, padding: '2px 8px', margin: 2 }}>{w[0]} ↔ {w[1]}</span>)}
              </div>
            )}
            {wireA && <p style={{ fontSize: 12, color: GOLD, marginTop: 6 }}>Wiring from <b>{wireA}</b> — click another component to connect.</p>}
          </div>

          {/* Code editor */}
          <div style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 14, padding: 16 }}>
            <b style={{ color: '#fff' }}>MicroPython</b>
            <textarea value={code} onChange={e => setCode(e.target.value)} spellCheck={false}
              style={{ width: '100%', minHeight: 220, marginTop: 8, background: '#0b1420', color: '#a5f3d0', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: 12, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={run} disabled={running} style={{ flex: 1, background: GOLD, color: BRAND, fontWeight: 800, border: 'none', borderRadius: 8, padding: 11, cursor: 'pointer' }}>{running ? 'Grading…' : '▶ Run & Grade'}</button>
              <button onClick={getHint} disabled={(hint?.level || 0) >= 3} style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 16px', cursor: 'pointer' }}>💡 Hint {hint?.level ? `(${hint.level}/3)` : ''}</button>
            </div>
          </div>
        </div>

        {terminal && <pre style={{ marginTop: 14, background: '#0b1420', color: '#a5f3d0', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 14, fontSize: 12.5, fontFamily: 'ui-monospace,Menlo,monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{terminal}</pre>}

        {hint && <div style={{ marginTop: 14, background: 'rgba(212,175,55,.12)', border: '1px solid rgba(212,175,55,.3)', borderRadius: 12, padding: 14, whiteSpace: 'pre-wrap', fontSize: 13.5 }}><b style={{ color: GOLD }}>Hint {hint.level}/3:</b> {hint.hint}</div>}

        {result && (
          <div style={{ marginTop: 16, background: result.passed ? 'rgba(34,197,94,.12)' : 'rgba(15,23,42,.6)', border: `1px solid ${result.passed ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.12)'}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <b style={{ color: '#fff', fontSize: 18 }}>{result.passed ? '✅ Passed' : 'Score'}: {result.totalScore}%</b>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              {[['Code (AST)', result.astScore], ['Circuit', result.circuitScore], ['Unit tests', result.unitScore]].map(([l, v]: any) => (
                <div key={l} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>{v}%</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{l}</div>
                </div>
              ))}
            </div>
            {(result.feedback || []).map((f: string, i: number) => <p key={i} style={{ fontSize: 13, color: f.includes('⚠') ? '#fca5a5' : f.includes('✅') ? '#4ade80' : '#cbd5e1', margin: '4px 0' }}>{f}</p>)}
          </div>
        )}
      </div>
      <style>{`@media(max-width:800px){.sandbox-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}><Sandbox /></Suspense>;
}
