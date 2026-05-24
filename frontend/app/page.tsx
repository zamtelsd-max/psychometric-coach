'use client';
import Link from 'next/link';

const features = [
  { icon: '🧠', title: 'Adaptive AI Engine', desc: 'Questions adjust to your skill level using Item Response Theory — always the perfect challenge.' },
  { icon: '📊', title: '15+ Test Categories', desc: 'Numerical, Verbal, Abstract, Logical, Spatial, SJT and more — all in one platform.' },
  { icon: '🎯', title: 'Full Mock Exams', desc: '45–90 minute timed simulations with detailed score reports and percentile ranking.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'Radar charts, readiness scores, skill heatmaps and 30/60/90-day trend analysis.' },
  { icon: '📱', title: 'Mobile App', desc: 'Install on Android or iPhone — works offline, syncs across all your devices.' },
  { icon: '💡', title: 'AI Explanations', desc: 'Every question comes with a detailed explanation that teaches the underlying concept.' },
];

const plans = [
  { name: 'Free', price: '$0', period: 'forever', color: 'border-gray-200', features: ['20 questions/day', '5 categories', 'Basic progress tracking', 'Mobile PWA'], cta: 'Start Free', href: '/register' },
  { name: 'Premium', price: '$9.99', period: '/month', color: 'border-brand ring-2 ring-brand', features: ['Unlimited practice', 'All 15 categories', 'Full mock exams', 'AI explanations', 'Offline mode', 'Advanced analytics'], cta: 'Start Premium', href: '/register', badge: 'Most Popular' },
  { name: 'Enterprise', price: 'Custom', period: '', color: 'border-gray-200', features: ['Bulk seat licensing', 'Cohort analytics', 'Custom content', 'Dedicated support', 'SLA guarantee'], cta: 'Contact Us', href: 'mailto:hello@psychometriccoach.com' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
            <span className="font-bold text-brand text-lg">PsychometricCoach</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand px-3 py-2">Sign In</Link>
            <Link href="/register" className="text-sm font-semibold bg-brand text-white px-4 py-2 rounded-xl hover:bg-brand-dark">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand to-blue-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🚀 Now with AI-powered adaptive learning
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
            Ace Your<br />
            <span className="text-yellow-300">Psychometric Tests</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Intelligent, adaptive preparation across 15+ test types. Our AI identifies your weaknesses and builds you a personalised path to test-day confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-yellow-300 transition-all hover:scale-105">
              Start Free Today →
            </Link>
            <Link href="/login" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/10">
              Sign In
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">No credit card required · Free plan available forever</p>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[['5,000+', 'Practice Questions'], ['15', 'Test Categories'], ['10K+', 'Active Learners']].map(([n, l]) => (
            <div key={l} className="bg-white/10 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-yellow-300">{n}</div>
              <div className="text-sm text-blue-200 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-lg text-gray-500">Built for serious candidates who want results, not just practice.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-brand/20 transition-all">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories preview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">15 Test Categories Covered</h2>
            <p className="text-gray-500">From cognitive aptitude to situational judgement — comprehensive coverage.</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {['🔢 Numerical Reasoning','📝 Verbal Reasoning','🔷 Abstract Reasoning','🧩 Logical Reasoning','🧊 Spatial Reasoning','🔍 Error Checking','⚙️ Mechanical Reasoning','💼 Situational Judgement','💡 Inductive Reasoning','🎯 Deductive Reasoning','📊 Diagrammatic Reasoning','📖 Reading Comprehension','📐 Quantitative Aptitude','🤔 Critical Thinking','🧠 Personality & Behavioural'].map(cat => (
              <span key={cat} className="bg-surface border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:border-brand hover:text-brand cursor-default transition-colors">{cat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500">Start free. Upgrade when you are ready to go all-in.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.name} className={`bg-white rounded-2xl p-6 border-2 ${p.color} relative`}>
                {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1 rounded-full">{p.badge}</div>}
                <div className="font-bold text-gray-500 text-sm mb-2">{p.name}</div>
                <div className="text-4xl font-black text-gray-900">{p.price}<span className="text-base font-normal text-gray-400">{p.period}</span></div>
                <ul className="mt-5 space-y-2.5 mb-6">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><span className="text-success">✓</span>{f}</li>)}
                </ul>
                <Link href={p.href} className={`block text-center font-semibold py-3 rounded-xl text-sm transition-all ${p.badge ? 'bg-brand text-white hover:bg-brand-dark' : 'border border-gray-200 text-gray-700 hover:border-brand hover:text-brand'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Ready to start practising?</h2>
          <p className="text-blue-100 mb-8">Join thousands of candidates who improved their scores with PsychometricCoach.</p>
          <Link href="/register" className="inline-block bg-yellow-400 text-gray-900 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-yellow-300 hover:scale-105 transition-all">
            Get Started — It is Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand rounded flex items-center justify-center text-white font-black text-xs">P</div>
            <span className="text-white font-semibold">PsychometricCoach</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <a href="mailto:hello@psychometriccoach.com" className="hover:text-white">Contact</a>
          </div>
          <p>© 2026 PsychometricCoach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
