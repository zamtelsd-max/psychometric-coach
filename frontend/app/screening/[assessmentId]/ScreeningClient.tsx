'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';

export default function ScreeningClient() {
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [phase, setPhase] = useState<'load' | 'consent' | 'active' | 'done' | 'error'>('load');
  const [errMsg, setErrMsg] = useState('');
  const [qIdx, setQIdx] = useState(0);
  const [mode, setMode] = useState<'reading' | 'speaking'>('reading');
  const [timeLeft, setTimeLeft] = useState(30);
  const [answer, setAnswer] = useState('');
  const [violationModal, setViolationModal] = useState<string | null>(null);
  const [proctorStatus, setProctorStatus] = useState('initialising camera…');
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);
  const gazeBadRef = useRef(0); const absentRef = useRef(0);

  // read id + token from URL
  useEffect(() => {
    const parts = window.location.pathname.split('/');
    setId(parts[parts.indexOf('screening') + 1] || '');
    setToken(new URLSearchParams(window.location.search).get('t') || '');
  }, []);

  const logViolation = useCallback(async (type: string, detail?: string) => {
    setViolationModal(type);
    try { await fetch(`${API}/screening/${id}/log-violation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token, type, detail }) }); } catch {}
  }, [id, token]);

  // fetch assessment
  useEffect(() => {
    if (!id || !token) return;
    fetch(`${API}/screening/candidate/${id}?t=${encodeURIComponent(token)}`).then(r => r.json()).then(d => {
      if (d.error) { setErrMsg(d.error); setPhase('error'); return; }
      setAssessment(d.assessment); setTimeLeft(d.assessment.readingSec); setPhase('consent');
    }).catch(() => { setErrMsg('Could not load assessment.'); setPhase('error'); });
  }, [id, token]);

  // SR-B2B-04: block clipboard/dev-tool keys
  useEffect(() => {
    if (phase !== 'active') return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(k)) { e.preventDefault(); logViolation('CLIPBOARD', k); }
      if (e.key === 'F12' || ((e.metaKey || e.ctrlKey) && e.altKey && k === 'i')) { e.preventDefault(); logViolation('DEVTOOLS'); }
    };
    const onCopy = (e: Event) => { e.preventDefault(); logViolation('CLIPBOARD', 'copy'); };
    const onVis = () => { if (document.hidden) logViolation('VISIBILITY', 'tab hidden'); };
    const onFsChange = () => { if (!document.fullscreenElement && phase === 'active') logViolation('FULLSCREEN_EXIT'); };
    const onMouseOut = (e: MouseEvent) => { if (!e.relatedTarget && (e.clientY <= 0 || e.clientX <= 0)) logViolation('CURSOR_ESCAPE'); };
    document.addEventListener('keydown', onKey); document.addEventListener('copy', onCopy); document.addEventListener('paste', onCopy);
    document.addEventListener('visibilitychange', onVis); document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('mouseout', onMouseOut as any);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('copy', onCopy); document.removeEventListener('paste', onCopy); document.removeEventListener('visibilitychange', onVis); document.removeEventListener('fullscreenchange', onFsChange); document.removeEventListener('mouseout', onMouseOut as any); };
  }, [phase, logViolation]);

  // Edge ML proctoring (SR-B2B-05..09): MediaPipe Face Mesh via CDN, on-device only
  useEffect(() => {
    if (phase !== 'active') return;
    let stop = false; let detector: any; let raf = 0;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        // load tfjs + face-landmarks-detection from CDN (lazy, non-blocking)
        const tf: any = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/+esm' as any);
        await tf.setBackend('webgl'); await tf.ready();
        const fld: any = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.5/+esm' as any);
        detector = await fld.createDetector(fld.SupportedModels.MediaPipeFaceMesh, { runtime: 'tfjs', refineLandmarks: true, maxFaces: 2 });
        setProctorStatus('proctoring active');
        const loop = async () => {
          if (stop || !videoRef.current) return;
          try {
            const faces = await detector.estimateFaces(videoRef.current);
            const now = Date.now();
            if (faces.length > 1) logViolation('MULTI_FACE', `${faces.length} faces`); // SR-B2B-07
            if (faces.length === 0) { absentRef.current = absentRef.current || now; if (now - absentRef.current > 4000) { logViolation('FACE_ABSENT'); absentRef.current = now; } } // SR-B2B-08
            else { absentRef.current = 0; }
            if (faces.length === 1) { // SR-B2B-09 gaze via iris vs nose
              const kp = faces[0].keypoints;
              const nose = kp.find((p: any) => p.name === 'noseTip') || kp[1];
              const li = kp.find((p: any) => p.name === 'leftEyeIris') || kp[468];
              const ri = kp.find((p: any) => p.name === 'rightEyeIris') || kp[473];
              if (nose && li && ri) {
                const off = Math.abs(((li.x + ri.x) / 2) - nose.x);
                if (off > 28) { gazeBadRef.current = gazeBadRef.current || now; if (now - gazeBadRef.current > 4000) { logViolation('GAZE_DIVERSION', off.toFixed(0)); gazeBadRef.current = now; } }
                else gazeBadRef.current = 0;
              }
            }
          } catch {}
          raf = requestAnimationFrame(() => setTimeout(loop, 700));
        };
        loop();
      } catch (e) { setProctorStatus('camera unavailable — assessment continues'); } // SR-4.3 graceful fallback
    })();
    return () => { stop = true; cancelAnimationFrame(raf); const s: any = videoRef.current?.srcObject; s?.getTracks?.().forEach((t: any) => t.stop()); };
  }, [phase, logViolation]);

  // timers (SR-B2B-10/11/12)
  useEffect(() => {
    if (phase !== 'active') return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { advance(); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, mode, qIdx]);

  const advance = async () => {
    clearInterval(timerRef.current);
    if (mode === 'reading') { setMode('speaking'); setTimeLeft(assessment.speakingSec); return; }
    // speaking done → commit answer, next question
    const q = assessment.questions[qIdx];
    try { await fetch(`${API}/screening/candidate/${id}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token, questionId: q.id, answer }) }); } catch {}
    setAnswer('');
    if (qIdx + 1 >= assessment.questions.length) {
      try { await fetch(`${API}/screening/candidate/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token }) }); } catch {}
      document.exitFullscreen?.().catch(() => {}); setPhase('done');
    } else { setQIdx(qIdx + 1); setMode('reading'); setTimeLeft(assessment.readingSec); }
  };

  const beginAssessment = async () => {
    try { await (document.documentElement as any).requestFullscreen?.(); } catch {} // SR-B2B-01
    try { await fetch(`${API}/screening/candidate/${id}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token }) }); } catch {}
    setMode('reading'); setTimeLeft(assessment.readingSec); setPhase('active');
  };

  const resumeFromViolation = async () => { try { await (document.documentElement as any).requestFullscreen?.(); } catch {} setViolationModal(null); };

  const wrap: React.CSSProperties = { minHeight: '100vh', background: BRAND, color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter,system-ui,sans-serif' };

  if (phase === 'load') return <div style={wrap}>Loading secure assessment…</div>;
  if (phase === 'error') return <div style={wrap}><div style={{ textAlign: 'center' }}><h2>Access error</h2><p style={{ color: '#94a3b8' }}>{errMsg}</p></div></div>;

  if (phase === 'consent') return (
    <div style={wrap}><div style={{ maxWidth: 520, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: 30, border: '1px solid rgba(212,175,55,.3)' }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>SECURE ASSESSMENT</span>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '14px 0 8px' }}>{assessment.role}</h1>
      <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>This is a proctored assessment. By starting you consent to:</p>
      <ul style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.9, margin: '10px 0 16px', paddingLeft: 20 }}>
        <li>Fullscreen lock &amp; on-device camera proctoring (video stays on your device)</li>
        <li>{assessment.questions.length} questions · {assessment.readingSec}s reading + {assessment.speakingSec}s answer each</li>
        <li>Copy/paste &amp; tab-switching are monitored (won&apos;t end your test, but are logged)</li>
      </ul>
      <button onClick={beginAssessment} style={{ width: '100%', background: GOLD, color: BRAND, fontWeight: 900, padding: 15, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15 }}>I consent — start in fullscreen →</button>
    </div></div>
  );

  if (phase === 'done') return (
    <div style={wrap}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 54 }}>✓</div><h2 style={{ fontWeight: 900 }}>Assessment submitted</h2><p style={{ color: '#94a3b8' }}>Thank you. Your responses have been recorded and sent to the recruiter.</p></div></div>
  );

  // active
  const q = assessment.questions[qIdx];
  return (
    <div style={{ minHeight: '100vh', background: BRAND, color: '#f1f5f9', fontFamily: 'Inter,system-ui,sans-serif', userSelect: 'none' }}>
      <video ref={videoRef} muted playsInline style={{ position: 'fixed', bottom: 16, right: 16, width: 128, height: 96, borderRadius: 10, border: `2px solid ${GOLD}`, objectFit: 'cover', zIndex: 5 }} />
      <div style={{ position: 'fixed', bottom: 118, right: 16, fontSize: 10, color: '#94a3b8', zIndex: 5 }}>● {proctorStatus}</div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Question {qIdx + 1} / {assessment.questions.length}</span>
          <div style={{ background: mode === 'reading' ? 'rgba(212,175,55,.2)' : 'rgba(220,38,38,.2)', border: `1px solid ${mode === 'reading' ? GOLD : '#ef4444'}`, borderRadius: 20, padding: '6px 16px', fontWeight: 800, fontSize: 15 }}>
            {mode === 'reading' ? '📖 Read' : '🎤 Answer'} · {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>
        <div style={{ background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: 26, border: '1px solid rgba(255,255,255,.08)', marginBottom: 16 }}>
          <p style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5 }}>{q.questionText}</p>
        </div>
        {mode === 'speaking' && (
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer…" autoFocus
            style={{ width: '100%', minHeight: 160, background: 'rgba(15,23,42,.6)', color: '#f1f5f9', border: '1px solid rgba(212,175,55,.3)', borderRadius: 12, padding: 14, fontSize: 15 }} />
        )}
        <button onClick={advance} style={{ marginTop: 14, background: GOLD, color: BRAND, fontWeight: 800, padding: '12px 22px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
          {mode === 'reading' ? 'Start answering →' : qIdx + 1 >= assessment.questions.length ? 'Submit assessment' : 'Next question →'}
        </button>
      </div>
      {violationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ maxWidth: 420, textAlign: 'center', padding: 30 }}>
            <div style={{ fontSize: 44 }}>⚠️</div>
            <h2 style={{ fontWeight: 900, margin: '10px 0' }}>Assessment paused</h2>
            <p style={{ color: '#cbd5e1', fontSize: 14 }}>A monitoring event was detected ({violationModal.replace(/_/g, ' ').toLowerCase()}). This has been logged. Return to fullscreen to continue — your progress is safe.</p>
            <button onClick={resumeFromViolation} style={{ marginTop: 16, background: GOLD, color: BRAND, fontWeight: 800, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Resume in fullscreen</button>
          </div>
        </div>
      )}
    </div>
  );
}
