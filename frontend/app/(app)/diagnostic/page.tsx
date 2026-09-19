'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { questionsApi, attemptsApi } from '../../../lib/api';

interface Option { id: string; text: string; isCorrect: boolean; }
interface Question { id: string; text: string; options: Option[]; explanation: string; category?: { name: string; icon: string }; }

export default function DiagnosticPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const [startTime] = useState(Date.now());
  const [qStartTime, setQStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{correct: number; total: number}>({correct:0,total:0});

  useEffect(() => {
    questionsApi.diagnostic().then(r => setQuestions(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!selected || submitted) return;
    const q = questions[idx];
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);
    setSubmitted(true);
    const isCorrect = q.options.find(o => o.id === selected)?.isCorrect ?? false;
    setResults(r => ({correct: r.correct + (isCorrect?1:0), total: r.total+1}));
    try { await attemptsApi.submit({ questionId: q.id, selectedOption: selected, timeTaken, confidence, mode: 'DIAGNOSTIC' }); } catch {}
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx(i => i+1);
    setSelected(null);
    setSubmitted(false);
    setConfidence(3);
    setQStartTime(Date.now());
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">⏳</div></div>;

  if (done) return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <div className="text-6xl mb-4">🎯</div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Diagnostic Complete!</h2>
      <p className="text-gray-500 mb-2">Baseline score: <strong>{Math.round(results.correct/Math.max(results.total,1)*100)}%</strong></p>
      <p className="text-sm text-gray-400 mb-8">Time taken: {Math.round((Date.now()-startTime)/60000)} min</p>
      <button onClick={()=>router.push('/dashboard')} className="bg-brand text-white font-bold px-8 py-4 rounded-2xl hover:bg-brand-dark">View My Dashboard →</button>
    </div>
  );

  const q = questions[idx];
  if (!q) return null;
  const progress = ((idx+1)/questions.length)*100;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-black text-gray-900">Diagnostic Assessment</h1>
          <span className="text-xs font-bold text-gray-400">{idx+1}/{questions.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full transition-all" style={{width:`${progress}%`}}/>
        </div>
        <p className="text-xs text-gray-400 mt-1">~10 minutes · Identifies your strengths and weaknesses</p>
      </div>

      {q.category && <div className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5"><span>{q.category.icon}</span>{q.category.name}</div>}

      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
      </div>

      <div className="space-y-2.5 mb-4">
        {q.options.map(opt => {
          let cls = 'bg-white border border-gray-200 text-gray-800 hover:border-brand/40';
          if (submitted) {
            if (opt.isCorrect) cls = 'bg-green-50 border-success text-success font-bold';
            else if (selected === opt.id) cls = 'bg-red-50 border-error text-error';
            else cls = 'bg-white border-gray-100 text-gray-400';
          } else if (selected === opt.id) cls = 'bg-brand/10 border-brand text-brand font-semibold';
          return (
            <button key={opt.id} onClick={() => !submitted && setSelected(opt.id)} disabled={submitted}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm transition-all min-h-[52px] ${cls}`}>
              <span className="font-bold mr-3">{opt.id}.</span>{opt.text}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Confidence level (1–5)</p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setConfidence(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${confidence===n?'bg-brand text-white':'bg-surface text-gray-400 hover:text-gray-700'}`}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {submitted && (
        <div className={`rounded-2xl p-4 mb-4 border-2 ${q.options.find(o=>o.id===selected)?.isCorrect?'bg-green-50 border-success':'bg-red-50 border-error'}`}>
          <p className="font-bold text-sm mb-1">{q.options.find(o=>o.id===selected)?.isCorrect?'✅ Correct!':'❌ Incorrect'}</p>
          <p className="text-sm text-gray-700">{q.explanation}</p>
        </div>
      )}

      {submitted ? (
        <button onClick={handleNext} className="w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-dark">
          {idx+1>=questions.length?'See Results':'Next →'}
        </button>
      ) : (
        <button onClick={handleSubmit} disabled={!selected}
          className="w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-dark disabled:opacity-40">
          Submit Answer
        </button>
      )}
    </div>
  );
}
