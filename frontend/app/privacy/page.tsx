export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: January 2026</p>
      {[
        ['Data We Collect', 'We collect your name, email address, and usage data (questions answered, scores, timing). We do not collect payment card details — payments are processed securely by third-party providers.'],
        ['How We Use Your Data', 'Your data is used solely to power the adaptive learning engine, generate your personalised study plan, and track your progress. We do not sell or share your personal data with third parties.'],
        ['Data Security', 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Passwords are hashed using bcrypt and never stored in plain text.'],
        ['Your Rights', 'You may request a copy of your data or request permanent deletion at any time by emailing privacy@psychometriccoach.com. We will respond within 30 days.'],
        ['Cookies', 'We use essential session cookies only. No advertising or tracking cookies are used.'],
        ['Contact', 'Questions about this policy: privacy@psychometriccoach.com'],
      ].map(([t, b]) => (
        <div key={t} className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{b}</p>
        </div>
      ))}
    </div>
  );
}
