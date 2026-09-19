'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockExamsApi } from '../../../../lib/api';

interface Option { id: string; text: string; isCorrect: boolean; }
interface Question { id: string; text: string; options: Option[]; difficulty: number; category?: { name: string; icon: string }; }
interface Answer { questionId: string; selected: string; }

export default function ExamSessionPage() {
  const router = useRouter();
  const [examId, setExamId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<{ score: number; percentile: number; correct: number } | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const id = sessionStorage.getItem('psy_exam_id') || '';
    setExamId(id);
    if (!id) { setLoading(false); return; }

    // Use questions from sessionStorage immediately (no waiting)
    const cached = sessionStorage.getItem('psy_exam_questions');
    if (cached) {
      try {
        const qs: Question[] = JSON.parse(cached);
        if (qs.length > 0) {
          setQuestions(qs);
          setTimeLeft(qs.length * 90);
          setLoading(false);
          return; // No need to fetch from API
        }
      } catch { /* ignore parse error */ }
    }

    // Fallback: fetch from API
    mockExamsApi.get(id)
      .then(r => {
        const qs: Question[] = r.data.questions || [];
        if (qs.length === 0) {
          setError('No questions found for this exam. Please start a new one.');
        } else {
          setQuestions(qs);
          setTimeLeft(qs.length * 90);
        }
      })
      .catch(() => setError('Failed to load exam. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const submitExam = useCallback(async () => {
    if (submitting || !examId) return;
    setSubmitting(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await mockExamsApi.submit(examId, answers.map(a => ({ ...a, timeTaken: duration, correct: false })));
      sessionStorage.removeItem('psy_exam_id');
      sessionStorage.removeItem('psy_exam_questions');
      const correct = answers.filter(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q?.options.find(o => o.id === a.selected)?.isCorrect;
      }).length;
      setResults({ score: res.data.score ?? 0, percentile: res.data.percentile ?? 50, correct });
    } catch {
      setSubmitting(false);
      setError('Failed to submit exam. Please try again.');
    }
  }, [examId, answers, submitting, startTime, questions]);

  // Countdown timer
  useEffect(() => {
    if (results || loading || timeLeft <= 0 || questions.length === 0) return;
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); submitExam(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [results, loading, timeLeft, questions.length, submitExam]);

  const selectAnswer = (opt: string) => {
    const q = questions[idx];
    if (!q) return;
    setAnswers(a => [...a.filter(x => x.questionId !== q.id), { questionId: q.id, selected: opt }]);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const answered = (qId: string) => answers.find(a => a.questionId === qId)?.selected;

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">Loading your exam…</p>
    </div>
  );

  if (!examId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
      <div className="text-5xl">📋</div>
      <h3 className="font-bold text-gray-900">No active exam</h3>
      <p className="text-gray-500 text-sm">Select categories and start a new exam.</p>
      <button onClick={() => router.push('/mock-exams')} className="bg-brand text-white font-bold px-6 py-3 rounded-xl text-sm">Go to Mock Exams →</button>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
      <div className="text-5xl">⚠️</div>
      <h3 className="font-bold text-gray-900">Something went wrong</h3>
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={() => router.push('/mock-exams')} className="bg-brand text-white font-bold px-6 py-3 rounded-xl text-sm">Back to Mock Exams</button>
    </div>
  );

  if (results) return (
    <div className="p-6 max-w-lg mx-auto text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-gray-900 mb-4">Exam Complete!</h2>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <div className="text-5xl font-black mb-2" style={{ color: results.score >= 70 ? '#2E7D32' : results.score >= 50 ? '#F57F17' : '#D32F2F' }}>
          {Math.round(results.score)}%
        </div>
        <p className="text-gray-500 text-sm mb-1">Top {Math.max(1, Math.round(100 - results.percentile))}% of all users</p>
        <p className="text-sm text-gray-400">{results.correct}/{questions.length} correct · {answers.length} answered</p>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => router.push('/mock-exams')} className="bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark">New Exam</button>
        <button onClick={() => router.push('/dashboard')} className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl">Dashboard</button>
      </div>
    </div>
  );

  const q = questions[idx];

  // Shouldn't happen, but guard
  if (!q) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
      <div className="text-5xl">🤔</div>
      <p className="text-gray-500 text-sm">Question not found. Please restart the exam.</p>
      <button onClick={() => router.push('/mock-exams')} className="bg-brand text-white font-bold px-6 py-3 rounded-xl text-sm">Restart</button>
    </div>
  );

  const cur = answered(q.id);
  const isLast = idx === questions.length - 1;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Timer + progress bar */}
      <div className={`flex items-center justify-between mb-4 px-4 py-2.5 rounded-2xl ${timeLeft < 300 ? 'bg-red-50 border border-red-100' : 'bg-white border border-gray-100'}`}>
        <span className="text-xs font-semibold text-gray-600">Q {idx + 1} / {questions.length}</span>
        <span className={`font-black text-lg ${timeLeft < 300 ? 'text-error animate-pulse' : 'text-gray-700'}`}>{fmtTime(timeLeft)}</span>
        <span className="text-xs text-gray-400">{answers.length} answered</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }}></div>
      </div>

      {/* Question grid nav */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {questions.map((qp, i) => (
          <button key={qp.id} onClick={() => setIdx(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${i === idx ? 'bg-brand text-white' : answered(qp.id) ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            aria-label={`Go to question ${i + 1}`}>{i + 1}</button>
        ))}
      </div>

      {/* Category badge */}
      {q.category && (
        <div className="inline-flex items-center gap-1.5 bg-brand/10 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {q.category.icon} {q.category.name}
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5 mb-6">
        {q.options.map((opt, oi) => {
          const labels = ['A', 'B', 'C', 'D', 'E'];
          return (
            <button key={opt.id} onClick={() => selectAnswer(opt.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm transition-all min-h-[52px] ${cur === opt.id ? 'bg-brand/10 border-brand text-brand font-semibold' : 'bg-white border-gray-200 text-gray-800 hover:border-brand/40 hover:bg-brand/5'}`}>
              <span className="font-bold mr-3">{labels[oi] || opt.id}.</span>{opt.text}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50">← Prev</button>
        )}
        {!isLast ? (
          <button onClick={() => setIdx(i => i + 1)} className="flex-1 bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-dark">Next →</button>
        ) : (
          <button onClick={submitExam} disabled={submitting}
            className="flex-1 bg-success text-white font-bold py-3.5 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting
              ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Submitting…</>
              : `Submit Exam (${answers.length}/${questions.length}) ✓`}
          </button>
        )}
      </div>

      {/* Skip warning */}
      {isLast && answers.length < questions.length && (
        <p className="text-xs text-amber-600 text-center mt-3">
          ⚠️ You have {questions.length - answers.length} unanswered question{questions.length - answers.length > 1 ? 's' : ''}. You can still submit.
        </p>
      )}
    </div>
  );
}
