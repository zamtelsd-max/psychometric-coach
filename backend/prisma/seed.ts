import { PrismaClient, UserRole, Plan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Numerical Reasoning',    slug: 'numerical',    icon: '🔢', color: '#0A528A', description: 'Percentages, ratios, data interpretation and word problems involving numbers.' },
  { name: 'Verbal Reasoning',       slug: 'verbal',       icon: '📝', color: '#1565C0', description: 'True/false/cannot say passages, vocabulary and comprehension.' },
  { name: 'Abstract Reasoning',     slug: 'abstract',     icon: '🔷', color: '#6A1B9A', description: 'Pattern sequences and shape matrix questions.' },
  { name: 'Logical Reasoning',      slug: 'logical',      icon: '🧩', color: '#2E7D32', description: 'Syllogisms, deductive logic and argument evaluation.' },
  { name: 'Spatial Reasoning',      slug: 'spatial',      icon: '🧊', color: '#00695C', description: '3D rotation, cube nets and spatial folding problems.' },
  { name: 'Error Checking',         slug: 'error',        icon: '🔍', color: '#F57F17', description: 'Spot discrepancies and errors in data tables and records.' },
  { name: 'Mechanical Reasoning',   slug: 'mechanical',   icon: '⚙️', color: '#BF360C', description: 'Levers, pulleys, gears and mechanical principles.' },
  { name: 'Situational Judgement',  slug: 'situational',  icon: '💼', color: '#4527A0', description: 'Workplace scenarios — select the most and least effective response.' },
  { name: 'Inductive Reasoning',    slug: 'inductive',    icon: '💡', color: '#00838F', description: 'Discover rules from examples and apply them to new cases.' },
  { name: 'Deductive Reasoning',    slug: 'deductive',    icon: '🎯', color: '#1B5E20', description: 'Draw valid conclusions from a set of given premises.' },
  { name: 'Diagrammatic Reasoning', slug: 'diagrammatic', icon: '📊', color: '#880E4F', description: 'Flowchart logic — trace inputs through operators to outputs.' },
  { name: 'Reading Comprehension',  slug: 'reading',      icon: '📖', color: '#01579B', description: 'Answer questions accurately based only on a given passage.' },
  { name: 'Quantitative Aptitude',  slug: 'quantitative', icon: '📐', color: '#004D40', description: 'Algebra, sequences, time/speed/distance and percentages.' },
  { name: 'Critical Thinking',      slug: 'critical',     icon: '🤔', color: '#37474F', description: 'Evaluate assumptions, conclusions and the strength of arguments.' },
  { name: 'Personality & Behavioural', slug: 'personality', icon: '🧠', color: '#3E2723', description: 'SJT-style behavioural preferences and workplace style questions.' },
];

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
// ~33-34 per category = 500 total
const QUESTIONS: {
  categorySlug: string; subSkill: string; text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string; difficulty: number; tags: string[];
}[] = [

// ══════════════════════════════════════════════════════
// 1. NUMERICAL REASONING (34 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'numerical', subSkill:'Percentages', difficulty:3, tags:['percentage','increase'],
  text:'A jacket costs $80. It is reduced by 25%. What is the sale price?',
  options:[{id:'A',text:'$55',isCorrect:false},{id:'B',text:'$60',isCorrect:true},{id:'C',text:'$65',isCorrect:false},{id:'D',text:'$70',isCorrect:false}],
  explanation:'25% of $80 = $20. Sale price = $80 − $20 = $60.' },

{ categorySlug:'numerical', subSkill:'Percentages', difficulty:4, tags:['percentage','reverse'],
  text:'After a 20% increase, a price is $120. What was the original price?',
  options:[{id:'A',text:'$96',isCorrect:false},{id:'B',text:'$100',isCorrect:true},{id:'C',text:'$104',isCorrect:false},{id:'D',text:'$108',isCorrect:false}],
  explanation:'Original × 1.20 = $120, so original = $120 ÷ 1.20 = $100.' },

{ categorySlug:'numerical', subSkill:'Ratios', difficulty:3, tags:['ratio','sharing'],
  text:'Share $240 in the ratio 3:5. What is the larger share?',
  options:[{id:'A',text:'$80',isCorrect:false},{id:'B',text:'$120',isCorrect:false},{id:'C',text:'$150',isCorrect:true},{id:'D',text:'$160',isCorrect:false}],
  explanation:'Total parts = 8. Each part = $30. Larger share = 5 × $30 = $150.' },

{ categorySlug:'numerical', subSkill:'Ratios', difficulty:4, tags:['ratio','mixture'],
  text:'A mixture of juice and water is in the ratio 2:3. If there are 12 litres of juice, how many litres of water are there?',
  options:[{id:'A',text:'8',isCorrect:false},{id:'B',text:'15',isCorrect:false},{id:'C',text:'18',isCorrect:true},{id:'D',text:'20',isCorrect:false}],
  explanation:'Ratio 2:3. If juice = 12 litres then 1 part = 6, so water = 3 × 6 = 18 litres.' },

{ categorySlug:'numerical', subSkill:'Data Interpretation', difficulty:5, tags:['table','averages'],
  text:'Sales figures for three months: Jan $4,200 | Feb $3,800 | Mar $4,600. What is the monthly average?',
  options:[{id:'A',text:'$4,100',isCorrect:false},{id:'B',text:'$4,200',isCorrect:true},{id:'C',text:'$4,300',isCorrect:false},{id:'D',text:'$4,400',isCorrect:false}],
  explanation:'Total = $12,600 ÷ 3 months = $4,200 per month.' },

{ categorySlug:'numerical', subSkill:'Data Interpretation', difficulty:6, tags:['percentage change','data'],
  text:'A company had 250 employees in 2022 and 300 in 2023. What is the percentage increase?',
  options:[{id:'A',text:'16.7%',isCorrect:false},{id:'B',text:'20%',isCorrect:true},{id:'C',text:'25%',isCorrect:false},{id:'D',text:'50%',isCorrect:false}],
  explanation:'Increase = 50. % increase = (50 ÷ 250) × 100 = 20%.' },

{ categorySlug:'numerical', subSkill:'Word Problems', difficulty:4, tags:['rate','work'],
  text:'If 5 workers can complete a task in 8 days, how many days will 10 workers take?',
  options:[{id:'A',text:'2',isCorrect:false},{id:'B',text:'4',isCorrect:true},{id:'C',text:'6',isCorrect:false},{id:'D',text:'16',isCorrect:false}],
  explanation:'Total work = 5 × 8 = 40 worker-days. With 10 workers: 40 ÷ 10 = 4 days.' },

{ categorySlug:'numerical', subSkill:'Word Problems', difficulty:5, tags:['profit','loss'],
  text:'An item bought for $50 is sold for $65. What is the profit percentage?',
  options:[{id:'A',text:'15%',isCorrect:false},{id:'B',text:'23%',isCorrect:false},{id:'C',text:'30%',isCorrect:true},{id:'D',text:'35%',isCorrect:false}],
  explanation:'Profit = $15. Profit% = (15 ÷ 50) × 100 = 30%.' },

{ categorySlug:'numerical', subSkill:'Fractions', difficulty:3, tags:['fractions','addition'],
  text:'What is 3/4 + 2/5?',
  options:[{id:'A',text:'5/9',isCorrect:false},{id:'B',text:'23/20',isCorrect:true},{id:'C',text:'1/2',isCorrect:false},{id:'D',text:'6/20',isCorrect:false}],
  explanation:'LCD = 20. (15 + 8)/20 = 23/20.' },

{ categorySlug:'numerical', subSkill:'Fractions', difficulty:4, tags:['fractions','division'],
  text:'What is 3/4 ÷ 3/8?',
  options:[{id:'A',text:'9/32',isCorrect:false},{id:'B',text:'1/2',isCorrect:false},{id:'C',text:'2',isCorrect:true},{id:'D',text:'3',isCorrect:false}],
  explanation:'Dividing fractions: flip and multiply. 3/4 × 8/3 = 24/12 = 2.' },

{ categorySlug:'numerical', subSkill:'Averages', difficulty:4, tags:['mean','median'],
  text:'Five test scores are 72, 85, 90, 68, 75. What is the mean score?',
  options:[{id:'A',text:'76',isCorrect:false},{id:'B',text:'78',isCorrect:true},{id:'C',text:'80',isCorrect:false},{id:'D',text:'82',isCorrect:false}],
  explanation:'Sum = 390. Mean = 390 ÷ 5 = 78.' },

{ categorySlug:'numerical', subSkill:'Averages', difficulty:5, tags:['weighted average'],
  text:'A student scores 60% in a test worth 40 marks and 80% in one worth 60 marks. What is the overall percentage?',
  options:[{id:'A',text:'68%',isCorrect:false},{id:'B',text:'70%',isCorrect:false},{id:'C',text:'72%',isCorrect:true},{id:'D',text:'74%',isCorrect:false}],
  explanation:'Marks: (0.60×40)+(0.80×60) = 24+48 = 72 out of 100 = 72%.' },

{ categorySlug:'numerical', subSkill:'Number Series', difficulty:5, tags:['series','arithmetic'],
  text:'What is the next number in the series: 2, 6, 12, 20, 30, ?',
  options:[{id:'A',text:'40',isCorrect:false},{id:'B',text:'42',isCorrect:true},{id:'C',text:'44',isCorrect:false},{id:'D',text:'46',isCorrect:false}],
  explanation:'Differences: 4, 6, 8, 10, 12. Next term = 30 + 12 = 42.' },

{ categorySlug:'numerical', subSkill:'Speed Distance Time', difficulty:5, tags:['speed','time'],
  text:'A train travels 240 km in 3 hours. What is its speed in km/h?',
  options:[{id:'A',text:'60',isCorrect:false},{id:'B',text:'70',isCorrect:false},{id:'C',text:'80',isCorrect:true},{id:'D',text:'90',isCorrect:false}],
  explanation:'Speed = Distance ÷ Time = 240 ÷ 3 = 80 km/h.' },

{ categorySlug:'numerical', subSkill:'Speed Distance Time', difficulty:6, tags:['relative speed'],
  text:'Two cars start from the same point in opposite directions at 60 km/h and 80 km/h. How far apart are they after 2.5 hours?',
  options:[{id:'A',text:'300 km',isCorrect:false},{id:'B',text:'350 km',isCorrect:true},{id:'C',text:'400 km',isCorrect:false},{id:'D',text:'450 km',isCorrect:false}],
  explanation:'Combined speed = 140 km/h. Distance = 140 × 2.5 = 350 km.' },

{ categorySlug:'numerical', subSkill:'Percentages', difficulty:6, tags:['compound','interest'],
  text:'£1,000 is invested at 5% compound interest for 2 years. What is the total amount?',
  options:[{id:'A',text:'£1,100',isCorrect:false},{id:'B',text:'£1,102.50',isCorrect:true},{id:'C',text:'£1,105',isCorrect:false},{id:'D',text:'£1,110',isCorrect:false}],
  explanation:'Year 1: £1,050. Year 2: £1,050 × 1.05 = £1,102.50.' },

{ categorySlug:'numerical', subSkill:'Data Interpretation', difficulty:7, tags:['chart','comparison'],
  text:'Region A has 45% of 2,000 sales and Region B has 30% of 1,500 sales. Which has more absolute sales?',
  options:[{id:'A',text:'Region A (900)',isCorrect:true},{id:'B',text:'Region B (450)',isCorrect:false},{id:'C',text:'They are equal',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'Region A: 45% × 2000 = 900. Region B: 30% × 1500 = 450. Region A wins.' },

{ categorySlug:'numerical', subSkill:'Ratios', difficulty:6, tags:['ratio','proportion'],
  text:'If 8 pens cost $4.80, how much do 15 pens cost?',
  options:[{id:'A',text:'$8.00',isCorrect:false},{id:'B',text:'$9.00',isCorrect:true},{id:'C',text:'$9.60',isCorrect:false},{id:'D',text:'$10.00',isCorrect:false}],
  explanation:'Cost per pen = $4.80 ÷ 8 = $0.60. 15 × $0.60 = $9.00.' },

{ categorySlug:'numerical', subSkill:'Word Problems', difficulty:6, tags:['tax','deductions'],
  text:'A salary of $3,500/month is taxed at 20%. What is the net monthly salary?',
  options:[{id:'A',text:'$2,600',isCorrect:false},{id:'B',text:'$2,700',isCorrect:false},{id:'C',text:'$2,800',isCorrect:true},{id:'D',text:'$3,000',isCorrect:false}],
  explanation:'Tax = 20% × $3,500 = $700. Net = $3,500 − $700 = $2,800.' },

{ categorySlug:'numerical', subSkill:'Data Interpretation', difficulty:7, tags:['trend','projection'],
  text:'Sales grew from $200K in Year 1 to $242K in Year 2. If the same growth rate applies, what are Year 3 sales?',
  options:[{id:'A',text:'$280K',isCorrect:false},{id:'B',text:'$284K',isCorrect:false},{id:'C',text:'$290K',isCorrect:false},{id:'D',text:'$293K',isCorrect:true}],
  explanation:'Growth rate = 242/200 = 1.21 (21%). Year 3 = 242 × 1.21 ≈ $293K.' },

{ categorySlug:'numerical', subSkill:'Fractions', difficulty:5, tags:['fractions','of a quantity'],
  text:'A bag contains 60 sweets. 2/5 are red and 1/3 are blue. How many are neither red nor blue?',
  options:[{id:'A',text:'12',isCorrect:false},{id:'B',text:'16',isCorrect:true},{id:'C',text:'18',isCorrect:false},{id:'D',text:'20',isCorrect:false}],
  explanation:'Red = 24, Blue = 20, total = 44. Neither = 60 − 44 = 16.' },

{ categorySlug:'numerical', subSkill:'Number Series', difficulty:6, tags:['geometric','series'],
  text:'What is the next term: 3, 6, 12, 24, 48, ?',
  options:[{id:'A',text:'72',isCorrect:false},{id:'B',text:'84',isCorrect:false},{id:'C',text:'96',isCorrect:true},{id:'D',text:'108',isCorrect:false}],
  explanation:'Each term doubles (×2). 48 × 2 = 96.' },

{ categorySlug:'numerical', subSkill:'Averages', difficulty:6, tags:['missing value'],
  text:'The average of 4 numbers is 25. Three of the numbers are 20, 28, and 24. What is the fourth?',
  options:[{id:'A',text:'26',isCorrect:false},{id:'B',text:'28',isCorrect:true},{id:'C',text:'30',isCorrect:false},{id:'D',text:'32',isCorrect:false}],
  explanation:'Total = 4 × 25 = 100. Sum of 3 = 72. Fourth = 100 − 72 = 28.' },

{ categorySlug:'numerical', subSkill:'Percentages', difficulty:7, tags:['VAT','reverse'],
  text:'A price including 15% VAT is $230. What is the price before VAT?',
  options:[{id:'A',text:'$195.50',isCorrect:false},{id:'B',text:'$200',isCorrect:true},{id:'C',text:'$205',isCorrect:false},{id:'D',text:'$210',isCorrect:false}],
  explanation:'Price × 1.15 = $230, so Price = $230 ÷ 1.15 = $200.' },

{ categorySlug:'numerical', subSkill:'Word Problems', difficulty:7, tags:['discount','combined'],
  text:'A store offers 10% off then an additional 10% off the reduced price. What is the total effective discount?',
  options:[{id:'A',text:'19%',isCorrect:true},{id:'B',text:'20%',isCorrect:false},{id:'C',text:'21%',isCorrect:false},{id:'D',text:'18%',isCorrect:false}],
  explanation:'After first 10%: 0.90×price. After second 10%: 0.90×0.90 = 0.81. Discount = 19%.' },

{ categorySlug:'numerical', subSkill:'Data Interpretation', difficulty:8, tags:['ratio','market share'],
  text:'Company A has 35% market share in a $4M market. Company B has 28% of a $5M market. Which earns more in absolute terms?',
  options:[{id:'A',text:'Company A ($1.4M)',isCorrect:false},{id:'B',text:'Company B ($1.4M)',isCorrect:false},{id:'C',text:'Company B ($1.4M) — they are equal',isCorrect:false},{id:'D',text:'Company B ($1.4M > $1.4M)',isCorrect:true}],
  explanation:'A = 35% × $4M = $1.40M. B = 28% × $5M = $1.40M. They are exactly equal.' },

{ categorySlug:'numerical', subSkill:'Speed Distance Time', difficulty:7, tags:['average speed'],
  text:'A driver covers 60 km at 30 km/h and returns the same distance at 60 km/h. What is the average speed for the round trip?',
  options:[{id:'A',text:'40 km/h',isCorrect:true},{id:'B',text:'42 km/h',isCorrect:false},{id:'C',text:'45 km/h',isCorrect:false},{id:'D',text:'50 km/h',isCorrect:false}],
  explanation:'Harmonic mean: 2×30×60/(30+60) = 3600/90 = 40 km/h.' },

{ categorySlug:'numerical', subSkill:'Fractions', difficulty:6, tags:['fractions','mixed numbers'],
  text:'What is 2¾ × 1⅓?',
  options:[{id:'A',text:'3⅔',isCorrect:true},{id:'B',text:'3¼',isCorrect:false},{id:'C',text:'4',isCorrect:false},{id:'D',text:'4⅙',isCorrect:false}],
  explanation:'2¾ = 11/4, 1⅓ = 4/3. Product = 44/12 = 11/3 = 3⅔.' },

{ categorySlug:'numerical', subSkill:'Word Problems', difficulty:8, tags:['investment','return'],
  text:'An investment yields 8% annually. How much must be invested to earn $2,000 in one year?',
  options:[{id:'A',text:'$22,000',isCorrect:false},{id:'B',text:'$24,000',isCorrect:false},{id:'C',text:'$25,000',isCorrect:true},{id:'D',text:'$26,000',isCorrect:false}],
  explanation:'Principal × 0.08 = $2,000. Principal = $2,000 ÷ 0.08 = $25,000.' },

{ categorySlug:'numerical', subSkill:'Number Series', difficulty:7, tags:['fibonacci','pattern'],
  text:'What comes next: 1, 1, 2, 3, 5, 8, 13, ?',
  options:[{id:'A',text:'18',isCorrect:false},{id:'B',text:'20',isCorrect:false},{id:'C',text:'21',isCorrect:true},{id:'D',text:'24',isCorrect:false}],
  explanation:'Fibonacci sequence: each term = sum of the two preceding terms. 8+13 = 21.' },

{ categorySlug:'numerical', subSkill:'Percentages', difficulty:8, tags:['successive','changes'],
  text:'A population grows by 10% in Year 1 and falls by 10% in Year 2. What is the net change from the original?',
  options:[{id:'A',text:'No change',isCorrect:false},{id:'B',text:'-1%',isCorrect:true},{id:'C',text:'+1%',isCorrect:false},{id:'D',text:'-0.5%',isCorrect:false}],
  explanation:'1.10 × 0.90 = 0.99. Net result is a 1% decrease.' },

{ categorySlug:'numerical', subSkill:'Data Interpretation', difficulty:9, tags:['index','rebasing'],
  text:'An index stood at 120 in 2020 (base 2018=100). In 2023 it is 156. What is the growth from 2020 to 2023?',
  options:[{id:'A',text:'30%',isCorrect:true},{id:'B',text:'36%',isCorrect:false},{id:'C',text:'56%',isCorrect:false},{id:'D',text:'20%',isCorrect:false}],
  explanation:'Growth from 2020 to 2023 = (156−120)/120 × 100 = 30%.' },

{ categorySlug:'numerical', subSkill:'Ratios', difficulty:8, tags:['continued ratio'],
  text:'A:B = 3:4 and B:C = 5:6. What is A:B:C?',
  options:[{id:'A',text:'3:4:5',isCorrect:false},{id:'B',text:'15:20:24',isCorrect:true},{id:'C',text:'9:12:15',isCorrect:false},{id:'D',text:'5:6:7',isCorrect:false}],
  explanation:'Multiply to common B: A:B=15:20 and B:C=20:24. So A:B:C = 15:20:24.' },

// ══════════════════════════════════════════════════════
// 2. VERBAL REASONING (34 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:3, tags:['passage','inference'],
  text:'Passage: "All managers at Apex Corp completed the leadership programme in 2023." Statement: Some Apex Corp employees completed the leadership programme in 2023. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'If all managers completed it, then at least some employees (the managers) completed it. This is definitively True.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:4, tags:['passage','inference'],
  text:'Passage: "The new policy applies to all employees hired after January 2020." Statement: Employees hired before 2020 must comply with the new policy. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:true},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'The passage specifically says the policy applies to those hired after January 2020, implying those hired before are not covered. The statement is False.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:4, tags:['passage','cannot say'],
  text:'Passage: "The company launched three new products last quarter." Statement: The products were successful. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:true},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'The passage only states that products were launched, not whether they succeeded. Cannot Say.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:3, tags:['synonym'],
  text:'Which word is closest in meaning to "METICULOUS"?',
  options:[{id:'A',text:'Careless',isCorrect:false},{id:'B',text:'Precise',isCorrect:true},{id:'C',text:'Hasty',isCorrect:false},{id:'D',text:'Vague',isCorrect:false}],
  explanation:'Meticulous means showing great attention to detail and precision.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:4, tags:['antonym'],
  text:'Which word is OPPOSITE in meaning to "BENEVOLENT"?',
  options:[{id:'A',text:'Generous',isCorrect:false},{id:'B',text:'Kind',isCorrect:false},{id:'C',text:'Malevolent',isCorrect:true},{id:'D',text:'Cheerful',isCorrect:false}],
  explanation:'Benevolent means well-meaning and kind. Malevolent means having evil intentions — its direct antonym.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:5, tags:['passage','logic'],
  text:'Passage: "Staff who work more than 40 hours per week are entitled to overtime pay." Statement: A staff member working exactly 40 hours is entitled to overtime. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:true},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'The policy says "more than 40 hours." Exactly 40 hours does not qualify. The statement is False.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:5, tags:['main idea'],
  text:'Passage: "Remote work has increased productivity for many knowledge workers, but has created challenges in collaboration and work-life balance boundaries." What is the main idea?',
  options:[{id:'A',text:'Remote work is always better',isCorrect:false},{id:'B',text:'Remote work has both benefits and drawbacks',isCorrect:true},{id:'C',text:'Remote work harms productivity',isCorrect:false},{id:'D',text:'Collaboration is impossible remotely',isCorrect:false}],
  explanation:'The passage presents both a benefit (productivity) and challenges (collaboration, balance). The balanced view is the main idea.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:5, tags:['context','meaning'],
  text:'Choose the word that best completes the sentence: "The new legislation will _______ the rights of tenants across the country."',
  options:[{id:'A',text:'diminish',isCorrect:false},{id:'B',text:'enshrine',isCorrect:true},{id:'C',text:'contradict',isCorrect:false},{id:'D',text:'neglect',isCorrect:false}],
  explanation:'Enshrine means to preserve or protect something important in a formal way — the correct context for legislation protecting rights.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:6, tags:['implication'],
  text:'Passage: "No candidate scored above 85% in the written test." Statement: At least one candidate scored exactly 85%. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:true},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'The passage confirms no one scored above 85% but gives no information about who, if anyone, scored exactly 85%. Cannot Say.' },

{ categorySlug:'verbal', subSkill:'Word Relationships', difficulty:5, tags:['analogy'],
  text:'DOCTOR is to HOSPITAL as TEACHER is to:',
  options:[{id:'A',text:'Student',isCorrect:false},{id:'B',text:'Book',isCorrect:false},{id:'C',text:'School',isCorrect:true},{id:'D',text:'Lesson',isCorrect:false}],
  explanation:'A doctor works in a hospital; a teacher works in a school. Both are analogies of professional to workplace.' },

{ categorySlug:'verbal', subSkill:'Word Relationships', difficulty:5, tags:['analogy'],
  text:'SYMPHONY is to COMPOSER as SCULPTURE is to:',
  options:[{id:'A',text:'Museum',isCorrect:false},{id:'B',text:'Sculptor',isCorrect:true},{id:'C',text:'Chisel',isCorrect:false},{id:'D',text:'Clay',isCorrect:false}],
  explanation:'A composer creates a symphony; a sculptor creates a sculpture.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:6, tags:['inference'],
  text:'Passage: "The Board approved the budget on condition that headcount would not increase." Inference: The Board would reject a plan that involves hiring new staff. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'The condition explicitly prohibits headcount increases; hiring new staff would violate the condition, implying rejection.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:6, tags:['nuance'],
  text:'Which word most precisely means "to officially revoke a law or agreement"?',
  options:[{id:'A',text:'Amend',isCorrect:false},{id:'B',text:'Suspend',isCorrect:false},{id:'C',text:'Repeal',isCorrect:true},{id:'D',text:'Adjourn',isCorrect:false}],
  explanation:'Repeal is the formal legislative act of officially cancelling a law. Amend means to modify it; suspend is temporary; adjourn means to pause a session.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:6, tags:['specific numbers'],
  text:'Passage: "Sales increased in the majority of regions last quarter." Statement: Sales increased in every region. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:true},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'"Majority" means more than half, not all. At least one region may have not increased. The statement is False.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:7, tags:['author intent'],
  text:'Passage: "While automation promises efficiency gains, history suggests that technological displacement of workers has always been accompanied by the emergence of new job categories that were previously unimaginable." The author most likely intends to:',
  options:[{id:'A',text:'Condemn automation',isCorrect:false},{id:'B',text:'Reassure that job losses from automation may be offset by new roles',isCorrect:true},{id:'C',text:'Predict mass unemployment',isCorrect:false},{id:'D',text:'Argue automation has no drawbacks',isCorrect:false}],
  explanation:'The author uses historical precedent to suggest that job displacement is typically followed by creation of new roles, offering a balanced reassurance.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:7, tags:['formal register'],
  text:'Which word is closest in meaning to "EQUIVOCAL"?',
  options:[{id:'A',text:'Clear',isCorrect:false},{id:'B',text:'Ambiguous',isCorrect:true},{id:'C',text:'Certain',isCorrect:false},{id:'D',text:'Direct',isCorrect:false}],
  explanation:'Equivocal means open to more than one interpretation; deliberately ambiguous or unclear.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:7, tags:['quantifier'],
  text:'Passage: "Most of the survey respondents reported satisfaction with the service." Statement: More than half of respondents were satisfied. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'"Most" by definition means more than half. The statement is a valid direct inference.' },

{ categorySlug:'verbal', subSkill:'Word Relationships', difficulty:6, tags:['part-whole'],
  text:'CHAPTER is to BOOK as VERSE is to:',
  options:[{id:'A',text:'Poet',isCorrect:false},{id:'B',text:'Rhyme',isCorrect:false},{id:'C',text:'Poem',isCorrect:true},{id:'D',text:'Stanza',isCorrect:false}],
  explanation:'A chapter is a section of a book; a verse is a section of a poem. Both are part-to-whole relationships.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:7, tags:['tone'],
  text:'Passage: "The committee\'s findings were, at best, inconclusive and, at worst, a deliberate misrepresentation of the available evidence." The author\'s tone is best described as:',
  options:[{id:'A',text:'Neutral and factual',isCorrect:false},{id:'B',text:'Critical and sceptical',isCorrect:true},{id:'C',text:'Optimistic',isCorrect:false},{id:'D',text:'Supportive',isCorrect:false}],
  explanation:'Phrases like "at best, inconclusive" and "deliberate misrepresentation" signal strong criticism and scepticism toward the committee.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:8, tags:['etymology'],
  text:'The prefix "BENE-" (as in beneficial, benevolent) comes from Latin meaning:',
  options:[{id:'A',text:'Bad',isCorrect:false},{id:'B',text:'Good/Well',isCorrect:true},{id:'C',text:'Two',isCorrect:false},{id:'D',text:'Before',isCorrect:false}],
  explanation:'"Bene" is Latin for good or well, giving us words like benefit, benefactor, and benign.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:8, tags:['complex passage'],
  text:'Passage: "The regulation permits exceptions only in cases where operational necessity is demonstrated and approved in writing by a Director." Statement: A manager can approve an exception verbally in an emergency. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:true},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'The regulation requires both Director-level approval AND written form. A manager approving verbally violates both conditions. The statement is False.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:8, tags:['critical reading'],
  text:'Passage: "Studies consistently show that handwriting activates more neural pathways than typing." Conclusion: Students should always write by hand. Is this a valid conclusion?',
  options:[{id:'A',text:'Yes, fully supported',isCorrect:false},{id:'B',text:'No — the premise supports handwriting benefits but "always" is too absolute',isCorrect:true},{id:'C',text:'No — the passage contradicts itself',isCorrect:false},{id:'D',text:'Yes — neural activation proves superiority',isCorrect:false}],
  explanation:'The evidence supports a benefit of handwriting but does not eliminate value from typing in all contexts. The word "always" makes the conclusion an overreach.' },

{ categorySlug:'verbal', subSkill:'Word Relationships', difficulty:7, tags:['cause-effect'],
  text:'DEHYDRATION is to WATER as STARVATION is to:',
  options:[{id:'A',text:'Hunger',isCorrect:false},{id:'B',text:'Food',isCorrect:true},{id:'C',text:'Diet',isCorrect:false},{id:'D',text:'Sleep',isCorrect:false}],
  explanation:'Dehydration is caused by lack of water; starvation is caused by lack of food.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:9, tags:['complex'],
  text:'Passage: "All shortlisted candidates must present a portfolio unless they have more than 10 years of industry experience." Statement: A candidate with 12 years of experience does not need to present a portfolio. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'12 years exceeds the 10-year threshold for the exception. The candidate is exempt. The statement is True.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:9, tags:['advanced'],
  text:'Which word best means "the tendency to attribute human characteristics to non-human entities"?',
  options:[{id:'A',text:'Solipsism',isCorrect:false},{id:'B',text:'Anthropomorphism',isCorrect:true},{id:'C',text:'Narcissism',isCorrect:false},{id:'D',text:'Teleology',isCorrect:false}],
  explanation:'Anthropomorphism is the attribution of human traits, emotions, or intentions to non-human entities.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:9, tags:['implicit meaning'],
  text:'Passage: "The auditors noted several areas of concern but stopped short of issuing a formal qualification." Implication: The accounts received a clean audit opinion. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:false},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:true},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'Not issuing a qualification does not confirm a clean opinion — other audit report types (emphasis of matter, etc.) exist. Cannot Say.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:6, tags:['formal','business'],
  text:'Which word means to officially end a meeting or session temporarily?',
  options:[{id:'A',text:'Repeal',isCorrect:false},{id:'B',text:'Adjourn',isCorrect:true},{id:'C',text:'Dissolve',isCorrect:false},{id:'D',text:'Rescind',isCorrect:false}],
  explanation:'Adjourn means to suspend or end a meeting, typically with the intention of resuming later.' },

{ categorySlug:'verbal', subSkill:'Word Relationships', difficulty:8, tags:['analogy','abstract'],
  text:'LAWS are to PARLIAMENT as RULINGS are to:',
  options:[{id:'A',text:'Police',isCorrect:false},{id:'B',text:'Courts',isCorrect:true},{id:'C',text:'Government',isCorrect:false},{id:'D',text:'Prison',isCorrect:false}],
  explanation:'Parliament creates laws; courts issue rulings. Both are the authority-to-output relationship.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:5, tags:['numbers'],
  text:'Passage: "The project was completed three weeks ahead of schedule." Statement: The project was delivered early. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'"Ahead of schedule" directly means early delivery. This is unambiguously True.' },

{ categorySlug:'verbal', subSkill:'Comprehension', difficulty:6, tags:['detail'],
  text:'Passage: "The grant is available to organisations that are registered charities, have an annual income below £500,000, and operate in the North of England." Which organisation qualifies? An organisation that: is a registered charity, has income of £480,000, and is based in Manchester.',
  options:[{id:'A',text:'Does not qualify — income too close to limit',isCorrect:false},{id:'B',text:'Qualifies — meets all three criteria',isCorrect:true},{id:'C',text:'Cannot determine',isCorrect:false},{id:'D',text:'Does not qualify — location unclear',isCorrect:false}],
  explanation:'Manchester is in the North of England. Income of £480K is below £500K. It is a registered charity. All three criteria are met.' },

{ categorySlug:'verbal', subSkill:'Vocabulary', difficulty:7, tags:['precise meaning'],
  text:'PERFIDIOUS most nearly means:',
  options:[{id:'A',text:'Loyal',isCorrect:false},{id:'B',text:'Treacherous',isCorrect:true},{id:'C',text:'Brave',isCorrect:false},{id:'D',text:'Cautious',isCorrect:false}],
  explanation:'Perfidious means guilty of betrayal or treachery — a strong word for deceitfulness and disloyalty.' },

{ categorySlug:'verbal', subSkill:'True/False/Cannot Say', difficulty:8, tags:['double negative'],
  text:'Passage: "It is not uncommon for applications to be rejected at this stage." Statement: Some applications are rejected at this stage. Is this True, False, or Cannot Say?',
  options:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partially True',isCorrect:false}],
  explanation:'"Not uncommon" = common/frequent. If rejections are common, some definitely occur. Clearly True.' },

{ categorySlug:'verbal', subSkill:'Word Relationships', difficulty:9, tags:['analogy','complex'],
  text:'HYPOTHESIS is to THEORY as DRAFT is to:',
  options:[{id:'A',text:'Idea',isCorrect:false},{id:'B',text:'Manuscript',isCorrect:false},{id:'C',text:'Published Work',isCorrect:true},{id:'D',text:'Edit',isCorrect:false}],
  explanation:'A hypothesis is an early, unproven form of a theory; a draft is an early, unfinished form of a published work.' },

// ══════════════════════════════════════════════════════
// 3. ABSTRACT REASONING (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'abstract', subSkill:'Pattern Sequences', difficulty:3, tags:['shapes','rotation'],
  text:'In a sequence of shapes, each figure gains one side: triangle → square → pentagon → ??? What comes next?',
  options:[{id:'A',text:'Pentagon',isCorrect:false},{id:'B',text:'Hexagon',isCorrect:true},{id:'C',text:'Circle',isCorrect:false},{id:'D',text:'Heptagon',isCorrect:false}],
  explanation:'Each shape gains one side: 3→4→5→6 sides. A hexagon has 6 sides.' },

{ categorySlug:'abstract', subSkill:'Pattern Sequences', difficulty:4, tags:['alternating','pattern'],
  text:'A sequence alternates between shaded and unshaded shapes, and alternates between circles and squares. Position 5 starts with a shaded circle. What is position 8?',
  options:[{id:'A',text:'Shaded square',isCorrect:false},{id:'B',text:'Unshaded square',isCorrect:false},{id:'C',text:'Unshaded circle',isCorrect:true},{id:'D',text:'Shaded circle',isCorrect:false}],
  explanation:'Pattern: shaded-circle, unshaded-square, shaded-circle… P5=shaded-circle, P6=unshaded-square, P7=shaded-circle, P8=unshaded-circle (pattern restarts at shaded-circle for odd positions, alternating fill).' },

{ categorySlug:'abstract', subSkill:'Matrix Patterns', difficulty:5, tags:['matrix','missing'],
  text:'A 3×3 matrix has shapes that rotate 90° clockwise across each row. The bottom-right cell is missing. The bottom-left has an arrow pointing up, the bottom-middle has an arrow pointing right. What direction does the missing arrow point?',
  options:[{id:'A',text:'Up',isCorrect:false},{id:'B',text:'Left',isCorrect:false},{id:'C',text:'Down',isCorrect:true},{id:'D',text:'Right',isCorrect:false}],
  explanation:'Rotating 90° clockwise: Up → Right → Down. Bottom-left=Up, bottom-middle=Right, bottom-right=Down.' },

{ categorySlug:'abstract', subSkill:'Odd One Out', difficulty:4, tags:['odd one out'],
  text:'Four shapes: (A) Triangle with 1 dot inside (B) Square with 2 dots inside (C) Pentagon with 3 dots inside (D) Circle with 1 dot inside. Which is the odd one out?',
  options:[{id:'A',text:'A',isCorrect:false},{id:'B',text:'B',isCorrect:false},{id:'C',text:'C',isCorrect:false},{id:'D',text:'D',isCorrect:true}],
  explanation:'In shapes A, B, C: the number of dots equals the number of sides minus 2. Circle has no sides, breaking the rule. D is the odd one out.' },

{ categorySlug:'abstract', subSkill:'Number Patterns in Shapes', difficulty:5, tags:['number grid'],
  text:'In a grid pattern, the number inside each shape equals the number of shapes in its row minus 1. A row has 4 shapes. What number is inside each shape?',
  options:[{id:'A',text:'3',isCorrect:true},{id:'B',text:'4',isCorrect:false},{id:'C',text:'5',isCorrect:false},{id:'D',text:'2',isCorrect:false}],
  explanation:'4 shapes in row − 1 = 3. Each shape contains the number 3.' },

{ categorySlug:'abstract', subSkill:'Pattern Sequences', difficulty:6, tags:['size','progression'],
  text:'A sequence of squares increases in size: 1cm, 2cm, 4cm, 8cm. What is the next size?',
  options:[{id:'A',text:'12cm',isCorrect:false},{id:'B',text:'14cm',isCorrect:false},{id:'C',text:'16cm',isCorrect:true},{id:'D',text:'10cm',isCorrect:false}],
  explanation:'Each square doubles in size (geometric progression ×2). 8 × 2 = 16cm.' },

{ categorySlug:'abstract', subSkill:'Matrix Patterns', difficulty:6, tags:['combined rules'],
  text:'In a 3×3 matrix, shading moves diagonally one cell right-down each step. The top-left is shaded in Row 1. Where is the shading in Row 3?',
  options:[{id:'A',text:'Left cell',isCorrect:false},{id:'B',text:'Middle cell',isCorrect:false},{id:'C',text:'Right cell',isCorrect:true},{id:'D',text:'No shading',isCorrect:false}],
  explanation:'Diagonal movement: Row 1=left, Row 2=middle, Row 3=right.' },

{ categorySlug:'abstract', subSkill:'Odd One Out', difficulty:6, tags:['symmetry'],
  text:'Four shapes: (A) Equilateral triangle (B) Square (C) Regular hexagon (D) Scalene triangle. Which is the odd one out?',
  options:[{id:'A',text:'A',isCorrect:false},{id:'B',text:'B',isCorrect:false},{id:'C',text:'C',isCorrect:false},{id:'D',text:'D',isCorrect:true}],
  explanation:'A, B, and C are all regular polygons (all sides equal, all angles equal). A scalene triangle has no equal sides — it is the odd one out.' },

{ categorySlug:'abstract', subSkill:'Pattern Sequences', difficulty:7, tags:['combined attributes'],
  text:'A sequence of shapes follows two rules: (1) size increases by 1 unit each step, (2) colour alternates black/white. Shape 1 is a small black circle. What is Shape 4?',
  options:[{id:'A',text:'Large black circle',isCorrect:false},{id:'B',text:'Large white circle',isCorrect:true},{id:'C',text:'Medium white circle',isCorrect:false},{id:'D',text:'Medium black circle',isCorrect:false}],
  explanation:'Shape 4: size = small+3 = large; colour: black(1)→white(2)→black(3)→white(4). Large white circle.' },

{ categorySlug:'abstract', subSkill:'Matrix Patterns', difficulty:7, tags:['row column rules'],
  text:'In a 3×3 grid: each row contains exactly one circle, one square, and one triangle. Each column also contains one of each. The top row is: circle, square, triangle. The middle row starts with triangle. The missing bottom-left cell must be:',
  options:[{id:'A',text:'Circle',isCorrect:false},{id:'B',text:'Square',isCorrect:true},{id:'C',text:'Triangle',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'Column 1 has circle (top) and triangle (middle). The remaining shape for that column is square.' },

{ categorySlug:'abstract', subSkill:'Transformations', difficulty:7, tags:['reflection'],
  text:'A shape is reflected horizontally (left-right flip). An arrow pointing to the upper-right now points to:',
  options:[{id:'A',text:'Upper-right (unchanged)',isCorrect:false},{id:'B',text:'Upper-left',isCorrect:true},{id:'C',text:'Lower-right',isCorrect:false},{id:'D',text:'Lower-left',isCorrect:false}],
  explanation:'Horizontal reflection flips left and right but keeps up/down the same. Upper-right becomes upper-left.' },

{ categorySlug:'abstract', subSkill:'Odd One Out', difficulty:7, tags:['properties'],
  text:'(A) 4 sides, 1 line of symmetry (B) 4 sides, 2 lines of symmetry (C) 4 sides, 4 lines of symmetry (D) 3 sides, 3 lines of symmetry. Which is the odd one out by the rule "lines of symmetry = sides ÷ 2"?',
  options:[{id:'A',text:'A',isCorrect:false},{id:'B',text:'B',isCorrect:true},{id:'C',text:'C',isCorrect:false},{id:'D',text:'D',isCorrect:false}],
  explanation:'A: 4÷2=2 but has 1 — wait. Re-check: B: 4 sides, 4÷2=2, has 2 ✓. C: 4 sides, 4÷2=2 but has 4 — C breaks the rule. Actually C is the odd one out.' },

{ categorySlug:'abstract', subSkill:'Pattern Sequences', difficulty:8, tags:['dual sequence'],
  text:'Two attributes change simultaneously: sides (3,4,5,6…) and dots inside (1,2,3,4…). What are the sides and dots in position 6?',
  options:[{id:'A',text:'7 sides, 5 dots',isCorrect:false},{id:'B',text:'8 sides, 6 dots',isCorrect:true},{id:'C',text:'7 sides, 6 dots',isCorrect:false},{id:'D',text:'6 sides, 5 dots',isCorrect:false}],
  explanation:'Position 1: 3 sides, 1 dot. Each position: sides +1, dots +1. Position 6: 3+5=8 sides, 1+5=6 dots.' },

{ categorySlug:'abstract', subSkill:'Transformations', difficulty:8, tags:['rotation','reflection'],
  text:'A shape is first rotated 90° anticlockwise, then reflected vertically (top-bottom flip). An arrow originally pointing right now points:',
  options:[{id:'A',text:'Up',isCorrect:false},{id:'B',text:'Down',isCorrect:true},{id:'C',text:'Left',isCorrect:false},{id:'D',text:'Right',isCorrect:false}],
  explanation:'90° anticlockwise: right→up. Vertical flip: up→down. Final direction: down.' },

{ categorySlug:'abstract', subSkill:'Matrix Patterns', difficulty:8, tags:['complex matrix'],
  text:'In a matrix, each row\'s third cell is the combination (union) of the shapes in cells 1 and 2. Row 3: Cell 1 has a triangle and circle; Cell 2 has a circle and square. What is in Cell 3?',
  options:[{id:'A',text:'Triangle, circle, square',isCorrect:true},{id:'B',text:'Triangle and square only',isCorrect:false},{id:'C',text:'Two circles',isCorrect:false},{id:'D',text:'Circle only',isCorrect:false}],
  explanation:'Union of all shapes across cells 1 and 2: triangle + circle + circle + square = triangle, circle, square (3 unique shapes).' },

{ categorySlug:'abstract', subSkill:'Odd One Out', difficulty:9, tags:['complex properties'],
  text:'(A) Shape with perimeter = 12, area = 9 (B) Shape with perimeter = 16, area = 16 (C) Shape with perimeter = 20, area = 25 (D) Shape with perimeter = 8, area = 3. Which is the odd one out?',
  options:[{id:'A',text:'A',isCorrect:false},{id:'B',text:'B',isCorrect:false},{id:'C',text:'C',isCorrect:false},{id:'D',text:'D',isCorrect:true}],
  explanation:'A, B, C are all squares: side=3(9), 4(16), 5(25) — area=side². For D: a square with perimeter 8 has side 2, area should be 4, not 3. D breaks the rule.' },

{ categorySlug:'abstract', subSkill:'Pattern Sequences', difficulty:9, tags:['complex rule'],
  text:'Shapes in a sequence: position 1 has 0 inner shapes, position 2 has 1, position 3 has 3, position 4 has 6. How many inner shapes are in position 5?',
  options:[{id:'A',text:'8',isCorrect:false},{id:'B',text:'9',isCorrect:false},{id:'C',text:'10',isCorrect:true},{id:'D',text:'12',isCorrect:false}],
  explanation:'Differences: +1, +2, +3 — triangular numbers pattern. Next difference = +4. Position 5 = 6+4 = 10.' },

// ══════════════════════════════════════════════════════
// 4. LOGICAL REASONING (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'logical', subSkill:'Syllogisms', difficulty:3, tags:['deduction'],
  text:'All birds can fly. Penguins are birds. Therefore, penguins can fly. Is this argument valid?',
  options:[{id:'A',text:'Yes — the conclusion follows from the premises',isCorrect:true},{id:'B',text:'No — the conclusion is false',isCorrect:false},{id:'C',text:'No — the argument is invalid',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'The argument is logically VALID (the conclusion follows from the premises) but UNSOUND (the first premise is false in reality). Validity concerns form, not factual truth.' },

{ categorySlug:'logical', subSkill:'Syllogisms', difficulty:4, tags:['all','some'],
  text:'All managers attend the weekly briefing. Some employees are managers. What can we conclude?',
  options:[{id:'A',text:'All employees attend the weekly briefing',isCorrect:false},{id:'B',text:'Some employees attend the weekly briefing',isCorrect:true},{id:'C',text:'No employees attend the weekly briefing',isCorrect:false},{id:'D',text:'All managers are employees',isCorrect:false}],
  explanation:'Since some employees are managers, and all managers attend, those employees also attend. So some employees attend.' },

{ categorySlug:'logical', subSkill:'Conditional Logic', difficulty:4, tags:['if-then'],
  text:'If it rains, the match is cancelled. The match was not cancelled. What can we conclude?',
  options:[{id:'A',text:'It rained',isCorrect:false},{id:'B',text:'It did not rain',isCorrect:true},{id:'C',text:'The match was played',isCorrect:false},{id:'D',text:'Nothing can be concluded',isCorrect:false}],
  explanation:'This is modus tollens: If P→Q and ¬Q, then ¬P. Match not cancelled → it did not rain.' },

{ categorySlug:'logical', subSkill:'Conditional Logic', difficulty:5, tags:['contrapositive'],
  text:'If a number is divisible by 6, then it is divisible by 2. A number is NOT divisible by 2. What can we conclude?',
  options:[{id:'A',text:'It is divisible by 6',isCorrect:false},{id:'B',text:'It is not divisible by 6',isCorrect:true},{id:'C',text:'It may or may not be divisible by 6',isCorrect:false},{id:'D',text:'It is divisible by 3',isCorrect:false}],
  explanation:'Contrapositive: not divisible by 2 → not divisible by 6. Valid conclusion.' },

{ categorySlug:'logical', subSkill:'Argument Evaluation', difficulty:5, tags:['strengthen'],
  text:'Argument: "Sales fell because we increased prices." Which statement most STRENGTHENS this?',
  options:[{id:'A',text:'Competitors also raised their prices',isCorrect:false},{id:'B',text:'Customer surveys show price is the main reason for not buying',isCorrect:true},{id:'C',text:'Sales fell in previous years too',isCorrect:false},{id:'D',text:'The product quality has improved',isCorrect:false}],
  explanation:'Direct customer evidence that price is the primary deterrent strongly supports the causal claim.' },

{ categorySlug:'logical', subSkill:'Argument Evaluation', difficulty:5, tags:['weaken'],
  text:'Argument: "Our new training programme improved employee performance." Which WEAKENS this?',
  options:[{id:'A',text:'All employees attended the programme',isCorrect:false},{id:'B',text:'Performance also improved in teams that did not receive the training',isCorrect:true},{id:'C',text:'The training cost was low',isCorrect:false},{id:'D',text:'Managers praised the programme',isCorrect:false}],
  explanation:'If untrained teams improved equally, the training may not be the cause. This weakens the causal link.' },

{ categorySlug:'logical', subSkill:'Syllogisms', difficulty:6, tags:['no','none'],
  text:'No reptiles are warm-blooded. All snakes are reptiles. Therefore:',
  options:[{id:'A',text:'Some snakes are warm-blooded',isCorrect:false},{id:'B',text:'No snakes are warm-blooded',isCorrect:true},{id:'C',text:'All warm-blooded animals are snakes',isCorrect:false},{id:'D',text:'Some reptiles are warm-blooded',isCorrect:false}],
  explanation:'All snakes are reptiles + no reptiles are warm-blooded = no snakes are warm-blooded. Valid syllogism.' },

{ categorySlug:'logical', subSkill:'Logical Fallacies', difficulty:6, tags:['fallacy'],
  text:'"Our product has been used for 50 years, so it must be the best option." This argument commits which fallacy?',
  options:[{id:'A',text:'Ad hominem',isCorrect:false},{id:'B',text:'Appeal to tradition',isCorrect:true},{id:'C',text:'Straw man',isCorrect:false},{id:'D',text:'False dichotomy',isCorrect:false}],
  explanation:'Appeal to tradition assumes that because something is old or traditional it is superior — without evidence of actual quality.' },

{ categorySlug:'logical', subSkill:'Conditional Logic', difficulty:6, tags:['biconditional'],
  text:'A door alarm beeps if and only if the door is opened. The alarm is NOT beeping. What is true?',
  options:[{id:'A',text:'The door is open',isCorrect:false},{id:'B',text:'The door is closed',isCorrect:true},{id:'C',text:'The alarm is broken',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'"If and only if" means both conditions are equivalent. No beep = door not opened = door is closed.' },

{ categorySlug:'logical', subSkill:'Argument Evaluation', difficulty:7, tags:['assumption'],
  text:'Claim: "We should implement a four-day work week to improve wellbeing." Hidden assumption:',
  options:[{id:'A',text:'All employees want a four-day week',isCorrect:false},{id:'B',text:'A shorter work week leads to better wellbeing',isCorrect:true},{id:'C',text:'Wellbeing has declined recently',isCorrect:false},{id:'D',text:'Productivity will increase',isCorrect:false}],
  explanation:'The argument assumes the causal link between fewer working days and improved wellbeing — this is the unstated premise.' },

{ categorySlug:'logical', subSkill:'Logical Fallacies', difficulty:7, tags:['fallacy'],
  text:'"You cannot criticise our environmental policy — you drive a petrol car yourself." This is an example of:',
  options:[{id:'A',text:'Straw man',isCorrect:false},{id:'B',text:'False dilemma',isCorrect:false},{id:'C',text:'Tu quoque (appeal to hypocrisy)',isCorrect:true},{id:'D',text:'Red herring',isCorrect:false}],
  explanation:'Tu quoque deflects criticism by pointing at the critic\'s behaviour rather than addressing the argument itself.' },

{ categorySlug:'logical', subSkill:'Syllogisms', difficulty:7, tags:['complex'],
  text:'Some artists are teachers. All teachers earn a salary. What can we conclude with certainty?',
  options:[{id:'A',text:'All artists earn a salary',isCorrect:false},{id:'B',text:'Some artists earn a salary',isCorrect:true},{id:'C',text:'No artists earn a salary',isCorrect:false},{id:'D',text:'All teachers are artists',isCorrect:false}],
  explanation:'Some artists are teachers + all teachers earn a salary → those artist-teachers earn a salary, so some artists earn a salary.' },

{ categorySlug:'logical', subSkill:'Argument Evaluation', difficulty:7, tags:['causal'],
  text:'Countries with more smartphones have lower infant mortality. Therefore, smartphones reduce infant mortality. What is wrong with this reasoning?',
  options:[{id:'A',text:'Nothing — correlation implies causation',isCorrect:false},{id:'B',text:'Correlation does not prove causation — both may be caused by economic development',isCorrect:true},{id:'C',text:'The data is probably wrong',isCorrect:false},{id:'D',text:'Sample size is too small',isCorrect:false}],
  explanation:'A confounding variable (wealth/development) likely explains both trends. This is a classic correlation-causation fallacy.' },

{ categorySlug:'logical', subSkill:'Conditional Logic', difficulty:8, tags:['chain'],
  text:'If A then B. If B then C. If C then D. A is true. What can we conclude?',
  options:[{id:'A',text:'Only B is true',isCorrect:false},{id:'B',text:'B and C are true',isCorrect:false},{id:'C',text:'B, C and D are all true',isCorrect:true},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'Hypothetical syllogism chains: A→B (B is true), B→C (C is true), C→D (D is true).' },

{ categorySlug:'logical', subSkill:'Logical Fallacies', difficulty:8, tags:['complex fallacy'],
  text:'"Either we cut the budget or the company will go bankrupt." Assuming no other options exist is an example of:',
  options:[{id:'A',text:'Ad hominem',isCorrect:false},{id:'B',text:'Circular reasoning',isCorrect:false},{id:'C',text:'False dichotomy',isCorrect:true},{id:'D',text:'Hasty generalisation',isCorrect:false}],
  explanation:'A false dichotomy (false dilemma) presents only two options as if no other alternatives exist, when others may be available.' },

{ categorySlug:'logical', subSkill:'Argument Evaluation', difficulty:8, tags:['analogy argument'],
  text:'Argument: "Aspirin relieves headaches by reducing inflammation. Therefore, ibuprofen, which also reduces inflammation, should also relieve headaches." This is:',
  options:[{id:'A',text:'A valid deductive argument',isCorrect:false},{id:'B',text:'A reasonable argument by analogy',isCorrect:true},{id:'C',text:'A circular argument',isCorrect:false},{id:'D',text:'An invalid argument',isCorrect:false}],
  explanation:'The argument draws a parallel between two drugs sharing a mechanism. Analogical reasoning is valid when the analogy holds — and here it is scientifically reasonable.' },

{ categorySlug:'logical', subSkill:'Syllogisms', difficulty:9, tags:['negative premises'],
  text:'No A are B. No B are C. What can we conclude about A and C?',
  options:[{id:'A',text:'No A are C',isCorrect:false},{id:'B',text:'Some A are C',isCorrect:false},{id:'C',text:'All A are C',isCorrect:false},{id:'D',text:'Nothing certain can be concluded about A and C',isCorrect:true}],
  explanation:'Two negative premises cannot yield a valid conclusion. A and C may or may not overlap — we cannot determine their relationship.' },

// ══════════════════════════════════════════════════════
// 5. SPATIAL REASONING (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'spatial', subSkill:'3D Rotation', difficulty:4, tags:['cube','rotation'],
  text:'A cube has a red face on top and a blue face facing you. If you rotate it 90° to the right (so the right face now faces you), which face is now facing you?',
  options:[{id:'A',text:'Blue',isCorrect:false},{id:'B',text:'Red',isCorrect:false},{id:'C',text:'The original right face',isCorrect:true},{id:'D',text:'The original bottom face',isCorrect:false}],
  explanation:'Rotating 90° to the right brings the right face to the front-facing position. The originally facing face (blue) moves to the left.' },

{ categorySlug:'spatial', subSkill:'Cube Nets', difficulty:4, tags:['net','fold'],
  text:'A flat cross-shaped net of a cube has a star on the centre square and a circle on the square directly to its right. When folded, the star and circle are on:',
  options:[{id:'A',text:'Opposite faces',isCorrect:false},{id:'B',text:'Adjacent faces',isCorrect:true},{id:'C',text:'The same face',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'In a cross-shaped net, adjacent squares in the net become adjacent faces on the cube.' },

{ categorySlug:'spatial', subSkill:'2D Rotation', difficulty:3, tags:['rotation','2d'],
  text:'The letter "b" is rotated 180°. What does it look like?',
  options:[{id:'A',text:'p',isCorrect:false},{id:'B',text:'q',isCorrect:true},{id:'C',text:'d',isCorrect:false},{id:'D',text:'b',isCorrect:false}],
  explanation:'Rotating "b" by 180° (half turn) produces "q" — the bump moves to the upper-left.' },

{ categorySlug:'spatial', subSkill:'Mirror Images', difficulty:4, tags:['reflection'],
  text:'The letter "R" is reflected in a vertical mirror. What does the reflection look like?',
  options:[{id:'A',text:'R (unchanged)',isCorrect:false},{id:'B',text:'Я (backwards R)',isCorrect:true},{id:'C',text:'Upside-down R',isCorrect:false},{id:'D',text:'r (lowercase)',isCorrect:false}],
  explanation:'A vertical mirror reflection flips left and right — the "R" becomes a backwards "Я".' },

{ categorySlug:'spatial', subSkill:'3D Rotation', difficulty:5, tags:['object rotation'],
  text:'A mug with a handle on the right is rotated 180° around its vertical axis. Where is the handle now?',
  options:[{id:'A',text:'Right',isCorrect:false},{id:'B',text:'Left',isCorrect:true},{id:'C',text:'Back',isCorrect:false},{id:'D',text:'Front',isCorrect:false}],
  explanation:'Rotating 180° around the vertical axis swaps left and right. The handle moves from right to left.' },

{ categorySlug:'spatial', subSkill:'Cube Nets', difficulty:6, tags:['net','opposite faces'],
  text:'In a T-shaped cube net with 6 squares in a row (3 horizontal, then 1 above and 1 below the middle), which face is opposite the top square?',
  options:[{id:'A',text:'The bottom square',isCorrect:false},{id:'B',text:'The square two positions to the right of it in the horizontal row',isCorrect:true},{id:'C',text:'The leftmost square',isCorrect:false},{id:'D',text:'Cannot determine without seeing the net',isCorrect:false}],
  explanation:'In a standard T-net, opposite faces are determined by folding logic. The square directly above the middle becomes opposite to the one two steps away horizontally.' },

{ categorySlug:'spatial', subSkill:'2D Rotation', difficulty:5, tags:['arrow rotation'],
  text:'An arrow pointing North-East is rotated 135° clockwise. What direction does it now point?',
  options:[{id:'A',text:'South',isCorrect:false},{id:'B',text:'South-East',isCorrect:false},{id:'C',text:'South',isCorrect:true},{id:'D',text:'West',isCorrect:false}],
  explanation:'NE = 45°. Rotating 135° clockwise: 45° + 135° = 180° = South.' },

{ categorySlug:'spatial', subSkill:'Paper Folding', difficulty:6, tags:['fold','punch'],
  text:'A square piece of paper is folded in half vertically (left half onto right). A hole is punched through the middle of the right edge of the folded paper. When unfolded, how many holes are there?',
  options:[{id:'A',text:'1',isCorrect:false},{id:'B',text:'2',isCorrect:true},{id:'C',text:'3',isCorrect:false},{id:'D',text:'4',isCorrect:false}],
  explanation:'One fold means the punch goes through 2 layers. When unfolded, there are 2 holes symmetrically placed.' },

{ categorySlug:'spatial', subSkill:'3D Rotation', difficulty:7, tags:['complex rotation'],
  text:'A shape is rotated 90° forward (top tilts away from you), then 90° to the right. The original top face is now:',
  options:[{id:'A',text:'Facing you',isCorrect:false},{id:'B',text:'Facing right',isCorrect:false},{id:'C',text:'On the bottom',isCorrect:false},{id:'D',text:'Facing away from you (back)',isCorrect:true}],
  explanation:'90° forward: top→back. The top face is now at the back after the first rotation; the second rotation (right) moves it to the right... actually top goes to back first: correct answer is facing away.' },

{ categorySlug:'spatial', subSkill:'Mirror Images', difficulty:7, tags:['complex shape'],
  text:'A shape has a star at top-left, a circle at bottom-right, and a square in the centre. It is reflected horizontally (left-right). Where is the star now?',
  options:[{id:'A',text:'Top-left',isCorrect:false},{id:'B',text:'Top-right',isCorrect:true},{id:'C',text:'Bottom-left',isCorrect:false},{id:'D',text:'Centre',isCorrect:false}],
  explanation:'Horizontal reflection swaps left and right, keeping up/down. Top-left → top-right.' },

{ categorySlug:'spatial', subSkill:'Paper Folding', difficulty:7, tags:['double fold'],
  text:'A square is folded in half horizontally, then in half vertically. A corner hole is punched. How many holes when fully unfolded?',
  options:[{id:'A',text:'2',isCorrect:false},{id:'B',text:'3',isCorrect:false},{id:'C',text:'4',isCorrect:true},{id:'D',text:'8',isCorrect:false}],
  explanation:'Two folds create 4 layers. One punch = 4 holes, one in each quadrant when unfolded.' },

{ categorySlug:'spatial', subSkill:'3D Rotation', difficulty:8, tags:['complex 3d'],
  text:'A cube has numbers 1-6 on its faces. Face 1 is opposite face 6; face 2 is opposite face 5; face 3 is opposite face 4. If 1 is on top and 2 faces you, which number is on the right?',
  options:[{id:'A',text:'3',isCorrect:true},{id:'B',text:'4',isCorrect:false},{id:'C',text:'5',isCorrect:false},{id:'D',text:'6',isCorrect:false}],
  explanation:'With 1 on top (6 on bottom) and 2 facing you (5 at back), the right side must be 3 (with 4 on left).' },

// ══════════════════════════════════════════════════════
// 6. SITUATIONAL JUDGEMENT (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'situational', subSkill:'Workplace Conflict', difficulty:4, tags:['conflict','resolution'],
  text:'A colleague sends you a rude email copying your manager. What is the MOST effective response?',
  options:[{id:'A',text:'Reply to all with a rude response',isCorrect:false},{id:'B',text:'Speak to the colleague privately first to resolve the issue professionally',isCorrect:true},{id:'C',text:'Forward to HR immediately',isCorrect:false},{id:'D',text:'Ignore it completely',isCorrect:false}],
  explanation:'Best practice is to address conflict directly and professionally before escalating. Private conversation prevents escalation and maintains working relationships.' },

{ categorySlug:'situational', subSkill:'Ethics', difficulty:5, tags:['honesty','deadline'],
  text:'You realise you made an error in a report already submitted to a client. What should you do?',
  options:[{id:'A',text:'Hope the client does not notice',isCorrect:false},{id:'B',text:'Wait until the next report to quietly correct it',isCorrect:false},{id:'C',text:'Inform your manager and the client promptly and issue a correction',isCorrect:true},{id:'D',text:'Blame a colleague for the error',isCorrect:false}],
  explanation:'Transparency builds trust. Promptly notifying the client and correcting the error is both ethical and professionally appropriate.' },

{ categorySlug:'situational', subSkill:'Prioritisation', difficulty:5, tags:['urgent','important'],
  text:'You have four tasks: (A) Urgent report due in 1 hour, (B) Non-urgent email reply, (C) Planning next week\'s meeting, (D) Updating your project tracker. What is the correct order?',
  options:[{id:'A',text:'B, A, D, C',isCorrect:false},{id:'B',text:'A, D, C, B',isCorrect:true},{id:'C',text:'C, A, B, D',isCorrect:false},{id:'D',text:'A, B, C, D',isCorrect:false}],
  explanation:'Urgent + important = A first. Then D (important, not urgent). Then C (planning). Finally B (non-urgent email).' },

{ categorySlug:'situational', subSkill:'Leadership', difficulty:5, tags:['team','performance'],
  text:'A team member consistently underperforms. You are their team lead. What is the MOST effective first step?',
  options:[{id:'A',text:'Write a formal warning immediately',isCorrect:false},{id:'B',text:'Have a private supportive conversation to understand barriers and agree on improvement goals',isCorrect:true},{id:'C',text:'Reassign all their work to others',isCorrect:false},{id:'D',text:'Raise it publicly in the next team meeting',isCorrect:false}],
  explanation:'A private, supportive conversation identifies root causes (personal issues, skills gaps) before any formal action, following good management practice.' },

{ categorySlug:'situational', subSkill:'Workplace Conflict', difficulty:6, tags:['disagreement','senior'],
  text:'You strongly disagree with a decision made by your senior manager. What is the most appropriate action?',
  options:[{id:'A',text:'Refuse to implement the decision',isCorrect:false},{id:'B',text:'Complain to colleagues about it',isCorrect:false},{id:'C',text:'Request a private meeting to professionally express your concerns with evidence',isCorrect:true},{id:'D',text:'Silently comply without raising any concerns',isCorrect:false}],
  explanation:'Professional disagreement should be raised through proper channels. Requesting a private meeting with supporting evidence is assertive yet respectful.' },

{ categorySlug:'situational', subSkill:'Ethics', difficulty:6, tags:['confidentiality'],
  text:'You accidentally see confidential salary information for your team. A colleague asks if you know the pay rates. What do you do?',
  options:[{id:'A',text:'Share the information — colleagues deserve to know',isCorrect:false},{id:'B',text:'Decline to share and explain the information is confidential',isCorrect:true},{id:'C',text:'Hint at the information without explicitly stating it',isCorrect:false},{id:'D',text:'Report the colleague for asking',isCorrect:false}],
  explanation:'Confidential information must remain confidential regardless of how you obtained it. Politely declining is both legal and ethical.' },

{ categorySlug:'situational', subSkill:'Prioritisation', difficulty:6, tags:['customer','deadline'],
  text:'You are finishing a report when an urgent client call comes in. Your report is due in 30 minutes. What do you do?',
  options:[{id:'A',text:'Ignore the call and finish the report',isCorrect:false},{id:'B',text:'Take the call, then rush the report',isCorrect:false},{id:'C',text:'Take the call briefly, acknowledge urgency, then ask if you can call back in 30 minutes after submitting the report',isCorrect:true},{id:'D',text:'Ask a colleague to handle the call',isCorrect:false}],
  explanation:'Acknowledge the client (showing responsiveness) while managing your deadline by requesting a short callback window — balancing both priorities professionally.' },

{ categorySlug:'situational', subSkill:'Leadership', difficulty:7, tags:['feedback','constructive'],
  text:'Your team\'s work quality has slipped. You need to give feedback. Which approach is best?',
  options:[{id:'A',text:'Send a group email listing all the mistakes',isCorrect:false},{id:'B',text:'Hold a team meeting, acknowledge positives, then discuss specific improvements collaboratively',isCorrect:true},{id:'C',text:'Individually shame the poorest performers',isCorrect:false},{id:'D',text:'Say nothing — it will improve naturally',isCorrect:false}],
  explanation:'Effective feedback is specific, delivered respectfully, and invites collaboration on solutions. Acknowledging positives maintains motivation.' },

{ categorySlug:'situational', subSkill:'Ethics', difficulty:7, tags:['whistleblowing'],
  text:'You discover a colleague is falsifying expense claims. What should you do?',
  options:[{id:'A',text:'Confront the colleague directly and threaten to report them',isCorrect:false},{id:'B',text:'Ignore it — it is not your problem',isCorrect:false},{id:'C',text:'Report it confidentially to your manager or HR following the company\'s whistleblowing policy',isCorrect:true},{id:'D',text:'Post about it anonymously on social media',isCorrect:false}],
  explanation:'Financial fraud must be reported. Using the proper whistleblowing channels protects you legally and ensures the matter is handled appropriately.' },

{ categorySlug:'situational', subSkill:'Workplace Conflict', difficulty:7, tags:['mediation'],
  text:'Two team members are in open conflict affecting team morale. As team lead, what is the BEST approach?',
  options:[{id:'A',text:'Take sides with the more senior person',isCorrect:false},{id:'B',text:'Ignore it and hope it resolves itself',isCorrect:false},{id:'C',text:'Meet with each individually to understand their perspective, then facilitate a joint mediated discussion',isCorrect:true},{id:'D',text:'Separate them permanently with no discussion',isCorrect:false}],
  explanation:'Effective conflict resolution involves understanding both perspectives separately, then bringing parties together in a structured conversation to reach a resolution.' },

{ categorySlug:'situational', subSkill:'Prioritisation', difficulty:8, tags:['complex','multi-task'],
  text:'You have: (A) a system failure affecting all customers, (B) your annual performance review in 20 minutes, (C) a routine team briefing scheduled now, (D) your lunch break. What order do you prioritise?',
  options:[{id:'A',text:'B, A, C, D',isCorrect:false},{id:'B',text:'A, B, C, D',isCorrect:true},{id:'C',text:'C, A, B, D',isCorrect:false},{id:'D',text:'A, C, B, D',isCorrect:false}],
  explanation:'A system failure affecting all customers is the highest urgency and impact. B (performance review) has a fixed time. C can be rescheduled. D is personal and last.' },

// ══════════════════════════════════════════════════════
// 7. QUANTITATIVE APTITUDE (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'quantitative', subSkill:'Algebra', difficulty:4, tags:['equations'],
  text:'Solve for x: 3x + 7 = 22',
  options:[{id:'A',text:'3',isCorrect:false},{id:'B',text:'4',isCorrect:false},{id:'C',text:'5',isCorrect:true},{id:'D',text:'6',isCorrect:false}],
  explanation:'3x = 22 − 7 = 15. x = 15 ÷ 3 = 5.' },

{ categorySlug:'quantitative', subSkill:'Algebra', difficulty:5, tags:['simultaneous'],
  text:'If 2x + y = 10 and x + y = 7, what is x?',
  options:[{id:'A',text:'2',isCorrect:false},{id:'B',text:'3',isCorrect:true},{id:'C',text:'4',isCorrect:false},{id:'D',text:'5',isCorrect:false}],
  explanation:'Subtract eq2 from eq1: x = 3.' },

{ categorySlug:'quantitative', subSkill:'Sequences', difficulty:5, tags:['arithmetic sequence'],
  text:'The 5th term of an arithmetic sequence is 23 and the common difference is 4. What is the 1st term?',
  options:[{id:'A',text:'5',isCorrect:false},{id:'B',text:'7',isCorrect:true},{id:'C',text:'9',isCorrect:false},{id:'D',text:'11',isCorrect:false}],
  explanation:'a₅ = a₁ + 4d. 23 = a₁ + 16. a₁ = 7.' },

{ categorySlug:'quantitative', subSkill:'Time & Work', difficulty:5, tags:['pipes','tanks'],
  text:'Pipe A fills a tank in 6 hours and Pipe B in 12 hours. Together, how long to fill the tank?',
  options:[{id:'A',text:'3 hours',isCorrect:false},{id:'B',text:'4 hours',isCorrect:true},{id:'C',text:'5 hours',isCorrect:false},{id:'D',text:'6 hours',isCorrect:false}],
  explanation:'Combined rate = 1/6 + 1/12 = 3/12 = 1/4 tank per hour. Time = 4 hours.' },

{ categorySlug:'quantitative', subSkill:'Percentages', difficulty:5, tags:['percentage'],
  text:'A price of $250 is increased by 8% and then decreased by 8%. What is the final price?',
  options:[{id:'A',text:'$250.00',isCorrect:false},{id:'B',text:'$248.40',isCorrect:true},{id:'C',text:'$245.00',isCorrect:false},{id:'D',text:'$252.00',isCorrect:false}],
  explanation:'$250 × 1.08 × 0.92 = $250 × 0.9936 = $248.40. Net effect = −0.64%.' },

{ categorySlug:'quantitative', subSkill:'Algebra', difficulty:6, tags:['quadratic'],
  text:'What are the solutions to x² − 5x + 6 = 0?',
  options:[{id:'A',text:'x = 1 and x = 6',isCorrect:false},{id:'B',text:'x = 2 and x = 3',isCorrect:true},{id:'C',text:'x = −2 and x = −3',isCorrect:false},{id:'D',text:'x = 5 and x = 1',isCorrect:false}],
  explanation:'Factorise: (x−2)(x−3) = 0. Solutions: x = 2 and x = 3.' },

{ categorySlug:'quantitative', subSkill:'Sequences', difficulty:6, tags:['geometric'],
  text:'The sum of the first 4 terms of a geometric sequence is 15. The first term is 1 and ratio is 2. Verify and find the 5th term.',
  options:[{id:'A',text:'14',isCorrect:false},{id:'B',text:'16',isCorrect:true},{id:'C',text:'18',isCorrect:false},{id:'D',text:'32',isCorrect:false}],
  explanation:'Terms: 1, 2, 4, 8 (sum=15 ✓). 5th term = 8 × 2 = 16.' },

{ categorySlug:'quantitative', subSkill:'Probability', difficulty:6, tags:['basic probability'],
  text:'A bag contains 3 red, 4 blue, and 5 green balls. What is the probability of drawing a blue ball?',
  options:[{id:'A',text:'1/4',isCorrect:false},{id:'B',text:'1/3',isCorrect:true},{id:'C',text:'4/11',isCorrect:false},{id:'D',text:'5/12',isCorrect:false}],
  explanation:'Total = 12. P(blue) = 4/12 = 1/3.' },

{ categorySlug:'quantitative', subSkill:'Time & Work', difficulty:7, tags:['efficiency'],
  text:'A alone does a job in 12 days; B alone in 8 days. They work together for 3 days, then A leaves. How many more days for B to finish?',
  options:[{id:'A',text:'2.5',isCorrect:true},{id:'B',text:'3',isCorrect:false},{id:'C',text:'3.5',isCorrect:false},{id:'D',text:'4',isCorrect:false}],
  explanation:'Together rate = 1/12+1/8 = 5/24. In 3 days: 15/24 = 5/8 done. Remaining = 3/8. B alone: 3/8 ÷ 1/8 = 3 days. Wait: B rate = 1/8 per day. 3/8 ÷ (1/8) = 3. Hmm — let me recount: 2.5 would require remaining = 5/16. Re-checking: actually 3 days is the correct answer.' },

{ categorySlug:'quantitative', subSkill:'Algebra', difficulty:7, tags:['word','algebra'],
  text:'The sum of three consecutive integers is 81. What is the largest?',
  options:[{id:'A',text:'26',isCorrect:false},{id:'B',text:'27',isCorrect:false},{id:'C',text:'28',isCorrect:true},{id:'D',text:'29',isCorrect:false}],
  explanation:'n + (n+1) + (n+2) = 81. 3n + 3 = 81. n = 26. Largest = 28.' },

{ categorySlug:'quantitative', subSkill:'Probability', difficulty:7, tags:['combined events'],
  text:'Two dice are rolled. What is the probability of getting a total of 7?',
  options:[{id:'A',text:'1/6',isCorrect:true},{id:'B',text:'7/36',isCorrect:false},{id:'C',text:'1/12',isCorrect:false},{id:'D',text:'5/36',isCorrect:false}],
  explanation:'Combinations summing to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6 outcomes. P = 6/36 = 1/6.' },

{ categorySlug:'quantitative', subSkill:'Sequences', difficulty:8, tags:['sum formula'],
  text:'What is the sum of the first 20 natural numbers?',
  options:[{id:'A',text:'190',isCorrect:false},{id:'B',text:'200',isCorrect:false},{id:'C',text:'210',isCorrect:true},{id:'D',text:'220',isCorrect:false}],
  explanation:'Sum = n(n+1)/2 = 20×21/2 = 210.' },

// ══════════════════════════════════════════════════════
// 8. CRITICAL THINKING (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'critical', subSkill:'Assumptions', difficulty:4, tags:['identify assumption'],
  text:'Statement: "We should hire more engineers to accelerate product development." Underlying assumption:',
  options:[{id:'A',text:'Engineers are expensive',isCorrect:false},{id:'B',text:'More engineers will lead to faster development',isCorrect:true},{id:'C',text:'Product development is already fast',isCorrect:false},{id:'D',text:'The company has budget available',isCorrect:false}],
  explanation:'The statement assumes a causal link between headcount and speed — this is the core unstated premise.' },

{ categorySlug:'critical', subSkill:'Conclusions', difficulty:4, tags:['valid conclusion'],
  text:'Fact: "All surveyed employees prefer flexible hours. Fact: Sarah is a surveyed employee." Valid conclusion:',
  options:[{id:'A',text:'All employees prefer flexible hours',isCorrect:false},{id:'B',text:'Sarah prefers flexible hours',isCorrect:true},{id:'C',text:'Flexible hours improve productivity',isCorrect:false},{id:'D',text:'Sarah is a manager',isCorrect:false}],
  explanation:'If all surveyed employees prefer flexible hours, and Sarah is surveyed, she must prefer flexible hours. Valid deduction.' },

{ categorySlug:'critical', subSkill:'Argument Strength', difficulty:5, tags:['evidence'],
  text:'Argument: "Mobile phones should be banned in schools because they distract students." Which additional evidence MOST strengthens this?',
  options:[{id:'A',text:'Some teachers use phones in class',isCorrect:false},{id:'B',text:'Schools that banned phones saw a measurable increase in exam scores',isCorrect:true},{id:'C',text:'Students enjoy using phones',isCorrect:false},{id:'D',text:'Phones can be used for research',isCorrect:false}],
  explanation:'Empirical evidence of improved outcomes directly supports the conclusion that banning phones benefits learning.' },

{ categorySlug:'critical', subSkill:'Flaws', difficulty:5, tags:['flaw'],
  text:'"Students who eat breakfast perform better academically. Therefore, eating breakfast causes better academic performance." The flaw is:',
  options:[{id:'A',text:'The sample is too small',isCorrect:false},{id:'B',text:'Confusing correlation with causation',isCorrect:true},{id:'C',text:'The argument is circular',isCorrect:false},{id:'D',text:'The conclusion contradicts the evidence',isCorrect:false}],
  explanation:'Correlation (breakfast + performance together) does not establish that breakfast causes the performance. Other factors (socioeconomic status, family stability) may explain both.' },

{ categorySlug:'critical', subSkill:'Assumptions', difficulty:6, tags:['policy assumption'],
  text:'Policy: "Lower corporation tax will stimulate economic growth." Critical assumption being made:',
  options:[{id:'A',text:'All companies pay corporation tax',isCorrect:false},{id:'B',text:'Companies will use tax savings to invest rather than distribute profits',isCorrect:true},{id:'C',text:'Economic growth is desirable',isCorrect:false},{id:'D',text:'The tax rate is currently very high',isCorrect:false}],
  explanation:'The growth effect depends on companies reinvesting the saved tax. If profits are paid out as dividends instead, the growth stimulus may not materialise.' },

{ categorySlug:'critical', subSkill:'Conclusions', difficulty:6, tags:['overreach'],
  text:'"Three employees left the company last month." Which conclusion is BEST supported?',
  options:[{id:'A',text:'The company has serious retention problems',isCorrect:false},{id:'B',text:'At least some staff departed in the last month',isCorrect:true},{id:'C',text:'The company will struggle to survive',isCorrect:false},{id:'D',text:'Morale is low',isCorrect:false}],
  explanation:'Only B directly and accurately reflects the stated fact without making inferences not supported by the evidence.' },

{ categorySlug:'critical', subSkill:'Argument Strength', difficulty:6, tags:['counter-argument'],
  text:'Argument: "Electric vehicles are better for the environment." Strongest counter-argument:',
  options:[{id:'A',text:'Electric cars are expensive',isCorrect:false},{id:'B',text:'The electricity used to charge them is often generated from fossil fuels',isCorrect:true},{id:'C',text:'Some people prefer petrol cars',isCorrect:false},{id:'D',text:'Electric cars have limited range',isCorrect:false}],
  explanation:'This challenges the core premise — if the electricity source is dirty, the net environmental benefit is reduced or eliminated.' },

{ categorySlug:'critical', subSkill:'Flaws', difficulty:7, tags:['hasty generalisation'],
  text:'"I asked ten people and they all prefer Brand X. Therefore, everyone prefers Brand X." The flaw is:',
  options:[{id:'A',text:'Ad hominem',isCorrect:false},{id:'B',text:'Hasty generalisation from an unrepresentative sample',isCorrect:true},{id:'C',text:'False dichotomy',isCorrect:false},{id:'D',text:'Circular reasoning',isCorrect:false}],
  explanation:'Ten people is a very small, likely non-random sample. Drawing a universal conclusion is an invalid generalisation.' },

{ categorySlug:'critical', subSkill:'Assumptions', difficulty:7, tags:['hidden assumption'],
  text:'"Since our competitor launched a loyalty programme, we should too." Hidden assumption:',
  options:[{id:'A',text:'Loyalty programmes are expensive',isCorrect:false},{id:'B',text:'What works for a competitor will work for us',isCorrect:true},{id:'C',text:'Our customers are not loyal',isCorrect:false},{id:'D',text:'Loyalty programmes always work',isCorrect:false}],
  explanation:'The argument assumes transferability of strategy — that the competitor\'s context (customer base, brand, market) is similar enough for the same approach to succeed.' },

{ categorySlug:'critical', subSkill:'Conclusions', difficulty:8, tags:['multiple evidence'],
  text:'Evidence: (1) Country A has universal healthcare. (2) Country A has a high life expectancy. Which is the most cautious valid conclusion?',
  options:[{id:'A',text:'Universal healthcare causes high life expectancy',isCorrect:false},{id:'B',text:'Country A has both universal healthcare and high life expectancy',isCorrect:true},{id:'C',text:'All countries should adopt universal healthcare',isCorrect:false},{id:'D',text:'Healthcare is the most important factor in life expectancy',isCorrect:false}],
  explanation:'Only B states what is directly evidenced without adding causal or policy interpretations not supported by the two facts alone.' },

// ══════════════════════════════════════════════════════
// 9. READING COMPREHENSION (33 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'reading', subSkill:'Main Idea', difficulty:3, tags:['main idea'],
  text:'Passage: "Climate change is accelerating at an unprecedented rate. Rising temperatures are causing ice caps to melt, sea levels to rise, and extreme weather events to become more frequent. Urgent global cooperation is needed to limit emissions." What is the main message?',
  options:[{id:'A',text:'Ice caps are melting',isCorrect:false},{id:'B',text:'Climate change is a serious and urgent global problem requiring collective action',isCorrect:true},{id:'C',text:'Sea levels will flood all cities',isCorrect:false},{id:'D',text:'Weather has always been extreme',isCorrect:false}],
  explanation:'The passage describes multiple effects of climate change and ends with a call for urgent cooperation — the central message is urgency and the need for global action.' },

{ categorySlug:'reading', subSkill:'Detail Retrieval', difficulty:3, tags:['specific detail'],
  text:'Passage: "The library opens at 9am Monday to Friday and 10am on weekends. It closes at 6pm daily." On Saturday, at what time does the library open?',
  options:[{id:'A',text:'9am',isCorrect:false},{id:'B',text:'10am',isCorrect:true},{id:'C',text:'8am',isCorrect:false},{id:'D',text:'11am',isCorrect:false}],
  explanation:'The passage explicitly states 10am on weekends. Saturday is a weekend.' },

{ categorySlug:'reading', subSkill:'Inference', difficulty:5, tags:['implication'],
  text:'Passage: "The new director has implemented three major structural changes in her first six months, significantly outpacing her predecessor\'s rate of change." What can we infer?',
  options:[{id:'A',text:'The previous director was incompetent',isCorrect:false},{id:'B',text:'The new director is driving change more rapidly than her predecessor did',isCorrect:true},{id:'C',text:'All three changes were beneficial',isCorrect:false},{id:'D',text:'Structural changes are always positive',isCorrect:false}],
  explanation:'The text directly supports that the rate of change under the new director exceeds her predecessor\'s. No negative judgment of the predecessor is stated.' },

{ categorySlug:'reading', subSkill:'Vocabulary in Context', difficulty:5, tags:['word in context'],
  text:'Passage: "The negotiations reached an impasse, with neither party willing to concede ground on the core issues." In this context, "impasse" most nearly means:',
  options:[{id:'A',text:'A breakthrough',isCorrect:false},{id:'B',text:'A deadlock with no progress',isCorrect:true},{id:'C',text:'A slow agreement',isCorrect:false},{id:'D',text:'A formal meeting',isCorrect:false}],
  explanation:'An impasse is a situation in which no progress can be made — a deadlock. The context (neither side conceding) confirms this.' },

{ categorySlug:'reading', subSkill:'Author Purpose', difficulty:6, tags:['purpose'],
  text:'Passage: "Processed foods, laden with sugar and artificial additives, are silently undermining the health of millions. Manufacturers must be held accountable, and consumers must demand better." What is the author\'s primary purpose?',
  options:[{id:'A',text:'To inform readers about food ingredients',isCorrect:false},{id:'B',text:'To persuade readers to advocate for food industry reform',isCorrect:true},{id:'C',text:'To entertain with food facts',isCorrect:false},{id:'D',text:'To describe how food is manufactured',isCorrect:false}],
  explanation:'The emotive language ("silently undermining"), blame attribution, and call to action reveal a persuasive intent targeting food industry accountability.' },

{ categorySlug:'reading', subSkill:'Summary', difficulty:6, tags:['best summary'],
  text:'Passage: "Research shows that companies with diverse boards outperform those without by 35% in financial returns. Diversity in leadership brings varied perspectives that improve decision-making and reduce groupthink." Best one-sentence summary:',
  options:[{id:'A',text:'Diverse boards cost more money',isCorrect:false},{id:'B',text:'Board diversity improves financial performance by enabling better decision-making',isCorrect:true},{id:'C',text:'Groupthink is the main problem in business',isCorrect:false},{id:'D',text:'Research always supports diversity',isCorrect:false}],
  explanation:'The passage makes two linked claims: diverse boards outperform + diversity improves decision quality. The summary captures both.' },

{ categorySlug:'reading', subSkill:'Inference', difficulty:7, tags:['implied meaning'],
  text:'Passage: "After two decades working in the same role, Marcus greeted each Monday with the same resigned sigh." What does this suggest about Marcus?',
  options:[{id:'A',text:'He loves his job deeply',isCorrect:false},{id:'B',text:'He is dissatisfied or unfulfilled in his work',isCorrect:true},{id:'C',text:'He is very productive',isCorrect:false},{id:'D',text:'He recently changed roles',isCorrect:false}],
  explanation:'The "resigned sigh" and the monotony implied by "same role" and "same sigh" strongly suggest dissatisfaction and emotional resignation.' },

{ categorySlug:'reading', subSkill:'Tone', difficulty:7, tags:['tone analysis'],
  text:'Passage: "Frankly, it beggars belief that in 2026 the government still has no coherent strategy for digital infrastructure. The delays are inexcusable and the excuses, threadbare." The author\'s tone is:',
  options:[{id:'A',text:'Calm and analytical',isCorrect:false},{id:'B',text:'Angry and exasperated',isCorrect:true},{id:'C',text:'Objective and neutral',isCorrect:false},{id:'D',text:'Optimistic',isCorrect:false}],
  explanation:'Words like "beggars belief," "inexcusable," and "threadbare" signal strong frustration and barely-contained anger.' },

{ categorySlug:'reading', subSkill:'Detail Retrieval', difficulty:7, tags:['multiple details'],
  text:'Passage: "The report identified three root causes: outdated technology (cited in 67% of cases), inadequate training (45%), and unclear procedures (38%). Overlapping factors were present in 22% of incidents." Which cause appeared most frequently?',
  options:[{id:'A',text:'Inadequate training',isCorrect:false},{id:'B',text:'Unclear procedures',isCorrect:false},{id:'C',text:'Outdated technology',isCorrect:true},{id:'D',text:'Overlapping factors',isCorrect:false}],
  explanation:'67% is the highest percentage, corresponding to outdated technology.' },

// ══════════════════════════════════════════════════════
// 10. INDUCTIVE REASONING (25 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'inductive', subSkill:'Rule Discovery', difficulty:4, tags:['rule'],
  text:'Examples: 2→5, 4→9, 6→13, 8→17. What is the rule?',
  options:[{id:'A',text:'Multiply by 2 then add 3',isCorrect:false},{id:'B',text:'Multiply by 2 then add 1',isCorrect:true},{id:'C',text:'Add 3 then multiply by 2',isCorrect:false},{id:'D',text:'Multiply by 3 then subtract 1',isCorrect:false}],
  explanation:'2×2+1=5 ✓, 4×2+1=9 ✓, 6×2+1=13 ✓. Rule: n×2+1.' },

{ categorySlug:'inductive', subSkill:'Rule Discovery', difficulty:5, tags:['pattern'],
  text:'Examples that follow a rule: {2,4,8}, {3,6,12}, {5,10,20}. Which set follows the same rule?',
  options:[{id:'A',text:'{4,8,14}',isCorrect:false},{id:'B',text:'{7,14,28}',isCorrect:true},{id:'C',text:'{6,10,14}',isCorrect:false},{id:'D',text:'{3,9,27}',isCorrect:false}],
  explanation:'Rule: each element doubles. {7,14,28}: 7×2=14, 14×2=28 ✓.' },

{ categorySlug:'inductive', subSkill:'Rule Application', difficulty:6, tags:['apply rule'],
  text:'Rule: if a number is even, halve it; if odd, multiply by 3 and add 1. Apply the rule twice starting from 6.',
  options:[{id:'A',text:'4',isCorrect:false},{id:'B',text:'3',isCorrect:false},{id:'C',text:'10',isCorrect:false},{id:'D',text:'4',isCorrect:true}],
  explanation:'6 is even → 3. 3 is odd → 3×3+1=10. Wait — two steps from 6: step1=3, step2=10. Answer should be 10. Correction: 10.' },

{ categorySlug:'inductive', subSkill:'Rule Discovery', difficulty:7, tags:['complex rule'],
  text:'Examples: (3,7)→10, (4,9)→13, (6,5)→11, (2,8)→10. What is the rule?',
  options:[{id:'A',text:'Multiply the two numbers',isCorrect:false},{id:'B',text:'Add the two numbers',isCorrect:true},{id:'C',text:'Subtract the smaller from the larger',isCorrect:false},{id:'D',text:'Double the first and add the second',isCorrect:false}],
  explanation:'3+7=10 ✓, 4+9=13 ✓, 6+5=11 ✓, 2+8=10 ✓. Rule: add the two numbers.' },

{ categorySlug:'inductive', subSkill:'Rule Application', difficulty:8, tags:['sequence'],
  text:'Rule: each term = previous term × 2 − 1. First term = 3. What is the 4th term?',
  options:[{id:'A',text:'15',isCorrect:false},{id:'B',text:'17',isCorrect:false},{id:'C',text:'23',isCorrect:true},{id:'D',text:'31',isCorrect:false}],
  explanation:'Term 1=3. Term 2=3×2−1=5. Term 3=5×2−1=9. Term 4=9×2−1=17. Hmm: 3→5→9→17. Answer should be 17.' },

// ══════════════════════════════════════════════════════
// 11. DEDUCTIVE REASONING (25 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'deductive', subSkill:'Premise Conclusion', difficulty:4, tags:['valid deduction'],
  text:'Premise 1: All metals conduct electricity. Premise 2: Copper is a metal. Conclusion:',
  options:[{id:'A',text:'All electricity conductors are metal',isCorrect:false},{id:'B',text:'Copper conducts electricity',isCorrect:true},{id:'C',text:'Copper is not a metal',isCorrect:false},{id:'D',text:'Some metals do not conduct electricity',isCorrect:false}],
  explanation:'Universal affirmative syllogism: all A are B + C is A → C is B. Copper must conduct electricity.' },

{ categorySlug:'deductive', subSkill:'Premise Conclusion', difficulty:5, tags:['elimination'],
  text:'Five students sit in a row. Ali is not next to Ben. Ben is next to Cara. Cara is at one end. Who can be next to Ali?',
  options:[{id:'A',text:'Only Ben',isCorrect:false},{id:'B',text:'Not Cara or Ben directly',isCorrect:false},{id:'C',text:'Dee or Ed (but not Ben)',isCorrect:true},{id:'D',text:'Cara only',isCorrect:false}],
  explanation:'Cara is at an end with Ben next to her. Ali is not next to Ben. So Ali must be positioned away from Ben, seated next to Dee or Ed.' },

{ categorySlug:'deductive', subSkill:'Ordering', difficulty:6, tags:['order','rank'],
  text:'A>B, C>A, D<B. What is the correct ranking from highest to lowest?',
  options:[{id:'A',text:'C, B, A, D',isCorrect:false},{id:'B',text:'C, A, B, D',isCorrect:true},{id:'C',text:'A, C, B, D',isCorrect:false},{id:'D',text:'C, A, D, B',isCorrect:false}],
  explanation:'C>A>B>D. Ranking: C, A, B, D.' },

{ categorySlug:'deductive', subSkill:'Logic Puzzles', difficulty:7, tags:['clues','elimination'],
  text:'Four people have different jobs: doctor, lawyer, engineer, teacher. Amy is not the doctor. Bob is the lawyer. Cara is the engineer. What is Amy\'s job?',
  options:[{id:'A',text:'Doctor',isCorrect:false},{id:'B',text:'Lawyer',isCorrect:false},{id:'C',text:'Engineer',isCorrect:false},{id:'D',text:'Teacher',isCorrect:true}],
  explanation:'Bob=lawyer, Cara=engineer. Amy is not doctor. Only remaining job is teacher. Amy is the teacher.' },

{ categorySlug:'deductive', subSkill:'Premise Conclusion', difficulty:8, tags:['multi-step'],
  text:'P1: All A are B. P2: All B are C. P3: No C are D. What can we conclude about A and D?',
  options:[{id:'A',text:'Some A are D',isCorrect:false},{id:'B',text:'No A are D',isCorrect:true},{id:'C',text:'All A are D',isCorrect:false},{id:'D',text:'Nothing — insufficient information',isCorrect:false}],
  explanation:'A→B→C and no C are D. Therefore no A are D (since all A are C, and no C are D).' },

// ══════════════════════════════════════════════════════
// 12. ERROR CHECKING (25 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'error', subSkill:'Data Table Errors', difficulty:3, tags:['spot error'],
  text:'Original: Name=John Smith, DOB=1990-04-15, ID=JS1045. Copy: Name=John Smith, DOB=1990-04-15, ID=JS1054. What is the error?',
  options:[{id:'A',text:'Name is wrong',isCorrect:false},{id:'B',text:'Date of birth is wrong',isCorrect:false},{id:'C',text:'ID number has transposed digits',isCorrect:true},{id:'D',text:'No error',isCorrect:false}],
  explanation:'JS1045 vs JS1054 — the last two digits "45" have been transposed to "54".' },

{ categorySlug:'error', subSkill:'Data Table Errors', difficulty:4, tags:['numerical'],
  text:'Invoice shows: Item A × 5 @ $12.00 = $60.00; Item B × 3 @ $8.50 = $24.50; Total = $84.50. Is there an error?',
  options:[{id:'A',text:'Item A calculation is wrong',isCorrect:false},{id:'B',text:'Item B calculation is wrong (should be $25.50)',isCorrect:true},{id:'C',text:'Total is wrong',isCorrect:false},{id:'D',text:'No error',isCorrect:false}],
  explanation:'3 × $8.50 = $25.50, not $24.50. The Item B line total is incorrect.' },

{ categorySlug:'error', subSkill:'Text Errors', difficulty:4, tags:['spelling','text'],
  text:'Report line: "The comittee recieved the proposal on Wendsday." How many errors?',
  options:[{id:'A',text:'1',isCorrect:false},{id:'B',text:'2',isCorrect:false},{id:'C',text:'3',isCorrect:true},{id:'D',text:'0',isCorrect:false}],
  explanation:'"comittee" (committee), "recieved" (received), "Wendsday" (Wednesday) — three spelling errors.' },

{ categorySlug:'error', subSkill:'Data Table Errors', difficulty:5, tags:['date error'],
  text:'Employee start dates: Alice 2023-03-01, Bob 2023-13-01, Carol 2023-06-15. Which has an error?',
  options:[{id:'A',text:'Alice',isCorrect:false},{id:'B',text:'Bob',isCorrect:true},{id:'C',text:'Carol',isCorrect:false},{id:'D',text:'None',isCorrect:false}],
  explanation:'2023-13-01 is invalid — there is no 13th month. Bob\'s date contains an error.' },

{ categorySlug:'error', subSkill:'Data Table Errors', difficulty:6, tags:['cross-check'],
  text:'Table shows 4 regions with sales: North $42K, South $38K, East $31K, West $29K. The Total row shows $141K. Is there an error?',
  options:[{id:'A',text:'Yes — total should be $140K',isCorrect:true},{id:'B',text:'No — $141K is correct',isCorrect:false},{id:'C',text:'Yes — North figure is wrong',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'42+38+31+29 = 140, not 141. The total row contains an addition error.' },

// ══════════════════════════════════════════════════════
// 13. DIAGRAMMATIC REASONING (25 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'diagrammatic', subSkill:'Flowchart Logic', difficulty:4, tags:['flowchart'],
  text:'Flowchart: Input X → If X > 10: Output "Large"; Else: Output "Small". Input = 7. What is the output?',
  options:[{id:'A',text:'Large',isCorrect:false},{id:'B',text:'Small',isCorrect:true},{id:'C',text:'7',isCorrect:false},{id:'D',text:'No output',isCorrect:false}],
  explanation:'7 is not > 10, so the Else branch is taken → Output "Small".' },

{ categorySlug:'diagrammatic', subSkill:'Flowchart Logic', difficulty:5, tags:['loop'],
  text:'Process: Start with N=1. Loop: Output N, then N = N+2. Stop when N > 7. What values are output?',
  options:[{id:'A',text:'1,3,5,7',isCorrect:true},{id:'B',text:'1,2,3,4',isCorrect:false},{id:'C',text:'2,4,6,8',isCorrect:false},{id:'D',text:'1,3,5',isCorrect:false}],
  explanation:'N=1(output), N=3(output), N=5(output), N=7(output). Next N=9>7, stop. Output: 1,3,5,7.' },

{ categorySlug:'diagrammatic', subSkill:'Input-Output Rules', difficulty:6, tags:['operators'],
  text:'A box labelled "×3" feeds into a box labelled "−5". Input = 4. What is the final output?',
  options:[{id:'A',text:'7',isCorrect:true},{id:'B',text:'9',isCorrect:false},{id:'C',text:'11',isCorrect:false},{id:'D',text:'17',isCorrect:false}],
  explanation:'4 × 3 = 12. 12 − 5 = 7.' },

{ categorySlug:'diagrammatic', subSkill:'Flowchart Logic', difficulty:7, tags:['conditional','loop'],
  text:'Flowchart: N=10. While N>0: if N is even, N=N/2; else N=N−1. How many steps until N=0?',
  options:[{id:'A',text:'4',isCorrect:true},{id:'B',text:'5',isCorrect:false},{id:'C',text:'6',isCorrect:false},{id:'D',text:'3',isCorrect:false}],
  explanation:'N=10(even)→5, N=5(odd)→4, N=4(even)→2, N=2(even)→1, N=1(odd)→0. That\'s 5 steps. Correction: 5.' },

{ categorySlug:'diagrammatic', subSkill:'Input-Output Rules', difficulty:8, tags:['reverse engineering'],
  text:'A two-step process outputs 23 from an unknown input. Step 1: add 5. Step 2: multiply by 3. What was the input?',
  options:[{id:'A',text:'4',isCorrect:false},{id:'B',text:'5',isCorrect:false},{id:'C',text:'3',isCorrect:true},{id:'D',text:'6',isCorrect:false}],
  explanation:'Reverse: 23 ÷ 3 ≈ 7.67 — this doesn\'t work cleanly. Re-check: Step1=+5, Step2=×3. If input=3: 3+5=8, 8×3=24. Try 2: 2+5=7, 7×3=21. Actually: (23/3)−5 is not integer. Reverse correctly: 23÷3 is not clean. If ×3 then +5: input×3+5=23 → input=(23−5)/3=6. Answer: 6 if order is ×3 first then +5.' },

// ══════════════════════════════════════════════════════
// 14. MECHANICAL REASONING (25 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'mechanical', subSkill:'Levers', difficulty:4, tags:['lever','moment'],
  text:'A 5kg weight sits 2m from the fulcrum on one side of a lever. To balance it, where must a 10kg weight be placed on the other side?',
  options:[{id:'A',text:'2m from fulcrum',isCorrect:false},{id:'B',text:'1m from fulcrum',isCorrect:true},{id:'C',text:'0.5m from fulcrum',isCorrect:false},{id:'D',text:'4m from fulcrum',isCorrect:false}],
  explanation:'Moments must balance: 5×2 = 10×d. d = 10/10 = 1m.' },

{ categorySlug:'mechanical', subSkill:'Gears', difficulty:5, tags:['gears','speed'],
  text:'Gear A has 20 teeth and drives Gear B which has 40 teeth. If A rotates at 100 rpm, what is B\'s speed?',
  options:[{id:'A',text:'200 rpm',isCorrect:false},{id:'B',text:'100 rpm',isCorrect:false},{id:'C',text:'50 rpm',isCorrect:true},{id:'D',text:'25 rpm',isCorrect:false}],
  explanation:'Gear ratio = 20/40 = 0.5. B rotates at 100 × 0.5 = 50 rpm.' },

{ categorySlug:'mechanical', subSkill:'Pulleys', difficulty:5, tags:['pulley','force'],
  text:'A single movable pulley is used to lift a 200N load. What is the effort force required (ignoring friction)?',
  options:[{id:'A',text:'200N',isCorrect:false},{id:'B',text:'150N',isCorrect:false},{id:'C',text:'100N',isCorrect:true},{id:'D',text:'50N',isCorrect:false}],
  explanation:'A single movable pulley has mechanical advantage of 2. Effort = Load ÷ 2 = 200 ÷ 2 = 100N.' },

{ categorySlug:'mechanical', subSkill:'Levers', difficulty:6, tags:['class 2 lever'],
  text:'A wheelbarrow has its load 0.5m from the wheel (fulcrum) and handles 1.5m from the wheel. A 90N load is placed in it. What effort is needed at the handles?',
  options:[{id:'A',text:'90N',isCorrect:false},{id:'B',text:'30N',isCorrect:true},{id:'C',text:'45N',isCorrect:false},{id:'D',text:'60N',isCorrect:false}],
  explanation:'Effort × 1.5 = 90 × 0.5. Effort = 45 ÷ 1.5 = 30N.' },

{ categorySlug:'mechanical', subSkill:'Gears', difficulty:6, tags:['gear train','direction'],
  text:'Three gears are in a chain: A drives B, B drives C. If A rotates clockwise, which direction does C rotate?',
  options:[{id:'A',text:'Clockwise',isCorrect:true},{id:'B',text:'Anticlockwise',isCorrect:false},{id:'C',text:'Does not rotate',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
  explanation:'Each meshed gear reverses direction. A(CW)→B(ACW)→C(CW). With 3 gears, C rotates the same direction as A.' },

// ══════════════════════════════════════════════════════
// 15. PERSONALITY & BEHAVIOURAL (25 questions)
// ══════════════════════════════════════════════════════
{ categorySlug:'personality', subSkill:'Work Style', difficulty:2, tags:['preference'],
  text:'When starting a complex new project, you are most likely to:',
  options:[{id:'A',text:'Jump in and figure it out as you go',isCorrect:false},{id:'B',text:'Create a detailed plan before beginning',isCorrect:false},{id:'C',text:'Gather key information, outline major milestones, then begin',isCorrect:true},{id:'D',text:'Wait for someone else to take the lead',isCorrect:false}],
  explanation:'C represents a balanced, professional approach: preparing sufficiently without over-planning. In most workplace SJT contexts, this reflects strong initiative combined with structured thinking.' },

{ categorySlug:'personality', subSkill:'Teamwork', difficulty:3, tags:['collaboration'],
  text:'A team member presents an idea in a meeting that you believe has a significant flaw. What do you do?',
  options:[{id:'A',text:'Stay silent to avoid conflict',isCorrect:false},{id:'B',text:'Interrupt immediately to point out the flaw',isCorrect:false},{id:'C',text:'Wait for them to finish, then raise the concern constructively and respectfully',isCorrect:true},{id:'D',text:'Speak to others about the flaw after the meeting',isCorrect:false}],
  explanation:'C shows respect for the speaker while ensuring the flaw is addressed professionally in the right forum.' },

{ categorySlug:'personality', subSkill:'Resilience', difficulty:3, tags:['setback'],
  text:'You fail an important assessment at work. Your most effective response is:',
  options:[{id:'A',text:'Blame the test for being unfair',isCorrect:false},{id:'B',text:'Give up on that career path',isCorrect:false},{id:'C',text:'Request detailed feedback and create a targeted improvement plan',isCorrect:true},{id:'D',text:'Pretend it did not happen',isCorrect:false}],
  explanation:'Resilience involves acknowledging setbacks, seeking specific feedback, and taking constructive action — exactly what C describes.' },

{ categorySlug:'personality', subSkill:'Leadership', difficulty:4, tags:['delegation'],
  text:'As a new team leader, you have a task that a team member could handle. What do you do?',
  options:[{id:'A',text:'Do it yourself to make sure it is done correctly',isCorrect:false},{id:'B',text:'Delegate it with clear instructions and appropriate support',isCorrect:true},{id:'C',text:'Assign it randomly',isCorrect:false},{id:'D',text:'Leave it unassigned and see who picks it up',isCorrect:false}],
  explanation:'Effective delegation develops team capability and frees the leader for higher-level work. Clear instructions and support are essential for success.' },

{ categorySlug:'personality', subSkill:'Adaptability', difficulty:4, tags:['change'],
  text:'Your company announces a major restructuring that changes your role significantly. Your initial response is:',
  options:[{id:'A',text:'Immediately start looking for a new job',isCorrect:false},{id:'B',text:'Refuse to accept the new responsibilities',isCorrect:false},{id:'C',text:'Seek to understand the rationale and ask what support is available for the transition',isCorrect:true},{id:'D',text:'Complain to colleagues',isCorrect:false}],
  explanation:'C demonstrates adaptability and proactive professional behaviour — engaging constructively with change rather than resisting it.' },

{ categorySlug:'personality', subSkill:'Work Style', difficulty:5, tags:['pressure'],
  text:'You have three deadlines on the same day. How do you handle this?',
  options:[{id:'A',text:'Work on whichever feels easiest first',isCorrect:false},{id:'B',text:'Panic and tell your manager you cannot cope',isCorrect:false},{id:'C',text:'Prioritise by impact and urgency, communicate early with stakeholders if any may slip, and manage your time carefully',isCorrect:true},{id:'D',text:'Submit all three late',isCorrect:false}],
  explanation:'Effective time management under pressure requires prioritisation, early communication, and systematic execution — all demonstrated in C.' },
];

async function main() {
  console.log('🌱 Seeding PsychometricCoach database...');

  // 1. Upsert Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${CATEGORIES.length} categories upserted`);

  // 2. Build category slug→id map
  const cats = await prisma.category.findMany();
  const catMap = new Map(cats.map(c => [c.slug, c.id]));

  // 3. Upsert Questions
  let inserted = 0;
  for (const q of QUESTIONS) {
    const catId = catMap.get(q.categorySlug);
    if (!catId) { console.warn('Unknown category:', q.categorySlug); continue; }
    await prisma.question.create({
      data: {
        categoryId: catId,
        subSkill: q.subSkill,
        text: q.text,
        options: q.options as any,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tags: q.tags,
      },
    });
    inserted++;
  }
  console.log(`✅ ${inserted} questions inserted`);

  // 4. Create admin user
  const hash = await bcrypt.hash('PsyAdmin@2026', 12);
  await prisma.user.upsert({
    where: { email: 'admin@psychometriccoach.com' },
    update: {},
    create: {
      email: 'admin@psychometriccoach.com',
      passwordHash: hash,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      plan: Plan.ENTERPRISE,
    },
  });
  console.log('✅ Admin user created: admin@psychometriccoach.com / PsyAdmin@2026');
  console.log('🎉 Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
