'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

function getLoginError(raw: string | undefined): { title: string; hint: string; hintLink?: { label: string; href: string } } {
  const msg = (raw || '').toLowerCase();
  if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong') || msg.includes('password') || msg.includes('credential')) {
    return {
      title: 'Incorrect email or password',
      hint: 'Double-check your email address and password. Passwords are case-sensitive.',
      hintLink: { label: 'Forgot your password? Reset it here →', href: '/reset-password' },
    };
  }
  if (msg.includes('not found') || msg.includes('no account') || msg.includes('user not')) {
    return {
      title: 'No account found with this email',
      hint: 'This email is not registered. Would you like to create a free account?',
      hintLink: { label: 'Create a free account →', href: '/register' },
    };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('connect')) {
    return {
      title: 'Connection error',
      hint: 'We could not reach our servers. Please check your internet connection and try again.',
    };
  }
  if (msg.includes('too many') || msg.includes('rate') || msg.includes('limit')) {
    return {
      title: 'Too many attempts',
      hint: 'For security, please wait a few minutes before trying again.',
    };
  }
  if (msg.includes('disabled') || msg.includes('suspended') || msg.includes('banned')) {
    return {
      title: 'Account suspended',
      hint: 'Your account has been suspended. Please contact support for assistance.',
      hintLink: { label: 'Contact support', href: 'mailto:support@psycometriccoach.online' },
    };
  }
  return {
    title: 'Sign in failed',
    hint: raw || 'Something went wrong. Please try again or contact support.',
    hintLink: { label: 'Contact support', href: 'mailto:support@psycometriccoach.online' },
  };
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState(() => {
    // Pre-fill email if redirected from register page (email already exists flow)
    const prefill = typeof window !== 'undefined' ? sessionStorage.getItem('psy_prefill_email') || '' : '';
    if (prefill) sessionStorage.removeItem('psy_prefill_email');
    return { email: prefill, password: '' };
  });
  const [error, setError] = useState<{ title: string; hint: string; hintLink?: { label: string; href: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!form.email.includes('@')) {
      setError({ title: 'Invalid email address', hint: 'Please enter a valid email address (e.g. you@example.com).' });
      return;
    }
    if (form.password.length < 1) {
      setError({ title: 'Password required', hint: 'Please enter your password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string; requiresVerification?: boolean } } }).response?.data
        : undefined;
      const raw = data?.error;
      if (data?.requiresVerification) {
        try { await authApi.resendVerification(form.email); } catch {}
        setError({
          title: 'Verify your email first',
          hint: `Your account isn't verified yet. We've re-sent a verification link to ${form.email} — click it, then sign in. (Check your spam folder too.)`,
        });
      } else {
        setError(getLoginError(raw));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-black">P</div>
            <span className="font-bold text-brand text-xl">PsychometricCoach</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to continue your practice</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="text-red-700 font-semibold text-sm">{error.title}</p>
                  <p className="text-red-600 text-xs mt-1 leading-relaxed">{error.hint}</p>
                  {error.hintLink && (
                    <a href={error.hintLink.href} className="inline-block mt-2 text-xs font-semibold text-brand hover:underline">
                      {error.hintLink.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(null); }}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${error?.title.includes('email') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(null); }}
                  className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${error?.title.includes('password') || error?.title.includes('Incorrect') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <Link href="/reset-password" className="text-xs text-brand font-semibold hover:underline">Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-xl text-sm hover:bg-brand-dark disabled:opacity-60 transition-all mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Signing in…</>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center space-y-2">
            <p className="text-sm text-gray-500">
              No account?{' '}
              <Link href="/register" className="text-brand font-semibold hover:underline">Create a free account</Link>
            </p>
            <p className="text-xs text-gray-400">
              Need help?{' '}
              <a href="mailto:support@psycometriccoach.online" className="text-brand hover:underline">support@psycometriccoach.online</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
