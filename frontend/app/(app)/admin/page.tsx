'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

interface Stats { totalUsers: number; totalQuestions: number; totalAttempts: number; }

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      api.get('/admin/stats').then(r => setStats(r.data)).catch(()=>{});
    }
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'CONTENT_MANAGER')) {
    return <div className="p-6 text-center py-20"><p className="text-gray-400">Access denied</p></div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Admin CMS</h1>
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[['👥 Users', stats.totalUsers], ['📝 Questions', stats.totalQuestions], ['✅ Attempts', stats.totalAttempts]].map(([l, v]) => (
            <div key={String(l)} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
              <div className="text-2xl font-black text-gray-900">{v}</div>
              <div className="text-xs text-gray-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">Admin Actions</h3>
        <div className="space-y-2">
          <a href="/api/admin/export" className="block text-sm text-brand font-semibold hover:underline">Export question bank</a>
          <p className="text-sm text-gray-400">Full admin CMS with question creation, editing, and user management — coming in Phase 2.</p>
        </div>
      </div>
    </div>
  );
}
