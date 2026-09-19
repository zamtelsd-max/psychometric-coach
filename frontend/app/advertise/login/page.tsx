'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { advertiserApi } from '../../../lib/adsApi';

export default function AdvertiserLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await advertiserApi.login(email, password);
      localStorage.setItem('adToken', res.data.token);
      localStorage.setItem('adUser', JSON.stringify(res.data.advertiser));
      router.push('/advertise/dashboard');
    } catch {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/advertise" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#0A528A] rounded-xl flex items-center justify-center text-white font-black">P</div>
            <span className="font-bold text-[#0A528A] text-lg">PsychometricCoach</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Advertiser Sign In</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                placeholder="you@company.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A] pr-12"
                  placeholder="Password" required />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{show ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#0A528A] text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 disabled:opacity-50 transition-all">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            No account? <Link href="/advertise/register" className="text-[#0A528A] font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
