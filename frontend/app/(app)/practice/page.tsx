'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { questionsApi, attemptsApi, bookmarksApi, profileApi } from '../../../lib/api';
import DiagramRenderer from '../../../components/DiagramRenderer';

// ── Audio Player for Listening questions ───────────────────────────────────
function AudioPlayer({ url, label }: { url: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const MAX_PLAYS = 2; // IELTS/TOEFL: audio played max twice

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      if (playCount >= MAX_PLAYS) return;
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  return (
    <div className="mb-4 bg-gradient-to-r from-[#0A1628] to-[#0d2244] rounded-2xl p-4 border border-brand/30">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">🎧</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{label || 'Listening Audio'}</p>
          <p className="text-slate-400 text-xs">
            {playCount >= MAX_PLAYS
              ? '⚠ Maximum plays reached (×2)'
              : `Listen carefully · ${MAX_PLAYS - playCount} play${MAX_PLAYS - playCount !== 1 ? 's' : ''} remaining`}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={playCount >= MAX_PLAYS && !playing}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all shadow-lg
            ${playCount >= MAX_PLAYS ? 'bg-slate-600 cursor-not-allowed' : 'bg-brand hover:bg-brand/80 active:scale-95'}`}>
          {playing ? '⏸' : '▶'}
        </button>
      </div>
      {/* Progress bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
        onClick={e => {
          const a = audioRef.current;
          if (!a || !duration) return;
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          a.currentTime = (x / rect.width) * duration;
        }}>
        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{fmt(duration * progress / 100)}</span>
        <span>{fmt(duration)}</span>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => { setPlaying(false); setPlayCount(c => c + 1); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
    </div>
  );
}

interface Option { id: string; text: string; isCorrect: boolean; }
interface Question {
  id: string; text: string; options: Option[];
  explanation: string; difficulty: number; timeLimit: number;
  imageUrl?: string;
  diagramData?: {
    type: 'pie'|'bar'|'line'|'table'|'passage'|'chart_bar';
    title?: string;
    labels?: string[];
    datasets?: {label:string;data:number[];color:string}[];
    values?: number[];
    colors?: string[];
    headers?: string[];
    rows?: string[][];
    highlightCol?: number;
    highlightRow?: number;
    text?: string;
    audioUrl?: string;
    audioLabel?: string;
  } | null;
  category?: { name: string; icon: string; assessmentType?: string; isFreeTrialOnly?: boolean; trialDurationMin?: number };
}

type Mode = 'PRACTICE' | 'TIMED' | 'DIAGNOSTIC';

export default function PracticePage() {
  const params = useSearchParams();
  const category = params.get('category') || '';
  const [mode, setMode] = useState<Mode>('PRACTICE');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [bookmarked, setBookmarked] = useState(false);
  const [done, setDone] = useState(false);
  // Admin bypass — admins see everything, no trial limits
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    profileApi.get().then(r => {
      if (r.data?.role === 'ADMIN') setIsAdmin(true);
    }).catch(() => {});
  }, []);

  // Trial timer for exam prep categories
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState<number | null>(null);
  const trialRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    questionsApi.practice({ category, limit: 20, mode }).then(r => {
      setQuestions(r.data);
      setIdx(0); setSelected(null); setSubmitted(false); setStartTime(Date.now());
      // Set up trial timer if exam prep category
      const firstQ = r.data[0];
      const cat = firstQ?.category;
      if (cat?.isFreeTrialOnly && !isAdmin) {
        const mins = cat.trialDurationMin ?? 30;
        const secs = mins * 60;
        setTrialSecondsLeft(secs);
        if (trialRef.current) clearInterval(trialRef.current);
        trialRef.current = setInterval(() => {
          setTrialSecondsLeft(prev => {
            if (prev === null || prev <= 1) {
              if (trialRef.current) clearInterval(trialRef.current!);
              setTrialExpired(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
    return () => { if (trialRef.current) clearInterval(trialRef.current); };
  }, [category, mode]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Timer for TIMED mode
  useEffect(() => {
    if (mode !== 'TIMED' || submitted || loading || done) return;
    const q = questions[idx];
    if (!q) return;
    setTimeLeft(q.timeLimit || 60);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(''); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode, submitted, loading, done]);

  const handleSubmit = async (opt: string) => {
    if (submitted) return;
    const q = questions[idx];
    if (!q) return;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setSelected(opt);
    setSubmitted(true);
    const isCorrect = q.options.find(o => o.id === opt)?.isCorrect ?? false;
    setSessionStats(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    try {
      await attemptsApi.submit({ questionId: q.id, selectedOption: opt, timeTaken, confidence, mode, sessionId });
    } catch {}
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setSelected(null);
    setSubmitted(false);
    setConfidence(3);
    setStartTime(Date.now());
    setBookmarked(false);
  };

  const toggleBookmark = async () => {
    const q = questions[idx];
    if (!q) return;
    try {
      if (bookmarked) { await bookmarksApi.remove(q.id); setBookmarked(false); }
      else { await bookmarksApi.add(q.id); setBookmarked(true); }
    } catch {}
  };

  // Trial expired paywall — skip entirely for admin
  if (trialExpired && !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border-2 border-amber-300">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Free Trial Complete</h2>
        <p className="text-slate-500 text-sm mb-4">
          Your 30-minute free trial for this exam prep module has ended.<br/>
          Upgrade to <span className="font-bold text-amber-600">Premium</span> for unlimited access to IELTS, TOEFL, OET mock exams and practice.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left">
          <p className="text-xs font-bold text-amber-700 mb-2">Premium includes:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>✅ Unlimited IELTS, TOEFL & OET practice</li>
            <li>✅ Full-length mock exams with scoring</li>
            <li>✅ Detailed performance analytics</li>
            <li>✅ Answer explanations & study plans</li>
            <li>✅ All 29 assessment categories</li>
          </ul>
        </div>
        <a href="/profile" className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all mb-3">
          🔓 Upgrade to Premium
        </a>
        <a href="/library" className="block text-sm text-slate-400 hover:text-slate-600">
          ← Back to Library
        </a>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-4xl mb-3 animate-spin">⏳</div><p className="text-gray-500">Loading questions…</p></div>
    </div>
  );

  if (done || questions.length === 0) return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto text-center py-16">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Session Complete!</h2>
      <p className="text-gray-500 mb-2">You answered {sessionStats.total} questions</p>
      <div className="text-4xl font-black my-4" style={{color: sessionStats.correct/Math.max(sessionStats.total,1) >= 0.7 ? '#2E7D32' : '#D32F2F'}}>
        {Math.round(sessionStats.correct/Math.max(sessionStats.total,1)*100)}%
      </div>
      <p className="text-gray-500 text-sm mb-8">{sessionStats.correct}/{sessionStats.total} correct</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={loadQuestions} className="bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark">Practice Again</button>
        <a href="/dashboard" className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:border-brand">Dashboard</a>
      </div>
    </div>
  );

  const q = questions[idx];
  const progress = ((idx + 1) / questions.length) * 100;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Mode selector */}
      {idx === 0 && !submitted && (
        <div className="flex gap-2 mb-5 bg-white border border-gray-100 rounded-2xl p-1.5">
          {((['PRACTICE','TIMED','DIAGNOSTIC'] as Mode[])).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${mode === m ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              {m === 'PRACTICE' ? '📝 Practice' : m === 'TIMED' ? '⏱️ Timed' : '🔍 Diagnostic'}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full transition-all" style={{width:`${progress}%`}}/>
        </div>
        <span className="text-xs font-semibold text-gray-500 shrink-0">{idx+1}/{questions.length}</span>
        {mode === 'TIMED' && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${timeLeft <= 10 ? 'bg-red-100 text-error animate-pulse' : 'bg-surface text-gray-600'}`}>
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Category badge */}
      {q.category && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-sm">{q.category.icon}</span>
          <span className="text-xs font-semibold text-gray-500">{q.category.name}</span>
          <span className="ml-auto text-xs text-gray-300">Difficulty {q.difficulty}/10</span>
        </div>
      )}

      {/* Trial timer banner */}
      {trialSecondsLeft !== null && !trialExpired && !isAdmin && (
        <div className={`flex items-center justify-between rounded-xl px-4 py-2 mb-3 text-xs font-semibold ${trialSecondsLeft < 300 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          <span>⏱ Free Trial</span>
          <span>{Math.floor(trialSecondsLeft/60)}:{String(trialSecondsLeft%60).padStart(2,'0')} remaining</span>
          <a href="/profile" className="underline">Upgrade</a>
        </div>
      )}

      {/* Audio Player — for listening questions */}
      {q.diagramData?.audioUrl && <AudioPlayer url={q.diagramData.audioUrl} label={q.diagramData.audioLabel} />}

      {/* Diagram / Chart / Passage */}
      {q.diagramData && <DiagramRenderer data={q.diagramData} />}

      {/* Image (legacy) */}
      {q.imageUrl && !q.diagramData && (
        <div className="mb-4">
          <img src={q.imageUrl} alt="Question diagram" className="rounded-xl w-full object-contain max-h-64 border border-gray-100" />
        </div>
      )}

      {/* Question text */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 mb-4">
        <p className="text-gray-900 font-medium leading-relaxed text-base whitespace-pre-line">{q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5 mb-4">
        {q.options.map(opt => {
          let cls = 'bg-white border border-gray-200 text-gray-800 hover:border-brand/40';
          if (submitted) {
            if (opt.isCorrect) cls = 'bg-green-50 border-success text-success font-bold';
            else if (selected === opt.id) cls = 'bg-red-50 border-error text-error';
            else cls = 'bg-white border-gray-100 text-gray-400';
          } else if (selected === opt.id) cls = 'bg-brand/10 border-brand text-brand font-semibold';
          return (
            <button key={opt.id} onClick={() => !submitted && handleSubmit(opt.id)} disabled={submitted}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm transition-all min-h-[52px] ${cls}`}
              aria-label={`Option ${opt.id}: ${opt.text}`}>
              <span className="font-bold mr-3">{opt.id}.</span>{opt.text}
            </button>
          );
        })}
      </div>

      {/* Confidence (before submit) */}
      {!submitted && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">How confident are you? (1–5)</p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setConfidence(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${confidence===n ? 'bg-brand text-white' : 'bg-surface text-gray-400 hover:text-gray-700'}`}
                aria-label={`Confidence level ${n}`}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {/* Explanation (after submit) */}
      {submitted && (
        <div className={`rounded-2xl p-5 mb-4 border-2 ${q.options.find(o=>o.id===selected)?.isCorrect ? 'bg-green-50 border-success' : 'bg-red-50 border-error'}`}>
          <p className="font-bold text-sm mb-2">{q.options.find(o=>o.id===selected)?.isCorrect ? '✅ Correct!' : '❌ Incorrect'}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={toggleBookmark} aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          className={`px-4 py-3 rounded-2xl border transition-all text-lg ${bookmarked ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200 hover:border-yellow-300'}`}>
          {bookmarked ? '⭐' : '☆'}
        </button>
        {submitted ? (
          <button onClick={handleNext} className="flex-1 bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-dark transition-all">
            {idx + 1 >= questions.length ? 'See Results' : 'Next Question →'}
          </button>
        ) : (
          <button onClick={() => handleSubmit(selected || '')} disabled={!selected}
            className="flex-1 bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-dark disabled:opacity-40 transition-all">
            Submit Answer
          </button>
        )}
      </div>

      {/* Session mini-stats */}
      <div className="flex gap-4 justify-center mt-4 text-xs text-gray-400">
        <span>✅ {sessionStats.correct} correct</span>
        <span>❌ {sessionStats.total - sessionStats.correct} wrong</span>
        <span>📝 {sessionStats.total} answered</span>
      </div>
    </div>
  );
}
