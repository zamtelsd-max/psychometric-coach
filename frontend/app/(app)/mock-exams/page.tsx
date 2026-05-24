'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockExamsApi, questionsApi } from '../../../lib/api';

interface ExamHistory { id: string; title: string; score: number | null; totalQ: number; completedAt: string | null; duration: number; }
interface Category { id: string; name: string; slug: string; icon: string; }

export default function MockExamsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([mockExamsApi.history(), questionsApi.categories()])
      .then(([h, c]) => { setHistory(h.data.slice(0,10)); setCats(c.data); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const toggleCat = (id: string) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);

  const startExam = async () => {
    if (selected.length === 0) return;
    setStarting(true);
    try {
      const res = await mockExamsApi.start({ categoryIds: selected, questionCount });
      sessionStorage.setItem('psy_exam_id', res.data.examId); router.push('/mock-exams/session');
    } catch { setStarting(false); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Mock Exams</h1>
      <p className="text-gray-500 text-sm mb-6">Simulate real test conditions with timed, full-length exams.</p>

      {/* Create exam */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
        <h3 className="font-bold text-gray-900 mb-3">Configure New Exam</h3>
        <p className="text-xs text-gray-500 mb-3">Select categories (select multiple for a mixed exam)</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map(c => (
            <button key={c.id} onClick={() => toggleCat(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${selected.includes(c.id) ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}
              aria-pressed={selected.includes(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-semibold text-gray-700">Questions:</label>
          {[10, 20, 30, 45].map(n => (
            <button key={n} onClick={() => setQuestionCount(n)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${questionCount===n ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand'}`}>
              {n}
            </button>
          ))}
        </div>
        <button onClick={startExam} disabled={selected.length === 0 || starting}
          className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark disabled:opacity-40 transition-all text-sm">
          {starting ? 'Starting…' : `Start ${questionCount}-Question Exam →`}
        </button>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Recent Exams</h3>
        {loading ? (
          <div className="space-y-2">{[0,1,2].map(i=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No exams yet — create your first one above!</p>
        ) : (
          <div className="space-y-2.5">
            {history.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{e.title}</p>
                  <p className="text-xs text-gray-400">{e.totalQ} questions · {e.completedAt ? new Date(e.completedAt).toLocaleDateString() : 'Incomplete'}</p>
                </div>
                <div className="text-right shrink-0">
                  {e.score !== null ? (
                    <span className={`text-sm font-black ${e.score >= 70 ? 'text-success' : e.score >= 50 ? 'text-amber-600' : 'text-error'}`}>{Math.round(e.score)}%</span>
                  ) : <span className="text-xs text-gray-400">In progress</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
