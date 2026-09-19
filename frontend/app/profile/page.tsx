'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { profileApi, attemptsApi } from '../../../lib/api';

interface StatRow { categoryName: string; accuracy: number; total: number; avgTime: number; }

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<StatRow[]>([]);
  const [profile, setProfile] = useState<{user?: {readinessScore?: number; streakDays?: number}} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([profileApi.get(), attemptsApi.stats()])
      .then(([p, s]) => { setProfile(p.data); setStats(s.data.byCategory || []); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const score = profile?.user?.readinessScore ?? user?.readinessScore ?? 0;
  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 75 ? '#2E7D32' : score >= 50 ? '#F57F17' : '#D32F2F';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">My Profile</h1>

      {/* User card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-brand rounded-full flex items-center justify-center text-white font-black text-xl shrink-0">
          {user?.name?.[0] ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-lg truncate">{user?.name}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <span className="text-xs bg-brand/10 text-brand font-semibold px-2.5 py-0.5 rounded-full capitalize">{(user?.plan ?? 'FREE').toLowerCase()} plan</span>
            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full">🔥 {user?.streakDays ?? 0}d streak</span>
          </div>
        </div>
        <div className="relative shrink-0">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle cx="54" cy="54" r="48" fill="none" stroke="#F0F0F0" strokeWidth="10"/>
            <circle cx="54" cy="54" r="48" fill="none" stroke={scoreColor} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              strokeLinecap="round" transform="rotate(-90 54 54)"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black" style={{color:scoreColor}}>{score}</span>
            <span className="text-[10px] text-gray-400">Score</span>
          </div>
        </div>
      </div>

      {/* Performance by category */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <h3 className="font-bold text-gray-900 mb-4">Performance by Category</h3>
        {loading ? (
          <div className="space-y-3">{[0,1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : stats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No attempts yet — start practising!</p>
        ) : (
          <div className="space-y-3">
            {stats.map(s => (
              <div key={s.categoryName}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700 truncate max-w-[60%]">{s.categoryName}</span>
                  <span className={`font-bold ${s.accuracy >= 70 ? 'text-success' : s.accuracy >= 50 ? 'text-amber-600' : 'text-error'}`}>{s.accuracy}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${s.accuracy}%`, backgroundColor: s.accuracy>=70?'#2E7D32':s.accuracy>=50?'#F57F17':'#D32F2F'}}/>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.total} questions · avg {s.avgTime}s</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan card */}
      {user?.plan === 'FREE' && (
        <div className="bg-gradient-to-r from-brand to-blue-700 rounded-2xl p-5 text-white mb-4">
          <h3 className="font-bold mb-1">Upgrade to Premium</h3>
          <p className="text-sm text-blue-100 mb-4">Unlock unlimited practice, all categories, full mock exams and AI explanations.</p>
          <a href="mailto:hello@psychometriccoach.com?subject=Premium Subscription"
            className="inline-block bg-yellow-400 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-300">
            Get Premium — $9.99/mo
          </a>
        </div>
      )}

      {/* Sign out */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Account</h3>
        <button onClick={() => { logout(); window.location.href = '/'; }}
          className="w-full text-sm text-error font-semibold py-3 rounded-xl hover:bg-red-50 transition-all border border-red-100">
          Sign Out
        </button>
      </div>
    </div>
  );
}
