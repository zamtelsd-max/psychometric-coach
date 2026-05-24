'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { questionsApi, attemptsApi, bookmarksApi } from '../../../lib/api';

interface Option { id: string; text: string; isCorrect: boolean; }
interface Question {
  id: string; text: string; options: Option[];
  explanation: string; difficulty: number; timeLimit: number;
  category?: { name: string; icon: string };
}

type Mode = 'PRACTICE' | 'TIMED' | 'GUIDED';

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

  const loadQuestions = useCallback(() => {
    setLoading(true);
    questionsApi.practice({ category, limit: 20, mode }).then(r => {
      setQuestions(r.data);
      setIdx(0); setSelected(null); setSubmitted(false); setStartTime(Date.now());
    }).catch(()=>{}).finally(()=>setLoading(false));
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
          {(['PRACTICE','TIMED','GUIDED'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${mode === m ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              {m === 'PRACTICE' ? '📝 Practice' : m === 'TIMED' ? '⏱️ Timed' : '💡 Guided'}
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

      {/* Question */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 mb-4">
        <p className="text-gray-900 font-medium leading-relaxed text-base">{q.text}</p>
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
