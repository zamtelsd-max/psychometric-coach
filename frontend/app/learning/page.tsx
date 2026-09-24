'use client';
import { useEffect, useState } from 'react';

const BRAND = '#16335B', GOLD = '#E3B84B'; // brighter gold reads AA on dark bg
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const hdr = (): Record<string, string> => { const t = (typeof window !== 'undefined' && localStorage.getItem('psy_token')) || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };

export default function LearningPage() {
  const [items, setItems] = useState<any[]>([]);
  const [gaps, setGaps] = useState<string[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [content, setContent] = useState('');
  const [toast, setToast] = useState('');
  const [unlock, setUnlock] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<any>(null);          // { questions, best, xpEarned }
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizMode, setQuizMode] = useState(false);

  const load = () => fetch(`${API}/learning/feed`, { headers: hdr() }).then(r => r.json()).then(d => { setItems(d.items || []); setGaps(d.gaps || []); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const openModule = async (m: any) => {
    setOpen(m); setContent(''); setUnlock(null); setQuiz(null); setAnswers({}); setQuizResult(null); setQuizMode(false);
    const d = await fetch(`${API}/learning/module/${m.id}`, { headers: hdr() }).then(r => r.json()).catch(() => null);
    if (d?.module) { setContent(d.module.contentHtml); setOpen({ ...m, durationLabel: d.module.durationLabel }); }
    const q = await fetch(`${API}/learning/module/${m.id}/quiz`, { headers: hdr() }).then(r => r.json()).catch(() => null);
    if (q?.hasQuiz) setQuiz(q);
  };
  const submitQuiz = async () => {
    if (!open) return;
    const d = await fetch(`${API}/learning/module/${open.id}/quiz-submit`, { method: 'POST', headers: hdr(), body: JSON.stringify({ answers }) }).then(r => r.json()).catch(() => null);
    if (d?.ok) { setQuizResult(d); if (d.bonusXp > 0) { setToast(`🎉 +${d.bonusXp} bonus XP from the quiz!`); load(); } }
  };
  const complete = async () => {
    if (!open) return;
    const d = await fetch(`${API}/learning/module/${open.id}/complete`, { method: 'POST', headers: hdr() }).then(r => r.json()).catch(() => null);
    if (d?.ok) {
      setToast(`✓ +${d.xpAwarded} XP earned`);
      if (d.examUnlocked) setUnlock(d.examCourseId);
      load();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0B1626 0%,#12233f 100%)', padding: '26px 18px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>⚡ AI Growth Center</span>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '12px 0 4px' }}>Your Learning Stream</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 18px' }}>
          {gaps.length ? <>Detected gaps: <b style={{ color: GOLD }}>{gaps.slice(0, 3).join(', ')}</b> — short reads first to close them fast.</> : 'No gaps detected yet — foundation modules below. Short reads first.'}
        </p>
        {toast && <p style={{ color: '#4ade80', fontWeight: 800, margin: '0 0 12px' }}>{toast}</p>}
        {items.map(m => (
          <div key={m.id} onClick={() => openModule(m)}
            style={{ background: 'rgba(15,23,42,.55)', border: `1px solid ${m.completed ? 'rgba(74,222,128,.35)' : 'rgba(212,175,55,.22)'}`, borderRadius: 16, padding: 18, marginBottom: 12, cursor: 'pointer', transition: 'transform .1s', }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#fff', margin: 0 }}>{m.completed ? '✅ ' : ''}{m.title}</h3>
              <span style={{ background: m.estMinutes < 10 ? 'rgba(74,222,128,.15)' : 'rgba(212,175,55,.15)', color: m.estMinutes < 10 ? '#4ade80' : GOLD, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12, whiteSpace: 'nowrap' }}>{m.durationLabel}</span>
            </div>
            <p style={{ color: GOLD, fontSize: 12.5, fontWeight: 700, margin: '8px 0 4px' }}>💡 {m.rationale}</p>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{m.excerpt}</p>
          </div>
        ))}
        {open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,20,.9)', zIndex: 60, overflowY: 'auto', padding: '30px 16px' }} onClick={() => setOpen(null)}>
            <div style={{ maxWidth: 680, margin: '0 auto', background: '#0e1c30', border: `1px solid ${GOLD}55`, borderRadius: 18, padding: 26 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: '#fff', fontSize: 21, fontWeight: 900, margin: 0 }}>{open.title}</h2>
                <span style={{ background: 'rgba(212,175,55,.15)', color: GOLD, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12 }}>{open.durationLabel}</span>
              </div>
              <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, margin: '8px 0 14px' }}>💡 {open.rationale}</p>
              <div className="growth-content" style={{ color: '#e2e8f0', fontSize: 14.5, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content }} />
              <style>{`
                .growth-content h3 { color:#fff; font-size:16px; font-weight:800; margin:20px 0 8px; border-left:3px solid ${GOLD}; padding-left:10px; }
                .growth-content p { margin:10px 0; }
                .growth-content p.lead { font-size:15.5px; color:#f1f5f9; font-weight:500; background:rgba(212,175,55,.08); border-radius:10px; padding:12px 14px; }
                .growth-content ul, .growth-content ol { margin:10px 0 10px 4px; padding-left:20px; }
                .growth-content li { margin:5px 0; }
                .growth-content b { color:#fff; }
                .growth-content .worked { background:rgba(30,58,95,.55); border:1px solid rgba(148,163,184,.25); border-radius:12px; padding:14px 16px; margin:14px 0; }
                .growth-content .worked-h { font-weight:800; color:#93c5fd; margin-bottom:6px; }
                .growth-content .callout { border-radius:12px; padding:12px 14px; margin:14px 0; font-size:13.8px; }
                .growth-content .callout.tip { background:rgba(59,130,246,.12); border:1px solid rgba(96,165,250,.3); }
                .growth-content .callout.warn { background:rgba(239,68,68,.10); border:1px solid rgba(248,113,113,.3); }
                .growth-content .callout.key { background:rgba(34,197,94,.10); border:1px solid rgba(74,222,128,.35); }
                .growth-content .callout.key ul { margin-top:6px; }
                .growth-content details.quiz { background:rgba(212,175,55,.10); border:1px solid rgba(212,175,55,.3); border-radius:10px; padding:10px 14px; margin:14px 0; }
                .growth-content details.quiz summary { cursor:pointer; font-weight:700; color:${GOLD}; }
                .growth-content details.quiz > div { margin-top:8px; color:#cbd5e1; }
              `}</style>
              {quiz && (
                <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 16 }}>
                  {!quizMode && !quizResult && (
                    <button onClick={() => setQuizMode(true)} style={{ width: '100%', background: 'rgba(212,175,55,.15)', color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                      🧠 Test yourself ({quiz.questions.length} questions){quiz.best ? ` · best ${quiz.best}%` : ''}{quiz.xpEarned ? ' · XP earned ✓' : ' · +20 XP if you pass'}
                    </button>
                  )}
                  {(quizMode || quizResult) && (
                    <div>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 12px' }}>🧠 Test yourself</h3>
                      {quiz.questions.map((q: any) => {
                        const rev = quizResult?.review?.find((r: any) => r.i === q.i);
                        return (
                          <div key={q.i} style={{ marginBottom: 16 }}>
                            <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14.5, margin: '0 0 8px' }}>{q.i + 1}. {q.q}</p>
                            {q.options.map((o: any) => {
                              const chosen = answers[q.i] === o.key;
                              const isCorrect = rev && o.key === rev.correctKey;
                              const isWrongChosen = rev && chosen && !rev.correct;
                              return (
                                <div key={o.key} onClick={() => { if (!quizResult) setAnswers({ ...answers, [q.i]: o.key }); }}
                                  style={{ display: 'flex', gap: 8, padding: '9px 12px', marginBottom: 6, borderRadius: 8, cursor: quizResult ? 'default' : 'pointer',
                                    border: `1.5px solid ${isCorrect ? '#4ade80' : isWrongChosen ? '#f87171' : chosen ? GOLD : 'rgba(255,255,255,.15)'}`,
                                    background: isCorrect ? 'rgba(74,222,128,.12)' : isWrongChosen ? 'rgba(248,113,113,.12)' : chosen ? 'rgba(212,175,55,.12)' : 'rgba(255,255,255,.03)' }}>
                                  <b style={{ color: GOLD }}>{o.key}.</b><span style={{ color: '#e2e8f0', flex: 1 }}>{o.label}</span>
                                  {isCorrect && <span style={{ color: '#4ade80', fontWeight: 800 }}>✓</span>}
                                  {isWrongChosen && <span style={{ color: '#f87171', fontWeight: 800 }}>✗</span>}
                                </div>
                              );
                            })}
                            {rev && <p style={{ color: '#94a3b8', fontSize: 12.5, margin: '4px 0 0' }}>{rev.explain}</p>}
                          </div>
                        );
                      })}
                      {!quizResult ? (
                        <button onClick={submitQuiz} disabled={Object.keys(answers).length < quiz.questions.length}
                          style={{ width: '100%', background: Object.keys(answers).length < quiz.questions.length ? '#475569' : GOLD, color: BRAND, border: 'none', borderRadius: 10, padding: 12, fontWeight: 800, fontSize: 15, cursor: Object.keys(answers).length < quiz.questions.length ? 'not-allowed' : 'pointer' }}>
                          Submit answers
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', background: quizResult.passed ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.10)', borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 30, fontWeight: 900, color: quizResult.passed ? '#4ade80' : '#f87171' }}>{quizResult.score}%</div>
                          <p style={{ color: '#e2e8f0', fontSize: 13.5, margin: '4px 0' }}>{quizResult.correct}/{quizResult.total} correct{quizResult.passed ? ' — passed! 🎉' : ' — 80% needed to pass'}{quizResult.bonusXp ? ` · +${quizResult.bonusXp} XP` : ''}</p>
                          {!quizResult.passed && <button onClick={() => { setAnswers({}); setQuizResult(null); }} style={{ marginTop: 8, background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Try again</button>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {unlock && (
                <div style={{ marginTop: 16, background: 'rgba(74,222,128,.12)', border: '1px solid rgba(74,222,128,.4)', borderRadius: 12, padding: 14 }}>
                  <b style={{ color: '#4ade80' }}>🎓 Certification exam unlocked: {unlock}</b>
                  <p style={{ color: '#cbd5e1', fontSize: 13, margin: '4px 0 0' }}>Score 80–99% for Gold, 100% for Platinum. Head to My Assessments to attempt it.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                {!open.completed && <button onClick={complete} style={{ background: GOLD, color: BRAND, fontWeight: 800, padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14.5 }}>Mark complete (+XP)</button>}
                <button onClick={() => setOpen(null)} style={{ background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14.5 }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
