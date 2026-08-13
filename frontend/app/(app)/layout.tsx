'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/assessments', icon: '🎯', label: 'Assessments' },
  { href: '/library', icon: '📚', label: 'Library' },
  { href: '/practice', icon: '✏️', label: 'Practice' },
  { href: '/mock-exams', icon: '📋', label: 'Mock Exams' },
  { href: '/interview', icon: '🎤', label: 'Interview Panel' },
  { href: '/matcher', icon: '🎯', label: 'Resume Matcher' },
  { href: '/passports', icon: '🎫', label: 'Prep Passports' },
  { href: '/screening-admin', icon: '🛡️', label: 'Recruiter Console' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full z-40">
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
            <span className="font-bold text-brand">PsychometricCoach</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${path.startsWith(n.href) ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <span className="text-lg">{n.icon}</span>{n.label}
            </Link>
          ))}
          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${path.startsWith('/admin') ? 'bg-brand/10 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="text-lg">⚙️</span>Admin CMS
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm">{user.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.plan.toLowerCase()} plan</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/'); }}
            className="w-full text-xs text-gray-500 hover:text-error py-2 rounded-lg hover:bg-red-50 transition-all">Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center justify-around px-2 h-16 safe-area-pb">
        {navItems.map(n => (
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
