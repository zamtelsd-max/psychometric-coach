require('dotenv').config({path: '/home/work/.openclaw/workspace/psychometric-coach/backend/.env'});
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

const CATS = [
  {name:'Numerical Reasoning',slug:'numerical',icon:'🔢',color:'#0A528A',description:'Percentages, ratios, data interpretation and word problems.'},
  {name:'Verbal Reasoning',slug:'verbal',icon:'📝',color:'#1565C0',description:'True/false/cannot say, vocabulary and comprehension.'},
  {name:'Abstract Reasoning',slug:'abstract',icon:'🔷',color:'#6A1B9A',description:'Pattern sequences and shape matrix questions.'},
  {name:'Logical Reasoning',slug:'logical',icon:'🧩',color:'#2E7D32',description:'Syllogisms, deductive logic and argument evaluation.'},
  {name:'Spatial Reasoning',slug:'spatial',icon:'🧊',color:'#00695C',description:'3D rotation, cube nets and spatial folding problems.'},
  {name:'Error Checking',slug:'error',icon:'🔍',color:'#F57F17',description:'Spot discrepancies and errors in data tables.'},
  {name:'Mechanical Reasoning',slug:'mechanical',icon:'⚙️',color:'#BF360C',description:'Levers, pulleys, gears and mechanical principles.'},
  {name:'Situational Judgement',slug:'situational',icon:'💼',color:'#4527A0',description:'Workplace scenarios — best and least effective responses.'},
  {name:'Inductive Reasoning',slug:'inductive',icon:'💡',color:'#00838F',description:'Discover rules from examples and apply them.'},
  {name:'Deductive Reasoning',slug:'deductive',icon:'🎯',color:'#1B5E20',description:'Draw valid conclusions from given premises.'},
  {name:'Diagrammatic Reasoning',slug:'diagrammatic',icon:'📊',color:'#880E4F',description:'Flowchart logic and input-output operators.'},
  {name:'Reading Comprehension',slug:'reading',icon:'📖',color:'#01579B',description:'Answer questions based only on a given passage.'},
  {name:'Quantitative Aptitude',slug:'quantitative',icon:'📐',color:'#004D40',description:'Algebra, sequences, probability and percentages.'},
  {name:'Critical Thinking',slug:'critical',icon:'🤔',color:'#37474F',description:'Evaluate assumptions, conclusions and argument strength.'},
  {name:'Personality & Behavioural',slug:'personality',icon:'🧠',color:'#3E2723',description:'SJT-style behavioural preferences and workplace style.'},
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of CATS) {
    await p.category.upsert({ where:{slug:cat.slug}, update:{}, create:cat });
    process.stdout.write('.');
  }
  console.log('\nCategories done');

  const cats = await p.category.findMany();
  const m = new Map(cats.map(c=>[c.slug,c.id]));

  console.log('Seeding questions...');
  const Qs = [
    {cs:'numerical',ss:'Percentages',d:3,t:'A shirt costs $40. Reduced by 25%. Sale price?',
     opts:[{id:'A',text:'$28',isCorrect:false},{id:'B',text:'$30',isCorrect:true},{id:'C',text:'$32',isCorrect:false},{id:'D',text:'$35',isCorrect:false}],
     ex:'25% of $40=$10. $40-$10=$30.',tags:['percentage']},
    {cs:'numerical',ss:'Ratios',d:3,t:'Share $150 in ratio 2:3. Larger share?',
     opts:[{id:'A',text:'$60',isCorrect:false},{id:'B',text:'$75',isCorrect:false},{id:'C',text:'$90',isCorrect:true},{id:'D',text:'$100',isCorrect:false}],
     ex:'Total parts=5, each part=$30. Larger=3x30=$90.',tags:['ratio']},
    {cs:'numerical',ss:'Word Problems',d:4,t:'3 workers finish a job in 9 days. How many days for 9 workers?',
     opts:[{id:'A',text:'1',isCorrect:false},{id:'B',text:'2',isCorrect:false},{id:'C',text:'3',isCorrect:true},{id:'D',text:'6',isCorrect:false}],
     ex:'Total work=27 worker-days. 27/9=3 days.',tags:['work']},
    {cs:'numerical',ss:'Averages',d:4,t:'Mean of 10,20,30,40,50?',
     opts:[{id:'A',text:'25',isCorrect:false},{id:'B',text:'30',isCorrect:true},{id:'C',text:'35',isCorrect:false},{id:'D',text:'40',isCorrect:false}],
     ex:'Sum=150, n=5. Mean=30.',tags:['mean']},
    {cs:'numerical',ss:'Number Series',d:5,t:'Next: 3,6,11,18,27,?',
     opts:[{id:'A',text:'36',isCorrect:false},{id:'B',text:'38',isCorrect:true},{id:'C',text:'40',isCorrect:false},{id:'D',text:'42',isCorrect:false}],
     ex:'Differences: 3,5,7,9,11. Next=27+11=38.',tags:['series']},
    {cs:'numerical',ss:'Percentages',d:5,t:'After 20% increase a price is $180. Original?',
     opts:[{id:'A',text:'$140',isCorrect:false},{id:'B',text:'$144',isCorrect:false},{id:'C',text:'$150',isCorrect:true},{id:'D',text:'$160',isCorrect:false}],
     ex:'Original x 1.20=180. Original=180/1.20=$150.',tags:['reverse percentage']},
    {cs:'numerical',ss:'Speed Distance Time',d:5,t:'Train travels 300km in 3h. Speed in km/h?',
     opts:[{id:'A',text:'80',isCorrect:false},{id:'B',text:'90',isCorrect:false},{id:'C',text:'100',isCorrect:true},{id:'D',text:'110',isCorrect:false}],
     ex:'Speed=Distance/Time=300/3=100km/h.',tags:['speed']},
    {cs:'verbal',ss:'True/False/Cannot Say',d:3,t:'Passage: "All deadlines were met last quarter." Statement: No deadlines were missed. True/False/Cannot Say?',
     opts:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partial',isCorrect:false}],
     ex:'All met = none missed. True.',tags:['inference']},
    {cs:'verbal',ss:'Vocabulary',d:3,t:'TRANSPARENT most nearly means:',
     opts:[{id:'A',text:'Opaque',isCorrect:false},{id:'B',text:'Clear/open',isCorrect:true},{id:'C',text:'Hidden',isCorrect:false},{id:'D',text:'Colourful',isCorrect:false}],
     ex:'Transparent means easy to see through or honest and open.',tags:['synonym']},
    {cs:'verbal',ss:'Word Relationships',d:4,t:'PEN is to WRITER as BRUSH is to:',
     opts:[{id:'A',text:'Canvas',isCorrect:false},{id:'B',text:'Painter',isCorrect:true},{id:'C',text:'Paint',isCorrect:false},{id:'D',text:'Art',isCorrect:false}],
     ex:'A pen is the tool of a writer; a brush is the tool of a painter.',tags:['analogy']},
    {cs:'verbal',ss:'True/False/Cannot Say',d:5,t:'Passage: "The grant is for organisations with income below £500,000." Statement: An organisation with £480,000 income may qualify. True?',
     opts:[{id:'A',text:'True',isCorrect:true},{id:'B',text:'False',isCorrect:false},{id:'C',text:'Cannot Say',isCorrect:false},{id:'D',text:'Partial',isCorrect:false}],
     ex:'£480K is below £500K so the income criterion is met. True.',tags:['inference']},
    {cs:'verbal',ss:'Vocabulary',d:6,t:'PERFIDIOUS most nearly means:',
     opts:[{id:'A',text:'Loyal',isCorrect:false},{id:'B',text:'Treacherous',isCorrect:true},{id:'C',text:'Brave',isCorrect:false},{id:'D',text:'Cautious',isCorrect:false}],
     ex:'Perfidious means guilty of betrayal or treachery.',tags:['vocabulary']},
    {cs:'abstract',ss:'Pattern Sequences',d:3,t:'Sequence: circle, square, triangle, circle, square, ? What comes next?',
     opts:[{id:'A',text:'Circle',isCorrect:false},{id:'B',text:'Square',isCorrect:false},{id:'C',text:'Triangle',isCorrect:true},{id:'D',text:'Diamond',isCorrect:false}],
     ex:'Repeating group of 3: circle, square, triangle. 6th position = triangle.',tags:['pattern']},
    {cs:'abstract',ss:'Transformations',d:4,t:'Arrow pointing right rotated 90 degrees anticlockwise points:',
     opts:[{id:'A',text:'Left',isCorrect:false},{id:'B',text:'Up',isCorrect:true},{id:'C',text:'Down',isCorrect:false},{id:'D',text:'Right',isCorrect:false}],
     ex:'90 degrees anticlockwise: right becomes up.',tags:['rotation']},
    {cs:'abstract',ss:'Number Patterns in Shapes',d:6,t:'Sequence: 2,6,18,54. Next?',
     opts:[{id:'A',text:'108',isCorrect:false},{id:'B',text:'126',isCorrect:false},{id:'C',text:'162',isCorrect:true},{id:'D',text:'180',isCorrect:false}],
     ex:'Each term multiplied by 3. 54x3=162.',tags:['geometric sequence']},
    {cs:'logical',ss:'Syllogisms',d:3,t:'All cats are mammals. Whiskers is a cat. Therefore:',
     opts:[{id:'A',text:'Whiskers is a mammal',isCorrect:true},{id:'B',text:'All mammals are cats',isCorrect:false},{id:'C',text:'Whiskers is not a mammal',isCorrect:false},{id:'D',text:'Some mammals are cats',isCorrect:false}],
     ex:'Universal affirmative syllogism. Whiskers must be a mammal.',tags:['syllogism']},
    {cs:'logical',ss:'Conditional Logic',d:4,t:'If it is sunny, Maria jogs. Maria did NOT jog. Therefore:',
     opts:[{id:'A',text:'It was sunny',isCorrect:false},{id:'B',text:'It was not sunny',isCorrect:true},{id:'C',text:'Maria is ill',isCorrect:false},{id:'D',text:'Nothing can be concluded',isCorrect:false}],
     ex:'Modus tollens: not Q therefore not P. Not jogging means not sunny.',tags:['modus tollens']},
    {cs:'logical',ss:'Logical Fallacies',d:5,t:'"Everyone is buying this phone, so it must be the best." Which fallacy?',
     opts:[{id:'A',text:'Straw man',isCorrect:false},{id:'B',text:'Appeal to popularity',isCorrect:true},{id:'C',text:'False dilemma',isCorrect:false},{id:'D',text:'Red herring',isCorrect:false}],
     ex:'Appeal to popularity assumes quality because many people choose it.',tags:['fallacy']},
    {cs:'logical',ss:'Argument Evaluation',d:6,t:'"Sales fell because we raised prices." What WEAKENS this?',
     opts:[{id:'A',text:'Customers like our product',isCorrect:false},{id:'B',text:'Sales also fell in competitors who did not raise prices',isCorrect:true},{id:'C',text:'We raised prices last year too',isCorrect:false},{id:'D',text:'Sales fell by 10%',isCorrect:false}],
     ex:'If competitors who kept prices steady also saw falling sales, price may not be the cause.',tags:['weaken']},
    {cs:'spatial',ss:'2D Rotation',d:3,t:'Letter "d" rotated 180 degrees looks like:',
     opts:[{id:'A',text:'b',isCorrect:false},{id:'B',text:'p',isCorrect:true},{id:'C',text:'q',isCorrect:false},{id:'D',text:'d',isCorrect:false}],
     ex:'180-degree rotation of d produces p.',tags:['rotation']},
    {cs:'spatial',ss:'Mirror Images',d:4,t:'A clock showing 3:00 reflected in a vertical mirror shows:',
     opts:[{id:'A',text:'3:00',isCorrect:false},{id:'B',text:'9:00',isCorrect:true},{id:'C',text:'6:00',isCorrect:false},{id:'D',text:'12:00',isCorrect:false}],
     ex:'Vertical mirror flips left/right. 3 o\'clock (right) becomes 9 o\'clock (left).',tags:['reflection']},
    {cs:'spatial',ss:'Paper Folding',d:5,t:'Square folded in half, hole punched centre. Holes when unfolded?',
     opts:[{id:'A',text:'1',isCorrect:false},{id:'B',text:'2',isCorrect:true},{id:'C',text:'4',isCorrect:false},{id:'D',text:'3',isCorrect:false}],
     ex:'One fold = 2 layers. One punch = 2 holes.',tags:['paper folding']},
    {cs:'error',ss:'Data Table Errors',d:3,t:'Record: Name=Alice Brown, Code=AB2031. Copy: Name=Alice Brow, Code=AB2031. Error?',
     opts:[{id:'A',text:'Code wrong',isCorrect:false},{id:'B',text:'Name truncated - Brown became Brow',isCorrect:true},{id:'C',text:'No error',isCorrect:false},{id:'D',text:'Both wrong',isCorrect:false}],
     ex:'Surname lost the final letter n.',tags:['transcription']},
    {cs:'error',ss:'Data Table Errors',d:4,t:'Invoice: 4 items x $12.50 each = $48.00. Error?',
     opts:[{id:'A',text:'Yes - should be $50.00',isCorrect:true},{id:'B',text:'No - correct',isCorrect:false},{id:'C',text:'Cannot determine',isCorrect:false},{id:'D',text:'Yes - should be $52.00',isCorrect:false}],
     ex:'4 x $12.50 = $50.00 not $48.00.',tags:['calculation']},
    {cs:'error',ss:'Data Table Errors',d:5,t:'Payroll total: $2,500+$1,800+$2,200+$1,900 = $8,600. Error?',
     opts:[{id:'A',text:'Yes - should be $8,400',isCorrect:true},{id:'B',text:'No - correct',isCorrect:false},{id:'C',text:'An individual salary is wrong',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
     ex:'2500+1800+2200+1900=8400 not 8600.',tags:['addition']},
    {cs:'mechanical',ss:'Levers',d:4,t:'4m lever, fulcrum at centre. 10kg on left end. Balance weight on right?',
     opts:[{id:'A',text:'5kg',isCorrect:false},{id:'B',text:'10kg',isCorrect:true},{id:'C',text:'20kg',isCorrect:false},{id:'D',text:'2.5kg',isCorrect:false}],
     ex:'Equal arm lengths require equal weights. 10kg balances 10kg.',tags:['lever']},
    {cs:'mechanical',ss:'Gears',d:4,t:'Gear A (30 teeth) drives Gear B (15 teeth). A at 60rpm. B speed?',
     opts:[{id:'A',text:'30rpm',isCorrect:false},{id:'B',text:'60rpm',isCorrect:false},{id:'C',text:'120rpm',isCorrect:true},{id:'D',text:'45rpm',isCorrect:false}],
     ex:'B has half the teeth so turns twice as fast: 60x2=120rpm.',tags:['gears']},
    {cs:'mechanical',ss:'Pulleys',d:5,t:'A fixed pulley changes which property of a lifting force?',
     opts:[{id:'A',text:'Magnitude',isCorrect:false},{id:'B',text:'Direction',isCorrect:true},{id:'C',text:'Both',isCorrect:false},{id:'D',text:'Neither',isCorrect:false}],
     ex:'A single fixed pulley only changes direction of force, not magnitude.',tags:['pulley']},
    {cs:'situational',ss:'Ethics',d:4,t:'You find a wallet with cash in the office. What do you do?',
     opts:[{id:'A',text:'Keep it',isCorrect:false},{id:'B',text:'Hand it to reception/security with contents intact',isCorrect:true},{id:'C',text:'Take expenses and hand in rest',isCorrect:false},{id:'D',text:'Leave it',isCorrect:false}],
     ex:'Handing in found property intact is ethical and professional.',tags:['integrity']},
    {cs:'situational',ss:'Prioritisation',d:5,t:'Manager emails a new task while you are mid-way through a critical project. You:',
     opts:[{id:'A',text:'Drop everything immediately',isCorrect:false},{id:'B',text:'Ignore the email',isCorrect:false},{id:'C',text:'Acknowledge, explain current priority, confirm when you can start',isCorrect:true},{id:'D',text:'Pretend you did not see it',isCorrect:false}],
     ex:'Clear communication about workload and realistic timelines is professional.',tags:['communication']},
    {cs:'situational',ss:'Ethics',d:6,t:'You discover a colleague is falsifying expense claims. You:',
     opts:[{id:'A',text:'Confront and threaten to report them',isCorrect:false},{id:'B',text:'Ignore it',isCorrect:false},{id:'C',text:'Report confidentially via whistleblowing policy',isCorrect:true},{id:'D',text:'Post anonymously online',isCorrect:false}],
     ex:'Financial fraud must be reported through proper whistleblowing channels.',tags:['whistleblowing']},
    {cs:'inductive',ss:'Rule Discovery',d:4,t:'Examples: 1=3, 2=6, 3=9, 4=12. Rule?',
     opts:[{id:'A',text:'Add 2',isCorrect:false},{id:'B',text:'Multiply by 3',isCorrect:true},{id:'C',text:'Square it',isCorrect:false},{id:'D',text:'Add 3',isCorrect:false}],
     ex:'1x3=3, 2x3=6, 3x3=9. Rule: multiply by 3.',tags:['rule']},
    {cs:'inductive',ss:'Rule Discovery',d:5,t:'Sets following a rule: {1,4,9}, {4,9,16}. Which also fits?',
     opts:[{id:'A',text:'{2,5,10}',isCorrect:false},{id:'B',text:'{16,25,36}',isCorrect:true},{id:'C',text:'{3,6,9}',isCorrect:false},{id:'D',text:'{1,2,3}',isCorrect:false}],
     ex:'Rule: consecutive perfect squares. {16,25,36}=4sq,5sq,6sq.',tags:['perfect squares']},
    {cs:'inductive',ss:'Rule Application',d:6,t:'Rule: double then subtract 3. Apply to 7.',
     opts:[{id:'A',text:'9',isCorrect:false},{id:'B',text:'11',isCorrect:true},{id:'C',text:'13',isCorrect:false},{id:'D',text:'17',isCorrect:false}],
     ex:'7x2=14. 14-3=11.',tags:['apply rule']},
    {cs:'deductive',ss:'Premise Conclusion',d:4,t:'P1: All squares are rectangles. P2: All rectangles have 4 right angles. Conclusion about squares?',
     opts:[{id:'A',text:'Squares have 3 right angles',isCorrect:false},{id:'B',text:'Squares have 4 right angles',isCorrect:true},{id:'C',text:'Squares are not rectangles',isCorrect:false},{id:'D',text:'Nothing',isCorrect:false}],
     ex:'Square=>rectangle=>4 right angles. Transitive.',tags:['transitivity']},
    {cs:'deductive',ss:'Ordering',d:5,t:'Tom taller than Sam. Sam taller than Jay. Shortest?',
     opts:[{id:'A',text:'Tom',isCorrect:false},{id:'B',text:'Sam',isCorrect:false},{id:'C',text:'Jay',isCorrect:true},{id:'D',text:'Cannot determine',isCorrect:false}],
     ex:'Tom>Sam>Jay. Jay is shortest.',tags:['ordering']},
    {cs:'deductive',ss:'Logic Puzzles',d:6,t:'Ann, Bob, Carl like different fruits: apple, banana, mango. Ann not apple. Bob=banana. Ann likes?',
     opts:[{id:'A',text:'Apple',isCorrect:false},{id:'B',text:'Banana',isCorrect:false},{id:'C',text:'Mango',isCorrect:true},{id:'D',text:'Cannot determine',isCorrect:false}],
     ex:'Bob=banana. Ann cannot have apple. Only mango left for Ann.',tags:['elimination']},
    {cs:'diagrammatic',ss:'Flowchart Logic',d:3,t:'If N<0: output Negative; else if N=0: output Zero; else: Positive. Input=-3. Output?',
     opts:[{id:'A',text:'Positive',isCorrect:false},{id:'B',text:'Zero',isCorrect:false},{id:'C',text:'Negative',isCorrect:true},{id:'D',text:'Error',isCorrect:false}],
     ex:'-3 < 0 so first branch taken: Negative.',tags:['conditional']},
    {cs:'diagrammatic',ss:'Input-Output Rules',d:4,t:'Box: divide by 2 then add 10. Input=8. Output?',
     opts:[{id:'A',text:'9',isCorrect:false},{id:'B',text:'14',isCorrect:true},{id:'C',text:'12',isCorrect:false},{id:'D',text:'18',isCorrect:false}],
     ex:'8/2=4. 4+10=14.',tags:['operators']},
    {cs:'diagrammatic',ss:'Flowchart Logic',d:5,t:'Loop: X=1, while X<5: X=X+1. Final X?',
     opts:[{id:'A',text:'4',isCorrect:false},{id:'B',text:'5',isCorrect:true},{id:'C',text:'6',isCorrect:false},{id:'D',text:'3',isCorrect:false}],
     ex:'X goes 1,2,3,4,5. When X=5, condition fails. Final X=5.',tags:['loop']},
    {cs:'reading',ss:'Main Idea',d:3,t:'Passage: "Regular exercise reduces heart disease risk, improves mental health, and increases life expectancy." Main idea?',
     opts:[{id:'A',text:'Exercise cures all diseases',isCorrect:false},{id:'B',text:'Exercise provides multiple health benefits',isCorrect:true},{id:'C',text:'Mental health is most important',isCorrect:false},{id:'D',text:'Exercise is essential for survival',isCorrect:false}],
     ex:'Three distinct health benefits listed. Main idea: multiple positive effects.',tags:['main idea']},
    {cs:'reading',ss:'Detail Retrieval',d:3,t:'Passage: "Museum open Tue-Sun 10am-5pm. Last entry 4:30pm." Can you enter at 4:45pm Wednesday?',
     opts:[{id:'A',text:'Yes',isCorrect:false},{id:'B',text:'No - last entry is 4:30pm',isCorrect:true},{id:'C',text:'Yes - closes at 5pm',isCorrect:false},{id:'D',text:'Cannot determine',isCorrect:false}],
     ex:'4:45pm is after last entry of 4:30pm. No admission.',tags:['detail']},
    {cs:'reading',ss:'Inference',d:5,t:'Passage: "The CEO issued an unusually brief statement saying the board had full confidence in the CFO." This suggests:',
     opts:[{id:'A',text:'Everything is fine',isCorrect:false},{id:'B',text:'There may be underlying concerns being managed',isCorrect:true},{id:'C',text:'The CEO is too busy',isCorrect:false},{id:'D',text:'The CFO is being promoted',isCorrect:false}],
     ex:'"Unusually brief" plus defensive phrasing often signals underlying tension in corporate communications.',tags:['implied meaning']},
    {cs:'quantitative',ss:'Algebra',d:3,t:'Solve: 5x - 3 = 17',
     opts:[{id:'A',text:'3',isCorrect:false},{id:'B',text:'4',isCorrect:true},{id:'C',text:'5',isCorrect:false},{id:'D',text:'6',isCorrect:false}],
     ex:'5x=20, x=4.',tags:['linear equation']},
    {cs:'quantitative',ss:'Probability',d:4,t:'Coin tossed 3 times. Probability of all heads?',
     opts:[{id:'A',text:'1/4',isCorrect:false},{id:'B',text:'1/6',isCorrect:false},{id:'C',text:'1/8',isCorrect:true},{id:'D',text:'1/2',isCorrect:false}],
     ex:'(1/2) cubed = 1/8.',tags:['probability']},
    {cs:'quantitative',ss:'Sequences',d:5,t:'Sum of first 10 terms: 5,10,15,20...',
     opts:[{id:'A',text:'250',isCorrect:false},{id:'B',text:'275',isCorrect:true},{id:'C',text:'300',isCorrect:false},{id:'D',text:'225',isCorrect:false}],
     ex:'a=5, d=5, n=10. Sum=n/2x(2a+(n-1)d)=5x(10+45)=275.',tags:['series']},
    {cs:'critical',ss:'Assumptions',d:3,t:'Statement: "We should open a new branch because our location is always busy." Assumption?',
     opts:[{id:'A',text:'Current location is popular',isCorrect:false},{id:'B',text:'A new branch will attract sufficient customers',isCorrect:true},{id:'C',text:'Opening branches is cheap',isCorrect:false},{id:'D',text:'Current location will close',isCorrect:false}],
     ex:'The argument assumes busyness signals demand that a new branch would capture.',tags:['assumption']},
    {cs:'critical',ss:'Flaws',d:5,t:'"This medicine used for 200 years so must be effective." Flaw?',
     opts:[{id:'A',text:'Correlation vs causation',isCorrect:false},{id:'B',text:'Appeal to tradition - age does not prove efficacy',isCorrect:true},{id:'C',text:'Hasty generalisation',isCorrect:false},{id:'D',text:'Ad hominem',isCorrect:false}],
     ex:'Longevity of use does not demonstrate effectiveness.',tags:['fallacy']},
    {cs:'critical',ss:'Conclusions',d:4,t:'Data: Team A=20 tasks/day, Team B=15 tasks/day. Best conclusion?',
     opts:[{id:'A',text:'Team A is better',isCorrect:false},{id:'B',text:'Team A completes more tasks per day',isCorrect:true},{id:'C',text:'Team B should be disbanded',isCorrect:false},{id:'D',text:'Team A quality is higher',isCorrect:false}],
     ex:'Only the quantitative comparison is evidenced. Quality judgements are not supported.',tags:['evidence-based']},
    {cs:'personality',ss:'Work Style',d:2,t:'Given a new responsibility you have not done before, you:',
     opts:[{id:'A',text:'Refuse until fully trained',isCorrect:false},{id:'B',text:'Accept, research, and seek guidance where needed',isCorrect:true},{id:'C',text:'Accept but wait for exact instructions',isCorrect:false},{id:'D',text:'Immediately delegate',isCorrect:false}],
     ex:'Proactive research and seeking guidance shows initiative and professionalism.',tags:['initiative']},
    {cs:'personality',ss:'Teamwork',d:3,t:'Colleague takes credit for your idea in a meeting. You:',
     opts:[{id:'A',text:'Shout at them',isCorrect:false},{id:'B',text:'Say nothing',isCorrect:false},{id:'C',text:'Calmly clarify your contribution or speak privately afterwards',isCorrect:true},{id:'D',text:'Complain to everyone else',isCorrect:false}],
     ex:'Assertive yet professional response without creating unnecessary conflict.',tags:['assertiveness']},
    {cs:'personality',ss:'Resilience',d:4,t:'You receive very critical feedback on your work. You:',
     opts:[{id:'A',text:'Become defensive',isCorrect:false},{id:'B',text:'Listen, ask clarifying questions, identify improvements',isCorrect:true},{id:'C',text:'Stop trying to improve',isCorrect:false},{id:'D',text:'Redo all work from scratch',isCorrect:false}],
     ex:'Constructive reception of feedback is a hallmark of professional growth mindset.',tags:['feedback','growth mindset']},
  ];

  let count = 0;
  for (const q of Qs) {
    const catId = m.get(q.cs);
    if (!catId) { console.warn('No category:', q.cs); continue; }
    await p.question.create({data:{
      categoryId:catId, subSkill:q.ss, text:q.t,
      options:q.opts, explanation:q.ex,
      difficulty:q.d, tags:q.tags
    }});
    count++;
    if (count % 10 === 0) process.stdout.write(count + '...');
  }
  console.log('\nQuestions inserted:', count);

  const hash = await bcrypt.hash('PsyAdmin@2026', 12);
  await p.user.upsert({
    where:{email:'admin@psychometriccoach.com'},
    update:{},
    create:{email:'admin@psychometriccoach.com',passwordHash:hash,name:'Super Admin',role:'SUPER_ADMIN',plan:'ENTERPRISE'}
  });
  console.log('Admin user ready');

  const [c,q,u] = await Promise.all([p.category.count(),p.question.count(),p.user.count()]);
  console.log('FINAL - categories:', c, 'questions:', q, 'users:', u);
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
