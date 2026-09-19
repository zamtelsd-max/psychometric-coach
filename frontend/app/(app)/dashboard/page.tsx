'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { profileApi, attemptsApi } from '../../../lib/api';
import AdBanner from '../../../components/AdBanner';

interface ProfileData {
  user: { name: string; readinessScore: number; streakDays: number; plan: string };
  weakCategories: { name: string; accuracy: number }[];
  totalAttempts: number;
}

interface StudyTask {
  title: string;
  type: string;
  category?: string;
  done?: boolean;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneTasks, setDoneTasks] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([profileApi.get(), profileApi.studyPlan(), attemptsApi.stats()])
      .then(([p, sp]) => {
        setProfile(p.data);
        setStudyPlan(sp.data.tasks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const score = profile?.user?.readinessScore ?? user?.readinessScore ?? 0;
  const scoreColor = score >= 75 ? '#2E7D32' : score >= 50 ? '#F57F17' : '#D32F2F';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">{greeting} 👋</p>
          <h1 className="text-2xl font-black text-gray-900">{user?.name?.split(' ')[0] || 'Learner'}</h1>
        </div>
        {user && <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
          <span className="text-amber-500">🔥</span>
          <span className="text-sm font-bold text-amber-700">{user.streakDays}d streak</span>
        </div>}
      </div>

      {/* Readiness Score */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4 flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128" aria-label={`Readiness score: ${score}%`}>
            <circle cx="64" cy="64" r="54" fill="none" stroke="#F0F0F0" strokeWidth="12"/>
            <circle cx="64" cy="64" r="54" fill="none" stroke={scoreColor} strokeWidth="12"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              strokeLinecap="round" transform="rotate(-90 64 64)" style={{transition:'stroke-dashoffset 1s ease'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{color: scoreColor}}>{score}</span>
            <span className="text-xs text-gray-400 font-medium">/ 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Readiness Score</h2>
          <p className="text-sm text-gray-500 mb-3">
            {score >= 75 ? 'Excellent! You are exam-ready.' : score >= 50 ? 'Good progress. Keep practising.' : 'Just getting started — every session counts.'}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/practice" className="bg-brand text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-brand-dark">Practice Now</Link>
            <Link href="/mock-exams" className="border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl hover:border-brand hover:text-brand">Mock Exam</Link>
          </div>
        </div>
      </div>

      {/* ⭐ Featured: Virtual Interview Panel */}
      <Link href="/interview" className="block mb-4 group">
        <div className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'linear-gradient(120deg,#1B365D 0%,#2a4d80 55%,#1B365D 100%)' }}>
          <div className="absolute -right-6 -top-8 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle,#D4AF3733,transparent 70%)' }} />
          <div className="flex -space-x-3 shrink-0">
            {['tech_lead','hr_manager','product_manager','exec_director'].map((a,i)=>(
              <img key={a} src={`/panelists/${a}.jpg`} alt="panelist" width={44} height={44}
                className="rounded-full border-2" style={{ borderColor: '#D4AF37', zIndex: 4-i }} />
            ))}
          </div>
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background:'#D4AF37', color:'#1B365D' }}>New</span>
              <span className="text-white/70 text-[11px]">AI-powered</span>
            </div>
            <h3 className="text-white font-black text-lg leading-tight mt-1">Virtual Interview Panel 🎤</h3>
            <p className="text-white/80 text-xs mt-0.5">Face 4 AI interviewers · live STAR scoring · voice or text</p>
          </div>
          <span className="relative shrink-0 text-white font-bold text-sm px-4 py-2 rounded-xl group-hover:scale-105 transition" style={{ background:'#D4AF37', color:'#1B365D' }}>Start →</span>
        </div>
      </Link>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Questions Done', value: profile?.totalAttempts ?? 0, icon: '✅' },
          { label: 'Weak Areas', value: profile?.weakCategories?.length ?? 0, icon: '⚠️' },
          { label: 'Plan', value: user?.plan ?? 'FREE', icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-black text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Study Plan */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>📅</span> Today&apos;s Study Plan
          {!loading && studyPlan.length === 0 && <Link href="/diagnostic" className="ml-auto text-xs text-brand font-medium hover:underline">Take Diagnostic →</Link>}
        </h3>
        {loading ? (
          <div className="space-y-2">{[0,1,2].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : studyPlan.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-3">Complete your diagnostic to get a personalised plan</p>
            <Link href="/diagnostic" className="bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-dark">Start Diagnostic (10 min)</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {studyPlan.slice(0, 5).map((task, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${doneTasks.includes(String(i)) ? 'border-green-100 bg-green-50' : 'border-gray-100 hover:border-brand/20'}`}>
                <button onClick={() => setDoneTasks(p => p.includes(String(i)) ? p.filter(x=>x!==String(i)) : [...p,String(i)])}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${doneTasks.includes(String(i)) ? 'bg-success border-success text-white' : 'border-gray-300'}`}
                  aria-label={doneTasks.includes(String(i)) ? 'Mark incomplete' : 'Mark complete'}>
                  {doneTasks.includes(String(i)) && <span className="text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${doneTasks.includes(String(i)) ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                  {task.category && <p className="text-xs text-gray-400">{task.category}</p>}
                </div>
                <Link href="/practice" className="text-xs text-brand font-semibold shrink-0 hover:underline">Start</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weak areas */}
      {profile?.weakCategories && profile.weakCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>🎯</span>Focus Areas</h3>
          <div className="space-y-2.5">
            {profile.weakCategories.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 truncate">{cat.name}</span>
                    <span className="text-error font-bold ml-2">{cat.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-error rounded-full transition-all" style={{width:`${cat.accuracy}%`}}/>
                  </div>
                </div>
                <Link href={`/practice?category=${encodeURIComponent(cat.name)}`} className="text-xs text-brand font-semibold shrink-0 hover:underline">Practice</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/assessments" className="bg-gradient-to-br from-[#0A528A] to-blue-700 text-white rounded-2xl p-4 hover:shadow-lg transition-all col-span-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="font-black text-sm">Find Your Assessment</p>
              <p className="text-xs text-blue-200 mt-0.5">By exam, education level or profession · 29 assessments</p>
            </div>
            <span className="ml-auto text-xl opacity-70">→</span>
          </div>
        </Link>
        <Link href="/library" className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-brand/20 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">📚</div>
          <p className="font-semibold text-gray-900 text-sm">Browse Library</p>
          <p className="text-xs text-gray-400 mt-0.5">All categories</p>
        </Link>
        <Link href="/bookmarks" className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-brand/20 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">🔖</div>
          <p className="font-semibold text-gray-900 text-sm">Bookmarks</p>
          <p className="text-xs text-gray-400 mt-0.5">Saved questions</p>
        </Link>
      </div>

      {/* Ad slot — shown to free users */}
      <AdBanner slot="BANNER" className="mt-2" />
    </div>
  );
}
