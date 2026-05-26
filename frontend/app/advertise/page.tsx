'use client';
import Link from 'next/link';
import { useCurrency } from '../../hooks/useCurrency';
import CurrencySelector from '../../components/CurrencySelector';

const STATS = [
  { value: '25,000+', label: 'Monthly Active Users' },
  { value: '85%',     label: 'Exam Preparation Intent' },
  { value: '72%',     label: 'Age 18–35 (prime buying age)' },
  { value: '4.2%',    label: 'Avg. Click-Through Rate' },
];

export default function AdvertisePage() {
  const { format, USD_PRICES } = useCurrency();

  const PACKAGES = [
    {
      name: 'Starter',
      usdPrice: USD_PRICES.PACKAGE_STARTER,
      impressions: '10,000',
      color: '#6B7280',
      features: ['Banner ads', '1 active ad', 'Basic analytics', 'Email support'],
      cta: 'Get Started',
    },
    {
      name: 'Growth',
      usdPrice: USD_PRICES.PACKAGE_GROWTH,
      impressions: '40,000',
      color: '#0A528A',
      features: ['Banner + In-feed ads', '3 active ads', 'Full analytics dashboard', 'Priority support', 'Category targeting'],
      cta: 'Start Growing',
      popular: true,
    },
    {
      name: 'Enterprise',
      usdPrice: null,
      impressions: 'Unlimited',
      color: '#D4A017',
      features: ['All ad slots', 'Unlimited ads', 'Dedicated account manager', 'Custom reporting', 'Retargeting', 'A/B testing'],
      cta: 'Contact Us',
    },
  ];

  const AD_FORMATS = [
    { name: 'Banner',        icon: '📰', desc: 'Full-width at top of page. Maximum visibility.', usdCpm: USD_PRICES.CPM_BANNER },
    { name: 'Sidebar',       icon: '📌', desc: 'Right sidebar on desktop. Always in view.',       usdCpm: USD_PRICES.CPM_SIDEBAR },
    { name: 'In-Feed',       icon: '📋', desc: 'Between content cards. Native feel.',             usdCpm: USD_PRICES.CPM_IN_FEED },
    { name: 'Footer Banner', icon: '📍', desc: 'Bottom of page. Broad reach, lower cost.',        usdCpm: USD_PRICES.CPM_FOOTER },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0A528A] rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
          <span className="font-bold text-[#0A528A] hidden sm:block">PsychometricCoach</span>
        </Link>
        <div className="flex items-center gap-3">
          <CurrencySelector />
          <Link href="/advertise/login" className="text-sm text-gray-600 hover:text-[#0A528A] font-medium">Sign in</Link>
          <Link href="/advertise/register" className="bg-[#0A528A] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-900 transition-all">Advertise Now</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0A528A] text-xs font-bold px-4 py-2 rounded-full mb-6">
          📣 Reach Zambia's most driven learners
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">
          Advertise to <span className="text-[#0A528A]">25,000+</span><br />motivated professionals
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
          PsychometricCoach is Zambia's leading test prep platform. Put your brand in front of job-seekers, graduates, and professionals actively preparing for career advancement.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/advertise/register" className="bg-[#0A528A] text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20">
            Start Advertising — Free to Sign Up
          </Link>
          <a href="mailto:support@psycometriccoach.online" className="border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base hover:border-[#0A528A] hover:text-[#0A528A] transition-all">
            Talk to Sales →
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">All prices in USD. View in your local currency using the selector above.</p>
      </section>

      {/* Stats */}
      <section className="bg-[#0A528A] py-14">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-blue-200 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why advertise */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-4">Why advertise here?</h2>
        <p className="text-gray-500 text-center mb-12">Your ideal customers — right when they're most focused and goal-driven.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '🎯', title: 'Precision Targeting', desc: 'Reach users studying specific categories — e.g. Numerical Reasoning for finance roles, Verbal for law.' },
            { icon: '📱', title: 'Mobile-First Audience', desc: '78% of users access via mobile. Your ads are optimised for the devices your customers actually use.' },
            { icon: '🇿🇲', title: 'Zambia-Focused', desc: 'All users are in Zambia. No wasted spend on international traffic irrelevant to your business.' },
            { icon: '📊', title: 'Real-Time Analytics', desc: 'See impressions, clicks, and CTR live. Pause or adjust your campaign instantly from your dashboard.' },
            { icon: '⚡', title: 'Quick Setup', desc: 'Create your ad, set your budget, submit for review. Live within 24 hours of approval.' },
            { icon: '💰', title: 'Pay as You Go', desc: 'No long-term contracts. Top up your balance and your ad runs until budget is exhausted.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ad formats */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-1">Ad Formats & Pricing</h2>
              <p className="text-gray-500 text-sm">Cost per 1,000 impressions (CPM) — paid only for delivery</p>
            </div>
            <CurrencySelector />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {AD_FORMATS.map(f => (
              <div key={f.name} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{f.desc}</p>
                <div>
                  <span className="text-lg font-black text-[#0A528A]">{format(f.usdCpm)}</span>
                  <span className="text-xs text-gray-400 ml-1">/ 1,000 impressions</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">(${f.usdCpm} USD)</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">All prices in USD. Displayed amounts are converted at today's exchange rate. Billing is in USD.</p>
        </div>
      </section>

      {/* Pricing packages */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-1">Monthly Packages</h2>
            <p className="text-gray-500">Simple pricing. No hidden fees.</p>
          </div>
          <CurrencySelector />
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {PACKAGES.map(p => (
            <div key={p.name} className={`rounded-2xl p-6 border-2 relative ${p.popular ? 'border-[#0A528A] shadow-lg shadow-blue-900/10' : 'border-gray-100'}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A528A] text-white text-[10px] font-bold px-3 py-1 rounded-full">Most Popular</div>
              )}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-500 mb-1">{p.name}</p>
                {p.usdPrice !== null ? (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black" style={{ color: p.color }}>{format(p.usdPrice)}</span>
                      <span className="text-gray-400 text-sm pb-1">/month</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">${p.usdPrice} USD · ~{p.impressions} impressions</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-black" style={{ color: p.color }}>Custom</span>
                    <p className="text-[10px] text-gray-400 mt-1">{p.impressions} impressions</p>
                  </div>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500 text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.name === 'Enterprise' ? 'mailto:support@psycometriccoach.online' : '/advertise/register'}
                className="block w-full text-center font-bold py-3 rounded-xl transition-all text-sm"
                style={{ backgroundColor: p.popular ? '#0A528A' : undefined, color: p.popular ? 'white' : p.color, border: p.popular ? 'none' : `2px solid ${p.color}` }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Prefer pay-as-you-go? Set any budget from {format(USD_PRICES.BUDGET_MIN)} USD minimum.
        </p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10">How It Works</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Create your account', desc: 'Sign up free. No credit card required.' },
              { step: '2', title: 'Build your ad', desc: 'Upload creative, write your headline, set your CTA and budget in USD.' },
              { step: '3', title: 'Submit & pay', desc: 'Submit for review. Deposit via bank transfer or mobile money. We confirm within 24 hours.' },
              { step: '4', title: 'Go live', desc: 'Approved ads go live immediately. Track performance in real-time from your dashboard.' },
            ].map(s => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#0A528A] text-white font-black text-sm rounded-full flex items-center justify-center shrink-0">{s.step}</div>
                <div>
                  <p className="font-bold text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ on currencies */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Billing & Currency FAQ</h2>
        <div className="space-y-4">
          {[
            { q: 'What currency do you charge in?', a: 'All billing is in USD. This keeps pricing consistent regardless of exchange rate fluctuations.' },
            { q: 'Can I see prices in my local currency?', a: 'Yes — use the currency selector (top right) to view approximate prices in ZMW, GBP, EUR, ZAR, KES, NGN, INR, AED, or others. Rates update daily.' },
            { q: 'How do I pay if I\'m in Zambia?', a: 'You can pay via bank transfer (Zanaco, Standard Chartered) or Zambian mobile money (Airtel Money, MTN MoMo, Zamtel Kwacha). The equivalent ZMW amount will be shown at current rates.' },
            { q: 'Is there a minimum budget?', a: `The minimum campaign budget is $${USD_PRICES.BUDGET_MIN} USD (approx. ${format(USD_PRICES.BUDGET_MIN)}).` },
          ].map(f => (
            <div key={f.q} className="bg-gray-50 rounded-2xl p-5">
              <p className="font-bold text-gray-900 mb-1.5">{f.q}</p>
              <p className="text-sm text-gray-500">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Ready to reach Zambia's top talent?</h2>
        <p className="text-gray-500 mb-8">Join businesses advertising on PsychometricCoach today.</p>
        <Link href="/advertise/register" className="inline-block bg-[#0A528A] text-white font-bold px-10 py-4 rounded-2xl text-base hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20">
          Create Advertiser Account — Free
        </Link>
        <p className="text-xs text-gray-400 mt-4">Questions? Email <a href="mailto:support@psycometriccoach.online" className="text-[#0A528A]">support@psycometriccoach.online</a></p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PsychometricCoach · <Link href="/" className="hover:text-[#0A528A]">Back to site</Link>
      </footer>
    </div>
  );
}
