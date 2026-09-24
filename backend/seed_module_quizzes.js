// Add a 3-question end-of-module quiz to each of the 12 Growth Center modules.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const o = (arr) => arr.map((label, i) => ({ key: 'ABCD'[i], label }));

const QUIZ = {
  'Ratios & Proportions Fast Track': [
    { q: 'A:B = 3:5 and A+B = 40. What is A?', options: o(['15', '12', '18', '24']), correctKey: 'A', explain: 'Total parts 8, one part = 5, A = 3×5 = 15.' },
    { q: 'Profit K72,000 shared 2:3:4. The largest share is:', options: o(['K32,000', 'K24,000', 'K16,000', 'K36,000']), correctKey: 'A', explain: '9 parts, one part = K8,000; largest = 4×8,000 = K32,000.' },
    { q: 'Recipe uses flour:sugar 5:2. With 350g flour, sugar needed?', options: o(['140g', '175g', '70g', '210g']), correctKey: 'A', explain: 'One part = 70g, sugar = 2×70 = 140g.' },
  ],
  'Percentage Change Without Panic': [
    { q: 'Price rose K1.2m → K1.5m. Percentage increase?', options: o(['25%', '30%', '20%', '15%']), correctKey: 'A', explain: '(1.5−1.2)/1.2 = 25%.' },
    { q: 'After a 20% discount an item costs K160. Original price?', options: o(['K200', 'K192', 'K180', 'K128']), correctKey: 'A', explain: '160 is 80% of original → 160/0.8 = K200.' },
    { q: 'K100 rises 20% then falls 20%. Final value?', options: o(['K96', 'K100', 'K104', 'K98']), correctKey: 'A', explain: '100×1.2×0.8 = 96 — the fall is off a bigger base.' },
  ],
  'Speed Reading Comprehension': [
    { q: '"Most clinics reported stock-outs." Statement: "All clinics had stock-outs." Verdict?', options: o(['False', 'True', 'Cannot Say', 'Partly true']), correctKey: 'A', explain: '"Most" ≠ "all" → the statement is contradicted → False.' },
    { q: 'Passage covers only urban schools. Statement: "Rural schools did worse." Verdict?', options: o(['Cannot Say', 'False', 'True', 'Likely']), correctKey: 'A', explain: 'Rural schools out of scope → nothing stated → Cannot Say.' },
    { q: 'For "Cannot Say", you should ask:', options: o(['Did the text actually rule this out?', 'Is it true in real life?', 'Does it sound plausible?', 'Is it a long sentence?']), correctKey: 'A', explain: 'Cannot Say = not stated; never use outside knowledge.' },
  ],
  'Analogy & Vocabulary Patterns': [
    { q: 'PEN : WRITE :: KNIFE : ?', options: o(['CUT', 'SHARP', 'KITCHEN', 'METAL']), correctKey: 'A', explain: 'Function bridge: a pen is used to write, a knife to cut.' },
    { q: 'LIBRARY : BOOKS :: BANK : ?', options: o(['MONEY', 'TELLER', 'BUILDING', 'LOAN']), correctKey: 'A', explain: 'A library stores books; a bank stores money.' },
    { q: 'Best way to break a tie between two answers:', options: o(['Make the bridge sentence more specific', 'Pick the longer word', 'Choose the first option', 'Guess']), correctKey: 'A', explain: 'Tighten the relationship sentence until one fits.' },
  ],
  'Matrices & Sequence Logic': [
    { q: '2, 6, 12, 20, 30, ? — next term?', options: o(['42', '40', '36', '44']), correctKey: 'A', explain: 'Differences 4,6,8,10,12 → 30+12 = 42.' },
    { q: '1, 4, 9, 16, ? — next term?', options: o(['25', '20', '24', '32']), correctKey: 'A', explain: 'Perfect squares → 5² = 25.' },
    { q: 'In a grid matrix, the missing cell must satisfy:', options: o(['Both the row rule and the column rule', 'Only the row rule', 'Only the column rule', 'Neither']), correctKey: 'A', explain: 'Rows and columns often carry different rules — both apply.' },
  ],
  'Syllogisms & Deduction': [
    { q: 'All cats are mammals. No mammals are fish. "No cats are fish." Valid?', options: o(['Valid', 'Invalid', 'Cannot tell', 'Sometimes']), correctKey: 'A', explain: 'Cats ⊂ mammals, mammals ∩ fish = ∅ → valid.' },
    { q: 'All managers are employees. Some employees work weekends. "Some managers work weekends." Valid?', options: o(['Invalid', 'Valid', 'Always true', 'Cannot Say']), correctKey: 'A', explain: 'The weekend workers might all be non-managers → invalid.' },
    { q: '"Valid" means the conclusion is:', options: o(['True in every possible case', 'Probably true', 'True in real life', 'Reasonable-sounding']), correctKey: 'A', explain: 'Validity = must hold in every diagram, not just plausibly.' },
  ],
  'Spatial Folding & Rotation': [
    { q: 'Two faces are side-by-side in a cube net. Can they be opposite on the cube?', options: o(['No', 'Yes', 'Sometimes', 'Only if shaded']), correctKey: 'A', explain: 'Adjacent-in-net faces always end up touching → not opposite.' },
    { q: 'Rotation vs reflection: rotation preserves...', options: o(['Handedness (no mirror flip)', 'Colour only', 'Size only', 'Nothing']), correctKey: 'A', explain: 'Reflection mirrors; rotation keeps the same handedness.' },
    { q: 'Fastest way to check a rotated-figure option:', options: o(['Follow one anchor feature', 'Redraw the whole shape', 'Guess', 'Count the sides']), correctKey: 'A', explain: 'Track a unique marker instead of rotating everything.' },
  ],
  'SJT: Prioritise Like a Manager': [
    { q: 'A teammate misses a deadline affecting you. MOST effective?', options: o(['Speak privately, understand, agree a fix', 'Complain to colleagues', 'Report to the CEO at once', 'Do their work silently']), correctKey: 'A', explain: 'Direct + respectful = ownership without damaging trust.' },
    { q: 'An angry customer blames you for a fault that was not yours. Best first move?', options: o(['Acknowledge, apologise for the impact, resolve it', 'Explain it was not your fault', 'Transfer them away', 'Ask for a formal complaint']), correctKey: 'A', explain: 'Own the impact and fix it — never deflect.' },
    { q: 'SJT answers usually reward:', options: o(['Measured, direct action', 'The most aggressive option', 'Doing nothing', 'Escalating immediately']), correctKey: 'A', explain: 'Avoid both extremes; choose the balanced professional move.' },
  ],
  'Negotiation Value Claims': [
    { q: 'Your first credible number in a negotiation is called the:', options: o(['Anchor', 'BATNA', 'ZOPA', 'Reservation price']), correctKey: 'A', explain: 'The anchor shapes the whole range.' },
    { q: 'Better than conceding on price:', options: o(['Trade the concession for something', 'Give it freely', 'Walk away', 'Split the difference immediately']), correctKey: 'A', explain: 'Every concession should buy something back.' },
    { q: 'Your "walk-away power" is your:', options: o(['BATNA', 'Anchor', 'ZOPA', 'Opening offer']), correctKey: 'A', explain: 'Best Alternative To a Negotiated Agreement.' },
  ],
  'Funnel Diagnostics in Practice': [
    { q: '10,000 visitors → 2,000 cart (20%) → 200 buy (10% of cart). The leak is:', options: o(['Cart → purchase', 'Visitor → cart', 'Awareness', 'Retention']), correctKey: 'A', explain: 'Cart→purchase at 10% is the weak step — fix checkout.' },
    { q: 'CTR is great but sales are flat. Look:', options: o(['Downstream (landing/offer/checkout)', 'At more ad spend', 'At impressions', 'At CPM']), correctKey: 'A', explain: 'Clicks are fine; something after the click fails.' },
    { q: 'You should measure conversion:', options: o(['Between each stage', 'Only as a site-wide total', 'Only at the top', 'Only at retention']), correctKey: 'A', explain: 'Stage-to-stage rates reveal where the drop-off is.' },
  ],
  'Ransomware First Response': [
    { q: 'First action when a workstation shows a ransom note?', options: o(['Isolate it from the network', 'Power it off', 'Pay the ransom', 'Reinstall Windows']), correctKey: 'A', explain: 'Isolate first to stop lateral spread.' },
    { q: 'Why NOT immediately power off an infected machine?', options: o(['You lose volatile forensic evidence', 'It costs money', 'It voids warranty', 'It is faster to leave on']), correctKey: 'A', explain: 'Encryption keys may sit in RAM; preserve for forensics.' },
    { q: 'Preferred recovery method:', options: o(['Restore from clean offline backups', 'Pay the ransom', 'Negotiate with attackers', 'Ignore it']), correctKey: 'A', explain: 'Offline, tested backups — paying funds crime with no guarantee.' },
  ],
  'Budget Cuts by Zero-Based Review': [
    { q: 'Zero-based budgeting starts each cycle from:', options: o(['Zero — every line re-justified', 'Last year + a few %', 'The biggest department', 'Fixed costs only']), correctKey: 'A', explain: 'No automatic carry-over; justify against current goals.' },
    { q: 'Two teams request K1m each; one drives 60% of revenue, one 5%. ZBB funds:', options: o(['By value delivered (revenue team first)', 'Equally', 'The one that asked first', 'Neither']), correctKey: 'A', explain: 'Rank by value, fund top-down under constraint.' },
    { q: 'Cut first under ZBB:', options: o(['Discretionary spend', 'Fixed/contractual costs', 'Payroll', 'Nothing']), correctKey: 'A', explain: 'Discretionary is easiest to trim for quick wins.' },
  ],
};

(async () => {
  const mods = await p.learningModule.findMany();
  let n = 0;
  for (const m of mods) {
    const quiz = QUIZ[m.title];
    if (!quiz) { console.log('  (no quiz for', m.title, ')'); continue; }
    await p.learningModule.update({ where: { id: m.id }, data: { quiz } });
    n++; console.log(`  ✓ ${m.title} — ${quiz.length} questions`);
  }
  console.log('Added quizzes to', n, 'of', mods.length, 'modules');
  await p.$disconnect();
})();
