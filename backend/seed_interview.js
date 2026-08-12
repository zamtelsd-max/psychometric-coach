require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// archetype question banks — General + job-family specific. keywords drive semantic scoring.
const Q = [];
function add(archetype, jobFamily, tier, difficulty, questionText, expectedKeywords, followUp) {
  Q.push({ archetype, jobFamily, tier, difficulty, questionText, expectedKeywords, followUp: followUp || null });
}

// ── GENERAL (applies to any role) ────────────────────────────────────────────
// Technical Lead
add('TECH_LEAD','General','Mid',2,'Walk me through a technically challenging problem you solved recently. What made it hard and how did you approach it?','problem,approach,solution,debug,root cause,trade-off,tested');
add('TECH_LEAD','General','Mid',3,'How do you decide between two competing technical approaches when both seem viable?','trade-off,criteria,cost,scalability,maintainability,evaluate,decision');
add('TECH_LEAD','General','Mid',3,'Describe a time your solution failed in production. What did you learn?','failure,production,root cause,monitoring,fix,learned,prevent');
add('TECH_LEAD','General','Mid',2,'How do you keep your technical skills current in a fast-changing field?','learning,practice,reading,courses,projects,community,update');
add('TECH_LEAD','General','Senior',4,'How would you design a system to handle a 10x increase in load?','scalability,caching,load balancing,database,horizontal,bottleneck,architecture');
// HR & Culture Manager
add('HR_MANAGER','General','Mid',2,'Tell me about a time you had a conflict with a colleague. How did you handle it?','conflict,communication,listen,resolve,compromise,respect,outcome');
add('HR_MANAGER','General','Mid',2,'What does a healthy team culture look like to you, and how do you contribute to it?','culture,collaboration,trust,respect,feedback,inclusive,support');
add('HR_MANAGER','General','Mid',3,'Describe a situation where you had to adapt to significant change at work.','change,adapt,flexible,learn,positive,uncertainty,adjust');
add('HR_MANAGER','General','Mid',2,'Why are you interested in this role, and where do you see yourself growing?','motivation,growth,goals,align,values,contribute,develop');
add('HR_MANAGER','General','Junior',1,'Tell me about yourself and what drives you professionally.','background,motivation,strengths,passion,goals,experience');
// Product / Project Manager
add('PRODUCT_MANAGER','General','Mid',3,'Tell me about a time you had to prioritise competing tasks under a tight deadline.','prioritise,deadline,impact,stakeholder,trade-off,delivered,focus');
add('PRODUCT_MANAGER','General','Mid',3,'How do you handle a project that is falling behind schedule?','risk,replan,stakeholder,scope,communicate,mitigate,deliver');
add('PRODUCT_MANAGER','General','Mid',2,'Describe how you gather and balance requirements from different stakeholders.','stakeholder,requirements,prioritise,balance,communicate,align,trade-off');
add('PRODUCT_MANAGER','General','Senior',4,'How do you measure whether a project or product was successful?','metrics,kpi,outcome,impact,roi,users,goals,measure');
add('PRODUCT_MANAGER','General','Mid',3,'Tell me about a time you had to make a decision with incomplete information.','decision,data,risk,assumption,judgement,outcome,adapt');
// Executive Director
add('EXEC_DIRECTOR','General','Senior',4,'How would your work in this role contribute to the wider strategy of the organisation?','strategy,vision,impact,roi,align,growth,value');
add('EXEC_DIRECTOR','General','Senior',4,'Tell me about a time you drove measurable business impact.','impact,revenue,cost,roi,growth,metrics,result');
add('EXEC_DIRECTOR','General','Executive',5,'How do you balance short-term delivery against long-term vision?','short-term,long-term,vision,trade-off,strategy,sustainable,balance');
add('EXEC_DIRECTOR','General','Senior',4,'Describe a difficult decision you made that others disagreed with. What was the result?','decision,conviction,data,stakeholder,result,leadership,outcome');
add('EXEC_DIRECTOR','General','Executive',5,'What is the biggest risk facing a team in your field and how would you mitigate it?','risk,mitigate,strategy,plan,impact,contingency,lead');

// ── Software Engineering ─────────────────────────────────────────────────────
add('TECH_LEAD','Software Engineering','Mid',3,'Explain how you would debug a performance regression in a web application.','profiling,latency,database,query,cache,bottleneck,metrics,fix');
add('TECH_LEAD','Software Engineering','Mid',3,'How do you ensure code quality across a team?','code review,tests,ci,standards,linting,documentation,pair');
add('TECH_LEAD','Software Engineering','Senior',4,'Design a URL shortener. What are the key components and trade-offs?','hashing,database,cache,scalability,collision,redirect,api,trade-off');
add('TECH_LEAD','Software Engineering','Mid',3,'How do you approach writing tests for a new feature?','unit test,integration,coverage,edge case,tdd,mock,regression');
add('HR_MANAGER','Software Engineering','Mid',2,'How do you handle disagreement over a technical decision within your team?','listen,data,compromise,respect,decision,align,communicate');
add('HR_MANAGER','Software Engineering','Mid',2,'Describe a time you mentored a junior engineer.','mentor,teach,patience,feedback,growth,support,guide');
add('PRODUCT_MANAGER','Software Engineering','Mid',3,'How do you balance shipping fast with technical debt?','technical debt,trade-off,prioritise,refactor,deliver,risk,balance');
add('PRODUCT_MANAGER','Software Engineering','Mid',3,'A feature is delayed by a dependency outside your team. What do you do?','communicate,escalate,replan,mitigate,stakeholder,unblock,deliver');
add('EXEC_DIRECTOR','Software Engineering','Senior',4,'How would you justify investment in platform/infrastructure work to leadership?','roi,reliability,velocity,cost,scale,risk,business value');

// ── Sales & Distribution ─────────────────────────────────────────────────────
add('TECH_LEAD','Sales & Distribution','Mid',2,'What sales tools or systems have you used and how do you leverage data to sell?','crm,data,pipeline,analytics,forecast,leads,conversion');
add('HR_MANAGER','Sales & Distribution','Mid',2,'Tell me about a time you turned an unhappy customer into a loyal one.','customer,listen,resolve,trust,relationship,follow up,retention');
add('PRODUCT_MANAGER','Sales & Distribution','Mid',3,'How do you plan and prioritise your sales territory or targets?','territory,target,prioritise,pipeline,plan,quota,segment');
add('PRODUCT_MANAGER','Sales & Distribution','Mid',3,'Describe how you recovered a quarter where you were behind target.','target,recover,pipeline,activity,focus,close,result');
add('EXEC_DIRECTOR','Sales & Distribution','Senior',4,'How would you grow revenue in an underperforming region?','revenue,growth,strategy,market,channel,roi,plan');

// ── Finance ──────────────────────────────────────────────────────────────────
add('TECH_LEAD','Finance','Mid',3,'Walk me through how you would analyse the financial health of a company.','ratio,liquidity,profitability,cash flow,balance sheet,analysis,trend');
add('HR_MANAGER','Finance','Mid',2,'Describe a time you had to explain complex financial information to non-finance colleagues.','communicate,simplify,clarity,stakeholder,understand,translate');
add('PRODUCT_MANAGER','Finance','Mid',3,'How do you ensure accuracy while working under tight reporting deadlines?','accuracy,review,reconcile,deadline,checks,process,quality');
add('EXEC_DIRECTOR','Finance','Senior',4,'How would you advise leadership on a major cost-reduction decision?','cost,roi,risk,analysis,trade-off,impact,recommend');

(async () => {
  try {
    const existing = await prisma.interviewQuestion.count();
    if (existing > 0) { console.log('Interview questions already seeded:', existing, '— skipping.'); await prisma.$disconnect(); return; }
    for (let i = 0; i < Q.length; i += 100) await prisma.interviewQuestion.createMany({ data: Q.slice(i, i + 100), skipDuplicates: true });
    console.log('Seeded interview questions:', await prisma.interviewQuestion.count());
    // breakdown
    for (const a of ['TECH_LEAD','HR_MANAGER','PRODUCT_MANAGER','EXEC_DIRECTOR']) {
      console.log(' ', a, await prisma.interviewQuestion.count({ where: { archetype: a } }));
    }
  } catch (e) { console.error('seed error:', e.message); }
  finally { await prisma.$disconnect(); }
})();
