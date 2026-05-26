'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

interface Stats { totalUsers: number; totalQuestions: number; totalAttempts: number; }
interface AdRow { id: string; title: string; slot: string; status: string; advertiser: { companyName: string; email: string }; budget: number; createdAt: string; }
interface Payment { id: string; amount: number; currency: string; status: string; method: string; createdAt: string; ad: { title: string }; advertiser: { companyName: string }; }

interface AttemptRow {
  id: string; isCorrect: boolean; mode: string; timeTaken: number; createdAt: string;
  user: { id: string; name: string; email: string };
  question: { text: string; category: { name: string; icon: string } };
}
interface ExamRow {
  id: string; title: string; score: number | null; totalQ: number; completedAt: string | null; createdAt: string;
  user: { id: string; name: string; email: string } | null;
}
interface ActivityData {
  recentAttempts: AttemptRow[];
  recentExams: ExamRow[];
  activeToday: number;
  activeLast7d: number;
  topCategories: { name: string; icon: string; count: number }[];
}

type Tab = 'overview' | 'activity' | 'pending' | 'ads' | 'payments';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingAds, setPendingAds] = useState<AdRow[]>([]);
  const [allAds, setAllAds] = useState<AdRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [tab, setTab] = useState<Tab>('activity');
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return;
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/ads/pending'),
      api.get('/admin/ads/all'),
      api.get('/admin/ads/payments'),
    ]).then(([s, p, a, pay]) => {
      setStats(s.data); setPendingAds(p.data); setAllAds(a.data); setPayments(pay.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const fetchActivity = useCallback(() => {
    setActLoading(true);
    api.get('/admin/activity')
      .then(r => setActivity(r.data))
      .catch(() => {})
      .finally(() => setActLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'activity') fetchActivity();
  }, [tab, fetchActivity]);

  // Auto-refresh activity every 30s when enabled
  useEffect(() => {
    if (!autoRefresh || tab !== 'activity') return;
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, tab, fetchActivity]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'CONTENT_MANAGER')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">Admin access required</p>
          <button onClick={() => router.push('/dashboard')} className="text-brand font-semibold">← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const tabLabels: { id: Tab; label: string; badge?: number }[] = [
    { id: 'activity', label: '📡 Activity' },
    { id: 'overview', label: '📊 Overview' },
    { id: 'pending', label: '⏳ Pending', badge: pendingAds.length },
    { id: 'ads', label: '📢 All Ads' },
    { id: 'payments', label: '💳 Payments' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">PsychometricCoach platform management</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 overflow-x-auto">
        {tabLabels.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap relative ${tab === t.id ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
            {t.badge && t.badge > 0 ? (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── ACTIVITY TAB ── */}
      {tab === 'activity' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">Live Activity</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                  className="rounded" />
                Auto-refresh (30s)
              </label>
              <button onClick={fetchActivity} disabled={actLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-all">
                {actLoading ? <span className="animate-spin">⟳</span> : '⟳'} Refresh
              </button>
            </div>
          </div>

          {actLoading && !activity && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {activity && (
            <>
              {/* Active users cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: '🟢', label: 'Active Today', value: activity.activeToday, color: 'text-success' },
                  { icon: '📅', label: 'Active 7 days', value: activity.activeLast7d, color: 'text-brand' },
                  { icon: '📝', label: 'Attempts (feed)', value: activity.recentAttempts.length, color: 'text-gray-700' },
                  { icon: '🎯', label: 'Exams (feed)', value: activity.recentExams.length, color: 'text-gray-700' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Top categories */}
              {activity.topCategories.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">🔥 Most Practiced Categories</h3>
                  <div className="space-y-2">
                    {activity.topCategories.map((c, i) => {
                      const max = activity.topCategories[0]?.count || 1;
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-4">#{i+1}</span>
                          <span className="text-base">{c.icon}</span>
                          <span className="text-sm font-semibold text-gray-700 w-36 truncate">{c.name}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${(c.count / max) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{c.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Two-column layout: attempts + exams */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Attempts feed */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">⚡ Recent Question Attempts</h3>
                  {activity.recentAttempts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No attempts yet</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                      {activity.recentAttempts.map(a => (
                        <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface">
                          <span className={`text-base mt-0.5 ${a.isCorrect ? 'text-success' : 'text-error'}`}>
                            {a.isCorrect ? '✅' : '❌'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {a.user?.name || a.user?.email?.split('@')[0] || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{a.question?.text}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{a.question?.category?.icon} {a.question?.category?.name}</span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{a.mode}</span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{a.timeTaken}s</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Mock Exams feed */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">🎯 Recent Mock Exams</h3>
                  {activity.recentExams.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No exams yet</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                      {activity.recentExams.map(e => (
                        <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {e.user?.name || e.user?.email?.split('@')[0] || 'Unknown user'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{e.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {e.totalQ} questions · {e.completedAt ? 'Completed' : 'In progress'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {e.score !== null ? (
                              <span className={`text-sm font-black ${e.score >= 70 ? 'text-success' : e.score >= 50 ? 'text-amber-500' : 'text-error'}`}>
                                {Math.round(e.score)}%
                              </span>
                            ) : (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Live</span>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0,1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-3">
              {[['👥 Users', stats.totalUsers, 'text-brand'], ['📝 Questions', stats.totalQuestions, 'text-gray-800'], ['✅ Attempts', stats.totalAttempts, 'text-success']].map(([l, v, c]) => (
                <div key={l as string} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className={`text-2xl font-black ${c}`}>{(v as number).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{l}</div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTab('activity')} className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark">
                📡 View Activity Feed
              </button>
              <button onClick={() => setTab('pending')} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600">
                ⏳ Review Pending Ads {pendingAds.length > 0 && `(${pendingAds.length})`}
              </button>
              <button onClick={() => setTab('payments')} className="px-4 py-2 bg-surface text-gray-700 text-sm font-semibold rounded-xl border hover:bg-gray-100">
                💳 Confirm Payments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING ADS TAB ── */}
      {tab === 'pending' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">⏳ Pending Ad Approvals ({pendingAds.length})</h3>
          {pendingAds.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No pending ads — all clear ✅</p>
          ) : (
            <div className="space-y-3">
              {pendingAds.map(ad => (
                <div key={ad.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{ad.title}</p>
                      <p className="text-xs text-gray-500">{ad.advertiser.companyName} · {ad.slot} · ${ad.budget} budget</p>
                      <p className="text-xs text-gray-400">{new Date(ad.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={async () => {
                        await api.post(`/admin/ads/${ad.id}/approve`);
                        setPendingAds(p => p.filter(a => a.id !== ad.id));
                      }} className="px-3 py-1.5 bg-success text-white text-xs font-bold rounded-lg hover:opacity-90">
                        ✅ Approve
                      </button>
                      <button onClick={async () => {
                        await api.post(`/admin/ads/${ad.id}/reject`);
                        setPendingAds(p => p.filter(a => a.id !== ad.id));
                      }} className="px-3 py-1.5 bg-error text-white text-xs font-bold rounded-lg hover:opacity-90">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL ADS TAB ── */}
      {tab === 'ads' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">📢 All Ads ({allAds.length})</h3>
          <div className="space-y-2">
            {allAds.map(ad => (
              <div key={ad.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{ad.title}</p>
                  <p className="text-xs text-gray-500">{ad.advertiser.companyName} · {ad.slot}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  ad.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  ad.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{ad.status}</span>
                <span className="text-xs text-gray-500 shrink-0">${ad.budget}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {tab === 'payments' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">💳 Ad Payments ({payments.length})</h3>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{p.advertiser.companyName}</p>
                  <p className="text-xs text-gray-500">{p.ad.title} · {p.method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900">{p.currency} {p.amount}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  }`}>{p.status}</span>
                </div>
                {p.status === 'PENDING' && (
                  <button onClick={async () => {
                    await api.post(`/admin/payments/${p.id}/confirm`);
                    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: 'CONFIRMED' } : x));
                  }} className="px-3 py-1.5 bg-success text-white text-xs font-bold rounded-lg hover:opacity-90 shrink-0">
                    Confirm
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
