// Seed all missing exam prep + listening/writing questions
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const EXAM_QUESTIONS = [

  // ── IELTS LISTENING ────────────────────────────────────────────────────────
  {
    slug: 'ielts-listening',
    questions: [
      {
        subSkill: 'form-completion',
        text: 'You hear a student registering for a college course. Listen to the details and choose what the student gives as her FIRST name.\n\n[Audio transcript excerpt]: "Good morning. I\'d like to register for the Advanced English course. My name is Martinez — that\'s M-A-R-T-I-N-E-Z — Sofia Martinez. My student number is 4471892. I\'d prefer morning classes if possible, starting from next Monday."',
        diagramData: { type: 'passage', title: '🎧 IELTS Listening — Part 1: Form Completion', text: 'You will hear a conversation between a student and a college administrator.\n\nListen and answer the question based on the audio transcript provided.' },
        options: [
          { id: 'A', text: 'Sofia', isCorrect: true },
          { id: 'B', text: 'Martinez', isCorrect: false },
          { id: 'C', text: 'Maria', isCorrect: false },
          { id: 'D', text: 'Sandra', isCorrect: false },
        ],
        explanation: 'The student clearly states "Sofia Martinez" — Sofia is her first name, Martinez is her family name.',
        difficulty: 1, timeLimit: 60,
      },
      {
        subSkill: 'multiple-choice',
        text: 'You hear a lecture about climate migration. According to the speaker, what is the PRIMARY driver of climate migration in coastal regions?\n\n[Transcript]: "While droughts and extreme heat events affect inland communities, the most significant driver of climate-related movement in coastal regions is sea level rise combined with increased storm surge frequency. Economic disruption caused by fishery collapse is also significant, but it is secondary to the direct displacement caused by flooding."',
        diagramData: { type: 'passage', title: '🎧 IELTS Listening — Part 3: Academic Lecture', text: 'You will hear an extract from a university lecture on climate migration patterns.' },
        options: [
          { id: 'A', text: 'Drought and extreme heat', isCorrect: false },
          { id: 'B', text: 'Sea level rise and increased storm surge', isCorrect: true },
          { id: 'C', text: 'Economic disruption from fishery collapse', isCorrect: false },
          { id: 'D', text: 'Inland flooding from heavy rainfall', isCorrect: false },
        ],
        explanation: 'The lecturer explicitly says "the most significant driver... in coastal regions is sea level rise combined with increased storm surge frequency." Fishery collapse is stated to be secondary.',
        difficulty: 2, timeLimit: 90,
      },
      {
        subSkill: 'sentence-completion',
        text: 'Complete the sentence based on what the speaker says:\n\n"The new library extension will be open to students from _______ onwards, according to the announcement."\n\n[Transcript]: "I\'m pleased to announce that the library extension project is on track. The new reading rooms and digital resource centre will be fully accessible to all registered students from the fifteenth of September onwards."',
        diagramData: { type: 'passage', title: '🎧 IELTS Listening — Part 2: Announcement', text: 'Listen to a university campus announcement and complete the missing information.' },
        options: [
          { id: 'A', text: '15th September', isCorrect: true },
          { id: 'B', text: '15th October', isCorrect: false },
          { id: 'C', text: '1st September', isCorrect: false },
          { id: 'D', text: '30th August', isCorrect: false },
        ],
        explanation: 'The speaker says "fully accessible... from the fifteenth of September onwards." The answer is 15th September.',
        difficulty: 1, timeLimit: 60,
      },
      {
        subSkill: 'map-plan',
        text: 'You hear directions around a museum. According to the guide, where is the Prehistoric Gallery located?\n\n[Transcript]: "As you enter the main hall, the gift shop is on your left. If you walk straight ahead past the information desk, you will reach the central atrium. The Prehistoric Gallery is directly to the right of the central atrium, while the Modern Art wing is on the left."',
        diagramData: { type: 'passage', title: '🎧 IELTS Listening — Part 2: Museum Tour', text: 'Listen to a guided tour of a museum and answer questions about the layout.' },
        options: [
          { id: 'A', text: 'Left of the main entrance', isCorrect: false },
          { id: 'B', text: 'Right of the central atrium', isCorrect: true },
          { id: 'C', text: 'Left of the central atrium', isCorrect: false },
          { id: 'D', text: 'Behind the information desk', isCorrect: false },
        ],
        explanation: 'The guide says "The Prehistoric Gallery is directly to the right of the central atrium."',
        difficulty: 1, timeLimit: 70,
      },
    ]
  },

  // ── IELTS WRITING ──────────────────────────────────────────────────────────
  {
    slug: 'ielts-writing',
    questions: [
      {
        subSkill: 'task1-chart-description',
        text: 'IELTS Writing Task 1: The bar chart shows the percentage of households with internet access in four countries in 2010 and 2020. Which statement BEST describes the overall trend?',
        diagramData: {
          type: 'bar',
          title: 'Household Internet Access (%) — 2010 vs 2020',
          labels: ['Country A', 'Country B', 'Country C', 'Country D'],
          datasets: [
            { label: '2010', data: [55, 42, 38, 28], color: '#0A528A' },
            { label: '2020', data: [88, 79, 71, 62], color: '#E4007C' },
          ]
        },
        options: [
          { id: 'A', text: 'All four countries showed significant increases; Country A had the highest access in both years', isCorrect: true },
          { id: 'B', text: 'Country D had higher access than Country C in 2020', isCorrect: false },
          { id: 'C', text: 'Country B showed the largest percentage point increase', isCorrect: false },
          { id: 'D', text: 'Access fell in at least one country between 2010 and 2020', isCorrect: false },
        ],
        explanation: 'All four countries increased (A: +33pp, B: +37pp, C: +33pp, D: +34pp). Country A had the highest in both 2010 (55%) and 2020 (88%). B has the largest increase at +37pp — but option A is the only globally accurate summary statement.',
        difficulty: 2, timeLimit: 100,
      },
      {
        subSkill: 'task1-pie-description',
        text: 'IELTS Writing Task 1: The pie charts show time spent on different activities by UK adults in 1980 and 2020. Which activity showed the GREATEST change?',
        diagramData: {
          type: 'table',
          title: 'Time Allocation by UK Adults (% of leisure time)',
          headers: ['Activity', '1980 (%)', '2020 (%)', 'Change'],
          rows: [
            ['Watching TV', '42', '28', '-14pp'],
            ['Online/Social Media', '0', '35', '+35pp'],
            ['Reading', '25', '12', '-13pp'],
            ['Sport/Exercise', '18', '18', '0pp'],
            ['Other', '15', '7', '-8pp'],
          ],
          highlightRow: 1,
        },
        options: [
          { id: 'A', text: 'Watching TV (decreased by 14pp)', isCorrect: false },
          { id: 'B', text: 'Online/Social Media (increased from 0% to 35%)', isCorrect: true },
          { id: 'C', text: 'Reading (decreased by 13pp)', isCorrect: false },
          { id: 'D', text: 'Sport/Exercise (unchanged)', isCorrect: false },
        ],
        explanation: 'Online/Social Media went from 0% to 35% — a 35 percentage point increase — the largest single change of any category.',
        difficulty: 2, timeLimit: 90,
      },
      {
        subSkill: 'task2-argument',
        text: 'IELTS Writing Task 2: "Some people believe that universities should focus only on academic subjects. Others think that practical skills should also be taught." Which of the following is the STRONGEST argument in support of including practical skills in university education?',
        diagramData: null,
        options: [
          { id: 'A', text: 'Practical skills make students more popular with their peers', isCorrect: false },
          { id: 'B', text: 'Employers increasingly value graduates who can apply knowledge in real-world contexts, reducing skills gaps', isCorrect: true },
          { id: 'C', text: 'Academic subjects are too difficult for most students without supplementary practical work', isCorrect: false },
          { id: 'D', text: 'Universities have always included both academic and practical components', isCorrect: false },
        ],
        explanation: 'In IELTS Task 2, strong arguments are relevant, specific, and logically connected to the topic. Option B directly addresses the purpose of higher education (employment readiness) with a clear, measurable benefit (reducing skills gaps).',
        difficulty: 3, timeLimit: 90,
      },
      {
        subSkill: 'task1-process-diagram',
        text: 'IELTS Writing Task 1: The diagram shows how paper is recycled. What is the SECOND step in the recycling process?\n\n[Process]: Collection → Sorting by type → Pulping in water → Cleaning & de-inking → Sheet formation → Drying → Finished recycled paper',
        diagramData: { type: 'passage', title: '📊 IELTS Task 1 — Process Diagram: Paper Recycling', text: 'Steps in paper recycling:\n\n1. Collection of used paper\n2. Sorting by paper type (cardboard, newspaper, office paper)\n3. Pulping — paper is mixed with water to form slurry\n4. Cleaning and de-inking — ink and contaminants removed\n5. Sheet formation on wire mesh\n6. Drying and pressing\n7. Finished recycled paper product' },
        options: [
          { id: 'A', text: 'Pulping in water', isCorrect: false },
          { id: 'B', text: 'Collection of used paper', isCorrect: false },
          { id: 'C', text: 'Sorting by paper type', isCorrect: true },
          { id: 'D', text: 'De-inking', isCorrect: false },
        ],
        explanation: 'According to the process: Step 1 = Collection, Step 2 = Sorting by paper type. In Task 1 process questions, always read the sequence carefully.',
        difficulty: 1, timeLimit: 60,
      },
    ]
  },

  // ── TOEFL LISTENING ────────────────────────────────────────────────────────
  {
    slug: 'toefl-listening',
    questions: [
      {
        subSkill: 'lecture-main-idea',
        text: 'You hear a professor discussing urban heat islands. What is the MAIN topic of the lecture?\n\n[Transcript excerpt]: "Today I want to explore a phenomenon that affects virtually every major city in the world — the urban heat island effect. Essentially, urban areas experience significantly higher temperatures than surrounding rural areas, sometimes by as much as 7 degrees Celsius. This happens because of the replacement of natural surfaces — vegetation, soil — with concrete, asphalt and buildings that absorb and re-emit heat. Understanding this effect is crucial for urban planners and climate policy makers."',
        diagramData: { type: 'passage', title: '🔊 TOEFL Listening — Academic Lecture', text: 'You will hear a portion of a university lecture. Answer the question based on what the professor says.' },
        options: [
          { id: 'A', text: 'The history of urban planning in major cities', isCorrect: false },
          { id: 'B', text: 'Why urban areas are warmer than rural areas and its implications', isCorrect: true },
          { id: 'C', text: 'How concrete and asphalt are manufactured', isCorrect: false },
          { id: 'D', text: 'Climate policy differences between rural and urban governments', isCorrect: false },
        ],
        explanation: 'The professor introduces the topic as "the urban heat island effect" and explains the cause (replacement of natural surfaces) and why it matters (urban planners, climate policy). This is a main idea question — choose the broadest accurate answer.',
        difficulty: 2, timeLimit: 90,
      },
      {
        subSkill: 'conversation-purpose',
        text: 'You hear a student talking to a professor during office hours.\n\n[Transcript]: "Professor Chen, I wanted to ask about my essay grade. I thought I addressed all the points in the rubric, but I only got a C+. Could you explain what I missed?" Professor: "Of course. Looking at your essay, your argument was clear, but you relied heavily on just two sources. For this level of analysis, I expected at least five peer-reviewed references."\n\nWhy does the student visit the professor?',
        diagramData: { type: 'passage', title: '🔊 TOEFL Listening — Office Hours Conversation', text: 'Listen to a conversation between a student and a professor during office hours.' },
        options: [
          { id: 'A', text: 'To request an extension for a future assignment', isCorrect: false },
          { id: 'B', text: 'To understand why she received a lower grade than expected', isCorrect: true },
          { id: 'C', text: 'To complain about the grading rubric', isCorrect: false },
          { id: 'D', text: 'To submit a revised version of her essay', isCorrect: false },
        ],
        explanation: 'The student says "I wanted to ask about my essay grade" and "Could you explain what I missed?" — the purpose is to understand the reason for the grade.',
        difficulty: 1, timeLimit: 75,
      },
      {
        subSkill: 'attitude-inference',
        text: 'Based on the conversation below, what is the professor\'s attitude toward the student\'s essay?\n\n[Transcript]: "Your argument was clear, but you relied heavily on just two sources... For this level of analysis, I expected at least five peer-reviewed references."',
        diagramData: { type: 'passage', title: '🔊 TOEFL Listening — Attitude Question', text: 'The professor is reviewing a student\'s essay. What is the professor\'s overall attitude?' },
        options: [
          { id: 'A', text: 'Completely negative — the essay had no merit', isCorrect: false },
          { id: 'B', text: 'Mixed — acknowledges strengths but identifies a significant weakness', isCorrect: true },
          { id: 'C', text: 'Fully positive — the grade reflects the rubric accurately', isCorrect: false },
          { id: 'D', text: 'Indifferent — the professor does not care about the student\'s performance', isCorrect: false },
        ],
        explanation: '"Your argument was clear" = positive. "but you relied heavily on just two sources" = weakness. The professor\'s attitude is mixed/balanced. TOEFL attitude questions require careful attention to tone words.',
        difficulty: 2, timeLimit: 80,
      },
    ]
  },

  // ── OET WRITING ────────────────────────────────────────────────────────────
  {
    slug: 'oet-writing',
    questions: [
      {
        subSkill: 'referral-letter',
        text: 'OET Writing Task: You are a nurse practitioner. Based on the case notes, which information is MOST important to include in a referral letter to a cardiologist?',
        diagramData: {
          type: 'table',
          title: 'Patient Case Notes — Mr. Emmanuel Phiri, 62y M',
          headers: ['Category', 'Details'],
          rows: [
            ['Presenting complaint', 'Chest tightness on exertion for 3 weeks, relieved by rest'],
            ['Vitals', 'BP: 148/92, HR: 78 bpm, SpO₂: 97%, BMI: 28.4'],
            ['PMH', 'T2DM (diagnosed 2015), hyperlipidaemia, ex-smoker (quit 2018)'],
            ['Current meds', 'Metformin 1g BD, Atorvastatin 40mg nocte, Aspirin 75mg OD'],
            ['ECG', 'ST depression in V4-V6 at rest'],
            ['Recent bloods', 'HbA1c 8.1%, Cholesterol 5.8 mmol/L, Troponin T: 0.03 μg/L (borderline)'],
          ],
        },
        options: [
          { id: 'A', text: 'BMI and ex-smoking status only — lifestyle factors are key for cardiology', isCorrect: false },
          { id: 'B', text: 'Exertional chest tightness, ST depression on ECG, borderline troponin, and cardiovascular risk factors (DM, hyperlipidaemia)', isCorrect: true },
          { id: 'C', text: 'All information including BMI, medications and cholesterol should be given equal emphasis', isCorrect: false },
          { id: 'D', text: 'Only the ECG finding, as this is the most objective data', isCorrect: false },
        ],
        explanation: 'A cardiologist referral should prioritise: (1) the presenting cardiac symptom (exertional chest tightness), (2) objective findings suggesting ischaemia (ST depression, borderline troponin), and (3) key cardiovascular risk factors. All are clinically relevant to the referral purpose.',
        difficulty: 3, timeLimit: 150,
      },
      {
        subSkill: 'discharge-letter',
        text: 'OET Writing: A patient is being discharged after an acute asthma attack. Which opening sentence is MOST appropriate for the discharge letter to her GP?',
        diagramData: {
          type: 'passage',
          title: 'Patient: Ms. Chanda Mwale, 34y F — Discharge Summary',
          text: 'Admitted: 22 May 2026\nDischarge: 24 May 2026\nDiagnosis: Acute severe asthma exacerbation\nTreatment: IV hydrocortisone, nebulised salbutamol, oxygen therapy\nDischarge medications: Prednisolone 40mg OD × 5 days, Salbutamol inhaler PRN, Seretide 250 BD\nFollow-up: GP in 48 hours, respiratory clinic in 3 weeks',
        },
        options: [
          { id: 'A', text: 'I am writing to tell you about a patient who was in the hospital.', isCorrect: false },
          { id: 'B', text: 'I am writing to inform you that Ms. Chanda Mwale was admitted to our ward on 22 May 2026 following an acute severe asthma exacerbation and was discharged on 24 May 2026.', isCorrect: true },
          { id: 'C', text: 'Your patient had asthma and is now better and can go home.', isCorrect: false },
          { id: 'D', text: 'Please be advised that asthma is a serious condition that requires careful management.', isCorrect: false },
        ],
        explanation: 'OET letters should be professional, specific, and include: patient name, dates, and reason for contact in the opening. Option B is precise, formal, and contains all essential identifying information.',
        difficulty: 3, timeLimit: 120,
      },
      {
        subSkill: 'vocabulary-clinical',
        text: 'In OET Writing, which word BEST replaces the informal phrase "the patient got worse" in a professional letter?',
        diagramData: null,
        options: [
          { id: 'A', text: 'The patient went downhill', isCorrect: false },
          { id: 'B', text: 'The patient\'s condition deteriorated', isCorrect: true },
          { id: 'C', text: 'The patient became more sick', isCorrect: false },
          { id: 'D', text: 'The patient was not doing well', isCorrect: false },
        ],
        explanation: '"Deteriorated" is the standard clinical/formal term. OET examiners specifically reward appropriate professional register — avoid informal expressions in clinical correspondence.',
        difficulty: 1, timeLimit: 45,
      },
    ]
  },

  // ── IELTS READING (additional) ────────────────────────────────────────────
  {
    slug: 'ielts-reading',
    questions: [
      {
        subSkill: 'matching-headings',
        text: 'IELTS Reading — Matching Headings: Read the passage and select the BEST heading for Paragraph B.',
        diagramData: {
          type: 'passage',
          title: 'Reading Passage: Urban Farming',
          text: 'Paragraph A: Urban farming — the practice of growing food within city limits — has experienced remarkable growth over the past two decades. From rooftop gardens in New York to vertical farms in Singapore, cities worldwide are integrating food production into their built environments.\n\nParagraph B: The economic case for urban farming is compelling. Local production eliminates the long-distance transportation costs associated with conventional supply chains, reduces packaging requirements, and can significantly lower food prices in densely populated areas. In some cities, urban farms have created employment opportunities and revitalised neglected industrial spaces.\n\nParagraph C: Despite these advantages, urban farming faces substantial challenges. Land in cities is expensive and often contaminated with industrial pollutants. Water usage is intensive, and without advanced hydroponic systems, yields per square metre are often insufficient to justify the investment.',
        },
        options: [
          { id: 'A', text: 'The environmental challenges facing city food production', isCorrect: false },
          { id: 'B', text: 'How urban farming started in major cities', isCorrect: false },
          { id: 'C', text: 'Financial and social benefits of growing food in cities', isCorrect: true },
          { id: 'D', text: 'Problems with water supply in urban farms', isCorrect: false },
        ],
        explanation: 'Paragraph B discusses economic benefits (transport cost savings, lower prices, employment, space revitalisation) — best matched by "Financial and social benefits of growing food in cities".',
        difficulty: 2, timeLimit: 110,
      },
      {
        subSkill: 'summary-completion',
        text: 'IELTS Reading — Summary Completion: Complete the summary using words from the urban farming passage.\n\n"Despite the economic benefits, urban farming faces challenges including _______ land costs and potential _______ from industrial pollutants."',
        diagramData: {
          type: 'passage',
          title: 'Urban Farming — Paragraph C (Reference)',
          text: 'Despite these advantages, urban farming faces substantial challenges. Land in cities is expensive and often contaminated with industrial pollutants. Water usage is intensive, and without advanced hydroponic systems, yields per square metre are often insufficient to justify the investment.',
        },
        options: [
          { id: 'A', text: 'high land costs / pollution risks', isCorrect: false },
          { id: 'B', text: 'expensive / contamination', isCorrect: true },
          { id: 'C', text: 'urban / drainage', isCorrect: false },
          { id: 'D', text: 'substantial / investment losses', isCorrect: false },
        ],
        explanation: 'The passage says "Land in cities is expensive" → expensive; "contaminated with industrial pollutants" → contamination. In summary completion, words must come from the passage.',
        difficulty: 2, timeLimit: 100,
      },
    ]
  },

  // ── TOEFL READING (additional) ────────────────────────────────────────────
  {
    slug: 'toefl-reading',
    questions: [
      {
        subSkill: 'vocabulary-in-context',
        text: 'In the passage about plate tectonics, the word "converge" (not shown) would mean which of the following in context?\n\n"At boundaries where two plates converge, one plate is typically forced beneath the other in a process known as subduction."',
        diagramData: { type: 'passage', title: 'TOEFL Vocabulary in Context', text: '"At boundaries where two plates converge, one plate is typically forced beneath the other in a process known as subduction."' },
        options: [
          { id: 'A', text: 'Diverge — move apart from each other', isCorrect: false },
          { id: 'B', text: 'Come together / move toward each other', isCorrect: true },
          { id: 'C', text: 'Slide horizontally past one another', isCorrect: false },
          { id: 'D', text: 'Break apart suddenly', isCorrect: false },
        ],
        explanation: 'Context clue: at convergent boundaries, "one plate is forced beneath the other" — this only makes sense if the plates are moving toward each other. "Converge" = come together.',
        difficulty: 2, timeLimit: 60,
      },
      {
        subSkill: 'factual-information',
        text: 'According to the plate tectonics passage, which of the following is TRUE about the Mid-Atlantic Ridge?',
        diagramData: {
          type: 'passage',
          title: 'TOEFL — Plate Tectonics (Reference)',
          text: 'At divergent boundaries, plates move apart, allowing magma from the mantle to rise and solidify into new oceanic crust. The Mid-Atlantic Ridge, a chain of underwater mountains stretching 16,000 km, is a prime example of such a boundary.',
        },
        options: [
          { id: 'A', text: 'It is located at a convergent boundary', isCorrect: false },
          { id: 'B', text: 'It is formed where plates slide horizontally past each other', isCorrect: false },
          { id: 'C', text: 'It is a chain of underwater mountains at a divergent boundary', isCorrect: true },
          { id: 'D', text: 'It extends for approximately 6,000 km', isCorrect: false },
        ],
        explanation: 'The passage: "The Mid-Atlantic Ridge, a chain of underwater mountains stretching 16,000 km, is a prime example of [a divergent boundary]." Both descriptors — underwater mountains AND divergent boundary — are required for the correct answer.',
        difficulty: 1, timeLimit: 70,
      },
    ]
  },

  // ── OET READING (additional) ──────────────────────────────────────────────
  {
    slug: 'oet-reading',
    questions: [
      {
        subSkill: 'matching-information',
        text: 'OET Reading Part A: Match the drug to its correct primary indication based on the clinical summary.',
        diagramData: {
          type: 'table',
          title: 'Drug Summary Table — OET Reading Part A',
          headers: ['Drug', 'Class', 'Primary Indication', 'Key Caution'],
          rows: [
            ['Metformin', 'Biguanide', 'Type 2 Diabetes (first-line)', 'Avoid if eGFR <30'],
            ['Warfarin', 'Anticoagulant', 'AF / DVT / PE prevention', 'Regular INR monitoring required'],
            ['Salbutamol', 'Beta-2 agonist', 'Acute bronchospasm / asthma', 'Not for long-term control alone'],
            ['Atorvastatin', 'Statin', 'Hyperlipidaemia / CV risk reduction', 'Monitor LFTs; avoid in pregnancy'],
            ['Omeprazole', 'Proton pump inhibitor', 'GORD / peptic ulcer / H.pylori', 'May mask symptoms of gastric cancer'],
          ],
        },
        options: [
          { id: 'A', text: 'Warfarin — for reducing cholesterol in high-risk patients', isCorrect: false },
          { id: 'B', text: 'Salbutamol — for acute relief of airway narrowing during asthma attack', isCorrect: true },
          { id: 'C', text: 'Omeprazole — for preventing blood clots in atrial fibrillation', isCorrect: false },
          { id: 'D', text: 'Metformin — for long-term asthma control', isCorrect: false },
        ],
        explanation: 'Salbutamol\'s primary indication is "Acute bronchospasm / asthma" — this matches "acute relief of airway narrowing during asthma attack." The other options mismatch drugs to wrong indications.',
        difficulty: 2, timeLimit: 120,
      },
      {
        subSkill: 'detail-comprehension',
        text: 'Based on the drug table, which medication requires regular monitoring of a specific blood test?',
        diagramData: {
          type: 'table',
          title: 'Drug Cautions (Reference)',
          headers: ['Drug', 'Key Caution'],
          rows: [
            ['Metformin', 'Avoid if eGFR <30'],
            ['Warfarin', 'Regular INR monitoring required'],
            ['Salbutamol', 'Not for long-term control alone'],
            ['Atorvastatin', 'Monitor LFTs; avoid in pregnancy'],
            ['Omeprazole', 'May mask symptoms of gastric cancer'],
          ],
        },
        options: [
          { id: 'A', text: 'Metformin — monitor eGFR before prescribing only', isCorrect: false },
          { id: 'B', text: 'Warfarin — requires regular INR blood tests', isCorrect: true },
          { id: 'C', text: 'Omeprazole — regular gastroscopy required', isCorrect: false },
          { id: 'D', text: 'Salbutamol — peak flow monitoring is required', isCorrect: false },
        ],
        explanation: 'Warfarin\'s caution explicitly says "Regular INR monitoring required" — INR is a blood test for clotting time, essential for safe anticoagulation with warfarin.',
        difficulty: 2, timeLimit: 90,
      },
    ]
  },
];

async function main() {
  console.log('Seeding exam prep questions (listening/writing + more reading)...');
  let total = 0;

  for (const group of EXAM_QUESTIONS) {
    const cat = await p.category.findUnique({ where: { slug: group.slug } });
    if (!cat) { console.log(`  ⚠ No category: ${group.slug}`); continue; }

    for (const q of group.questions) {
      const { diagramData, ...rest } = q;
      await p.question.create({
        data: {
          categoryId: cat.id,
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
    console.log(`  ✅ ${group.slug}: +${group.questions.length} questions`);
  }

  // Verify final counts
  console.log('\nFinal question counts for exam prep:');
  const cats = await p.category.findMany({
    where: { assessmentType: 'EXAM_PREP' },
    select: { name: true, slug: true, _count: { select: { questions: { where: { isActive: true } } } } },
    orderBy: { name: 'asc' }
  });
  cats.forEach(c => console.log(`  ${c.slug}: ${c._count.questions} questions`));
  console.log(`\nTotal added: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
