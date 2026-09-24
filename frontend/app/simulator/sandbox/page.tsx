'use client';
import { useEffect, useState, useRef, Suspense } from 'react';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const font = "Inter, Roboto, system-ui, sans-serif";

// Full component palette (costs mirror backend)
const PALETTE: Record<string, { label: string; icon: string; cost: number }> = {
  pico: { label: 'Pi Pico', icon: '🔲', cost: 250 },
  moisture_probe: { label: 'Moisture Probe', icon: '🌱', cost: 120 },
  temp_sensor: { label: 'Temp Sensor', icon: '🌡️', cost: 130 },
  relay: { label: 'Relay', icon: '🔌', cost: 90 },
  pump: { label: 'Water Pump', icon: '💧', cost: 180 },
  resistor: { label: 'Resistor', icon: '➰', cost: 15 },
  solar: { label: 'Solar Panel', icon: '☀️', cost: 200 },
  battery: { label: 'Battery', icon: '🔋', cost: 160 },
  transistor: { label: 'Transistor', icon: '📐', cost: 25 },
  fan: { label: 'Fan', icon: '🌀', cost: 150 },
  red_led: { label: 'Red LED', icon: '🔴', cost: 20 },
  green_led: { label: 'Green LED', icon: '🟢', cost: 20 },
  button: { label: 'Button', icon: '🔘', cost: 30 },
};

const STARTERS: Record<string, string> = {
  smartfarm: `from machine import Pin, ADC\nfrom time import sleep\nadc = ADC(Pin(26))\nrelay = Pin(15, Pin.OUT)\nwhile True:\n    moisture = adc.read_u16()/65535*100\n    if moisture < 30:\n        relay.value(1)   # pump ON\n    else:\n        relay.value(0)\n    sleep(1)`,
  trafficlight: `from machine import Pin\nbtn = Pin(14, Pin.IN)\nred_led = Pin(15, Pin.OUT)\ngreen_led = Pin(16, Pin.OUT)\nwhile True:\n    button = btn.value()\n    if button > 0:\n        red_led.value(1)\n        green_led.value(0)\n    else:\n        red_led.value(0)\n        green_led.value(1)`,
  tempfan: `from machine import Pin, ADC\nsensor = ADC(Pin(26))\ntransistor = Pin(15, Pin.OUT)\nwhile True:\n    temperature = sensor.read_u16()/65535*50\n    if temperature > 28:\n        transistor.value(1)  # fan ON\n    else:\n        transistor.value(0)`,
  solarcharge: `from machine import Pin, ADC\nadc = ADC(Pin(26))\nrelay = Pin(15, Pin.OUT)\nwhile True:\n    charge = adc.read_u16()/65535*100\n    if charge < 95:\n        relay.value(1)   # charging\n    else:\n        relay.value(0)   # cut off`,
};

function Sandbox() {
  const [list, setList] = useState<any[]>([]);
  const [challenge, setChallenge] = useState<any>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [wires, setWires] = useState<[string, string][]>([]);
  const [wireA, setWireA] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [terminal, setTerminal] = useState('');
  const [hint, setHint] = useState<{ level: number; hint: string } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [inputVal, setInputVal] = useState(50);   // live sim slider
  const [pyReady, setPyReady] = useState(false);
  const pyodide = useRef<any>(null);

  const loadChallenge = (id: string) => {
    fetch(`${API}/simulator/sandbox/${id}`).then(r => r.json()).then(d => {
      setChallenge(d.challenge); setCode(STARTERS[id] || ''); setPlaced([]); setWires([]); setResult(null); setTerminal(''); setHint(null); setHintsUsed(0);
    }).catch(() => {});
  };

  useEffect(() => {
    fetch(`${API}/simulator/sandbox`).then(r => r.json()).then(d => setList(d.challenges || [])).catch(() => {});
    const id = new URLSearchParams(window.location.search).get('id') || 'smartfarm';
    loadChallenge(id);
    // load Pyodide for real Python execution
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
    sc.onload = async () => { try { pyodide.current = await (window as any).loadPyodide(); setPyReady(true); } catch { setPyReady(false); } };
    document.body.appendChild(sc);
  }, []);

  const spent = placed.reduce((s, t) => s + (PALETTE[t]?.cost || 0), 0);
  const budget = challenge?.budgetZMW || 850;

  const addComp = (t: string) => { if (!placed.includes(t)) setPlaced([...placed, t]); };
  const removeComp = (t: string) => { setPlaced(placed.filter(x => x !== t)); setWires(wires.filter(w => w[0] !== t && w[1] !== t)); };
  const clickWire = (t: string) => {
    if (!wireA) { setWireA(t); return; }
    if (wireA === t) { setWireA(''); return; }
    if (!wires.find(w => (w[0] === wireA && w[1] === t) || (w[0] === t && w[1] === wireA))) setWires([...wires, [wireA, t]]);
    setWireA('');
  };

  const getHint = async () => {
    const level = Math.min(3, (hint?.level || 0) + 1);
    const r = await fetch(`${API}/simulator/sandbox/${challenge.id}/hint`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level }) });
    setHint(await r.json()); setHintsUsed(h => h + 1);
  };

  // Real Python run via Pyodide (student's actual code, in-browser, no server)
  const runPython = async (): Promise<string> => {
    if (!pyReady || !pyodide.current) return '';
    // provide a tiny machine shim + capture prints; run one iteration with inputVal
    const shim = `
import sys, io
_out = io.StringIO()
_stdout = sys.stdout; sys.stdout = _out
class _P:
    def __init__(self,*a,**k): self._v=0
    OUT=1; IN=0
    def value(self,*a):
        if a: self._v=a[0]
        return self._v
    def on(self): self._v=1
    def off(self): self._v=0
class _ADC:
    def __init__(self,*a,**k): pass
    def read_u16(self): return int(${inputVal}/100*65535)
class _machine:
    Pin=_P; ADC=_ADC
sys.modules['machine']=_machine
import time
time.sleep=lambda *a: None
`;
    // strip the infinite while loop → run body once for the live demo
    let body = code.replace(/while\s+True\s*:/, 'if True:');
    body = body.replace(/from machine import.*/g, '').replace(/from time import.*/g, '').replace(/import time/g, '');
    try {
      await pyodide.current.runPythonAsync(shim + '\n' + body + '\nprint(_out.getvalue(), end="")\nsys.stdout=_stdout');
      const out = pyodide.current.runPython('_out.getvalue()');
      return String(out || '');
    } catch (e: any) { return 'PythonError: ' + String(e.message || e).split('\n').slice(-2).join(' '); }
  };

  const run = async () => {
    setRunning(true); setTerminal('');
    let py = '';
    if (pyReady) { const o = await runPython(); py = o ? `$ python (Pyodide) — real execution\n${o}\n` : ''; }
    // unit-test execution on backend
    const ex = await fetch(`${API}/simulator/sandbox/${challenge.id}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).then(r => r.json()).catch(() => null);
    let term = py;
    if (ex?.success) term += `\n$ unit tests\n${ex.terminal}\n\n${ex.passed}/${ex.total} unit tests passed`;
    setTerminal(term.trim());
    const circuit = { components: placed.map(t => ({ type: t })), wires: wires.map(w => ({ from: w[0], to: w[1] })) };
    const r = await fetch(`${API}/simulator/sandbox/${challenge.id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, circuit, hintsUsed }) });
    setResult(await r.json()); setRunning(false);
  };

  // Live actuator state from current code + slider (client-side mirror of backend logic)
  const liveOn = (() => {
    if (!challenge) return false;
    const cmp = new RegExp(`${challenge.inputVar}\\s*(<|>|<=|>=)\\s*(\\d+(?:\\.\\d+)?)`);
    const m = code.match(cmp); if (!m) return false;
    const op = m[1], thr = parseFloat(m[2]);
    const drives = new RegExp(`(${challenge.actuator}\\.value\\(1\\)|${challenge.actuator}\\.on\\(\\)|value\\(1\\))`).test(code);
    if (!drives) return false;
    return op === '<' ? inputVal < thr : op === '>' ? inputVal > thr : op === '<=' ? inputVal <= thr : inputVal >= thr;
  })();

  if (!challenge) return <div style={{ fontFamily: font, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading sandbox…</div>;

  // Circuit SVG positions
  const nodePos = (i: number, n: number) => { const cols = Math.min(n, 4); const col = i % cols, row = Math.floor(i / cols); return { x: 70 + col * 150, y: 45 + row * 90 }; };
  const idxOf = (t: string) => placed.indexOf(t);

  return (
    <div style={{ fontFamily: font, minHeight: '100vh', background: '#0e1c30', color: '#e2e8f0', padding: '20px 16px' }}>
      <div style={{ maxWidth: 1150, margin: '0 auto' }}>
        <a href="/simulator/" style={{ color: GOLD, fontSize: 13, textDecoration: 'none' }}>← Simulator</a>

        {/* Challenge picker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 6px' }}>
          {list.map(c => (
            <button key={c.id} onClick={() => loadChallenge(c.id)}
              style={{ background: challenge.id === c.id ? GOLD : 'rgba(255,255,255,.06)', color: challenge.id === c.id ? BRAND : '#e2e8f0', border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              {c.title.split('—')[0].trim()} <span style={{ opacity: .7 }}>· {c.difficulty}</span>
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: 23, fontWeight: 900, color: '#fff', margin: '8px 0 4px' }}>🛠️ {challenge.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: '80ch' }}>{challenge.brief}</p>
        {pyReady ? <span style={{ fontSize: 11, color: '#4ade80' }}>● Real Python engine ready (Pyodide)</span> : <span style={{ fontSize: 11, color: '#94a3b8' }}>○ Loading Python engine…</span>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }} className="sbx">
          {/* Circuit builder + SVG schematic */}
          <div style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <b style={{ color: '#fff' }}>Circuit schematic</b>
              <span style={{ fontSize: 12, color: spent > budget ? '#f87171' : '#4ade80' }}>ZMW {spent} / {budget}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {challenge.requiredComponents.concat(Object.keys(PALETTE).filter((k: string) => !challenge.requiredComponents.includes(k))).slice(0, 10).map((t: string) => (
                <button key={t} onClick={() => addComp(t)} disabled={placed.includes(t)}
                  style={{ background: placed.includes(t) ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 8, padding: '5px 9px', fontSize: 11.5, cursor: placed.includes(t) ? 'default' : 'pointer' }}>
                  {PALETTE[t]?.icon} {PALETTE[t]?.label} <span style={{ color: '#94a3b8' }}>K{PALETTE[t]?.cost}</span>
                </button>
              ))}
            </div>
            {/* SVG schematic */}
            <svg viewBox={`0 0 620 ${Math.max(180, (Math.ceil(placed.length / 4)) * 90 + 40)}`} style={{ width: '100%', background: 'rgba(0,0,0,.25)', borderRadius: 10, border: '1px dashed rgba(255,255,255,.15)' }}>
              {wires.map(([a, b], i) => {
                const pa = nodePos(idxOf(a), placed.length), pb = nodePos(idxOf(b), placed.length);
                return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={GOLD} strokeWidth={2} opacity={0.7} />;
              })}
              {placed.map((t, i) => {
                const p = nodePos(i, placed.length);
                const isActuator = t === challenge.actuator;
                const lit = isActuator && liveOn;
                return (
                  <g key={t} style={{ cursor: 'pointer' }} onClick={() => clickWire(t)}>
                    <circle cx={p.x} cy={p.y} r={26} fill={lit ? '#22c55e' : wireA === t ? GOLD : 'rgba(212,175,55,.18)'} stroke={wireA === t ? '#fff' : 'rgba(212,175,55,.5)'} strokeWidth={2} />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={18}>{PALETTE[t]?.icon}</text>
                    <text x={p.x} y={p.y + 42} textAnchor="middle" fontSize={10} fill="#cbd5e1">{PALETTE[t]?.label}</text>
                    <text x={p.x + 20} y={p.y - 18} textAnchor="middle" fontSize={13} fill="#f87171" onClick={(e) => { e.stopPropagation(); removeComp(t); }}>×</text>
                  </g>
                );
              })}
              {placed.length === 0 && <text x={310} y={90} textAnchor="middle" fill="#64748b" fontSize={13}>Add components above, then click two to wire them.</text>}
            </svg>
            {wireA && <p style={{ fontSize: 12, color: GOLD, marginTop: 6 }}>Wiring from <b>{PALETTE[wireA]?.label}</b> — click another to connect.</p>}

            {/* Live simulation slider */}
            <div style={{ marginTop: 12, background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span>{challenge.inputLabel}: <b style={{ color: GOLD }}>{inputVal}{challenge.inputUnit}</b></span>
                <span>{challenge.actuatorLabel}: <b style={{ color: liveOn ? '#4ade80' : '#f87171' }}>{liveOn ? 'ON' : 'OFF'}</b></span>
              </div>
              <input type="range" min={0} max={100} value={inputVal} onChange={e => setInputVal(Number(e.target.value))} style={{ width: '100%', accentColor: GOLD }} />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Drag to test your logic live — the actuator lights up on the schematic.</p>
            </div>
          </div>

          {/* Code editor */}
          <div style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 14, padding: 16 }}>
            <b style={{ color: '#fff' }}>MicroPython</b>
            <textarea value={code} onChange={e => setCode(e.target.value)} spellCheck={false}
              style={{ width: '100%', minHeight: 240, marginTop: 8, background: '#0b1420', color: '#a5f3d0', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: 12, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={run} disabled={running} style={{ flex: 1, background: GOLD, color: BRAND, fontWeight: 800, border: 'none', borderRadius: 8, padding: 11, cursor: 'pointer' }}>{running ? 'Running…' : '▶ Run & Grade'}</button>
              <button onClick={getHint} disabled={(hint?.level || 0) >= 3} style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 16px', cursor: 'pointer' }}>💡 Hint {hint?.level ? `(${hint.level}/3)` : ''}</button>
            </div>
          </div>
        </div>

        {terminal && <pre style={{ marginTop: 14, background: '#0b1420', color: '#a5f3d0', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 14, fontSize: 12.5, fontFamily: 'ui-monospace,Menlo,monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{terminal}</pre>}
        {hint && <div style={{ marginTop: 14, background: 'rgba(212,175,55,.12)', border: '1px solid rgba(212,175,55,.3)', borderRadius: 12, padding: 14, whiteSpace: 'pre-wrap', fontSize: 13.5 }}><b style={{ color: GOLD }}>Hint {hint.level}/3:</b> {hint.hint}</div>}

        {result && (
          <div style={{ marginTop: 16, background: result.passed ? 'rgba(34,197,94,.12)' : 'rgba(15,23,42,.6)', border: `1px solid ${result.passed ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.12)'}`, borderRadius: 14, padding: 18 }}>
            <b style={{ color: '#fff', fontSize: 18 }}>{result.passed ? '✅ Passed' : 'Score'}: {result.totalScore}%</b>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
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
      <style>{`@media(max-width:820px){.sbx{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}><Sandbox /></Suspense>;
}
