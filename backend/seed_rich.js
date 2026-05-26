// Rich content seed: new categories + diagram-enhanced questions
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// ─── NEW CATEGORIES ───────────────────────────────────────────────────────────
const NEW_CATEGORIES = [
  // EXAM PREP
  {
    slug: 'ielts-reading', name: 'IELTS Reading', description: 'Academic reading passages, true/false/not given, matching headings, summary completion',
    icon: '📖', color: '#C0392B', assessmentType: 'EXAM_PREP', examType: 'IELTS',
    targetLevels: ['secondary', 'graduate', 'professional'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  {
    slug: 'ielts-listening', name: 'IELTS Listening', description: 'Multi-part listening tasks: form completion, multiple choice, plan/map labelling',
    icon: '🎧', color: '#E74C3C', assessmentType: 'EXAM_PREP', examType: 'IELTS',
    targetLevels: ['secondary', 'graduate', 'professional'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  {
    slug: 'ielts-writing', name: 'IELTS Writing', description: 'Task 1: data description (graphs, charts, tables). Task 2: argumentative essays',
    icon: '✍️', color: '#E74C3C', assessmentType: 'EXAM_PREP', examType: 'IELTS',
    targetLevels: ['secondary', 'graduate', 'professional'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  {
    slug: 'toefl-reading', name: 'TOEFL Reading', description: 'Academic passages with inference, vocabulary, prose summary questions',
    icon: '📚', color: '#2980B9', assessmentType: 'EXAM_PREP', examType: 'TOEFL',
    targetLevels: ['secondary', 'graduate'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  {
    slug: 'toefl-listening', name: 'TOEFL Listening', description: 'Lectures and conversations; comprehension, attitude, purpose questions',
    icon: '🔊', color: '#2980B9', assessmentType: 'EXAM_PREP', examType: 'TOEFL',
    targetLevels: ['secondary', 'graduate'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  {
    slug: 'oet-reading', name: 'OET Reading', description: 'Healthcare professional reading: clinical texts, patient information, research articles',
    icon: '🏥', color: '#27AE60', assessmentType: 'EXAM_PREP', examType: 'OET',
    targetLevels: ['professional'], targetRoles: ['nurse', 'doctor', 'pharmacist', 'physiotherapist'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  {
    slug: 'oet-writing', name: 'OET Writing', description: 'Writing referral and discharge letters based on case notes',
    icon: '📋', color: '#27AE60', assessmentType: 'EXAM_PREP', examType: 'OET',
    targetLevels: ['professional'], targetRoles: ['nurse', 'doctor', 'pharmacist'], isFreeTrialOnly: true, trialDurationMin: 30,
  },
  // PROFESSIONAL / ROLE-BASED
  {
    slug: 'financial-aptitude', name: 'Financial & Accounting', description: 'Financial ratios, balance sheet analysis, cost-benefit, investment calculations',
    icon: '💰', color: '#F39C12', assessmentType: 'PROFESSIONAL',
    targetLevels: ['graduate', 'professional'], targetRoles: ['accountant', 'finance officer', 'auditor', 'banker'],
  },
  {
    slug: 'data-analysis', name: 'Data Analysis & Statistics', description: 'Interpret charts, graphs, tables, regression, probability, statistical inference',
    icon: '📈', color: '#8E44AD', assessmentType: 'PROFESSIONAL',
    targetLevels: ['graduate', 'professional'], targetRoles: ['data analyst', 'researcher', 'statistician'],
  },
  {
    slug: 'management-reasoning', name: 'Management & Leadership', description: 'Decision making, team dynamics, situational judgement for managers and executives',
    icon: '👔', color: '#2C3E50', assessmentType: 'PROFESSIONAL',
    targetLevels: ['professional'], targetRoles: ['manager', 'team lead', 'director', 'executive'],
  },
  {
    slug: 'medical-science', name: 'Medical & Health Sciences', description: 'Clinical reasoning, pharmacology basics, anatomy, patient care scenarios',
    icon: '⚕️', color: '#16A085', assessmentType: 'PROFESSIONAL',
    targetLevels: ['graduate', 'professional'], targetRoles: ['nurse', 'doctor', 'pharmacist', 'clinical officer'],
  },
  {
    slug: 'law-reasoning', name: 'Legal Reasoning', description: 'Case analysis, statutory interpretation, logical legal arguments',
    icon: '⚖️', color: '#7F8C8D', assessmentType: 'PROFESSIONAL',
    targetLevels: ['graduate', 'professional'], targetRoles: ['lawyer', 'paralegal', 'compliance officer'],
  },
  // EDUCATION LEVEL BASED
  {
    slug: 'secondary-maths', name: 'Secondary School Maths', description: 'O-Level / IGCSE standard: algebra, geometry, fractions, percentages, word problems',
    icon: '🔢', color: '#E67E22', assessmentType: 'APTITUDE',
    targetLevels: ['secondary'],
  },
  {
    slug: 'graduate-reasoning', name: 'Graduate-Level Reasoning', description: 'Advanced numerical, verbal and abstract reasoning for graduate scheme applicants',
    icon: '🎓', color: '#2980B9', assessmentType: 'GRADUATE',
    targetLevels: ['graduate'],
  },
];

// ─── RICH QUESTIONS WITH DIAGRAMS ─────────────────────────────────────────────
// Format for diagramData:
// { type: "pie"|"bar"|"line"|"table"|"passage"|"chart_bar", title: "...", data: {...} }

const RICH_QUESTIONS = [
  // ── DATA ANALYSIS (bar + pie charts) ──────────────────────────────────────
  {
    slug: 'data-analysis',
    questions: [
      {
        subSkill: 'bar-chart-reading',
        text: 'The bar chart shows quarterly sales (in thousands) for Products A, B and C over 2023. Which product had the highest total annual sales?',
        diagramData: {
          type: 'bar',
          title: '2023 Quarterly Sales by Product (K units)',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            { label: 'Product A', data: [45, 52, 48, 61], color: '#0A528A' },
            { label: 'Product B', data: [38, 41, 55, 47], color: '#E4007C' },
            { label: 'Product C', data: [29, 35, 42, 58], color: '#00843D' },
          ]
        },
        options: [
          { id: 'A', text: 'Product A (total: 206K)', isCorrect: true },
          { id: 'B', text: 'Product B (total: 181K)', isCorrect: false },
          { id: 'C', text: 'Product C (total: 164K)', isCorrect: false },
          { id: 'D', text: 'All products tied', isCorrect: false },
        ],
        explanation: 'A: 45+52+48+61=206K. B: 38+41+55+47=181K. C: 29+35+42+58=164K. Product A highest at 206K.',
        difficulty: 2, timeLimit: 90,
      },
      {
        subSkill: 'pie-chart-reading',
        text: 'The pie chart shows how a company spends its annual budget. If the total budget is $4,800,000, how much is spent on Marketing?',
        diagramData: {
          type: 'pie',
          title: 'Annual Budget Allocation',
          labels: ['Salaries', 'Operations', 'Marketing', 'R&D', 'Admin'],
          values: [40, 25, 15, 12, 8],
          colors: ['#0A528A', '#E4007C', '#00843D', '#F39C12', '#7F8C8D'],
        },
        options: [
          { id: 'A', text: '$480,000', isCorrect: false },
          { id: 'B', text: '$720,000', isCorrect: true },
          { id: 'C', text: '$600,000', isCorrect: false },
          { id: 'D', text: '$960,000', isCorrect: false },
        ],
        explanation: '15% of $4,800,000 = 0.15 × 4,800,000 = $720,000.',
        difficulty: 2, timeLimit: 80,
      },
      {
        subSkill: 'line-chart-trend',
        text: 'The line graph shows website traffic (monthly visitors) over 6 months. What was the percentage increase from January to June?',
        diagramData: {
          type: 'line',
          title: 'Monthly Website Visitors (thousands)',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            { label: 'Visitors', data: [20, 24, 22, 28, 35, 44], color: '#0A528A' },
          ]
        },
        options: [
          { id: 'A', text: '100%', isCorrect: false },
          { id: 'B', text: '110%', isCorrect: false },
          { id: 'C', text: '120%', isCorrect: true },
          { id: 'D', text: '125%', isCorrect: false },
        ],
        explanation: 'Increase = (44-20)/20 × 100 = 24/20 × 100 = 120%.',
        difficulty: 2, timeLimit: 90,
      },
      {
        subSkill: 'table-analysis',
        text: 'Using the table, which department has the highest revenue per employee?',
        diagramData: {
          type: 'table',
          title: 'Departmental Performance 2023',
          headers: ['Department', 'Employees', 'Revenue ($000)', 'Rev/Employee ($)'],
          rows: [
            ['Sales', '12', '1,440', '120,000'],
            ['Engineering', '8', '1,120', '140,000'],
            ['Marketing', '6', '660', '110,000'],
            ['Finance', '4', '520', '130,000'],
          ],
          highlightCol: 3,
        },
        options: [
          { id: 'A', text: 'Sales ($120,000)', isCorrect: false },
          { id: 'B', text: 'Engineering ($140,000)', isCorrect: true },
          { id: 'C', text: 'Finance ($130,000)', isCorrect: false },
          { id: 'D', text: 'Marketing ($110,000)', isCorrect: false },
        ],
        explanation: 'Engineering: $1,120,000 ÷ 8 = $140,000 per employee — highest of all departments.',
        difficulty: 2, timeLimit: 100,
      },
      {
        subSkill: 'mixed-chart',
        text: 'The chart compares market share (%) of 5 companies in 2020 vs 2023. Which company gained the most market share?',
        diagramData: {
          type: 'bar',
          title: 'Market Share Comparison 2020 vs 2023 (%)',
          labels: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
          datasets: [
            { label: '2020', data: [28, 22, 18, 17, 15], color: '#0A528A' },
            { label: '2023', data: [24, 25, 22, 19, 10], color: '#E4007C' },
          ],
        },
        options: [
          { id: 'A', text: 'Alpha (+0%)', isCorrect: false },
          { id: 'B', text: 'Beta (+3%)', isCorrect: false },
          { id: 'C', text: 'Gamma (+4%)', isCorrect: true },
          { id: 'D', text: 'Delta (+2%)', isCorrect: false },
        ],
        explanation: 'Gamma grew from 18% to 22% = +4 percentage points, the largest gain.',
        difficulty: 3, timeLimit: 90,
      },
    ]
  },
  // ── FINANCIAL APTITUDE (tables + charts) ─────────────────────────────────
  {
    slug: 'financial-aptitude',
    questions: [
      {
        subSkill: 'ratio-analysis',
        text: 'Using the financial data in the table, calculate the current ratio for Company X.',
        diagramData: {
          type: 'table',
          title: 'Company X Balance Sheet Extract ($000)',
          headers: ['Item', 'Value ($000)'],
          rows: [
            ['Cash & equivalents', '250'],
            ['Accounts receivable', '180'],
            ['Inventory', '320'],
            ['Current liabilities', '500'],
            ['Long-term debt', '800'],
          ],
        },
        options: [
          { id: 'A', text: '1.00', isCorrect: false },
          { id: 'B', text: '1.50', isCorrect: true },
          { id: 'C', text: '1.25', isCorrect: false },
          { id: 'D', text: '0.86', isCorrect: false },
        ],
        explanation: 'Current assets = 250+180+320 = 750. Current ratio = 750/500 = 1.5.',
        difficulty: 3, timeLimit: 120,
      },
      {
        subSkill: 'profit-analysis',
        text: 'The pie chart shows the cost breakdown for a product priced at $200. What is the profit margin?',
        diagramData: {
          type: 'pie',
          title: 'Product Cost Structure (% of selling price $200)',
          labels: ['Raw Materials', 'Labour', 'Overhead', 'Marketing', 'Profit'],
          values: [35, 25, 15, 10, 15],
          colors: ['#E74C3C', '#3498DB', '#F39C12', '#9B59B6', '#2ECC71'],
        },
        options: [
          { id: 'A', text: '10%', isCorrect: false },
          { id: 'B', text: '15%', isCorrect: true },
          { id: 'C', text: '20%', isCorrect: false },
          { id: 'D', text: '25%', isCorrect: false },
        ],
        explanation: 'Profit slice = 15% of the chart. Profit margin = 15% of selling price.',
        difficulty: 2, timeLimit: 80,
      },
    ]
  },
  // ── IELTS READING (passage-based) ─────────────────────────────────────────
  {
    slug: 'ielts-reading',
    questions: [
      {
        subSkill: 'true-false-not-given',
        text: 'Read the passage and answer: TRUE, FALSE or NOT GIVEN for the statement: "Coral reefs occupy less than 1% of the ocean floor yet support over 25% of all marine species."',
        diagramData: {
          type: 'passage',
          title: 'Reading Passage: The Decline of Coral Reefs',
          text: `Coral reefs are among the most biologically diverse ecosystems on Earth. Although they occupy less than one percent of the ocean floor, coral reefs are home to more than 25 percent of all marine species, including fish, invertebrates, and plants. This extraordinary biodiversity makes reefs among the most productive marine habitats in the world.\n\nDespite their ecological importance, coral reefs face unprecedented threats. Ocean warming caused by climate change leads to coral bleaching — a stress response in which corals expel the symbiotic algae living in their tissues. Without algae, corals lose their primary food source and their vibrant colour, eventually dying if conditions do not improve. Scientists estimate that between 2009 and 2018, approximately 14 percent of the world's coral reefs were lost, representing around 11,700 km² of dead reef.\n\nOcean acidification, caused by rising CO₂ levels, also poses a significant threat. As seawater becomes more acidic, it becomes harder for corals to build and maintain their calcium carbonate skeletons. Some projections suggest that by 2050, ocean acidity could increase by up to 150 percent compared to pre-industrial levels.`,
        },
        options: [
          { id: 'A', text: 'TRUE — The statement matches the passage exactly', isCorrect: true },
          { id: 'B', text: 'FALSE — The passage states a different percentage', isCorrect: false },
          { id: 'C', text: 'NOT GIVEN — The passage does not mention this', isCorrect: false },
          { id: 'D', text: 'TRUE — But the figure of 25% refers to fish only', isCorrect: false },
        ],
        explanation: 'The passage explicitly states "less than one percent of the ocean floor" and "more than 25 percent of all marine species" — both figures match the statement exactly. Answer: TRUE.',
        difficulty: 2, timeLimit: 120,
      },
      {
        subSkill: 'inference',
        text: 'Based on the coral reef passage, what can be inferred about the relationship between rising CO₂ levels and coral skeleton formation?',
        diagramData: {
          type: 'passage',
          title: 'Reading Passage: The Decline of Coral Reefs',
          text: `Coral reefs are among the most biologically diverse ecosystems on Earth. Although they occupy less than one percent of the ocean floor, coral reefs are home to more than 25 percent of all marine species, including fish, invertebrates, and plants. This extraordinary biodiversity makes reefs among the most productive marine habitats in the world.\n\nDespite their ecological importance, coral reefs face unprecedented threats. Ocean warming caused by climate change leads to coral bleaching — a stress response in which corals expel the symbiotic algae living in their tissues. Without algae, corals lose their primary food source and their vibrant colour, eventually dying if conditions do not improve. Scientists estimate that between 2009 and 2018, approximately 14 percent of the world's coral reefs were lost, representing around 11,700 km² of dead reef.\n\nOcean acidification, caused by rising CO₂ levels, also poses a significant threat. As seawater becomes more acidic, it becomes harder for corals to build and maintain their calcium carbonate skeletons. Some projections suggest that by 2050, ocean acidity could increase by up to 150 percent compared to pre-industrial levels.`,
        },
        options: [
          { id: 'A', text: 'Higher CO₂ strengthens coral skeletons by providing more carbon', isCorrect: false },
          { id: 'B', text: 'Higher CO₂ increases ocean acidity, making skeleton building harder', isCorrect: true },
          { id: 'C', text: 'CO₂ has no direct effect on coral skeleton formation', isCorrect: false },
          { id: 'D', text: 'CO₂ affects bleaching but not skeleton formation', isCorrect: false },
        ],
        explanation: 'The passage states: "As seawater becomes more acidic [due to CO₂], it becomes harder for corals to build and maintain their calcium carbonate skeletons." Direct causal link.',
        difficulty: 2, timeLimit: 110,
      },
      {
        subSkill: 'vocabulary-context',
        text: 'In the coral reef passage, the word "unprecedented" (paragraph 2) is closest in meaning to:',
        diagramData: {
          type: 'passage',
          title: 'Context: "coral reefs face unprecedented threats"',
          text: 'Despite their ecological importance, coral reefs face unprecedented threats. Ocean warming caused by climate change leads to coral bleaching — a stress response in which corals expel the symbiotic algae living in their tissues.',
        },
        options: [
          { id: 'A', text: 'Well-documented', isCorrect: false },
          { id: 'B', text: 'Never seen before; without previous example', isCorrect: true },
          { id: 'C', text: 'Predictable and recurring', isCorrect: false },
          { id: 'D', text: 'Gradually increasing', isCorrect: false },
        ],
        explanation: '"Unprecedented" = never having happened or existed before. In context it emphasises these threats are uniquely severe compared to anything in recorded history.',
        difficulty: 1, timeLimit: 60,
      },
      {
        subSkill: 'data-from-passage',
        text: 'According to the passage, approximately how many square kilometres of coral reef were lost between 2009 and 2018?',
        diagramData: {
          type: 'passage',
          title: 'Coral Reef Decline — Key Statistics',
          text: 'Scientists estimate that between 2009 and 2018, approximately 14 percent of the world\'s coral reefs were lost, representing around 11,700 km² of dead reef. Ocean acidification, caused by rising CO₂ levels, also poses a significant threat.',
        },
        options: [
          { id: 'A', text: 'Around 11,700 km²', isCorrect: true },
          { id: 'B', text: 'Around 14,000 km²', isCorrect: false },
          { id: 'C', text: 'Around 9,500 km²', isCorrect: false },
          { id: 'D', text: 'Around 1% of ocean floor', isCorrect: false },
        ],
        explanation: 'The passage directly states "around 11,700 km² of dead reef" — scan for specific figures in the text.',
        difficulty: 1, timeLimit: 60,
      },
    ]
  },
  // ── TOEFL READING ──────────────────────────────────────────────────────────
  {
    slug: 'toefl-reading',
    questions: [
      {
        subSkill: 'prose-summary',
        text: 'Read the passage about plate tectonics. Which answer BEST summarises the main argument?',
        diagramData: {
          type: 'passage',
          title: 'TOEFL Reading: Plate Tectonics',
          text: `The theory of plate tectonics, developed in the 1960s, revolutionised the earth sciences by providing a unified framework to explain phenomena as diverse as earthquakes, volcanic activity, and the distribution of fossils across continents.\n\nAccording to this theory, the Earth's lithosphere — its rigid outermost shell — is divided into approximately fifteen major tectonic plates that move relative to one another at rates of a few centimetres per year. At convergent boundaries, where plates collide, one plate may be forced beneath another in a process called subduction, generating deep ocean trenches and volcanic mountain ranges. The Himalayas, for instance, formed when the Indian subcontinent collided with the Eurasian plate around 50 million years ago.\n\nAt divergent boundaries, plates move apart, allowing magma from the mantle to rise and solidify into new oceanic crust. The Mid-Atlantic Ridge, a chain of underwater mountains stretching 16,000 km, is a prime example of such a boundary. At transform boundaries, plates slide horizontally past one another, frequently causing shallow but powerful earthquakes — the San Andreas Fault in California exemplifies this type.`,
        },
        options: [
          { id: 'A', text: 'Plate tectonics explains why California has earthquakes', isCorrect: false },
          { id: 'B', text: 'The movement of tectonic plates explains major geological features and events across Earth', isCorrect: true },
          { id: 'C', text: 'The Himalayas formed due to volcanic activity 50 million years ago', isCorrect: false },
          { id: 'D', text: 'The Mid-Atlantic Ridge is the most important tectonic feature', isCorrect: false },
        ],
        explanation: 'The passage presents plate tectonics as a unified theory explaining earthquakes, volcanoes, mountain formation, and oceanic ridges — a broad, comprehensive claim.',
        difficulty: 2, timeLimit: 120,
      },
    ]
  },
  // ── OET READING ────────────────────────────────────────────────────────────
  {
    slug: 'oet-reading',
    questions: [
      {
        subSkill: 'clinical-text',
        text: 'Read the clinical extract and select the most appropriate clinical implication.',
        diagramData: {
          type: 'passage',
          title: 'OET Reading — Clinical Extract: Hypertension Management',
          text: `A 58-year-old male patient with a 10-year history of Type 2 diabetes presents with a blood pressure reading of 158/96 mmHg on three separate clinic visits over a 4-week period. His current medications include Metformin 1g twice daily and Aspirin 75mg once daily. His HbA1c is 7.8%, eGFR is 62 mL/min/1.73m², and urine albumin-to-creatinine ratio (uACR) is 42 mg/mmol.\n\nRecent NICE guidelines recommend initiating antihypertensive therapy for diabetic patients with a blood pressure above 140/90 mmHg. ACE inhibitors or ARBs are first-line agents in diabetic patients with proteinuria (uACR >3 mg/mmol) due to their nephroprotective effects. Beta-blockers are generally avoided in diabetic patients unless there is a specific cardiac indication, as they may mask hypoglycaemic symptoms.`,
        },
        options: [
          { id: 'A', text: 'Start a beta-blocker as it provides good blood pressure control in diabetic patients', isCorrect: false },
          { id: 'B', text: 'Initiate an ACE inhibitor or ARB, given hypertension with significant proteinuria', isCorrect: true },
          { id: 'C', text: 'Increase Metformin dose before adding antihypertensive therapy', isCorrect: false },
          { id: 'D', text: 'Blood pressure does not require treatment as eGFR is above 60', isCorrect: false },
        ],
        explanation: 'BP > 140/90 meets the threshold for antihypertensive treatment. uACR = 42 mg/mmol indicates significant proteinuria, making ACE inhibitors/ARBs first-line per NICE guidelines due to nephroprotective effects.',
        difficulty: 3, timeLimit: 150,
      },
    ]
  },
  // ── MANAGEMENT REASONING ──────────────────────────────────────────────────
  {
    slug: 'management-reasoning',
    questions: [
      {
        subSkill: 'decision-matrix',
        text: 'Your team must select a new software platform. The table shows scores (1-5) across key criteria. Which option gives the best overall result using equal weighting?',
        diagramData: {
          type: 'table',
          title: 'Platform Evaluation Matrix (Score 1–5)',
          headers: ['Criterion', 'Platform A', 'Platform B', 'Platform C'],
          rows: [
            ['Cost effectiveness', '4', '2', '3'],
            ['Ease of use', '3', '5', '4'],
            ['Integration', '5', '3', '4'],
            ['Security', '4', '4', '3'],
            ['Support quality', '3', '4', '5'],
            ['TOTAL', '19', '18', '19'],
          ],
          highlightRow: 5,
        },
        options: [
          { id: 'A', text: 'Platform A — highest total score', isCorrect: false },
          { id: 'B', text: 'Platform C — same total but better balance across criteria', isCorrect: true },
          { id: 'C', text: 'Platform B — best ease of use', isCorrect: false },
          { id: 'D', text: 'Platform A — best integration score', isCorrect: false },
        ],
        explanation: 'A and C tie at 19. However Platform C has no score below 3 (balanced), while Platform A scored 3 in two areas. For strategic deployment, balance across all criteria reduces operational risk.',
        difficulty: 3, timeLimit: 120,
      },
      {
        subSkill: 'team-performance',
        text: 'The chart shows employee satisfaction scores (1-10) across 4 quarters for two teams. A manager must decide which team to prioritise for intervention. Which is correct?',
        diagramData: {
          type: 'line',
          title: 'Team Satisfaction Scores by Quarter',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            { label: 'Team Alpha', data: [7.2, 6.8, 6.1, 5.4], color: '#E4007C' },
            { label: 'Team Beta', data: [6.0, 6.2, 6.3, 6.5], color: '#00843D' },
          ]
        },
        options: [
          { id: 'A', text: 'Team Beta — currently lower score than Alpha', isCorrect: false },
          { id: 'B', text: 'Team Alpha — consistent downward trend despite higher starting score', isCorrect: true },
          { id: 'C', text: 'Both need equal intervention', isCorrect: false },
          { id: 'D', text: 'Neither — both scores are above 5.0', isCorrect: false },
        ],
        explanation: 'Team Alpha shows a clear declining trend (7.2→5.4, drop of 1.8 points). Team Beta is stable/improving. The trajectory matters more than the snapshot: Alpha requires urgent intervention.',
        difficulty: 3, timeLimit: 100,
      },
    ]
  },
  // ── NUMERICAL with PIE CHART ───────────────────────────────────────────────
  {
    slug: 'numerical',
    questions: [
      {
        subSkill: 'pie-chart-calculation',
        text: 'The pie chart shows the breakdown of a city\'s annual transportation budget of $24 million. How much more is spent on Road Maintenance than on Cycling Infrastructure?',
        diagramData: {
          type: 'pie',
          title: 'City Transportation Budget ($24M total)',
          labels: ['Public Transport', 'Road Maintenance', 'Traffic Systems', 'Cycling Infrastructure', 'Administration'],
          values: [38, 27, 18, 10, 7],
          colors: ['#0A528A', '#E4007C', '#F39C12', '#00843D', '#7F8C8D'],
        },
        options: [
          { id: 'A', text: '$3.6 million', isCorrect: false },
          { id: 'B', text: '$4.08 million', isCorrect: true },
          { id: 'C', text: '$2.4 million', isCorrect: false },
          { id: 'D', text: '$5.76 million', isCorrect: false },
        ],
        explanation: 'Road Maintenance: 27% of $24M = $6.48M. Cycling: 10% of $24M = $2.40M. Difference = $6.48M - $2.40M = $4.08M.',
        difficulty: 3, timeLimit: 90,
      },
      {
        subSkill: 'bar-chart-calculation',
        text: 'The bar chart shows monthly production output (units) for a factory. What was the average monthly output for the second half of the year (Jul–Dec)?',
        diagramData: {
          type: 'bar',
          title: 'Monthly Factory Output (units)',
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: [
            { label: 'Units Produced', data: [820,750,880,910,870,840,780,820,860,940,910,870], color: '#0A528A' }
          ],
        },
        options: [
          { id: 'A', text: '846 units', isCorrect: false },
          { id: 'B', text: '863 units', isCorrect: false },
          { id: 'C', text: '863.3 units', isCorrect: true },
          { id: 'D', text: '870 units', isCorrect: false },
        ],
        explanation: 'Jul–Dec: 780+820+860+940+910+870 = 5,180. Average = 5,180/6 = 863.3 units.',
        difficulty: 2, timeLimit: 90,
      },
    ]
  },
  // ── GRADUATE REASONING (challenging) ──────────────────────────────────────
  {
    slug: 'graduate-reasoning',
    questions: [
      {
        subSkill: 'logical-deduction',
        text: 'Five candidates (P, Q, R, S, T) finished a race. Q finished before S but after T. P finished last. R finished before Q. In what position did T finish?',
        diagramData: null,
        options: [
          { id: 'A', text: '1st', isCorrect: false },
          { id: 'B', text: '2nd', isCorrect: false },
          { id: 'C', text: '3rd', isCorrect: false },
          { id: 'D', text: '1st or 2nd', isCorrect: true },
        ],
        explanation: 'Order constraints: R before Q, T before Q, Q before S, P last (5th). So S is 4th. Q is 3rd. R and T must fill 1st and 2nd (in any order). T finished 1st or 2nd.',
        difficulty: 4, timeLimit: 120,
      },
      {
        subSkill: 'abstract-series',
        text: 'What number replaces the "?" in this pattern?\n\n3 → 9 → 7 → 21 → 19 → 57 → 55 → ?',
        diagramData: null,
        options: [
          { id: 'A', text: '53', isCorrect: false },
          { id: 'B', text: '110', isCorrect: false },
          { id: 'C', text: '165', isCorrect: true },
          { id: 'D', text: '160', isCorrect: false },
        ],
        explanation: 'Pattern: ×3, −2, ×3, −2, ×3, −2, ×3. So 55×3 = 165.',
        difficulty: 4, timeLimit: 90,
      },
    ]
  },
  // ── SECONDARY MATHS ────────────────────────────────────────────────────────
  {
    slug: 'secondary-maths',
    questions: [
      {
        subSkill: 'percentage-change',
        text: 'A phone was priced at $450. It was first discounted by 20%, then the discounted price was increased by 10%. What is the final price?',
        diagramData: null,
        options: [
          { id: 'A', text: '$396', isCorrect: true },
          { id: 'B', text: '$405', isCorrect: false },
          { id: 'C', text: '$414', isCorrect: false },
          { id: 'D', text: '$360', isCorrect: false },
        ],
        explanation: 'After 20% discount: $450 × 0.80 = $360. After 10% increase: $360 × 1.10 = $396.',
        difficulty: 2, timeLimit: 90,
      },
      {
        subSkill: 'algebra',
        text: 'If 3x + 7 = 22, what is the value of 5x − 3?',
        diagramData: null,
        options: [
          { id: 'A', text: '22', isCorrect: true },
          { id: 'B', text: '18', isCorrect: false },
          { id: 'C', text: '25', isCorrect: false },
          { id: 'D', text: '20', isCorrect: false },
        ],
        explanation: '3x = 15, so x = 5. Then 5(5) − 3 = 25 − 3 = 22.',
        difficulty: 1, timeLimit: 60,
      },
    ]
  },
];

async function main() {
  console.log('Seeding new categories...');
  const catMap = {};

  for (const cat of NEW_CATEGORIES) {
    const existing = await p.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      catMap[cat.slug] = existing.id;
      console.log(`  ⏭  Category exists: ${cat.name}`);
      continue;
    }
    const created = await p.category.create({ data: cat });
    catMap[created.slug] = created.id;
    console.log(`  ✅ Created category: ${cat.name}`);
  }

  // Also update existing categories with assessmentType/targetLevels
  const existingUpdates = [
    { slug: 'numerical', targetLevels: ['secondary','graduate','professional'] },
    { slug: 'verbal', targetLevels: ['secondary','graduate','professional'] },
    { slug: 'abstract', targetLevels: ['graduate','professional'] },
    { slug: 'logical', targetLevels: ['graduate','professional'] },
    { slug: 'spatial', targetLevels: ['graduate','professional'] },
    { slug: 'mechanical', targetLevels: ['graduate','professional'], targetRoles: ['engineer','technician','mechanic'] },
    { slug: 'situational', assessmentType: 'PROFESSIONAL', targetLevels: ['graduate','professional'] },
    { slug: 'critical', assessmentType: 'PROFESSIONAL', targetLevels: ['graduate','professional'] },
    { slug: 'personality', assessmentType: 'PERSONALITY', targetLevels: ['secondary','graduate','professional'] },
  ];
  for (const upd of existingUpdates) {
    const { slug, ...data } = upd;
    try {
      const cat = await p.category.findUnique({ where: { slug } });
      if (cat) {
        await p.category.update({ where: { slug }, data });
        catMap[slug] = cat.id;
      }
    } catch(e) { console.log('  ⚠ Update failed for', slug, e.message); }
  }

  console.log('\nSeeding rich questions...');
  let total = 0;
  for (const group of RICH_QUESTIONS) {
    const catId = catMap[group.slug];
    if (!catId) {
      // Try finding it
      const cat = await p.category.findUnique({ where: { slug: group.slug } });
      if (!cat) { console.log(`  ⚠ No category for slug: ${group.slug}`); continue; }
      catMap[group.slug] = cat.id;
    }
    const categoryId = catMap[group.slug];
    for (const q of group.questions) {
      const { diagramData, ...rest } = q;
      await p.question.create({
        data: {
          categoryId,
          subSkill: rest.subSkill,
          text: rest.text,
          diagramData: diagramData || undefined,
          options: rest.options,
          explanation: rest.explanation,
          difficulty: rest.difficulty || 2,
          discrimination: 1.0,
          timeLimit: rest.timeLimit || 90,
          tags: [group.slug, rest.subSkill],
          isActive: true,
        }
      });
      total++;
    }
    console.log(`  ✅ Added ${group.questions.length} questions to ${group.slug}`);
  }
  console.log(`\nDone! Seeded ${total} rich questions across ${RICH_QUESTIONS.length} categories.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
