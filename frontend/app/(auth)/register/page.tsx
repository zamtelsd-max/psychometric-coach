'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<{ title: string; hint: string; isEmailExists?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Password strength
  const passLen = form.password.length;
  const passStrength = passLen === 0 ? 0 : passLen < 6 ? 1 : passLen < 8 ? 2 : passLen < 12 ? 3 : 4;
  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (form.name.trim().length < 2) {
      setError({ title: 'Name too short', hint: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!form.email.includes('@') || !form.email.includes('.')) {
      setError({ title: 'Invalid email address', hint: 'Please enter a valid email address (e.g. you@example.com).' });
      return;
    }
    if (form.password.length < 8) {
      setError({ title: 'Password too short', hint: 'Your password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.token);
      router.push('/diagnostic');
    } catch (err: unknown) {
      const raw = (err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined) || '';

      const lower = raw.toLowerCase();

      if (lower.includes('exist') || lower.includes('already') || lower.includes('duplicate') || lower.includes('taken') || lower.includes('registered')) {
        setError({
          title: 'Email already registered',
          hint: `An account with ${form.email} already exists. Sign in instead, or use a different email address.`,
          isEmailExists: true,
        });
      } else if (lower.includes('invalid') && lower.includes('email')) {
        setError({ title: 'Invalid email address', hint: 'Please enter a valid email address.' });
      } else if (lower.includes('network') || lower.includes('fetch') || lower.includes('connect')) {
        setError({ title: 'Connection error', hint: 'Could not reach our servers. Please check your internet and try again.' });
      } else {
        setError({ title: 'Registration failed', hint: raw || 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async () => {
    // Pre-fill login page with their email
    sessionStorage.setItem('psy_prefill_email', form.email);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-black">P</div>
            <span className="font-bold text-brand text-xl">PsychometricCoach</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Free forever. No credit card needed.</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Error Banner */}
          {error && (
            <div className={`border rounded-xl p-4 mb-5 ${error.isEmailExists ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{error.isEmailExists ? '📧' : '⚠️'}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${error.isEmailExists ? 'text-amber-800' : 'text-red-700'}`}>{error.title}</p>
                  <p className={`text-xs mt-1 leading-relaxed ${error.isEmailExists ? 'text-amber-700' : 'text-red-600'}`}>{error.hint}</p>
                  {error.isEmailExists && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={loginWithEmail}
                        className="flex-1 bg-brand text-white font-semibold text-xs py-2 px-3 rounded-lg hover:bg-brand-dark transition-colors"
                      >
                        Sign in instead →
                      </button>
                      <button
                        onClick={() => { setForm(f => ({ ...f, email: '' })); setError(null); }}
                        className="flex-1 border border-amber-300 text-amber-800 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Use different email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="John Banda"
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${error?.isEmailExists ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
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
              {/* Password strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passStrength ? strengthColor[passStrength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${passStrength <= 1 ? 'text-red-500' : passStrength === 2 ? 'text-orange-500' : passStrength === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {strengthLabel[passStrength]} {passStrength >= 3 ? '✓' : '— use 8+ characters with numbers & symbols'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-xl text-sm hover:bg-brand-dark disabled:opacity-60 transition-all mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Creating account…</>
              ) : 'Create Free Account →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By registering you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
          <p className="text-center text-sm text-gray-500 mt-3">
            Already have an account?{' '}
            <Link href="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
