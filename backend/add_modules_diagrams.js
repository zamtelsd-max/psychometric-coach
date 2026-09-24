// Add NEW Growth Center modules + inject inline SVG diagrams into lessons.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const S = {
  intro: (t) => `<p class="lead">${t}</p>`,
  h: (t) => `<h3>${t}</h3>`,
  ex: (title, body) => `<div class="worked"><div class="worked-h">📝 ${title}</div>${body}</div>`,
  tip: (t) => `<div class="callout tip"><b>💡 Pro tip:</b> ${t}</div>`,
  warn: (t) => `<div class="callout warn"><b>⚠️ Common mistake:</b> ${t}</div>`,
  key: (items) => `<div class="callout key"><b>🎯 Key takeaways</b><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`,
  quiz: (q, a) => `<details class="quiz"><summary>✅ Try it: ${q}</summary><div>${a}</div></details>`,
  fig: (svg, caption) => `<figure class="diagram">${svg}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`,
};

// ── Reusable SVG diagrams (dark-theme friendly) ──
const SVG = {
  funnel: `<svg viewBox="0 0 320 200" width="100%" style="max-width:340px;margin:auto;display:block">
    <polygon points="20,20 300,20 250,60 70,60" fill="#3b82f6" opacity="0.85"/>
    <polygon points="70,64 250,64 215,104 105,104" fill="#6366f1" opacity="0.85"/>
    <polygon points="105,108 215,108 185,148 135,148" fill="#8b5cf6" opacity="0.85"/>
    <polygon points="135,152 185,152 165,188 155,188" fill="#22c55e" opacity="0.9"/>
    <text x="160" y="44" fill="#fff" font-size="12" text-anchor="middle">Awareness 10,000</text>
    <text x="160" y="88" fill="#fff" font-size="12" text-anchor="middle">Cart 2,000 (20%)</text>
    <text x="160" y="132" fill="#fff" font-size="11" text-anchor="middle">Purchase 200 (10%)</text>
    <text x="160" y="176" fill="#fff" font-size="10" text-anchor="middle">Repeat</text>
  </svg>`,
  normalDist: `<svg viewBox="0 0 320 170" width="100%" style="max-width:360px;margin:auto;display:block">
    <path d="M20,150 C90,150 90,30 160,30 C230,30 230,150 300,150" fill="none" stroke="#E3B84B" stroke-width="2.5"/>
    <line x1="160" y1="30" x2="160" y2="150" stroke="#94a3b8" stroke-dasharray="3"/>
    <line x1="90" y1="150" x2="90" y2="95" stroke="#64748b" stroke-dasharray="2"/>
    <line x1="230" y1="150" x2="230" y2="95" stroke="#64748b" stroke-dasharray="2"/>
    <text x="160" y="165" fill="#cbd5e1" font-size="11" text-anchor="middle">mean (50th %ile)</text>
    <text x="90" y="90" fill="#94a3b8" font-size="10" text-anchor="middle">−1σ (16th)</text>
    <text x="230" y="90" fill="#94a3b8" font-size="10" text-anchor="middle">+1σ (84th)</text>
  </svg>`,
  cube: `<svg viewBox="0 0 300 150" width="100%" style="max-width:320px;margin:auto;display:block">
    <rect x="20" y="55" width="30" height="30" fill="#3b82f6" stroke="#0b1420"/>
    <rect x="50" y="25" width="30" height="30" fill="#6366f1" stroke="#0b1420"/>
    <rect x="50" y="55" width="30" height="30" fill="#8b5cf6" stroke="#0b1420"/>
    <rect x="50" y="85" width="30" height="30" fill="#22c55e" stroke="#0b1420"/>
    <rect x="80" y="55" width="30" height="30" fill="#f59e0b" stroke="#0b1420"/>
    <rect x="110" y="55" width="30" height="30" fill="#ef4444" stroke="#0b1420"/>
    <text x="80" y="135" fill="#cbd5e1" font-size="11" text-anchor="middle">cube net — folds into a cube</text>
    <text x="180" y="70" fill="#94a3b8" font-size="10">opposite faces are never</text>
    <text x="180" y="84" fill="#94a3b8" font-size="10">side-by-side in the net</text>
  </svg>`,
  venn: `<svg viewBox="0 0 300 150" width="100%" style="max-width:300px;margin:auto;display:block">
    <circle cx="120" cy="75" r="55" fill="#3b82f6" opacity="0.35" stroke="#3b82f6"/>
    <circle cx="180" cy="75" r="55" fill="#22c55e" opacity="0.35" stroke="#22c55e"/>
    <text x="95" y="80" fill="#fff" font-size="12" text-anchor="middle">A</text>
    <text x="205" y="80" fill="#fff" font-size="12" text-anchor="middle">B</text>
    <text x="150" y="80" fill="#fff" font-size="11" text-anchor="middle">A∩B</text>
  </svg>`,
  circuit: `<svg viewBox="0 0 320 140" width="100%" style="max-width:340px;margin:auto;display:block">
    <rect x="30" y="50" width="50" height="40" rx="5" fill="#1e3a5f" stroke="#E3B84B"/>
    <text x="55" y="74" fill="#fff" font-size="9" text-anchor="middle">Pico</text>
    <line x1="80" y1="70" x2="140" y2="70" stroke="#E3B84B" stroke-width="2"/>
    <rect x="140" y="55" width="20" height="30" fill="#f59e0b"/><text x="150" y="105" fill="#94a3b8" font-size="8" text-anchor="middle">resistor</text>
    <line x1="160" y1="70" x2="210" y2="70" stroke="#E3B84B" stroke-width="2"/>
    <circle cx="230" cy="70" r="20" fill="#22c55e" opacity="0.8"/><text x="230" y="74" fill="#fff" font-size="9" text-anchor="middle">pump</text>
    <text x="160" y="130" fill="#cbd5e1" font-size="10" text-anchor="middle">resistor protects the actuator from overcurrent</text>
  </svg>`,
};

// ── Inject diagrams into EXISTING modules ──
const INJECT = {
  'Funnel Diagnostics in Practice': { after: 'The stages', html: S.fig(SVG.funnel, 'A leaky funnel — the biggest % drop is where to focus.') },
  'Matrices & Sequence Logic': { after: 'Scan on five dimensions', html: '' },
  'Spatial Folding & Rotation': { after: 'Net folding', html: S.fig(SVG.cube, 'Adjacent faces in the net end up touching — so they can\'t be opposite.') },
  'Syllogisms & Deduction': { after: 'Use circles', html: S.fig(SVG.venn, 'Venn circles make validity visible.') },
  'Ransomware First Response': { after: '', html: '' },
};

// ── NEW modules (with diagrams + quizzes) ──
const NEW = [
  {
    title: 'Reading Data from Charts & Tables', format: 'READ',
    tags: ['Numerical Reasoning', 'Data Interpretation'],
    contentHtml: `
${S.intro('Half of numerical test items are really reading tests in disguise — the maths is easy once you read the chart correctly. Slow down on the axes and units.')}
${S.h('Read the frame before the data')}
<p>Check the <b>title</b>, <b>axis labels</b>, and <b>units</b> first. Many wrong answers come from missing a "in thousands" note or a broken axis.</p>
${S.fig(SVG.funnel, 'Always confirm what each layer/segment represents before calculating.')}
${S.ex('Two-step trap', `<p>A bar shows revenue "in K millions". The bar at 3.5 means <b>K3,500,000</b> — not K3.5. Read the unit, then compute.</p>`)}
${S.warn('Watch for percentages of different totals. "20% of sales" and "20% of profit" are different amounts.')}
${S.tip('For pie charts, remember the whole = 100% = 360°. A 90° slice is exactly 25%.')}
${S.quiz('A pie slice spans 72°. What percentage is that?', '<p>72/360 × 100 = <b>20%</b>.</p>')}
${S.key(['Read title, axes, and units first.', 'Apply the stated unit before calculating.', 'Percentages may use different bases.', 'Pie: 360° = 100%.'])}`,
    quiz: [
      { q: 'A bar labelled "K millions" reads 3.5. The value is:', k: 'A', opts: ['K3,500,000', 'K3.5', 'K350,000', 'K35,000'] },
      { q: 'A pie slice spans 90°. What percentage?', k: 'A', opts: ['25%', '90%', '50%', '10%'] },
      { q: 'First thing to check on any chart:', k: 'A', opts: ['Title, axes, and units', 'The biggest bar', 'The colour', 'The footnote only'] },
    ],
  },
  {
    title: 'Understanding Your Percentile Score', format: 'READ',
    tags: ['Personality & Behavioural', 'Test Strategy'],
    contentHtml: `
${S.intro('Aptitude results are usually reported as percentiles, not raw scores. Knowing what a percentile means stops you panicking over a "60%".')}
${S.h('Percentile ≠ percentage')}
<p>A <b>70th percentile</b> means you scored better than 70% of the comparison group — it is NOT "70% correct". Employers compare you to other candidates, not to a pass mark.</p>
${S.fig(SVG.normalDist, 'Most scores cluster near the mean; the tails are rare.')}
${S.ex('Reading the curve', `<p>The 50th percentile is average. +1 standard deviation ≈ 84th percentile. So a "top 15%" candidate sits around +1σ.</p>`)}
${S.warn('A lower raw score on a harder test can still be a high percentile. Difficulty is normalised out.')}
${S.tip('Speed AND accuracy both feed the score — rushing to finish can lower your percentile more than leaving a few blank.')}
${S.quiz('You are at the 84th percentile. Roughly how many standard deviations above the mean?', '<p>About <b>+1σ</b> — the top ~16%.</p>')}
${S.key(['Percentile = % of people you beat.', '50th = average; +1σ ≈ 84th.', 'Difficulty is normalised.', 'Balance speed and accuracy.'])}`,
    quiz: [
      { q: 'A 70th percentile means you:', k: 'A', opts: ['Scored better than 70% of candidates', 'Got 70% correct', 'Failed', 'Are average'] },
      { q: 'The 50th percentile is:', k: 'A', opts: ['Average', 'Top 1%', 'Bottom 1%', 'A fail'] },
      { q: '+1 standard deviation is approximately which percentile?', k: 'A', opts: ['84th', '50th', '99th', '16th'] },
    ],
  },
  {
    title: 'Logic Gates & Truth Tables', format: 'READ',
    tags: ['Abstract Reasoning', 'ICT Infrastructure & Technology Management'],
    contentHtml: `
${S.intro('Logic gates are the atoms of computing — and a favourite of abstract/technical tests. Learn the three core gates and truth tables become mechanical.')}
${S.h('The three you must know')}
<ul><li><b>AND</b> — output 1 only if BOTH inputs are 1.</li><li><b>OR</b> — output 1 if AT LEAST ONE input is 1.</li><li><b>NOT</b> — inverts: 1→0, 0→1.</li></ul>
${S.ex('AND truth table', `<p>0&0=0, 0&1=0, 1&0=0, <b>1&1=1</b>. AND is the "strict" gate.</p>`)}
${S.h('Combining gates')}
<p><b>NAND</b> = NOT(AND); <b>NOR</b> = NOT(OR). A NAND gate outputs 0 only when both inputs are 1 — the exact opposite of AND.</p>
${S.warn('XOR (exclusive OR) outputs 1 only when inputs DIFFER. Don\'t confuse it with OR.')}
${S.tip('Build a truth table row by row for every input combination (00, 01, 10, 11). Never reason it in your head for combined gates.')}
${S.quiz('For inputs 1 and 0, what does an XOR gate output?', '<p><b>1</b> — the inputs differ, so XOR is true.</p>')}
${S.key(['AND = both; OR = at least one; NOT = invert.', 'NAND/NOR are their negations.', 'XOR = inputs differ.', 'Always tabulate all input combinations.'])}`,
    quiz: [
      { q: 'An AND gate outputs 1 when:', k: 'A', opts: ['Both inputs are 1', 'Either input is 1', 'Both are 0', 'Inputs differ'] },
      { q: 'XOR outputs 1 when:', k: 'A', opts: ['Inputs differ', 'Both are 1', 'Both are 0', 'Always'] },
      { q: 'NAND is:', k: 'A', opts: ['NOT(AND)', 'NOT(OR)', 'Same as AND', 'Same as XOR'] },
    ],
  },
];

(async () => {
  // 1) inject diagrams into existing modules
  const mods = await p.learningModule.findMany();
  for (const m of mods) {
    const inj = INJECT[m.title];
    if (!inj || !inj.html) continue;
    if (m.contentHtml.includes('class="diagram"')) { console.log('  (diagram already in', m.title, ')'); continue; }
    let html = m.contentHtml;
    if (inj.after) {
      const anchor = `<h3>${inj.after}`;
      const idx = html.indexOf(anchor);
      if (idx >= 0) {
        // insert after the end of that h3's following paragraph/list block — simplest: right after the h3 tag's closing
        const endH3 = html.indexOf('</h3>', idx) + 5;
        html = html.slice(0, endH3) + inj.html + html.slice(endH3);
      } else { html = inj.html + html; }
    } else { html = inj.html + html; }
    await p.learningModule.update({ where: { id: m.id }, data: { contentHtml: html } });
    console.log('  ✓ diagram injected →', m.title);
  }

  // 2) add new modules
  for (const nm of NEW) {
    const exists = await p.learningModule.findFirst({ where: { title: nm.title } });
    const quiz = nm.quiz.map(x => ({ q: x.q, options: x.opts.map((label, i) => ({ key: 'ABCD'[i], label })), correctKey: x.k, explain: '' }));
    const words = nm.contentHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(3, Math.round(words / 180));
    if (exists) {
      await p.learningModule.update({ where: { id: exists.id }, data: { contentHtml: nm.contentHtml.trim(), tags: nm.tags, format: nm.format, quiz, estMinutes, isActive: true } });
      console.log('  ↻ updated module:', nm.title);
    } else {
      await p.learningModule.create({ data: { title: nm.title, contentHtml: nm.contentHtml.trim(), tags: nm.tags, format: nm.format, quiz, estMinutes, isActive: true } });
      console.log('  ✚ new module:', nm.title);
    }
  }
  const total = await p.learningModule.count({ where: { isActive: true } });
  console.log('Total active modules now:', total);
  await p.$disconnect();
})();
