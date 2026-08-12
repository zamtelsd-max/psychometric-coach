require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const Q = [];
const add = (archetype, jobFamily, tier, difficulty, questionText, expectedKeywords) =>
  Q.push({ archetype, jobFamily, tier, difficulty, questionText, expectedKeywords, followUp: null });

const FAMILIES = ['General', 'Software Engineering', 'Sales & Distribution', 'Finance', 'Marketing', 'Customer Service', 'Operations', 'Data & Analytics', 'Human Resources', 'Healthcare'];

// ── Behavioural / cross-cutting question templates per archetype ─────────────
// Each entry: [text, keywords]. Job-family placeholder {f} lightly localises.
const TECH = [
  ['Walk me through the most technically challenging problem you have solved. What made it hard?', 'problem,approach,root cause,solution,tested,trade-off'],
  ['How do you decide between two competing technical approaches?', 'trade-off,criteria,cost,scalability,maintainability,evaluate,decision'],
  ['Describe a time your solution failed. What did you learn and change?', 'failure,root cause,fix,learned,prevent,monitoring'],
  ['How do you keep your technical skills current?', 'learning,practice,courses,projects,reading,update,community'],
  ['Explain a complex concept in your field to me as if I were non-technical.', 'simplify,analogy,clear,explain,translate,understand'],
  ['How do you ensure quality in the work you deliver?', 'quality,review,tests,standards,checks,accuracy,process'],
  ['Tell me about a time you improved a process or system.', 'improve,process,efficiency,automate,measure,result,impact'],
  ['How do you approach a problem you have never seen before?', 'research,break down,hypothesis,test,iterate,learn,approach'],
  ['Describe a time you had to learn a new tool or technology quickly.', 'learn,fast,documentation,practice,apply,deliver,adapt'],
  ['How do you handle competing technical priorities with limited time?', 'prioritise,impact,trade-off,focus,deliver,triage'],
  ['What technical achievement are you most proud of and why?', 'achievement,impact,built,delivered,result,proud,ownership'],
  ['How do you validate that your work actually meets the requirement?', 'validate,requirement,test,acceptance,verify,edge case,review'],
];
const HR = [
  ['Tell me about a time you had a conflict with a colleague. How did you handle it?', 'conflict,communication,listen,resolve,compromise,respect,outcome'],
  ['What does a healthy team culture look like to you?', 'culture,collaboration,trust,respect,feedback,inclusive,support'],
  ['Describe a situation where you had to adapt to significant change.', 'change,adapt,flexible,learn,positive,uncertainty,adjust'],
  ['Why are you interested in this role and where do you see yourself growing?', 'motivation,growth,goals,align,values,contribute,develop'],
  ['Tell me about yourself and what drives you professionally.', 'background,motivation,strengths,passion,goals,experience'],
  ['Describe a time you received difficult feedback. How did you respond?', 'feedback,listen,reflect,improve,growth,humble,act'],
  ['Tell me about a time you supported a struggling teammate.', 'support,help,mentor,empathy,team,listen,result'],
  ['How do you handle stress and pressure at work?', 'stress,manage,prioritise,calm,balance,plan,resilience'],
  ['Describe a time you demonstrated leadership without formal authority.', 'lead,influence,initiative,team,motivate,ownership,result'],
  ['Tell me about a time you made a mistake. How did you handle it?', 'mistake,own,honest,fix,learn,accountable,improve'],
  ['What motivates you to do your best work?', 'motivation,purpose,impact,growth,recognition,values,passion'],
  ['How do you build trust with new colleagues?', 'trust,listen,reliable,honest,deliver,respect,communicate'],
  ['Describe a time you had to work with someone very different from you.', 'diversity,respect,adapt,listen,collaborate,understand,inclusive'],
  ['Tell me about a time you went above and beyond for a customer or colleague.', 'initiative,extra,ownership,care,impact,result,service'],
];
const PM = [
  ['Tell me about a time you prioritised competing tasks under a tight deadline.', 'prioritise,deadline,impact,stakeholder,trade-off,delivered,focus'],
  ['How do you handle a project falling behind schedule?', 'risk,replan,stakeholder,scope,communicate,mitigate,deliver'],
  ['How do you gather and balance requirements from different stakeholders?', 'stakeholder,requirements,prioritise,balance,communicate,align,trade-off'],
  ['How do you measure whether a project was successful?', 'metrics,kpi,outcome,impact,roi,users,goals,measure'],
  ['Tell me about a decision you made with incomplete information.', 'decision,data,risk,assumption,judgement,outcome,adapt'],
  ['Describe a time you had to say no to a stakeholder. How did you do it?', 'no,prioritise,explain,data,trade-off,align,respect'],
  ['How do you keep a team aligned and motivated during a long project?', 'align,communicate,motivate,goals,check-in,morale,transparency'],
  ['Tell me about a time you identified and mitigated a project risk early.', 'risk,identify,mitigate,plan,contingency,proactive,result'],
  ['How do you handle scope creep?', 'scope,control,prioritise,stakeholder,trade-off,change,communicate'],
  ['Describe how you turned around an underperforming initiative.', 'turnaround,diagnose,replan,execute,result,improve,focus'],
  ['How do you balance speed of delivery with quality?', 'speed,quality,trade-off,prioritise,risk,deliver,balance'],
  ['Tell me about a time you influenced a decision without authority.', 'influence,data,persuade,stakeholder,align,outcome,lead'],
  ['How do you plan a project from a vague brief?', 'clarify,scope,plan,milestones,stakeholder,assumptions,deliver'],
];
const EXEC = [
  ['How would your work in this role contribute to the wider strategy of the organisation?', 'strategy,vision,impact,roi,align,growth,value'],
  ['Tell me about a time you drove measurable business impact.', 'impact,revenue,cost,roi,growth,metrics,result'],
  ['How do you balance short-term delivery against long-term vision?', 'short-term,long-term,vision,trade-off,strategy,sustainable,balance'],
  ['Describe a difficult decision you made that others disagreed with.', 'decision,conviction,data,stakeholder,result,leadership,outcome'],
  ['What is the biggest risk facing a team in your field and how would you mitigate it?', 'risk,mitigate,strategy,plan,impact,contingency,lead'],
  ['How do you decide where to invest limited resources?', 'invest,roi,prioritise,strategy,impact,data,trade-off'],
  ['Tell me about a time you led a team through significant change.', 'change,lead,vision,communicate,motivate,adapt,result'],
  ['How would you improve the performance of an underperforming team or region?', 'diagnose,strategy,coach,metrics,accountability,improve,result'],
  ['What does success look like to you in the first 90 days of this role?', '90 days,quick wins,learn,relationships,strategy,impact,plan'],
  ['How do you stay accountable for outcomes you do not directly control?', 'accountable,influence,stakeholder,metrics,ownership,follow up,result'],
  ['Describe a time you had to make an unpopular but necessary decision.', 'decision,tough,data,communicate,conviction,outcome,lead'],
  ['How do you think about growth versus profitability?', 'growth,profitability,strategy,roi,trade-off,sustainable,balance'],
];

// Family-specific flavour questions (added on top of behavioural pool)
const FAMILY_Q = {
  'Software Engineering': {
    TECH_LEAD: [
      ['Explain how you would debug a performance regression in an application.', 'profiling,latency,query,cache,bottleneck,metrics,fix'],
      ['Design a URL shortener — key components and trade-offs?', 'hashing,database,cache,scalability,collision,redirect,api'],
      ['How do you ensure code quality across a team?', 'code review,tests,ci,standards,linting,documentation'],
      ['How would you design a system to handle 10x load?', 'scalability,caching,load balancing,database,horizontal,bottleneck'],
      ['How do you approach writing tests for a new feature?', 'unit test,integration,coverage,edge case,tdd,mock'],
    ],
    PRODUCT_MANAGER: [
      ['How do you balance shipping fast with technical debt?', 'technical debt,trade-off,prioritise,refactor,deliver,risk'],
      ['A feature is blocked by another team. What do you do?', 'communicate,escalate,replan,unblock,stakeholder,deliver'],
    ],
    EXEC_DIRECTOR: [['How would you justify platform/infrastructure investment to leadership?', 'roi,reliability,velocity,cost,scale,risk,business value']],
  },
  'Sales & Distribution': {
    TECH_LEAD: [['What sales tools have you used and how do you use data to sell?', 'crm,data,pipeline,analytics,forecast,leads,conversion']],
    HR_MANAGER: [['Tell me about turning an unhappy customer into a loyal one.', 'customer,listen,resolve,trust,relationship,retention']],
    PRODUCT_MANAGER: [
      ['How do you plan and prioritise your sales territory or targets?', 'territory,target,prioritise,pipeline,plan,quota,segment'],
      ['Describe how you recovered a quarter where you were behind target.', 'target,recover,pipeline,activity,focus,close,result'],
    ],
    EXEC_DIRECTOR: [['How would you grow revenue in an underperforming region?', 'revenue,growth,strategy,market,channel,roi,plan']],
  },
  'Finance': {
    TECH_LEAD: [['Walk me through how you analyse the financial health of a company.', 'ratio,liquidity,profitability,cash flow,balance sheet,trend']],
    HR_MANAGER: [['Describe explaining complex financial info to non-finance colleagues.', 'communicate,simplify,clarity,stakeholder,understand']],
    PRODUCT_MANAGER: [['How do you ensure accuracy under tight reporting deadlines?', 'accuracy,review,reconcile,deadline,checks,process']],
    EXEC_DIRECTOR: [['How would you advise leadership on a major cost-reduction decision?', 'cost,roi,risk,analysis,trade-off,impact,recommend']],
  },
  'Marketing': {
    TECH_LEAD: [['How do you measure the ROI of a marketing campaign?', 'roi,metrics,conversion,attribution,cost,analytics,result']],
    PRODUCT_MANAGER: [['Describe launching a campaign under a tight budget.', 'budget,plan,prioritise,channel,creative,measure,result']],
    EXEC_DIRECTOR: [['How would you grow brand awareness in a new market?', 'brand,market,strategy,channel,positioning,roi,growth']],
    HR_MANAGER: [['Tell me about collaborating with a difficult creative team.', 'collaborate,creative,feedback,align,respect,deliver']],
  },
  'Customer Service': {
    HR_MANAGER: [['Tell me about de-escalating an angry customer.', 'de-escalate,listen,empathy,resolve,calm,solution,retention'],
      ['How do you stay positive after a stressful interaction?', 'resilience,reset,positive,support,manage,balance']],
    PRODUCT_MANAGER: [['How do you handle a spike in support volume?', 'prioritise,triage,process,escalate,team,resolve,deliver']],
    EXEC_DIRECTOR: [['How would you improve overall customer satisfaction scores?', 'csat,metrics,root cause,process,training,improve,result']],
    TECH_LEAD: [['What tools do you use to track and resolve customer issues?', 'ticketing,crm,track,resolve,data,follow up,sla']],
  },
  'Operations': {
    TECH_LEAD: [['How do you identify a bottleneck in an operational process?', 'bottleneck,analyse,data,process,root cause,fix,measure']],
    PRODUCT_MANAGER: [['Describe optimising a workflow to save time or cost.', 'optimise,workflow,efficiency,cost,measure,result,improve']],
    EXEC_DIRECTOR: [['How would you scale operations for rapid growth?', 'scale,process,capacity,systems,plan,cost,growth']],
    HR_MANAGER: [['Tell me about coordinating across departments under pressure.', 'coordinate,communicate,stakeholder,align,deliver,pressure']],
  },
  'Data & Analytics': {
    TECH_LEAD: [['How would you approach an analysis with messy, incomplete data?', 'clean,validate,assumptions,method,analyse,caveats,insight'],
      ['How do you turn a business question into a data problem?', 'question,metric,hypothesis,data,method,analyse,answer']],
    PRODUCT_MANAGER: [['How do you prioritise which analyses to run first?', 'prioritise,impact,stakeholder,value,quick win,deliver']],
    EXEC_DIRECTOR: [['How do you drive a data-driven culture in an organisation?', 'data,culture,metrics,decision,adoption,tools,strategy']],
  },
  'Human Resources': {
    HR_MANAGER: [['How do you handle a sensitive employee grievance?', 'confidential,listen,fair,policy,resolve,document,empathy'],
      ['Describe improving employee engagement.', 'engagement,survey,listen,action,culture,measure,improve']],
    PRODUCT_MANAGER: [['How do you run a hiring process efficiently and fairly?', 'process,structured,fair,criteria,speed,candidate,quality']],
    EXEC_DIRECTOR: [['How would you reduce staff turnover?', 'turnover,root cause,retention,culture,growth,measure,strategy']],
  },
  'Healthcare': {
    TECH_LEAD: [['How do you ensure accuracy and safety in your clinical work?', 'accuracy,safety,protocol,check,verify,standard,risk']],
    HR_MANAGER: [['Tell me about handling a distressed patient or family.', 'empathy,calm,communicate,listen,support,dignity,resolve']],
    PRODUCT_MANAGER: [['How do you manage competing patient priorities in a busy shift?', 'triage,prioritise,urgent,calm,coordinate,deliver,safety']],
    EXEC_DIRECTOR: [['How would you improve patient outcomes with limited resources?', 'outcomes,resources,prioritise,process,quality,measure,improve']],
  },
};

const TIERS = ['Junior', 'Mid', 'Senior'];
const POOLS = { TECH_LEAD: TECH, HR_MANAGER: HR, PRODUCT_MANAGER: PM, EXEC_DIRECTOR: EXEC };

// Build: for each family, for each archetype, seed behavioural pool (varying tier) + family-specific
for (const f of FAMILIES) {
  for (const arch of Object.keys(POOLS)) {
    POOLS[arch].forEach((q, idx) => {
      const tier = TIERS[idx % TIERS.length];
      const diff = arch === 'EXEC_DIRECTOR' ? 4 : arch === 'TECH_LEAD' ? 3 : 2;
      add(arch, f, tier, diff, q[0], q[1]);
    });
    const fam = FAMILY_Q[f];
    if (fam && fam[arch]) fam[arch].forEach(q => add(arch, f, 'Mid', 3, q[0], q[1]));
  }
}

(async () => {
  try {
    // clear + reseed for a clean, large, varied bank
    await prisma.interviewQuestion.deleteMany({});
    for (let i = 0; i < Q.length; i += 200) await prisma.interviewQuestion.createMany({ data: Q.slice(i, i + 200), skipDuplicates: true });
    const total = await prisma.interviewQuestion.count();
    console.log('TOTAL seeded:', total);
    for (const a of Object.keys(POOLS)) console.log(' ', a, await prisma.interviewQuestion.count({ where: { archetype: a } }));
    console.log('families:', FAMILIES.length);
  } catch (e) { console.error('seed error:', e.message); }
  finally { await prisma.$disconnect(); }
})();
