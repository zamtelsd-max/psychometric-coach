// Seed SimBank with adaptive items across kinds/tracks (incl. Zambian ECZ + ZMW).
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const items = [];
const opt = (arr) => arr.map((label, i) => ({ key: 'ABCD'[i], label }));

// ── NUMERICAL (GENERAL) — adaptive spread by difficulty b ──
const NUM = [
  ['A shop offers 15% off K240. What is the sale price?', ['K204', 'K210', 'K216', 'K200'], 'A', -1.5],
  ['If 8 workers finish a job in 12 days, how many days for 6 workers (same rate)?', ['16', '14', '9', '18'], 'A', 0.0],
  ['Revenue rose from K1.2m to K1.5m. What % increase?', ['20%', '25%', '30%', '15%'], 'B', 0.3],
  ['A farmer harvests 1,800 kg over 3 fields equally. Two fields yield 500 kg each. The third?', ['800 kg', '700 kg', '600 kg', '900 kg'], 'A', 0.6],
  ['Compound: K5,000 at 10% p.a. for 2 years?', ['K6,050', 'K6,000', 'K5,500', 'K6,100'], 'A', 1.2],
  ['A tank fills in 6h and drains in 9h. Both open, time to fill?', ['18 h', '15 h', '12 h', '3.6 h'], 'A', 1.6],
];
NUM.forEach(([prompt, o, correctKey, b]) => items.push({ kind: 'NUMERICAL', track: 'GENERAL', subject: 'Numerical', prompt, options: opt(o), correctKey, difficulty: b, discrimination: 1.1 }));

// ── VERBAL (GENERAL) — True / False / Cannot Say ──
const VERB = [
  ['Passage: "All Zambian district hospitals stocked malaria kits in 2024. Chipata is a district."\nStatement: Chipata hospital stocked malaria kits in 2024.', ['True', 'False', 'Cannot Say'], 'A', -0.5, 'All district hospitals did; Chipata is a district → True.'],
  ['Passage: "The report covered only urban clinics."\nStatement: Rural clinics performed worse.', ['True', 'False', 'Cannot Say'], 'C', 0.4, 'Report excluded rural clinics → Cannot Say.'],
  ['Passage: "Every candidate who scored above 80% passed. Mary passed."\nStatement: Mary scored above 80%.', ['True', 'False', 'Cannot Say'], 'C', 0.9, 'Passing may occur below 80% too → Cannot Say.'],
];
VERB.forEach(([prompt, o, correctKey, b, explanation]) => items.push({ kind: 'VERBAL', track: 'GENERAL', subject: 'Verbal', prompt, options: opt(o), correctKey, difficulty: b, explanation }));

// ── OCEAN Big Five + SDS (Likert 1..5) ──
const OCEAN = [
  ['I enjoy exploring new ideas and abstract concepts.', 'O', false],
  ['I prefer routine over variety.', 'O', true],
  ['I complete tasks thoroughly and on time.', 'C', false],
  ['I often leave things until the last minute.', 'C', true],
  ['I feel energised in large social gatherings.', 'E', false],
  ['I prefer quiet time alone to recharge.', 'E', true],
  ['I go out of my way to help others.', 'A', false],
  ['I can be blunt even if it upsets people.', 'A', true],
  ['I stay calm under pressure.', 'N', true],
  ['I worry about things that might go wrong.', 'N', false],
  ['I have never told a lie in my life.', 'SDS', false],
  ['I am always completely honest, even when inconvenient.', 'SDS', false],
];
OCEAN.forEach(([prompt, trait, reverse]) => items.push({ kind: 'OCEAN', track: 'GENERAL', subject: 'Personality', prompt, options: opt(['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']), trait, reverse, difficulty: 0 }));

// ── SJT — Most / Least effective ──
const SJT = [
  ['A teammate misses a deadline that affects your delivery. What is MOST and LEAST effective?', ['Speak to them privately to understand and agree a fix', 'Report them to the manager immediately', 'Do their work silently and say nothing', 'Complain to other colleagues'], 'A', 'D', 0.2],
  ['A customer is angry about a fault that was not your fault. MOST / LEAST effective?', ['Acknowledge, apologise for the impact, and resolve it', 'Explain it was not your fault and move on', 'Transfer them to someone else immediately', 'Tell them to submit a formal complaint'], 'A', 'C', 0.5],
];
SJT.forEach(([prompt, o, correctKey, leastKey, b]) => items.push({ kind: 'SJT', track: 'GENERAL', subject: 'Judgement', prompt, options: opt(o), correctKey, leastKey, difficulty: b, discrimination: 1.0 }));

// ── ACADEMIC · UK GCSE (Maths/Science) ──
const UK_GCSE = [
  ['GCSE Maths: Solve 3x + 7 = 22.', ['x = 5', 'x = 4', 'x = 6', 'x = 3'], 'A', -0.8, 'Mathematics'],
  ['GCSE Physics: Unit of electrical resistance?', ['Ohm', 'Volt', 'Ampere', 'Watt'], 'A', -1.0, 'Physics'],
  ['GCSE Biology: Which organelle performs photosynthesis?', ['Chloroplast', 'Mitochondrion', 'Nucleus', 'Ribosome'], 'A', -0.6, 'Biology'],
  ['GCSE Maths: Factorise x² − 9.', ['(x−3)(x+3)', '(x−9)(x+1)', '(x−3)²', 'x(x−9)'], 'A', 0.4, 'Mathematics'],
];
UK_GCSE.forEach(([prompt, o, correctKey, b, subject]) => items.push({ kind: 'ACADEMIC', track: 'UK_GCSE', subject, prompt, options: opt(o), correctKey, difficulty: b, discrimination: 1.1 }));

// ── ACADEMIC · UK A-Level ──
const UK_AL = [
  ['A-Level Maths: d/dx of 3x² + 2x?', ['6x + 2', '3x + 2', '6x', '5x'], 'A', 0.2, 'Mathematics'],
  ['A-Level Chemistry: pH of 0.01 M HCl?', ['2', '1', '12', '0.01'], 'A', 0.6, 'Chemistry'],
  ['A-Level Physics: Kinetic energy formula?', ['½mv²', 'mv', 'mgh', 'F=ma'], 'A', 0.0, 'Physics'],
];
UK_AL.forEach(([prompt, o, correctKey, b, subject]) => items.push({ kind: 'ACADEMIC', track: 'UK_ALEVEL', subject, prompt, options: opt(o), correctKey, difficulty: b, discrimination: 1.1 }));

// ── ACADEMIC · Zambian ECZ (CBA) — localized context + ZMW ──
const ZM = [
  ['ECZ Maths: A maize farmer in Mkushi sells 50 bags at K320 each. Total revenue?', ['K16,000', 'K15,000', 'K1,600', 'K16,500'], 'A', -0.5, 'Mathematics'],
  ['ECZ Science: Which crop is a legume that fixes nitrogen in Zambian soils?', ['Groundnuts', 'Maize', 'Cassava', 'Sunflower'], 'A', -0.3, 'Agricultural Science'],
  ['ECZ Geography: The Zambezi River forms the border with which country to the south?', ['Zimbabwe', 'Tanzania', 'DRC', 'Angola'], 'A', -0.4, 'Geography'],
  ['ECZ Maths: A trader buys goods for K1,200 and sells for K1,560. Percentage profit?', ['30%', '25%', '36%', '20%'], 'A', 0.5, 'Mathematics'],
  ['ECZ CTS: A solar pump uses 40 W for 5 hours daily. Daily energy (Wh)?', ['200 Wh', '45 Wh', '8 Wh', '2000 Wh'], 'A', 0.3, 'Computer/Technology Studies'],
];
ZM.forEach(([prompt, o, correctKey, b, subject]) => items.push({ kind: 'ACADEMIC', track: 'ZM_ECZ', subject, prompt, options: opt(o), correctKey, difficulty: b, discrimination: 1.1 }));

(async () => {
  const existing = await p.simBank.count();
  if (existing > 0) { console.log('SimBank already has', existing, 'items — clearing & reseeding'); await p.simBank.deleteMany({}); }
  for (const it of items) await p.simBank.create({ data: it });
  const byKind = {};
  for (const it of items) byKind[it.kind] = (byKind[it.kind] || 0) + 1;
  console.log('Seeded', items.length, 'SimBank items:', JSON.stringify(byKind));
  await p.$disconnect();
})();
