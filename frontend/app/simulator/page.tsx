'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BRAND = '#16335B', GOLD = '#C99A2E';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';

const KIND_META: Record<string, { icon: string; desc: string }> = {
  NUMERICAL: { icon: '🔢', desc: 'Financial & data interpretation, adaptive difficulty, timed.' },
  VERBAL: { icon: '📖', desc: 'True / False / Cannot Say deduction from passages.' },
  OCEAN: { icon: '🧭', desc: 'Big Five personality (OCEAN) + social-desirability check.' },
  SJT: { icon: '⚖️', desc: 'Situational judgement — most & least effective actions.' },
  ACADEMIC: { icon: '🎓', desc: 'Curriculum-mapped subjects with grade bands.' },
};

export default function SimulatorHub() {
  const router = useRouter();
  const [tracks, setTracks] = useState<any[]>([]);
  const [kinds, setKinds] = useState<any[]>([]);
  const [kind, setKind] = useState('NUMERICAL');
  const [track, setTrack] = useState('GENERAL');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetch(`${API}/simulator/catalog`).then(r => r.json()).then(d => { setTracks(d.tracks || []); setKinds(d.kinds || []); }).catch(() => {});
  }, []);

  // UK/Zambian academic tracks carry curriculum subjects → use the ACADEMIC engine.
  const effectiveKind = (track === 'UK_GCSE' || track === 'UK_ALEVEL' || track === 'ZM_ECZ') ? 'ACADEMIC' : kind;
  const start = () => router.push(`/simulator/test/?kind=${effectiveKind}&track=${track}${joinCode ? `&join=${encodeURIComponent(joinCode.toUpperCase())}` : ''}`);

  return (
    <div className="pc-page max-w-4xl">
      <h1 className="pc-h1 mb-1">Assessment Simulator</h1>
      <p className="pc-sub mb-6">Adaptive psychometric &amp; academic testing — your ability calibrates every question.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kinds.map(k => (
          <button key={k.id} onClick={() => setKind(k.id)}
            className={`pc-card pc-card-hover text-left ${kind === k.id ? 'ring-2' : ''}`}
            style={kind === k.id ? { borderColor: BRAND, boxShadow: `0 0 0 2px ${BRAND}22` } : {}}>
            <div className="text-3xl mb-2" aria-hidden="true">{KIND_META[k.id]?.icon || '🧪'}</div>
            <h3 className="font-bold text-slate-900 text-sm">{k.label}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{KIND_META[k.id]?.desc}</p>
          </button>
        ))}
      </div>

      <div className="pc-card">
        <label className="pc-label">Curriculum / track</label>
        <select className="pc-input" value={track} onChange={e => setTrack(e.target.value)}>
          {tracks.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <p className="text-xs text-slate-500 mt-1 mb-4">Academic tracks map results to grade bands (GCSE 9–1, A-Level A*–E, ECZ Distinction–Developing) and run curriculum subjects. Zambian track uses local context &amp; ZMW.</p>
        {effectiveKind !== kind && <p className="text-xs mb-3" style={{ color: GOLD }}>This curriculum track runs the <b>Academic</b> subject engine.</p>}
        <label className="pc-label">Class join code <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — from your teacher)</span></label>
        <input className="pc-input" style={{ textTransform: 'uppercase', maxWidth: 200 }} placeholder="e.g. A1B2C3" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
        <button className="pc-btn pc-btn-primary w-full" style={{ marginTop: 12 }} onClick={start}>Start adaptive assessment →</button>
      </div>

      <div className="mt-6 pc-card" style={{ background: 'linear-gradient(135deg,#0e1c30,#16335B)', color: '#fff', borderColor: 'transparent' }}>
        <div className="flex items-center gap-4">
          <div className="text-4xl" aria-hidden="true">🛠️</div>
          <div className="flex-1">
            <h3 className="font-black text-lg">Engineering Sandbox</h3>
            <p className="text-sm" style={{ color: '#cbd5e1' }}>Zambian Smart Farm challenge — wire virtual hardware &amp; code MicroPython. Auto-graded with tiered hints.</p>
          </div>
          <a href="/simulator/sandbox/?id=smartfarm" className="pc-btn pc-btn-gold shrink-0">Open →</a>
        </div>
      </div>
    </div>
  );
}
