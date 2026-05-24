'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockExamsApi } from '../../../../lib/api';

interface Option { id: string; text: string; isCorrect: boolean; }
interface Question { id: string; text: string; options: Option[]; difficulty: number; }
interface Answer { questionId: string; selected: string; }

export default function ExamSessionPage() {
  const router = useRouter();
  const [examId, setExamId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<{score: number; percentile: number} | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const id = sessionStorage.getItem('psy_exam_id') || '';
    setExamId(id);
    if (!id) { setLoading(false); return; }
    mockExamsApi.get(id).then(r => {
      const qs = r.data.questions || [];
      setQuestions(qs);
      setTimeLeft(qs.length * 90);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const submitExam = useCallback(async () => {
    if (submitting || !examId) return;
    setSubmitting(true);
    const duration = Math.round((Date.now()-startTime)/1000);
    try {
      const res = await mockExamsApi.submit(examId, answers.map(a => ({...a, timeTaken: duration, correct: false})));
      setResults({ score: res.data.score ?? 0, percentile: res.data.percentile ?? 50 });
      sessionStorage.removeItem('psy_exam_id');
    } catch { setSubmitting(false); }
  }, [examId, answers, submitting, startTime]);

  useEffect(() => {
    if (results || loading || timeLeft <= 0 || questions.length === 0) return;
    const t = setInterval(() => setTimeLeft(s => { if (s <= 1) { clearInterval(t); submitExam(); return 0; } return s-1; }), 1000);
    return () => clearInterval(t);
  }, [results, loading, timeLeft, questions.length, submitExam]);

  const selectAnswer = (opt: string) => {
    const q = questions[idx];
    setAnswers(a => [...a.filter(x=>x.questionId!==q.id), {questionId:q.id, selected:opt}]);
  };

  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const answered = (qId: string) => answers.find(a=>a.questionId===qId)?.selected;

  if (!examId && !loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
      <div className="text-5xl">📋</div>
      <p className="text-gray-500 text-sm">No active exam. Start a new one from Mock Exams.</p>
      <button onClick={()=>router.push('/mock-exams')} className="bg-brand text-white font-bold px-5 py-2.5 rounded-xl text-sm">Go to Mock Exams</button>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">⏳</div></div>;

  if (results) return (
    <div className="p-6 max-w-lg mx-auto text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-gray-900 mb-4">Exam Complete!</h2>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <div className="text-5xl font-black mb-2" style={{color: results.score>=70?'#2E7D32':results.score>=50?'#F57F17':'#D32F2F'}}>{Math.round(results.score)}%</div>
        <p className="text-gray-500 text-sm">Top {Math.round(100-results.percentile)}% of all users</p>
        <p className="text-sm text-gray-400 mt-1">{answers.length}/{questions.length} questions answered</p>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={()=>router.push('/mock-exams')} className="bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark">New Exam</button>
        <button onClick={()=>router.push('/dashboard')} className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl">Dashboard</button>
      </div>
    </div>
  );

  const q = questions[idx];
  if (!q) return null;
  const cur = answered(q.id);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className={`flex items-center justify-between mb-4 px-4 py-2.5 rounded-2xl ${timeLeft<300?'bg-red-50 border border-red-100':'bg-white border border-gray-100'}`}>
        <span className="text-xs font-semibold text-gray-600">Q {idx+1}/{questions.length}</span>
        <span className={`font-black text-lg ${timeLeft<300?'text-error animate-pulse':'text-gray-700'}`}>{fmtTime(timeLeft)}</span>
        <span className="text-xs text-gray-400">{answers.length} answered</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {questions.map((qp, i) => (
          <button key={qp.id} onClick={()=>setIdx(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${i===idx?'bg-brand text-white':answered(qp.id)?'bg-green-100 text-success':'bg-gray-100 text-gray-500'}`}
            aria-label={`Question ${i+1}`}>{i+1}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
      </div>
      <div className="space-y-2.5 mb-6">
        {q.options.map(opt => (
          <button key={opt.id} onClick={()=>selectAnswer(opt.id)}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm transition-all min-h-[52px] ${cur===opt.id?'bg-brand/10 border-brand text-brand font-semibold':'bg-white border-gray-200 text-gray-800 hover:border-brand/40'}`}>
            <span className="font-bold mr-3">{opt.id}.</span>{opt.text}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        {idx > 0 && <button onClick={()=>setIdx(i=>i-1)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl">← Prev</button>}
        {idx < questions.length-1 ? (
          <button onClick={()=>setIdx(i=>i+1)} className="flex-1 bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-dark">Next →</button>
        ) : (
          <button onClick={submitExam} disabled={submitting}
            className="flex-1 bg-success text-white font-bold py-3.5 rounded-2xl disabled:opacity-60">
            {submitting?'Submitting…':'Submit Exam ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
