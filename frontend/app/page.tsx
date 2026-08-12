'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Video Showcase ─────────────────────────────────────────────────────────
const AD_VIDEOS = [
  {
    src: 'https://depcxnwq.gensparkclaw.com/psychometric-app/ads/psy_ad_extended.mp4',
    title: 'PsychometricCoach',
    subtitle: 'Smart Adaptive Tests for Everyone',
    tag: 'General',
    tagColor: 'bg-brand',
  },
  {
    src: 'https://depcxnwq.gensparkclaw.com/psychometric-app/ads/nurse_ad_extended.mp4',
    title: 'For Healthcare Professionals',
    subtitle: 'OET · IELTS · TOEFL — Pass & Work Abroad',
    tag: 'Nurses & Doctors',
    tagColor: 'bg-emerald-600',
  },
];

function InterviewAdCarousel() {
  const ADS = [
    { c: 'tech', label: 'Technical', avatar: 'tech_lead.jpg', role: 'Technical Lead', q: 'How would you design a system to handle a 10x increase in traffic overnight?' },
    { c: 'hr', label: 'HR & Culture', avatar: 'hr_manager.jpg', role: 'HR & Culture Manager', q: 'Tell me about a time you turned a conflict with a colleague into a win.' },
    { c: 'product', label: 'Product', avatar: 'product_manager.jpg', role: 'Product Manager', q: 'You have two urgent features and time for one. How do you decide?' },
    { c: 'exec', label: 'Executive', avatar: 'exec_director.jpg', role: 'Executive Director', q: 'How would your work here move the wider strategy of the business?' },
  ];
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    const rot = setInterval(() => setI(v => (v + 1) % ADS.length), 5200);
    return () => clearInterval(rot);
  }, []);
  useEffect(() => {
    setTyped(''); const q = ADS[i].q; let n = 0;
    const tw = setInterval(() => { setTyped(q.slice(0, ++n)); if (n >= q.length) clearInterval(tw); }, 26);
    return () => clearInterval(tw);
  }, [i]);
  const a = ADS[i];
  return (
    <div className="max-w-xl mx-auto mb-8">
      <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(212,175,55,.35)' }}>
        <div className="flex items-center gap-3 mb-3">
          <img src={`/panelists/${a.avatar}`} alt={a.role} className="rounded-full" style={{ width: 52, height: 52, border: '2.5px solid #D4AF37' }} />
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: '#D4AF37', color: '#1B365D' }}>{a.label}</span>
            <p className="text-white/70 text-xs mt-1">{a.role} asks…</p>
          </div>
        </div>
        <div className="bg-white text-left rounded-xl p-4 min-h-[76px]" style={{ color: '#212529' }}>
          <p className="font-semibold" style={{ fontSize: 16, lineHeight: 1.45 }}>{typed}<span style={{ color: '#D4AF37' }}>▌</span></p>
        </div>
        <div className="flex justify-center gap-1.5 mt-4">
          {ADS.map((_, k) => <span key={k} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 20, background: k === i ? '#D4AF37' : 'rgba(255,255,255,.3)', transition: 'all .3s' }} />)}
        </div>
      </div>
    </div>
  );
}

function VideoShowcase() {
  // Only re-render for active index changes — everything else via DOM refs
  const [active, setActive] = useState(0);
  const [showPlay, setShowPlay] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);      // main progress bar fill
  const thumbBarRef = useRef<HTMLDivElement>(null);      // thumbnail progress fill
  const rafRef      = useRef<number>(0);
  const startRef    = useRef<number>(0);
  const activeRef   = useRef(0);                         // shadow of active for rAF closure
  const DURATION    = 32000;

  // Switch to a video — never called inside rAF
  const goTo = useCallback((idx: number) => {
    cancelAnimationFrame(rafRef.current);
    const next = (idx + AD_VIDEOS.length) % AD_VIDEOS.length;
    activeRef.current = next;
    setActive(next);
    // reset bars immediately via DOM
    if (barRef.current)      barRef.current.style.width = '0%';
    if (thumbBarRef.current) thumbBarRef.current.style.width = '0%';
    startRef.current = 0;
  }, []);

  // rAF progress ticker — zero React state updates
  const startTicker = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startRef.current = 0;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const pct = Math.min((ts - startRef.current) / DURATION, 1) * 100;
      if (barRef.current)      barRef.current.style.width = pct + '%';
      if (thumbBarRef.current) thumbBarRef.current.style.width = pct + '%';
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        goTo(activeRef.current + 1);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [goTo]);

  // Load + play whenever active changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setShowPlay(false);
    v.src = AD_VIDEOS[active].src;
    v.load();
    const tryPlay = () => {
      v.play()
        .then(() => { setShowPlay(false); startTicker(); })
        .catch(() => setShowPlay(true));
    };
    v.addEventListener('canplay', tryPlay, { once: true });
    return () => { v.removeEventListener('canplay', tryPlay); };
  }, [active, startTicker]);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const video = AD_VIDEOS[active];
  const next  = AD_VIDEOS[(active + 1) % AD_VIDEOS.length];

  return (
    <section className="py-20 px-4 bg-[#05111F] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="inline-block bg-brand/20 text-brand text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">See It In Action</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Built for your journey</h2>
          <p className="text-slate-400 text-lg">Watch how PsychometricCoach prepares candidates for every exam.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">

          {/* ── Main video player ── */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-4 bg-brand/20 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative w-[260px] sm:w-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer"
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                v.muted = true;
                v.play().then(() => { setShowPlay(false); startTicker(); }).catch(() => {});
              }}>
              {/* Single stable <video> — src set via DOM ref, never remounted */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover block"
                muted playsInline
                style={{ aspectRatio: '9/16' }}
              />
              {/* Click-to-play overlay */}
              {showPlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center text-3xl shadow-xl">▶</div>
                </div>
              )}
              {/* Tag label */}
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <span className={`${video.tagColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
                  {video.tag}
                </span>
              </div>
              {/* Progress bar — updated via DOM ref, no re-render */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div ref={barRef} className="h-full bg-brand rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex flex-col gap-5 max-w-sm w-full">
            {/* Current info */}
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-2">Now playing</p>
              <h3 className="text-2xl font-black text-white mb-1">{video.title}</h3>
              <p className="text-slate-300 text-sm">{video.subtitle}</p>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-3 mt-2">
              {AD_VIDEOS.map((v, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 flex-1 ${i === active ? 'border-brand scale-105 shadow-lg shadow-brand/30' : 'border-white/10 opacity-50 hover:opacity-80'}`}
                  style={{ aspectRatio: '9/16', minWidth: 70 }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0A1628] to-[#0d2244] p-2 text-center">
                    <span className="text-2xl mb-1">{i === 0 ? '🎯' : '🏥'}</span>
                    <span className="text-white text-[10px] font-bold leading-tight">{v.tag}</span>
                  </div>
                  {i === active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                      <div ref={thumbBarRef} className="h-full bg-brand" style={{ width: '0%' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Up next */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Up next</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-sm">
                  {(active + 1) % AD_VIDEOS.length === 0 ? '🎯' : '🏥'}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{next.title}</p>
                  <p className="text-slate-400 text-xs">{next.subtitle}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link href="/register"
              className="w-full bg-brand hover:bg-brand/90 text-white font-black py-4 rounded-2xl text-center text-lg transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 active:scale-95">
              Start Free Today →
            </Link>
            <p className="text-slate-500 text-xs text-center">No credit card required · 30-min free trial</p>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  { name: 'Enterprise', price: 'Custom', period: '', color: 'border-gray-200', features: ['Bulk seat licensing', 'Cohort analytics', 'Custom content', 'Dedicated support', 'SLA guarantee'], cta: 'Contact Us', href: 'mailto:support@psycometriccoach.online' },
];

// ── Live Chat Widget ───────────────────────────────────────────────────────
function LiveChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'chat' | 'done'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const startChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStep('chat');
    setMessages([{
      from: 'bot',
      text: `Hi ${name}! 👋 Welcome to PsychometricCoach support. How can I help you today? You can ask about our test categories, pricing, technical issues, or share any feedback.`
    }]);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setSending(true);

    // Auto-reply bot logic
    setTimeout(() => {
      let reply = "Thanks for your message! Our support team has been notified and will follow up at your email within 24 hours. Is there anything else I can help you with?";
      const lower = userMsg.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('premium')) {
        reply = "Our Premium plan is $9.99/month with unlimited questions, all 15 categories, full mock exams, and AI explanations. We also have a forever-free plan with 20 questions/day. Would you like to upgrade?";
      } else if (lower.includes('category') || lower.includes('question') || lower.includes('test')) {
        reply = "We cover 15 test categories including Numerical, Verbal, Abstract, Logical, Spatial, Error Checking, Mechanical, Situational Judgement, and more — with 325+ expert questions and growing!";
      } else if (lower.includes('android') || lower.includes('app') || lower.includes('download') || lower.includes('apk')) {
        reply = "You can download our Android app at: https://www.psychometriccoach.com/download/ — or install it as a PWA from your browser on any device!";
      } else if (lower.includes('password') || lower.includes('login') || lower.includes('account') || lower.includes('sign')) {
        reply = "For account issues, please email us directly at support@psycometriccoach.online and we'll sort it out within a few hours.";
      } else if (lower.includes('feedback') || lower.includes('suggest') || lower.includes('improve')) {
        reply = "Thank you for your feedback! 🙏 We really appreciate it — your suggestions help us improve. Our team has been notified and will review it.";
      }
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      setSending(false);

      // Send to support email via API
      fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://www.psychometriccoach.com/api'}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: userMsg }),
      }).catch(() => {/* silent fail */});
    }, 1000);
  };

  const endChat = () => {
    setStep('done');
    setTimeout(() => {
      setOpen(false);
      setStep('form');
      setName('');
      setEmail('');
      setMessages([]);
    }, 3000);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-brand-dark transition-all hover:scale-105"
        aria-label="Open live chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden" style={{ maxHeight: '500px' }}>
          {/* Header */}
          <div className="bg-brand text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-black text-sm">P</div>
            <div>
              <div className="font-semibold text-sm">PsychometricCoach Support</div>
              <div className="text-xs text-blue-100 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> Online · replies in minutes</div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: '200px' }}>
            {step === 'form' && (
              <form onSubmit={startChat} className="space-y-3">
                <p className="text-sm text-gray-600">👋 Hi there! Before we start, please tell us who you are.</p>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Your Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Banda"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-brand text-white font-semibold py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors">
                  Start Chat →
                </button>
              </form>
            )}

            {step === 'chat' && messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.from === 'user' ? 'bg-brand text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-400 animate-pulse">Typing…</div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm text-gray-600 font-medium">Thanks for reaching out!</p>
                <p className="text-xs text-gray-400 mt-1">We&apos;ll follow up at {email}</p>
              </div>
            )}
          </div>

          {/* Input */}
          {step === 'chat' && (
            <div className="border-t border-gray-100 p-3 bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                  disabled={sending}
                />
                <button type="submit" disabled={sending || !input.trim()} className="bg-brand text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-40">→</button>
              </form>
              <button onClick={endChat} className="w-full mt-2 text-xs text-gray-400 hover:text-error transition-colors">End conversation</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
            <span className="font-bold text-brand text-lg">PsychometricCoach</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/advertise" className="text-sm font-medium text-gray-500 hover:text-brand px-3 py-2 hidden sm:block">Advertise</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand px-3 py-2">Sign In</Link>
            <Link href="/register" className="text-sm font-semibold bg-brand text-white px-4 py-2 rounded-xl hover:bg-brand-dark">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🚀 Now with AI-powered adaptive learning
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
            Ace Your<br />
            <span className="text-gold">Psychometric Tests</span>
          </h1>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Intelligent, adaptive preparation across 15+ test types. Our AI identifies your weaknesses and builds you a personalised path to test-day confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gold text-brand font-bold px-8 py-4 rounded-2xl text-lg hover:bg-gold-light transition-all hover:scale-105">
              Start Free Today →
            </Link>
            <Link href="/login" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/10">
              Sign In
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-6">No credit card required · Free plan available forever</p>
        </div>
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[['5,000+', 'Practice Questions'], ['15', 'Test Categories'], ['10K+', 'Active Learners']].map(([n, l]) => (
            <div key={l} className="bg-white/10 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-gold">{n}</div>
              <div className="text-sm text-blue-100 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ⭐ VIRTUAL INTERVIEW PANEL — flagship feature showcase */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(160deg,#1B365D 0%,#12233f 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background:'#D4AF37', color:'#1B365D' }}>New · AI Interview Coach</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Meet Your Virtual Interview Panel 🎤</h2>
            <p className="text-blue-50/80 max-w-2xl mx-auto">Face four AI interviewers in a realistic panel — answer by voice or text and get instant STAR-based scoring and coaching. The most realistic interview practice anywhere.</p>
          </div>
          <div className="flex justify-center items-end gap-3 sm:gap-6 mb-8">
            {[['tech_lead','Technical Lead'],['hr_manager','HR & Culture'],['product_manager','Product Manager'],['exec_director','Exec Director']].map(([a,label],i)=>(
              <div key={a} className="text-center" style={{ transform: i===1||i===2?'translateY(-10px)':'none' }}>
                <img src={`/panelists/${a}.jpg`} alt={label} className="rounded-full mx-auto"
                  style={{ width: 'clamp(56px,15vw,96px)', height: 'clamp(56px,15vw,96px)', border:'3px solid #D4AF37', boxShadow:'0 8px 24px rgba(0,0,0,.3)' }} />
                <p className="text-white text-[10px] sm:text-xs font-bold mt-2">{label}</p>
              </div>
            ))}
          </div>

          {/* Rotating animated ad preview — 4 categories, each a real question */}
          <InterviewAdCarousel />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="font-bold px-8 py-4 rounded-2xl text-lg text-center transition-all hover:scale-105" style={{ background:'#D4AF37', color:'#1B365D' }}>Try the Interview Panel →</Link>
            <Link href="/login" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-lg text-center hover:bg-white/10">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── VIDEO SHOWCASE ── */}
      <VideoShowcase />

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

      {/* Categories */}
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

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white" id="contact">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Get in Touch</h2>
            <p className="text-gray-500">Have a question, feedback or partnership enquiry? We&apos;d love to hear from you.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 text-center">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
              <p className="text-sm text-gray-500 mb-3">We reply within 24 hours</p>
              <a href="mailto:support@psycometriccoach.online" className="text-brand font-semibold text-sm hover:underline">support@psycometriccoach.online</a>
            </div>
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 text-center">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
              <p className="text-sm text-gray-500 mb-3">Chat with us right now</p>
              <button
                onClick={() => {
                  const btn = document.querySelector('[aria-label="Open live chat"]') as HTMLButtonElement;
                  if (btn) btn.click();
                }}
                className="text-brand font-semibold text-sm hover:underline"
              >
                Start a conversation →
              </button>
            </div>
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 text-center">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-bold text-gray-900 mb-1">Download App</h3>
              <p className="text-sm text-gray-500 mb-3">Get the Android app</p>
              <a href="/download/" className="text-brand font-semibold text-sm hover:underline">Download APK →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Ready to start practising?</h2>
          <p className="text-blue-50 mb-8">Join thousands of candidates who improved their scores with PsychometricCoach.</p>
          <Link href="/register" className="inline-block bg-gold text-brand font-bold px-10 py-4 rounded-2xl text-lg hover:bg-gold-light hover:scale-105 transition-all">
            Get Started — It is Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-sm mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand rounded flex items-center justify-center text-white font-black text-xs">P</div>
              <span className="text-white font-semibold">PsychometricCoach</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <a href="#contact" className="hover:text-white">Contact</a>
              <a href="mailto:support@psycometriccoach.online" className="hover:text-white">support@psycometriccoach.online</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            © 2026 PsychometricCoach. All rights reserved. · <a href="https://www.psychometriccoach.com" className="hover:text-gray-400">www.psychometriccoach.com</a>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <LiveChat />
    </div>
  );
}
