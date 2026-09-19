'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questionsApi } from '../../../lib/api';

interface Category {
  id: string; name: string; slug: string; description: string;
  icon: string; color: string;
  assessmentType: string;
  examType?: string;
  targetLevels: string[];
  targetRoles: string[];
  isFreeTrialOnly: boolean;
  trialDurationMin: number;
  _count?: { questions: number };
}

const EDUCATION_LEVELS = [
  { value: 'secondary', label: 'Secondary School', icon: '🏫', desc: 'O-Level / IGCSE / Grade 12' },
  { value: 'graduate', label: 'Graduate / University', icon: '🎓', desc: 'Degree holders & students' },
  { value: 'professional', label: 'Professional', icon: '💼', desc: 'Working professionals & executives' },
];

const PROFESSIONS = [
  { value: 'accountant', label: 'Accountant / Finance', icon: '💰' },
  { value: 'nurse', label: 'Nurse / Healthcare', icon: '🏥' },
  { value: 'doctor', label: 'Doctor / Clinical', icon: '⚕️' },
  { value: 'engineer', label: 'Engineer / Technical', icon: '⚙️' },
  { value: 'data analyst', label: 'Data Analyst', icon: '📊' },
  { value: 'manager', label: 'Manager / Team Lead', icon: '👔' },
  { value: 'lawyer', label: 'Lawyer / Legal', icon: '⚖️' },
  { value: 'teacher', label: 'Teacher / Educator', icon: '📚' },
  { value: 'pharmacist', label: 'Pharmacist', icon: '💊' },
  { value: 'researcher', label: 'Researcher / Scientist', icon: '🔬' },
];

const EXAM_TYPES = [
  { value: 'IELTS', label: 'IELTS', icon: '🌍', desc: 'International English Language Testing System', color: '#C0392B' },
  { value: 'TOEFL', label: 'TOEFL', icon: '🇺🇸', desc: 'Test of English as a Foreign Language', color: '#2980B9' },
  { value: 'OET', label: 'OET', icon: '🏥', desc: 'Occupational English Test (Healthcare)', color: '#27AE60' },
  { value: 'GRE', label: 'GRE', icon: '🎓', desc: 'Graduate Record Examination', color: '#8E44AD' },
  { value: 'GMAT', label: 'GMAT', icon: '💼', desc: 'Graduate Management Admission Test', color: '#F39C12' },
];

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  APTITUDE: '🧠 Aptitude',
  EXAM_PREP: '📝 Exam Prep',
  GRADUATE: '🎓 Graduate',
  PROFESSIONAL: '💼 Professional',
  TECHNICAL: '⚙️ Technical',
  PERSONALITY: '🧬 Personality',
};

type FilterView = 'start' | 'exam' | 'level' | 'profession' | 'results';

export default function AssessmentsPage() {
  const router = useRouter();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [view, setView] = useState<FilterView>('start');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    questionsApi.categories().then(r => {
      setAllCategories(r.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cats = allCategories;
    if (selectedExam) {
      cats = cats.filter(c => c.examType === selectedExam);
    } else if (selectedLevel || selectedProfession) {
      cats = cats.filter(c => {
        const levelMatch = !selectedLevel || c.targetLevels.includes(selectedLevel) || c.targetLevels.length === 0;
        const profMatch = !selectedProfession || c.targetRoles.includes(selectedProfession) || c.targetRoles.length === 0;
        return levelMatch && profMatch;
      });
    }
    if (search) {
      cats = cats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
    }
    setFiltered(cats);
  }, [allCategories, selectedLevel, selectedProfession, selectedExam, search]);

  const handleStart = (cat: Category) => {
    router.push(`/practice?category=${cat.slug}`);
  };

  const groupedFiltered = filtered.reduce((acc, cat) => {
    const t = cat.assessmentType || 'APTITUDE';
    if (!acc[t]) acc[t] = [];
    acc[t].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── START SCREEN ──────────────────────────────────────────────────────────
  if (view === 'start') return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Find Your Assessment</h1>
        <p className="text-slate-500 text-sm mt-1">Choose how you want to discover the right test for you.</p>
      </div>

      <div className="space-y-3">
        <button onClick={() => setView('exam')}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-all active:scale-98">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-black text-lg">Exam Preparation</div>
          <div className="text-sm text-red-100 mt-1">IELTS · TOEFL · OET · GRE · GMAT</div>
          <div className="mt-2 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
            ⏱ 30 min free trial
          </div>
        </button>

        <button onClick={() => setView('level')}
          className="w-full bg-gradient-to-r from-[#0A528A] to-blue-700 text-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-all active:scale-98">
          <div className="text-2xl mb-2">🎓</div>
          <div className="font-black text-lg">By Education Level</div>
          <div className="text-sm text-blue-100 mt-1">Secondary · Graduate · Professional</div>
        </button>

        <button onClick={() => setView('profession')}
          className="w-full bg-gradient-to-r from-[#00843D] to-emerald-700 text-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-all active:scale-98">
          <div className="text-2xl mb-2">💼</div>
          <div className="font-black text-lg">By Profession / Role</div>
          <div className="text-sm text-emerald-100 mt-1">Finance · Healthcare · Engineering · Law & more</div>
        </button>

        <button onClick={() => { setFiltered(allCategories); setView('results'); }}
          className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-2xl p-5 text-left hover:border-brand transition-all">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-black text-lg">Browse All Assessments</div>
          <div className="text-sm text-slate-500 mt-1">{allCategories.length} assessments available</div>
        </button>
      </div>
    </div>
  );

  // ── EXAM TYPE SELECTOR ────────────────────────────────────────────────────
  if (view === 'exam') return (
    <div className="p-5 max-w-lg mx-auto">
      <button onClick={() => setView('start')} className="flex items-center gap-2 text-sm text-slate-500 mb-5 hover:text-slate-800">
        ← Back
      </button>
      <h2 className="text-xl font-black text-slate-900 mb-1">Choose Your Exam</h2>
      <p className="text-sm text-amber-600 font-semibold mb-5">⏱ 30 minutes free · Premium for full access</p>
      <div className="space-y-3">
        {EXAM_TYPES.map(exam => (
          <button key={exam.value} onClick={() => { setSelectedExam(exam.value); setView('results'); }}
            className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-left hover:border-brand transition-all flex items-center gap-4">
            <span className="text-3xl">{exam.icon}</span>
            <div className="flex-1">
              <div className="font-black text-slate-900">{exam.label}</div>
              <div className="text-xs text-slate-500">{exam.desc}</div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">30 min free</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── EDUCATION LEVEL SELECTOR ──────────────────────────────────────────────
  if (view === 'level') return (
    <div className="p-5 max-w-lg mx-auto">
      <button onClick={() => setView('start')} className="flex items-center gap-2 text-sm text-slate-500 mb-5 hover:text-slate-800">
        ← Back
      </button>
      <h2 className="text-xl font-black text-slate-900 mb-1">Your Education Level</h2>
      <p className="text-sm text-slate-500 mb-5">We'll show the most relevant assessments for you.</p>
      <div className="space-y-3 mb-6">
        {EDUCATION_LEVELS.map(lvl => (
          <button key={lvl.value} onClick={() => setSelectedLevel(lvl.value)}
            className={`w-full rounded-2xl p-4 text-left border-2 transition-all flex items-center gap-4 ${selectedLevel === lvl.value ? 'border-brand bg-brand/5' : 'border-slate-200 bg-white hover:border-brand/40'}`}>
            <span className="text-3xl">{lvl.icon}</span>
            <div>
              <div className={`font-black ${selectedLevel === lvl.value ? 'text-brand' : 'text-slate-900'}`}>{lvl.label}</div>
              <div className="text-xs text-slate-500">{lvl.desc}</div>
            </div>
            {selectedLevel === lvl.value && <span className="ml-auto text-brand text-xl">✓</span>}
          </button>
        ))}
      </div>
      {/* Optional profession filter */}
      <p className="text-sm font-bold text-slate-700 mb-2">Also filter by profession? (optional)</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {PROFESSIONS.slice(0, 6).map(p => (
          <button key={p.value} onClick={() => setSelectedProfession(selectedProfession === p.value ? '' : p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedProfession === p.value ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand/40'}`}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      <button onClick={() => { if (selectedLevel) setView('results'); }}
        disabled={!selectedLevel}
        className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl disabled:opacity-40 transition-all">
        Show Assessments →
      </button>
    </div>
  );

  // ── PROFESSION SELECTOR ───────────────────────────────────────────────────
  if (view === 'profession') return (
    <div className="p-5 max-w-lg mx-auto">
      <button onClick={() => setView('start')} className="flex items-center gap-2 text-sm text-slate-500 mb-5 hover:text-slate-800">
        ← Back
      </button>
      <h2 className="text-xl font-black text-slate-900 mb-1">Your Profession / Role</h2>
      <p className="text-sm text-slate-500 mb-5">Select the role that best matches yours.</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {PROFESSIONS.map(prof => (
          <button key={prof.value} onClick={() => setSelectedProfession(prof.value)}
            className={`rounded-2xl p-3 text-left border-2 transition-all ${selectedProfession === prof.value ? 'border-brand bg-brand/5' : 'border-slate-200 bg-white hover:border-brand/40'}`}>
            <div className="text-2xl mb-1">{prof.icon}</div>
            <div className={`text-xs font-bold ${selectedProfession === prof.value ? 'text-brand' : 'text-slate-700'}`}>{prof.label}</div>
          </button>
        ))}
      </div>
      <button onClick={() => { if (selectedProfession) setView('results'); }}
        disabled={!selectedProfession}
        className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl disabled:opacity-40 transition-all">
        Show Assessments →
      </button>
    </div>
  );

  // ── RESULTS ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { setView('start'); setSelectedExam(''); setSelectedLevel(''); setSelectedProfession(''); setSearch(''); }}
          className="text-sm text-slate-500 hover:text-slate-800">← Back</button>
        <h2 className="text-lg font-black text-slate-900 flex-1">
          {selectedExam ? `${selectedExam} Preparation` : selectedProfession ? `${selectedProfession} Assessments` : selectedLevel ? `${selectedLevel.charAt(0).toUpperCase()+selectedLevel.slice(1)}-level Assessments` : 'All Assessments'}
        </h2>
        <span className="text-xs text-slate-400">{filtered.length} found</span>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assessments..."
          className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand outline-none" />
      </div>

      {/* Exam prep banner */}
      {selectedExam && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏱</span>
            <div>
              <p className="text-sm font-bold text-amber-800">30-Minute Free Trial</p>
              <p className="text-xs text-amber-700 mt-0.5">
                You can try {selectedExam} practice free for 30 minutes. After that, a Premium subscription unlocks unlimited mocks, full practice sets, and performance tracking.
              </p>
              <a href="/profile" className="inline-block mt-2 text-xs font-bold text-amber-600 underline">Upgrade to Premium →</a>
            </div>
          </div>
        </div>
      )}

      {/* Category cards grouped by type */}
      {Object.keys(groupedFiltered).length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold">No assessments found</p>
          <p className="text-sm">Try a different filter or browse all</p>
        </div>
      ) : (
        Object.entries(groupedFiltered).map(([type, cats]) => (
          <div key={type} className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {ASSESSMENT_TYPE_LABELS[type] || type}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cats.map(cat => (
                <button key={cat.id} onClick={() => handleStart(cat)}
                  className="bg-white border-2 border-slate-100 hover:border-brand/40 rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{cat.icon}</span>
                    {cat.isFreeTrialOnly && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                        {cat.trialDurationMin}min trial
                      </span>
                    )}
                  </div>
                  <p className="font-black text-slate-900 text-sm leading-tight mb-1">{cat.name}</p>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">{cat.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-300">{cat._count?.questions ?? '?'} questions</span>
                    <span className="text-xs font-bold text-brand opacity-0 group-hover:opacity-100 transition-opacity">Start →</span>
                  </div>
                  {/* Coloured accent bar */}
                  <div className="mt-2 h-1 rounded-full" style={{ background: cat.color, opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
