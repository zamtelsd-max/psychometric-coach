'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import AdBanner from '../../components/AdBanner';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';

const navGroups = [
  { title: 'Practice Hub', items: [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/assessments', icon: '🎯', label: 'My Assessments' },
    { href: '/practice', icon: '✏️', label: 'Practice' },
    { href: '/mock-exams', icon: '📋', label: 'Mock Exams' },
    { href: '/library', icon: '📚', label: 'Library' },
    { href: '/learning', icon: '⚡', label: 'AI Growth Center' },
  ]},
  { title: 'Career Tools', items: [
    { href: '/interview', icon: '🎤', label: 'Interview Panel' },
    { href: '/matcher', icon: '🧭', label: 'Resume Matcher' },
    { href: '/passports', icon: '🎫', label: 'Prep Passports' },
  ]},
  { title: 'Enterprise', items: [
    { href: '/enterprise', icon: '💼', label: 'Enterprise Hub' },
    { href: '/screening-admin', icon: '🛡️', label: 'Recruiter Console' },
  ]},
];

const adminLinks = [
  { href: '/admin/cms', icon: '📁', label: 'CMS Studio' },
  { href: '/admin/pricing', icon: '💲', label: 'Price & Promo Studio' },
  { href: '/admin/competencies', icon: '🎯', label: 'Competency Baselines' },
];

const mobileItems = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/assessments', icon: '🎯', label: 'Tests' },
  { href: '/interview', icon: '🎤', label: 'Interview' },
  { href: '/enterprise', icon: '💼', label: 'Enterprise' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const path = usePathname();
  const [promo, setPromo] = useState<any>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    fetch(`${API}/platform/banners/active?plan=${user.plan}`)
      .then(r => r.json())
      .then(d => setPromo((d.banners && d.banners[0]) || null))
      .catch(() => {});
  }, [user, router]);

  if (!user) return null;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full z-40">
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/wanctech-logo.png" alt="Wanctech IT Solutions" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-brand">PsychometricCoach</span>
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/60">
          <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{user.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.plan.toLowerCase()} plan{isAdmin ? ' · admin' : ''}</p>
          </div>
          <button onClick={() => { logout(); router.push('/'); }}
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:border-red-300 hover:bg-red-50 hover:text-error transition-all"
            aria-label="Sign out">
            <span aria-hidden="true">⏻</span> Sign out
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navGroups.map(g => (
            <div key={g.title}>
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{g.title}</p>
              {g.items.map(n => (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${path.startsWith(n.href) ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <span className="text-lg">{n.icon}</span>{n.label}
                </Link>
              ))}
            </div>
          ))}
          {isAdmin && (
            <div>
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Administration</p>
              <Link href="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${path.startsWith('/admin') && !path.startsWith('/admin/cms') && !path.startsWith('/admin/pricing') && !path.startsWith('/admin/competencies') ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <span className="text-lg">⚙️</span>Admin CMS
              </Link>
              {adminLinks.map(n => (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${path.startsWith(n.href) ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <span className="text-lg">{n.icon}</span>{n.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <AdBanner slot="SIDEBAR" />
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 min-h-screen">
        {promo && (
          <div className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold" style={{ background: 'linear-gradient(90deg,#1B365D,#0A528A)', color: '#fff' }}>
            <span style={{ color: '#D4AF37' }}>📣</span>
            <span>{promo.message}</span>
            {promo.ctaText ? <a href={promo.ctaUrl || '#'} className="underline font-bold" style={{ color: '#D4AF37' }}>{promo.ctaText}</a> : null}
          </div>
        )}
        <div className="lg:hidden px-3 pt-3"><AdBanner slot="FOOTER_BANNER" /></div>
        {children}
      </main>

      <button onClick={() => { logout(); router.push('/'); }}
        className="lg:hidden fixed bottom-20 right-3 z-50 flex items-center gap-1.5 bg-white border border-gray-200 shadow-md rounded-full px-4 py-2.5 text-sm font-semibold text-gray-700"
        aria-label="Sign out">
        <span aria-hidden="true">⏻</span> Sign out
      </button>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center justify-around px-2 h-16 safe-area-pb">
        {mobileItems.map(n => (
          <Link key={n.href} href={n.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[48px] min-h-[48px] justify-center transition-all ${path.startsWith(n.href) ? 'text-brand' : 'text-gray-400'}`}
            aria-label={n.label}>
            <span className="text-xl">{n.icon}</span>
            <span className={`text-[10px] font-medium ${path.startsWith(n.href) ? 'text-brand' : 'text-gray-400'}`}>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
