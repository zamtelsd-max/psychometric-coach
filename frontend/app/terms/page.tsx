export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: January 2026</p>
      {[
        ['Acceptance', 'By using PsychometricCoach you agree to these terms.'],
        ['Purpose', 'PsychometricCoach is a practice and preparation tool only. It is NOT a clinical diagnostic tool or medical device. Scores are for educational purposes and should not be used for clinical assessment.'],
        ['Free Plan Limits', 'Free accounts are limited to 20 practice questions per day and 5 categories. Premium features require a paid subscription.'],
        ['Subscriptions', 'Premium subscriptions are billed monthly or annually. Cancellation stops future billing but does not trigger automatic refunds. Refund requests are reviewed case by case.'],
        ['Intellectual Property', 'All question content, explanations, and platform design are owned by PsychometricCoach. You may not reproduce or redistribute content without written permission.'],
        ['Limitation of Liability', 'We provide this service as-is. We are not liable for any employment or admissions decisions made based on your use of the platform.'],
        ['Contact', 'legal@psychometriccoach.com'],
      ].map(([t, b]) => (
        <div key={t} className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{b}</p>
        </div>
      ))}
    </div>
  );
}
