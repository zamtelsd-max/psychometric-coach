// Enrich the 12 AI Growth Center modules into full mini-lessons.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Shared HTML helpers for consistent, rich formatting.
const S = {
  intro: (t) => `<p class="lead">${t}</p>`,
  h: (t) => `<h3>${t}</h3>`,
  ex: (title, body) => `<div class="worked"><div class="worked-h">📝 ${title}</div>${body}</div>`,
  tip: (t) => `<div class="callout tip"><b>💡 Pro tip:</b> ${t}</div>`,
  warn: (t) => `<div class="callout warn"><b>⚠️ Common mistake:</b> ${t}</div>`,
  key: (items) => `<div class="callout key"><b>🎯 Key takeaways</b><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`,
  quiz: (q, a) => `<details class="quiz"><summary>✅ Try it: ${q}</summary><div>${a}</div></details>`,
};

const MODULES = {
  'Ratios & Proportions Fast Track': `
${S.intro('Ratios are everywhere in aptitude tests — from splitting revenue to scaling recipes. Master the "parts" method and you\'ll solve them in seconds while others reach for a calculator.')}
${S.h('The core idea: think in parts')}
<p>A ratio like <b>3:5</b> means the whole is divided into <b>3 + 5 = 8 equal parts</b>. Once you know the value of one part, everything else follows.</p>
${S.ex('Worked example — splitting a total', `<p><b>A : B = 3 : 5</b> and <b>A + B = 40</b>.</p><ol><li>Total parts = 3 + 5 = <b>8</b></li><li>One part = 40 ÷ 8 = <b>5</b></li><li>A = 3 × 5 = <b>15</b>, B = 5 × 5 = <b>25</b></li></ol><p>Check: 15 + 25 = 40 ✓</p>`)}
${S.h('Three techniques worth knowing')}
<ul>
<li><b>Parts method</b> (above) — best when you know the total.</li>
<li><b>Scaling</b> — multiply both sides by the same number: 3:5 = 6:10 = 30:50.</li>
<li><b>Cross-multiplication</b> — for "A is to B as C is to D": if 2:3 = x:18, then 3x = 2×18, so x = 12.</li>
</ul>
${S.ex('Worked example — three-way split', `<p>Profit of <b>K72,000</b> shared 2:3:4 between partners.</p><p>Parts = 9, one part = K8,000 → <b>K16,000 / K24,000 / K32,000</b>.</p>`)}
${S.warn('Don\'t divide the total by the number of names (72,000 ÷ 3). Divide by the number of <em>parts</em>.')}
${S.tip('If a ratio "increases by" or "changes to", re-anchor on the new total parts — never reuse the old one-part value.')}
${S.quiz('A recipe uses flour:sugar 5:2. You have 350g flour. How much sugar?', '<p>One part = 350 ÷ 5 = 70g → sugar = 2 × 70 = <b>140g</b>.</p>')}
${S.key(['A ratio splits a whole into equal parts.', 'Find one-part value first, then scale.', 'Divide by total parts, not by the count of items.', 'Always sanity-check that shares add to the total.'])}`,

  'Percentage Change Without Panic': `
${S.intro('Percentages trip people up because the "base" keeps moving. Nail down what you\'re comparing against and the arithmetic becomes trivial.')}
${S.h('The one formula you need')}
<p><b>% change = (new − old) ÷ old × 100</b>. The denominator is always the <em>original</em> value.</p>
${S.ex('Worked example — a price rise', `<p>Price goes K1.2m → K1.5m.</p><p>Change = (1.5 − 1.2) ÷ 1.2 × 100 = 0.3 ÷ 1.2 × 100 = <b>25%</b> increase.</p>`)}
${S.h('Reverse percentages (the tricky ones)')}
<p>If a price <b>after</b> a 20% discount is K160, the K160 represents <b>80%</b> of the original. So original = 160 ÷ 0.8 = <b>K200</b>.</p>
${S.warn('A 20% rise then a 20% fall does NOT return you to the start. K100 → K120 → K96. The fall is taken from the larger base.')}
${S.h('Multipliers = speed')}
<p>Turn percentages into multipliers: +15% = ×1.15, −30% = ×0.70. Chain them: a K5,000 item, +10% tax then −25% sale = 5000 × 1.10 × 0.75 = <b>K4,125</b>.</p>
${S.tip('Percentage points ≠ percent. Going from 20% to 25% is a 5 percentage-point rise but a 25% relative increase.')}
${S.quiz('Sales fell from 800 to 680. What % drop?', '<p>(800 − 680) ÷ 800 × 100 = 120 ÷ 800 = <b>15%</b>.</p>')}
${S.key(['Always divide by the original value.', 'After-discount price is a % of the original — divide to reverse.', 'Use multipliers (×1.15, ×0.7) to chain changes fast.', 'Successive changes compound; they don\'t cancel.'])}`,

  'Speed Reading Comprehension': `
${S.intro('Verbal tests reward readers who extract structure, not those who read every word. Train your eyes to hunt for the argument, not the prose.')}
${S.h('Read for structure, not detail')}
<p>Before answering, find these in any passage: the <b>main claim</b>, the <b>evidence</b>, and any <b>qualifier</b> ("some", "usually", "except"). Answers almost always hinge on a qualifier.</p>
${S.ex('Spotting the trap word', `<p><i>"Most district clinics reported stock-outs in 2024."</i></p><p>Statement: <i>"All clinics had stock-outs."</i> → <b>False</b> — "most" ≠ "all". The qualifier is the whole game.</p>`)}
${S.h('The True / False / Cannot Say discipline')}
<ul><li><b>True</b> — the passage <em>directly supports</em> it.</li><li><b>False</b> — the passage <em>contradicts</em> it.</li><li><b>Cannot Say</b> — plausible but <em>not stated</em>. When in doubt between False and Cannot Say, ask: "Did the text actually rule this out?"</li></ul>
${S.warn('Never use outside knowledge. If the passage doesn\'t say it, "Cannot Say" — even if you know it\'s true in real life.')}
${S.tip('Skim the questions first, then read the passage hunting for those specific claims. You\'ll read with purpose and 40% faster.')}
${S.quiz('Passage: "The report covered only urban schools." Statement: "Rural schools performed worse." True/False/Cannot Say?', '<p><b>Cannot Say</b> — rural schools weren\'t in scope, so nothing is stated about them.</p>')}
${S.key(['Hunt for main claim, evidence, and qualifiers.', 'Qualifiers (most/all/some/except) decide most answers.', '"Cannot Say" = plausible but not stated.', 'Never import outside knowledge.'])}`,

  'Analogy & Vocabulary Patterns': `
${S.intro('Analogies test whether you can name the relationship between two words — then apply it. The skill is precision: describe the link in a short sentence.')}
${S.h('Bridge the pair with a sentence')}
<p>For <b>PEN : WRITE</b>, say "a pen is used to write." Now apply that exact sentence: <b>KNIFE : ___</b> → "a knife is used to <b>cut</b>."</p>
${S.h('Common relationship types')}
<ul><li><b>Function</b> — pen : write</li><li><b>Part : whole</b> — page : book</li><li><b>Degree</b> — warm : hot (intensity)</li><li><b>Category</b> — rose : flower</li><li><b>Antonym / synonym</b> — hot : cold</li><li><b>Cause : effect</b> — rain : flood</li></ul>
${S.ex('Worked example', `<p><b>DOCTOR : HOSPITAL :: TEACHER : ?</b></p><p>Bridge: "a doctor works in a hospital" → a teacher works in a <b>school</b>.</p>`)}
${S.warn('Watch word order and direction. "big : small" is opposite; "small : tiny" is degree. Keep the order consistent on both sides.')}
${S.tip('If two answers seem right, make your bridge sentence more specific until only one fits.')}
${S.quiz('LIBRARY : BOOKS :: BANK : ?', '<p>Bridge: "a library stores books" → a bank stores <b>money</b>.</p>')}
${S.key(['State the relationship as a short sentence.', 'Reapply the exact sentence to the answer pair.', 'Keep word order/direction consistent.', 'Tighten your bridge to break ties.'])}`,

  'Matrices & Sequence Logic': `
${S.intro('Abstract reasoning looks intimidating but obeys a small set of rules. Learn to scan systematically and the "hard" items become mechanical.')}
${S.h('Scan on five dimensions')}
<ol><li><b>Shape</b> — does it change/rotate/reflect?</li><li><b>Number</b> — count of elements increasing/decreasing?</li><li><b>Position</b> — moving clockwise, shifting?</li><li><b>Shading/colour</b> — alternating, filling?</li><li><b>Size</b> — growing/shrinking?</li></ol>
${S.ex('Worked example — a number sequence', `<p><b>2, 6, 12, 20, 30, ?</b></p><p>Differences: 4, 6, 8, 10 → next difference 12 → <b>42</b>. (These are n²+n.)</p>`)}
${S.h('Grid matrices')}
<p>Read rows AND columns. Often one rule governs rows (e.g. rotate 90°) and another governs columns (e.g. add a dot). The missing cell must satisfy both.</p>
${S.warn('Don\'t lock onto the first pattern you spot. Verify it against every cell before choosing — many options are "almost right" decoys.')}
${S.tip('For number series, always write the differences underneath. If they aren\'t constant, take differences again (second differences) or check ratios.')}
${S.quiz('1, 4, 9, 16, ?', '<p>Perfect squares → 5² = <b>25</b>.</p>')}
${S.key(['Scan shape, number, position, shading, size.', 'Write differences for number series.', 'Grid matrices obey row AND column rules.', 'Verify the rule on every cell before answering.'])}`,

  'Syllogisms & Deduction': `
${S.intro('Syllogisms test whether a conclusion <em>must</em> follow — not whether it sounds reasonable. Draw it, don\'t feel it.')}
${S.h('Use circles (Venn) to be certain')}
<p>"All A are B; all B are C" → draw A inside B inside C → therefore <b>all A are C</b> (valid). Diagrams remove guesswork.</p>
${S.ex('Worked example', `<p>Premise 1: All managers are employees.<br>Premise 2: Some employees work weekends.<br>Conclusion: "Some managers work weekends." → <b>Does NOT follow</b> — the weekend workers might all be non-managers.</p>`)}
${S.h('Watch the quantifiers')}
<ul><li><b>All</b> / <b>No</b> — universal, strong.</li><li><b>Some</b> — at least one; "some are" does not imply "some are not".</li></ul>
${S.warn('"Some A are B" never lets you conclude anything about ALL A. Overreach on "some" is the #1 syllogism error.')}
${S.tip('If a conclusion only "might" be true, it\'s invalid. Valid means it is true in every possible diagram.')}
${S.quiz('All cats are mammals. No mammals are fish. Conclusion: No cats are fish. Valid?', '<p><b>Valid</b> — cats sit inside mammals, which is entirely outside fish.</p>')}
${S.key(['Valid = must be true in every case.', 'Draw Venn circles instead of reasoning verbally.', '"Some" is weak — never generalise to "all".', 'Plausible ≠ valid.'])}`,

  'Spatial Folding & Rotation': `
${S.intro('Spatial items reward mental manipulation. Build a few reliable habits and you\'ll stop second-guessing rotations.')}
${S.h('Net folding — track adjacent faces')}
<p>When folding a net into a cube, opposite faces are never adjacent in the flat net (they\'re separated by one square). Track which faces touch as you fold.</p>
${S.ex('Rotation vs reflection', `<p>A rotated shape keeps the same "handedness"; a <b>reflected</b> shape is a mirror image. If an answer looks right but is flipped, it\'s a reflection decoy — reject it.</p>`)}
${S.h('Anchor on one feature')}
<p>Pick a unique marker (an arrow, a dot) and follow ONLY that through each option. You don\'t need to rotate the whole figure — just verify the anchor lands correctly.</p>
${S.warn('Mirror images are the classic trap. Rotation never turns a left-hand shape into a right-hand one.')}
${S.tip('For dice/cube nets, remember: 1 pairs with the face two squares away in a straight line.')}
${S.quiz('If two faces are directly adjacent in a cube net (side by side), can they be opposite faces on the cube?', '<p><b>No</b> — adjacent-in-net faces always end up touching, so they can\'t be opposite.</p>')}
${S.key(['Opposite cube faces are never side-by-side in the net.', 'Rotation preserves handedness; reflection flips it.', 'Follow one anchor feature, not the whole shape.', 'Reject mirror-image decoys.'])}`,

  'SJT: Prioritise Like a Manager': `
${S.intro('Situational Judgement Tests reward the response a calm, competent professional would choose — not the most aggressive or the most passive one. Learn the underlying values.')}
${S.h('The three values assessors look for')}
<ol><li><b>Ownership</b> — address issues directly, don\'t deflect.</li><li><b>Respect</b> — protect relationships; escalate only when needed.</li><li><b>Impact</b> — solve the actual problem, not just the symptom.</li></ol>
${S.ex('Worked example', `<p><i>A teammate misses a deadline that affects your delivery.</i></p><p><b>Most effective:</b> Speak to them privately, understand why, agree a fix. (ownership + respect)<br><b>Least effective:</b> Complain to other colleagues. (no ownership, damages trust)</p>`)}
${S.h('Ranking most / least')}
<p>The "most effective" option usually combines <b>direct action + respect</b>. The "least effective" is typically <b>gossip, blame, or ignoring the problem</b>. Extreme options (report to CEO immediately) are rarely correct.</p>
${S.warn('Avoid the two extremes: doing nothing, and going nuclear. The best answer is almost always the measured, direct one.')}
${S.tip('Ask: "What would a trusted, senior colleague do?" — not "What would feel satisfying?"')}
${S.quiz('An angry customer blames you for a fault that wasn\'t yours. Best first move?', '<p>Acknowledge, apologise for the <em>impact</em>, and resolve it — not "explain it wasn\'t my fault."</p>')}
${S.key(['Look for ownership, respect, and real impact.', 'Best = direct + respectful.', 'Worst = gossip, blame, or inaction.', 'Avoid both extremes.'])}`,

  'Negotiation Value Claims': `
${S.intro('Great negotiators expand the pie before dividing it. This module covers the two moves that separate amateurs from professionals: anchoring and trading.')}
${S.h('Anchor with intent')}
<p>The first credible number shapes the whole negotiation. Open ambitiously but justifiably — an anchor with a reason ("based on market rate X") holds; a random high number gets dismissed.</p>
${S.ex('Trading, not conceding', `<p>Instead of "I\'ll drop the price," say <b>"I can move on price if you commit to a 12-month term."</b> Every concession buys something back.</p>`)}
${S.h('Know your numbers')}
<ul><li><b>BATNA</b> — your Best Alternative To a Negotiated Agreement. Your walk-away power.</li><li><b>ZOPA</b> — the Zone Of Possible Agreement, where both parties\' ranges overlap.</li><li><b>Reservation price</b> — the worst deal you\'d still accept.</li></ul>
${S.warn('Never make the first concession without a trade. One-sided concessions signal you had slack — and invite more demands.')}
${S.tip('Silence is a tool. After you state your anchor, stop talking. The pressure works in your favour.')}
${S.quiz('The other side rejects your price flatly. Better response: cut the price, or ask "what would make this work for you?"', '<p>Ask the question — it surfaces their real constraint and lets you trade rather than just discount.</p>')}
${S.key(['Anchor first, with justification.', 'Trade concessions — never give freely.', 'Know your BATNA, ZOPA, and reservation price.', 'Use silence after your anchor.'])}`,

  'Funnel Diagnostics in Practice': `
${S.intro('A marketing funnel leaks at specific stages. The skill is finding <em>where</em> the drop-off is worst, because that\'s where a fix pays off most.')}
${S.h('The stages')}
<p><b>Awareness → Interest → Consideration → Conversion → Retention.</b> Track the conversion rate <em>between</em> each stage, not just totals.</p>
${S.ex('Diagnosing the leak', `<p>10,000 visitors → 2,000 add-to-cart (20%) → 200 purchase (10% of cart).</p><p>The visitor→cart step is healthy; the <b>cart→purchase</b> step (10%) is the leak. Fix checkout friction, not ad spend.</p>`)}
${S.h('Which metric matters at each stage')}
<ul><li>Awareness → reach, impressions, CPM</li><li>Interest → click-through rate</li><li>Consideration → add-to-cart, time on page</li><li>Conversion → checkout completion</li><li>Retention → repeat rate, churn</li></ul>
${S.warn('Don\'t pour budget into the top of the funnel when the leak is at the bottom. More traffic through a broken checkout just wastes spend.')}
${S.tip('Always compare stage-to-stage conversion against a benchmark. A 2% site-wide conversion can hide a 60% cart-abandonment problem.')}
${S.quiz('CTR is great but sales are flat. Where do you look?', '<p>Downstream — landing page, offer, or checkout. Clicks are fine; something after the click is failing.</p>')}
${S.key(['Measure conversion between stages, not just totals.', 'Fix the biggest leak first.', 'Each stage has its own key metric.', 'More top-funnel traffic won\'t fix a bottom-funnel leak.'])}`,

  'Ransomware First Response': `
${S.intro('When ransomware hits, the first 30 minutes decide the damage. This module is the response playbook every ICT professional should know cold.')}
${S.h('The immediate sequence — ISOLATE first')}
<ol><li><b>Isolate</b> — disconnect affected machines from the network (unplug/disable Wi-Fi). Stop the spread before anything else.</li><li><b>Preserve</b> — do NOT power off (you lose memory forensics); do NOT wipe yet.</li><li><b>Notify</b> — alert the incident response team and management.</li><li><b>Assess</b> — identify the strain, scope, and whether backups are intact.</li></ol>
${S.ex('Why isolation beats shutdown', `<p>Pulling the network cable halts lateral spread while keeping volatile evidence (encryption keys sometimes sit in RAM) available for forensics. A hard shutdown destroys that.</p>`)}
${S.h('Recovery, not ransom')}
<p>Restore from <b>clean, offline backups</b>. Paying is discouraged — it funds crime and offers no guarantee. Verify backups are uninfected before restoring.</p>
${S.warn('Never reconnect a "cleaned" machine to the network before confirming the malware and its persistence mechanisms are fully removed.')}
${S.tip('The best ransomware defence is tested, <em>offline</em> (air-gapped) backups plus least-privilege access. Prevention beats response every time.')}
${S.quiz('First action when a workstation shows a ransom note?', '<p><b>Isolate it from the network</b> — before investigating, notifying, or shutting down.</p>')}
${S.key(['Isolate before anything else.', 'Don\'t power off — preserve forensic evidence.', 'Notify the IR team and management.', 'Recover from offline backups; don\'t pay.'])}`,

  'Budget Cuts by Zero-Based Review': `
${S.intro('Zero-based budgeting (ZBB) rebuilds the budget from scratch each cycle — every expense must justify itself, not just inherit last year\'s number. It\'s the sharpest tool for finding real savings.')}
${S.h('Traditional vs zero-based')}
<p><b>Traditional:</b> start from last year, adjust by a few %. <b>Zero-based:</b> start from zero; every line must be re-justified against current goals.</p>
${S.ex('Worked example', `<p>A department spent K500k on software last year. ZBB asks: <i>which licences are actually used?</i> An audit finds 40% unused → immediate <b>K200k</b> saving, with no impact on output.</p>`)}
${S.h('How to run a ZBB review')}
<ol><li>List every activity and its cost.</li><li>Rank by value delivered vs strategic goals.</li><li>Fund from the top down until the budget is exhausted.</li><li>Cut or defer everything below the line.</li></ol>
${S.warn('Don\'t protect a cost just because "we\'ve always spent it." Legacy spend is exactly what ZBB exists to expose.')}
${S.tip('Distinguish <b>fixed/contractual</b> costs (hard to cut short-term) from <b>discretionary</b> ones (cut first). Target discretionary spend for quick wins.')}
${S.quiz('Two teams both request K1m. One drives 60% of revenue, the other 5%. How does ZBB allocate under constraint?', '<p>Fund by value delivered — the revenue-driving team is prioritised; the low-value request is trimmed or deferred.</p>')}
${S.key(['ZBB rebuilds from zero — no automatic carry-over.', 'Every line must justify itself against current goals.', 'Rank by value, fund top-down.', 'Cut discretionary before fixed costs.'])}`,
};

(async () => {
  const mods = await p.learningModule.findMany();
  let updated = 0;
  for (const m of mods) {
    const html = MODULES[m.title];
    if (!html) { console.log('  (no enrichment for:', m.title, ')'); continue; }
    // recompute est minutes ~ words/200
    const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(3, Math.round(words / 180));
    await p.learningModule.update({ where: { id: m.id }, data: { contentHtml: html.trim(), estMinutes } });
    updated++;
    console.log(`  ✓ ${m.title} — ${html.length} chars, ~${estMinutes} min`);
  }
  console.log('Enriched', updated, 'of', mods.length, 'modules');
  await p.$disconnect();
})();
