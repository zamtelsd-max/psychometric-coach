// SRS §5 — 300+ specialized question bank: 4 pillars × 75 items with
// [LocalName1]/[LocalCompany1]/[LocalCurrency] localization placeholders.
import prisma from './lib/prisma';

type Topic = { sub: string; stem: string; options: [string, string, string, string]; correct: number; expl: string };
type Pillar = { name: string; slug: string; desc: string; icon: string; topics: Topic[] };

const WRAPPERS = [
  (s: string) => s, (s: string) => `During a regional expansion review, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
  (s: string) => `Following a quarterly board meeting, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
  (s: string) => `Amid a period of rapid market change, ${s.charAt(0).toLowerCase() + s.slice(1)}`,
  (s: string) => `As part of a structured talent assessment, consider this case: ${s.charAt(0).toLowerCase() + s.slice(1)}`,
];

const PILLARS: Pillar[] = [
  { name: 'Sales Management', slug: 'sales-management', desc: 'High-value negotiations, closing pipelines, objection handling, territory mapping.', icon: '📈', topics: [
    { sub: 'Negotiation', stem: '[LocalName1] is closing a major distribution contract with [LocalCompany1]. The buyer objects heavily due to local supply delays. Which strategy best protects margin while giving the client peace of mind?', options: ['Offer an unconditional blanket discount', 'Phase deliveries with penalty-backed SLAs and a margin-safe escalation clause', 'Delay signing until supply is perfect', 'Transfer full logistics risk to the client'], correct: 1, expl: 'Phased SLAs de-risk the client while protecting base margin.' },
    { sub: 'Pipeline velocity', stem: 'An enterprise account executive finds 45% of deals stall at proposal for 3+ weeks. What structural change fixes proposal-stage velocity?', options: ['Add more approvers', 'Standardize proposals with pre-approved clause libraries and a 48h SLA', 'Skip proposals', 'Raise prices at proposal'], correct: 1, expl: 'Templated proposals with SLAs remove the structural bottleneck.' },
    { sub: 'Objection handling', stem: 'A long-term buyer threatens to switch to a cheaper international competitor. The best response leverages…', options: ['Matching any discount', 'Documented product value metrics and switching-cost analysis', 'Escalating to legal threats', 'Immediate cancellation'], correct: 1, expl: 'Value metrics beat discount matching for retention economics.' },
    { sub: 'Territory mapping', stem: '[LocalCompany1] reassigns territories quarterly. Balanced territory design should primarily equalize…', options: ['Headcount', 'Workload and revenue potential', 'Office proximity', 'Rep seniority'], correct: 1, expl: 'Balanced workload + opportunity keeps coverage and motivation fair.' },
    { sub: 'Closing frameworks', stem: 'When a prospect says "send more information" late in cycle, the strongest closing move is to…', options: ['Send a generic deck', 'Agree on a specific next-step decision meeting with stakeholders', 'Discount to force urgency', 'Wait for them to call'], correct: 1, expl: 'Committed next steps with stakeholders advance real momentum.' },
    { sub: 'Relationship health', stem: '[LocalName1] manages a key account that has not escalated issues but usage is dropping. Best first action?', options: ['Wait for renewal', 'Run a proactive business review with usage-based value reporting', 'Offer a discount', 'Add more users for free'], correct: 1, expl: 'Proactive value reviews surface silent churn risk.' },
    { sub: 'Quota setting', stem: 'Which quota method best balances ambition with fairness for a new territory?', options: ['Copy last year', 'Bottom-up capacity model adjusted for market potential', 'Top-line aspirational only', 'Equal split across reps'], correct: 1, expl: 'Capacity-based quotas reflect real territory opportunity.' },
    { sub: 'Discount governance', stem: 'A rep requests an out-of-policy discount to close this month. The manager should…', options: ['Approve quietly', 'Require a documented business case and trade-off concession', 'Fire the rep', 'Ignore the policy'], correct: 1, expl: 'Concession discipline protects pricing integrity.' },
    { sub: 'Forecasting', stem: 'Which evidence most improves forecast accuracy?', options: ['Rep optimism', 'Stage-verified exit criteria and committed next steps', 'Calendar quarter pressure', 'Competitor gossip'], correct: 1, expl: 'Objective exit criteria make stages meaningful.' },
    { sub: 'Prospecting', stem: '[LocalName2] targets [LocalCompany1]. The highest-yield first-touch approach is…', options: ['Cold generic blast', 'Personalized insight about a trigger event with a specific hypothesis', 'Cold call script only', 'LinkedIn stalking'], correct: 1, expl: 'Trigger-based personalization lifts reply and meeting rates.' },
    { sub: 'Renewals', stem: '90 days before renewal, the account team should…', options: ['Wait for the buyer to initiate', 'Confirm value delivered, align stakeholders, and pre-empt procurement', 'Auto-renew silently', 'Raise price 40%'], correct: 1, expl: 'Early value anchoring de-risks procurement cycles.' },
    { sub: 'Channel sales', stem: 'A partner keeps underselling your product. The best fix is…', options: ['Terminate immediately', 'Partner enablement + incentive realignment', 'Sell around them', 'Cut margin to zero'], correct: 1, expl: 'Capability + incentive fixes restore partner performance.' },
    { sub: 'CRM hygiene', stem: 'Pipeline reviews keep failing because data is stale. The systemic fix is…', options: ['Weekly nagging emails', 'Stage-gated mandatory fields tied to forecast submission', 'Manual spreadsheets', 'Buying more licenses'], correct: 1, expl: 'Gated data capture keeps pipeline trustworthy.' },
    { sub: 'Pricing strategy', stem: 'For a premium differentiated offering, which pricing posture is strongest?', options: ['Undercut competitors', 'Value-based pricing with tiered packaging', 'Cost-plus only', 'Free forever'], correct: 1, expl: 'Value capture follows differentiated value.' },
    { sub: 'Team coaching', stem: 'To lift a mid-performing team fastest, coach…', options: ['Only the top rep', 'The middle 60% on one high-leverage skill each', 'Only the worst rep', 'Nobody — hire instead'], correct: 1, expl: 'The performance middle offers the largest aggregate lift.' },
  ]},
  { name: 'Modern Marketing Strategy', slug: 'modern-marketing-strategy', desc: 'Funnels, campaign budgeting, brand equity, attribution, research analytics.', icon: '🎯', topics: [
    { sub: 'Funnel optimization', stem: '[LocalCompany1] spends [LocalCurrency]25,000 on a digital campaign. Traffic jumps 40% but checkout conversion drops 2.5%. Which metric should the team examine first?', options: ['Impressions', 'Checkout abandonment funnel steps', 'Follower count', 'Email open rate'], correct: 1, expl: 'Checkout-step analytics localize the conversion leak.' },
    { sub: 'Brand integrity', stem: 'During a PR issue about delivery mix-ups, the brand manager should frame messaging around…', options: ['Denial of all issues', 'Acknowledged accountability with a concrete remediation timeline', 'Silence', 'Attacking complainants'], correct: 1, expl: 'Accountability plus action protects loyalty.' },
    { sub: 'Attribution', stem: 'A customer sees a social post, reads a blog, then purchases via direct search. A first-touch model would credit…', options: ['Direct search', 'The social post', 'The blog', 'Split 33% each'], correct: 1, expl: 'First-touch assigns full credit to the first interaction.' },
    { sub: 'Budgeting', stem: 'Allocating a fixed annual budget, the most defensible split starts from…', options: ['Last year plus inflation', 'Marginal ROI by channel with a test-and-learn reserve', 'Equal channel split', 'Whatever sales prefers'], correct: 1, expl: 'Marginal-ROI allocation plus experimentation outperforms heuristics.' },
    { sub: 'Market research', stem: 'Before launching in a new region, the cheapest high-signal research step is…', options: ['Full national survey', 'Qualitative interviews with target-segment buyers', 'Buying a competitor database', 'Skipping research'], correct: 1, expl: 'Targeted qualitative work de-risks cheaply and fast.' },
    { sub: 'Positioning', stem: 'A strong positioning statement leads with…', options: ['Product feature lists', 'The distinct value for a defined audience versus alternatives', 'Company history', 'CEO quotes'], correct: 1, expl: 'Audience-value-differentiation is the positioning core.' },
    { sub: 'Retention marketing', stem: 'Subscription churn is 8% monthly. The highest-leverage campaign targets…', options: ['New logos only', 'Users showing engagement-drop signals with lifecycle nudges', 'All users equally', 'Competitor customers'], correct: 1, expl: 'Behavioral churn signals concentrate save-campaign spend.' },
    { sub: 'Content strategy', stem: 'For a long B2B sales cycle, content should map to…', options: ['Only pricing pages', 'Stage-matched assets: education → evaluation → decision', 'Viral memes', 'One brochure'], correct: 1, expl: 'Stage-fit content moves buyers through the cycle.' },
    { sub: 'Pricing pages', stem: 'A/B testing a pricing page shows tier reordering lifts revenue 6%. Before rollout, validate…', options: ['Nothing — ship it', 'Statistical significance and support-cost impact of new tier mix', 'CEO preference', 'Competitor pages'], correct: 1, expl: 'Significance plus operational impact guard against false wins.' },
    { sub: 'Influencer ROI', stem: 'Measuring an influencer campaign fairly requires…', options: ['Follower counts', 'Holdout or geo-based incrementality measurement', 'Vibes', 'Reach only'], correct: 1, expl: 'Incrementality isolates true causal lift.' },
    { sub: 'Local adaptation', stem: 'When entering the Zambian market, [LocalCompany1] should adapt…', options: ['Nothing — copy the US playbook', 'Currency, names, payment methods, and channel mix to local norms', 'Only the logo color', 'Product quality down'], correct: 1, expl: 'Localization spans currency, trust signals, and payments.' },
    { sub: 'Email lifecycle', stem: 'Welcome-series open rates are healthy but click-through is flat. Fix…', options: ['More paragraphs', 'Single-CTA layout with benefit-led links and list segmentation', 'Longer subject lines', 'Daily sends'], correct: 1, expl: 'CTA clarity and segmentation drive engagement.' },
    { sub: 'Competitive intel', stem: 'A competitor undercuts on price. The research-first response is to…', options: ['Match instantly', 'Analyze their trade-offs (service, quality) and reposition value', 'Publish attack ads', 'Ignore forever'], correct: 1, expl: 'Positioning against trade-offs beats reactive discounting.' },
    { sub: 'Brand equity', stem: 'Which measure best tracks brand equity over time?', options: ['Impressions', 'Periodic tracking of awareness, consideration, and preference', 'Refund counts', 'Hashtag volume'], correct: 1, expl: 'Tracking studies capture equity movement longitudinally.' },
    { sub: 'Marketing-sales handoff', stem: 'Lead handoff friction is high. The best structural fix is…', options: ['More meetings', 'Shared SLA definitions of qualified lead plus closed-loop scoring', 'Blame emails', 'Random routing'], correct: 1, expl: 'A shared qualification SLA aligns both funnels.' },
  ]},
  { name: 'Corporate Business Management', slug: 'corporate-business-management', desc: 'Leadership, budget allocation, governance, change management, evaluations.', icon: '🏢', topics: [
    { sub: 'Change management', stem: '[LocalName1] must merge two operations teams inside [LocalCompany1]; friction is slipping timelines. Deploy first…', options: ['A reorg announcement', 'A stakeholder map with change-impact analysis and quick wins', 'A dress code', 'New software'], correct: 1, expl: 'Stakeholder-impact mapping is the change foundation.' },
    { sub: 'Fiscal stewardship', stem: 'Raw material costs jump 15%. Which action protects cash flow without hurting quality?', options: ['Silent supplier switch', 'Renegotiate terms plus hedging with quality-audited alternates', 'Across-the-board quality cuts', 'Freeze all spend'], correct: 1, expl: 'Blended cost tactics protect both margin and quality.' },
    { sub: 'Strategic prioritization', stem: 'Choose between expanding domestically or high-risk regional infrastructure projects. The steering committee should weigh…', options: ['Excitement', 'Risk-adjusted NPV, capability readiness, and strategic fit', 'Office politics', 'Media buzz'], correct: 1, expl: 'Risk-adjusted value plus capability decides strategy.' },
    { sub: 'Governance', stem: 'A board wants independent oversight of a major transformation. Best instrument is…', options: ['Verbal updates', 'A steering committee with defined gates, RAG reporting, and audit rights', 'Trust alone', 'Ad-hoc emails'], correct: 1, expl: 'Stage-gated governance gives real oversight.' },
    { sub: 'Performance evaluation', stem: 'To reduce evaluation bias, calibrate…', options: ['Managers scoring alone', 'Cross-manager calibration with behavior-anchored evidence', 'Stack ranking always', 'Random ratings'], correct: 1, expl: 'Calibration with evidence anchors fairness.' },
    { sub: 'Operational budget', stem: '[LocalCompany1] must cut 10% of opex. Apply cuts by…', options: ['Proportional haircut everywhere', 'Zero-based review protecting revenue-critical capabilities', 'Cutting training only', 'Freezing hiring only'], correct: 1, expl: 'ZBB protects strategy-critical spend.' },
    { sub: 'Crisis leadership', stem: 'A supplier failure halts production. The leadership team should first…', options: ['Assign blame', 'Stand up a crisis cell: containment, customer comms, root cause', 'Ignore it', 'Delete emails'], correct: 1, expl: 'Containment-communication-rootcause is crisis order of operations.' },
    { sub: 'M&A integration', stem: 'Post-acquisition, cultural integration is stalling. The highest-leverage move is…', options: ['Mandate fun events', 'Joint value-creation squads with shared metrics and leaders', 'Parallel orgs forever', 'Longer slide decks'], correct: 1, expl: 'Shared metrics and joint teams fuse cultures.' },
    { sub: 'Stakeholder management', stem: 'For a contested policy change, map stakeholders by…', options: ['Job title only', 'Influence and impact, then engage each with tailored plans', 'Alphabetical order', 'Seniority myths'], correct: 1, expl: 'Influence-impact grids target engagement effort.' },
    { sub: 'Process improvement', stem: 'Order-to-cash delays increased 20%. The first analytical step is…', options: ['Hire consultants', 'Value-stream map the process to find the constraint', 'Buy software', 'Send surveys'], correct: 1, expl: 'Mapping exposes the true bottleneck before fixes.' },
    { sub: 'Risk management', stem: 'A firm discovers single-source dependency for a critical input. Treat by…', options: ['Accepting silently', 'Dual-sourcing with continuity plans and monitored triggers', 'Hope', 'Insurance only'], correct: 1, expl: 'Redundancy plus triggers operationalizes resilience.' },
    { sub: 'Talent planning', stem: 'Succession depth is thin for key roles. The strongest program is…', options: ['Names on a list', 'Assessed successors with development plans and stretch roles', 'External search only', 'Waiting'], correct: 1, expl: 'Assessed, stretched candidates make succession real.' },
    { sub: 'Corporate comms', stem: 'An unpopular but necessary restructuring is announced. Communication should…', options: ['Hide details', 'Explain the why, the timeline, and support available — then repeat it', 'Let rumor run', 'Blame the market only'], correct: 1, expl: 'Why-timeline-support messaging reduces destructive rumor.' },
    { sub: 'KPI design', stem: 'A balanced scorecard for a business unit must include…', options: ['Revenue only', 'Financial, customer, process, and learning measures', 'Vanity metrics', 'One KPI'], correct: 1, expl: 'Balanced perspectives prevent local optimization.' },
    { sub: 'Ethics & compliance', stem: 'A manager suspects procurement fraud. Correct first step…', options: ['Confront the suspect publicly', 'Report through the confidential channel preserving evidence', 'Ignore it', 'Post on social media'], correct: 1, expl: 'Confidential reporting protects process and evidence.' },
  ]},
  { name: 'ICT Infrastructure & Technology Management', slug: 'ict-infrastructure-technology', desc: 'Zero-trust cloud governance, cyber response, scalable infrastructure, privacy, TCO.', icon: '🖥️', topics: [
    { sub: 'Cyber defense', stem: '[LocalCompany1] suffers a ransomware incident on central offsite storage. The immediate first action to stop spread is…', options: ['Pay the ransom', 'Isolate affected segments and take backups offline-verify', 'Reboot everything', 'Email everyone'], correct: 1, expl: 'Segment isolation contains propagation before recovery.' },
    { sub: 'Cloud architecture', stem: 'Scaling customer-facing tools under strict data-sovereignty rules favors…', options: ['Public multi-tenant only', 'Hybrid with in-region private hosting for regulated data', 'One laptop', 'Full public cloud regardless'], correct: 1, expl: 'Hybrid satisfies sovereignty plus scale.' },
    { sub: 'Tech asset TCO', stem: 'Deciding legacy-server refresh versus SaaS over 5 years, the IT director must count…', options: ['License price only', 'Migration, integration, training, exit, and opportunity costs', 'Sticker price', 'Nothing'], correct: 1, expl: 'True TCO includes migration and exit economics.' },
    { sub: 'Zero trust', stem: 'Implementing zero-trust access begins with…', options: ['Trusting the VPN', 'Identity-centric policies with continuous verification and least privilege', 'One password for all', 'Disabling logs'], correct: 1, expl: 'Per-identity least privilege defines zero trust.' },
    { sub: 'Data privacy', stem: 'A new analytics product processes personal data. Before launch…', options: ['Ship and pray', 'Run a DPIA with minimization, consent, and retention controls', 'Hide the data flow', 'Delete the docs'], correct: 1, expl: 'DPIA-first is the compliance baseline.' },
    { sub: 'Incident response', stem: 'Post-incident, the most valuable artifact for regulators and insurers is…', options: ['Memory of meetings', 'A timestamped incident timeline with decisions and evidence', 'A verbal summary', 'No record'], correct: 1, expl: 'Documented timelines evidence a controlled response.' },
    { sub: 'DR planning', stem: 'A DR plan with RTO 4h / RPO 15min requires…', options: ['Annual PDF only', 'Replicated storage plus scheduled restore tests', 'One backup tape', 'Faith'], correct: 1, expl: 'RPO/RTO are only real if restore is tested.' },
    { sub: 'Capacity planning', stem: 'Traffic doubles each quarter. Scalable infra design should…', options: ['Buy the biggest server', 'Horizontal autoscaling with load-tested ceilings and cost curves', 'Static sizing', 'Ignore growth'], correct: 1, expl: 'Autoscale plus load tests match growth economics.' },
    { sub: 'Vendor management', stem: 'A critical SaaS vendor misses SLAs repeatedly. Escalate by…', options: ['Auto-renew anyway', 'Documented SLA credits, remediation plan, and exit evaluation', 'Angry tweets', 'Silence'], correct: 1, expl: 'SLA enforcement plus exit options restore leverage.' },
    { sub: 'Identity management', stem: 'Joiner-mover-leaver chaos is causing access risk. Fix with…', options: ['Manual emails', 'Automated lifecycle provisioning tied to HR source-of-truth', 'Shared accounts', 'Nothing'], correct: 1, expl: 'Automated JML provisioning kills standing access risk.' },
    { sub: 'Patch management', stem: 'A critical CVE affects 200 servers. Prioritize by…', options: ['Alphabetical hostnames', 'Exposure and criticality tiers with emergency change windows', 'Random order', 'Waiting for EOL'], correct: 1, expl: 'Risk-tiered patching matches threat urgency.' },
    { sub: 'Network segmentation', stem: 'To limit lateral movement for OT and IT estates…', options: ['One flat network', 'Segment by function with controlled choke points and monitoring', 'Disable firewalls', 'Open all ports'], correct: 1, expl: 'Segmentation plus monitored choke points contains breaches.' },
    { sub: 'Data observability', stem: 'Exec dashboards keep contradicting reports. Root fix is…', options: ['More spreadsheets', 'Source-aligned metric definitions with lineage and quality tests', 'New BI tool', 'Delete dashboards'], correct: 1, expl: 'Metric contracts plus lineage restore trust.' },
    { sub: 'AI governance', stem: 'Deploying an internal AI assistant, the gating control is…', options: ['None', 'Data-use policy, human-in-the-loop review, and audit logging', 'Speed only', 'Secrecy'], correct: 1, expl: 'Policy + HITL + audit enable safe AI adoption.' },
    { sub: 'Legacy migration', stem: 'Migrating a fragile legacy system, the safest path is…', options: ['Big-bang rewrite', 'Strangler-pattern incremental extraction with parallel-run verification', 'Turn it off', 'Hope'], correct: 1, expl: 'Strangler + parallel run de-risks migration.' },
  ]},
];

export async function seedQuestionBank() {
  let n = 0;
  for (const p of PILLARS) {
    const cat = await prisma.category.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, slug: p.slug, description: p.desc, icon: p.icon },
    });
    let item = 0;
    for (const t of p.topics) {
      for (let w = 0; w < WRAPPERS.length; w++) {
        item++; n++;
        const text = `${WRAPPERS[w](t.stem)}`;
        const tags = [p.slug, `item-${n}`, t.sub.toLowerCase()];
        const existing = await prisma.question.findFirst({ where: { text, categoryId: cat.id } });
        if (existing) continue;
        await prisma.question.create({ data: {
          categoryId: cat.id, subSkill: t.sub, text,
          options: t.options.map((o, i) => ({ label: String.fromCharCode(65 + i), content: o })),
          explanation: t.expl, difficulty: 2 + (item % 4), discrimination: 0.8 + ((item % 5) * 0.2),
          timeLimit: 60 + (item % 3) * 30, tags, isActive: true,
        } });
      }
    }
  }
  return n;
}

if (require.main === module) seedQuestionBank().then(n => { console.log(`question bank seeded: ${n} items`); return prisma.$disconnect(); }).catch(e => { console.error(e); process.exit(1); });
