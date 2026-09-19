'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [stage, setStage] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const t = params.get('token');
    if (t) { setToken(t); setStage('reset'); }
  }, [params]);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setMsg({ type: 'ok', text: 'If that email is registered, we\u2019ve sent a reset link and code. Check your inbox, then enter the code below.' });
      setStage('reset');
    } catch {
      setMsg({ type: 'ok', text: 'If that email is registered, we\u2019ve sent a reset link. Check your inbox.' });
      setStage('reset');
    } finally { setLoading(false); }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    if (password.length < 6) { setMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); setLoading(false); return; }
    try {
      await authApi.resetPassword(token.trim(), password);
      setMsg({ type: 'ok', text: 'Password updated! Redirecting to sign in\u2026' });
      setTimeout(() => router.push('/login'), 1400);
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.response?.data?.error || 'Invalid or expired reset code.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <span className="text-2xl font-black text-brand">Psychometric<span className="text-ink">Coach</span></span>
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h1 className="text-xl font-black text-gray-900 mb-1">Reset your password</h1>
          <p className="text-sm text-gray-500 mb-5">
            {stage === 'request' ? 'Enter your email and we\u2019ll send you a reset link and code.' : 'Enter the code from your email and choose a new password.'}
          </p>

          {msg && (
            <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{msg.text}</div>
          )}

          {stage === 'request' ? (
            <form onSubmit={requestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-brand text-white font-bold py-3.5 rounded-xl text-sm hover:bg-brand-dark disabled:opacity-60 transition-all">
                {loading ? 'Sending\u2026' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <form onSubmit={doReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reset code</label>
                <input required value={token} onChange={e => setToken(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Paste the code from your email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">New password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="At least 6 characters" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-brand text-white font-bold py-3.5 rounded-xl text-sm hover:bg-brand-dark disabled:opacity-60 transition-all">
                {loading ? 'Updating\u2026' : 'Set new password'}
              </button>
              <button type="button" onClick={() => setStage('request')} className="w-full text-xs text-gray-400 hover:text-gray-600">Didn\u2019t get a code? Resend</button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <Link href="/login" className="text-sm text-brand font-semibold hover:underline">\u2190 Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading\u2026</div>}><ResetInner /></Suspense>;
}
