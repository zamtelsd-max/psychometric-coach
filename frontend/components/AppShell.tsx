'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import AdBanner from './AdBanner';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';

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
    { href: '/employer', icon: '👔', label: 'Employer Workspace' },
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
  { href: '/employer', icon: '👔', label: 'Employers' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const path = usePathname();
  const [promo, setPromo] = useState<any>(null);

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return; }
    fetch(`${API}/platform/banners/active?plan=${user.plan}`)
      .then(r => r.json())
      .then(d => setPromo((d.banners && d.banners[0]) || null))
      .catch(() => {});
  }, [user, router]);

  if (!user) return null;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const linkCls = (active: boolean) =>
    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
      active ? 'bg-brand-50 text-brand font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;
  const activeBar = (active: boolean) => active ? (
    <span aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-gold" />
  ) : null;

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r fixed h-full z-40" style={{ borderColor: 'var(--line)' }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--line-2)' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/wanctech-logo.png" alt="Wanctech IT Solutions" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <span className="font-black text-[15px] leading-tight"><span className="text-brand">Psychometric</span><span className="text-gold">Coach</span></span>
          </Link>
        </div>

        <div className="px-4 py-3.5 border-b flex items-center gap-3" style={{ borderColor: 'var(--line-2)', background: 'var(--brand-050)' }}>
          <div className="w-10 h-10 pc-gradient-brand rounded-full flex items-center justify-center text-white font-bold shrink-0">{user.name[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs capitalize"><span className="pc-badge pc-badge-gold">{user.plan.toLowerCase()}</span>{isAdmin ? <span className="pc-badge pc-badge-brand ml-1">admin</span> : null}</p>
          </div>
        </div>

        <nav className="flex-1 p-3.5 space-y-5 overflow-y-auto" aria-label="Primary">
          {navGroups.map(g => (
            <div key={g.title}>
              <p className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{g.title}</p>
              {g.items.map(n => {
                const active = path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href} className={linkCls(active)} aria-current={active ? 'page' : undefined}>
                    {activeBar(active)}<span className="text-lg w-5 text-center" aria-hidden="true">{n.icon}</span>{n.label}
                  </Link>
                );
              })}
            </div>
          ))}
          {isAdmin && (
            <div>
              <p className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Administration</p>
              {(() => { const active = path.startsWith('/admin') && !adminLinks.some(a => path.startsWith(a.href)); return (
                <Link href="/admin" className={linkCls(active)} aria-current={active ? 'page' : undefined}>
                  {activeBar(active)}<span className="text-lg w-5 text-center" aria-hidden="true">⚙️</span>Admin CMS
                </Link>); })()}
              {adminLinks.map(n => { const active = path.startsWith(n.href); return (
                <Link key={n.href} href={n.href} className={linkCls(active)} aria-current={active ? 'page' : undefined}>
                  {activeBar(active)}<span className="text-lg w-5 text-center" aria-hidden="true">{n.icon}</span>{n.label}
                </Link>); })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'var(--line-2)' }}>
          <button onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 border rounded-xl px-3 py-2.5 hover:border-red-300 hover:bg-red-50 hover:text-error transition-all"
            style={{ borderColor: 'var(--line)' }} aria-label="Sign out">
            <span aria-hidden="true">⏻</span> Sign out
          </button>
          <div className="mt-3"><AdBanner slot="SIDEBAR" /></div>
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

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex items-center justify-around px-2 h-16 safe-area-pb" style={{ borderColor: 'var(--line)', boxShadow: '0 -2px 12px rgba(15,23,42,.06)' }} aria-label="Primary mobile">
        {mobileItems.map(n => { const active = path.startsWith(n.href); return (
          <Link key={n.href} href={n.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] min-h-[48px] justify-center transition-all ${active ? 'text-brand bg-brand-50' : 'text-slate-400'}`}
            aria-label={n.label} aria-current={active ? 'page' : undefined}>
            <span className="text-xl" aria-hidden="true">{n.icon}</span>
            <span className="text-[10px] font-semibold">{n.label}</span>
          </Link>); })}
      </nav>
    </div>
  );
}
