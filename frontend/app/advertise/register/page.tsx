'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { advertiserApi } from '../../../lib/adsApi';

export default function AdvertiserRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', password: '', phone: '', website: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.contactName || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await advertiserApi.register(form);
      localStorage.setItem('adToken', res.data.token);
      localStorage.setItem('adUser', JSON.stringify(res.data.advertiser));
      router.push('/advertise/dashboard');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/advertise" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#0A528A] rounded-xl flex items-center justify-center text-white font-black">P</div>
            <span className="font-bold text-[#0A528A] text-lg">PsychometricCoach</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Create Advertiser Account</h1>
          <p className="text-gray-500 text-sm mt-1">Start reaching Zambia's top learners</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name *</label>
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                placeholder="e.g. Zambian Bank Ltd" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Person *</label>
              <input value={form.contactName} onChange={e => set('contactName', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                placeholder="Full name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Work Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                placeholder="you@company.com" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                  placeholder="+260 9x xxx xxxx" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                  placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A528A]/30 focus:border-[#0A528A]"
                placeholder="Min 8 characters" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#0A528A] text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 disabled:opacity-50 transition-all mt-2">
              {loading ? 'Creating Account…' : 'Create Account & Start Advertising'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link href="/advertise/login" className="text-[#0A528A] font-semibold">Sign in</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            By registering you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
