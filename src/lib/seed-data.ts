export interface SeedOption {
  id: string;
  text: string;
  points?: number; // 0-3 for company
  mappedLevel?: 'UNAWARE' | 'AWARE' | 'PRACTICING' | 'PROFICIENT' | 'LEADING';
  concernType?: string;
  order: number;
}

export interface SeedQuestion {
  id: string;
  assessmentTypeId: 'COMPANY' | 'CLEVEL' | 'THREE_SIXTY';
  dimensionId: string;
  layer?: 'KNOWLEDGE' | 'AWARENESS' | 'RESISTANCE';
  text: string;
  scenarioContext?: string;
  order: number;
  roleFilter?: string; // 'ALL', 'CEO', 'CFO', 'CTO', 'CHRO', 'COO', 'CMO'
  options: SeedOption[];
}

export const COMPANY_DIMENSIONS = [
  {
    id: 'STRATEGY',
    name: 'Strategy and Leadership',
    weight: 0.25,
    domain: 'Direction, ownership, investment intent, alignment at the top',
    description: 'Measures executive alignment, strategic roadmap, resource commitment, and senior leadership accountability.',
    order: 1,
  },
  {
    id: 'USE_VALUE',
    name: 'Use and Value',
    weight: 0.20,
    domain: 'What AI is used for today, results tracked, pilots versus live use',
    description: 'Measures where and how AI is actively deployed across commercial workflows, tracking tangible business value and operational ROI.',
    order: 2,
  },
  {
    id: 'DATA_TECH',
    name: 'Data and Technology',
    weight: 0.20,
    domain: 'Data organization, tools, integration, shadow AI',
    description: 'Assesses corporate data readiness, software architecture, API integrations, and oversight of unsanctioned tools.',
    order: 3,
  },
  {
    id: 'GOVERNANCE',
    name: 'Governance and Risk',
    weight: 0.20,
    domain: 'Policies, data handling rules, vendor vetting, legal exposure',
    description: 'Evaluates risk mitigation protocols, proprietary IP protection, customer privacy controls, and AI vendor compliance.',
    order: 4,
  },
  {
    id: 'PEOPLE',
    name: 'People and Skills',
    weight: 0.15,
    domain: 'Training, skill levels, adoption habits',
    description: 'Assesses workforce digital literacy, structured upskilling, prompt proficiency, and cultural receptivity to change.',
    order: 5,
  },
];

export const COMPANY_QUESTIONS: SeedQuestion[] = [
  // --- Strategy and Leadership (5 Questions) ---
  {
    id: 'comp_strat_1',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'STRATEGY',
    order: 1,
    text: 'How is AI currently prioritized on your company executive agenda?',
    options: [
      { id: 'cs1_0', text: 'AI is not on our leadership agenda or discussed only informally.', points: 0, order: 0 },
      { id: 'cs1_1', text: 'We acknowledge AI as an emerging topic, but have no defined budget or champion.', points: 1, order: 1 },
      { id: 'cs1_2', text: 'AI has an assigned executive sponsor and quarterly pilot goals with dedicated budget.', points: 2, order: 2 },
      { id: 'cs1_3', text: 'AI strategy is fully integrated into our annual operating plan with multi-year ROI targets.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_strat_2',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'STRATEGY',
    order: 2,
    text: 'How aligned is your executive leadership team on where AI should be applied?',
    options: [
      { id: 'cs2_0', text: 'Leadership holds contradictory or skeptical views on the utility of AI.', points: 0, order: 0 },
      { id: 'cs2_1', text: 'Executives agree AI is important, but each department operates with disconnected ideas.', points: 1, order: 1 },
      { id: 'cs2_2', text: 'Leadership has formally agreed upon top 2-3 strategic focus areas for AI deployment.', points: 2, order: 2 },
      { id: 'cs2_3', text: 'Complete consensus on AI priorities across all business units with shared cross-functional KPIs.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_strat_3',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'STRATEGY',
    order: 3,
    text: 'What is your company investment posture regarding AI tooling and adoption over the next 12 months?',
    options: [
      { id: 'cs3_0', text: 'Zero dedicated spend; employees rely solely on free consumer tools at their own initiative.', points: 0, order: 0 },
      { id: 'cs3_1', text: 'Ad-hoc expense reimbursements for individual software licenses without unified allocation.', points: 1, order: 1 },
      { id: 'cs3_2', text: 'Designated budget line item specifically reserved for AI software, infrastructure, or pilots.', points: 2, order: 2 },
      { id: 'cs3_3', text: 'Strategic capital allocation with expected payback milestones and automated resource scaling.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_strat_4',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'STRATEGY',
    order: 4,
    text: 'How does your company monitor competitive threats and industry AI innovations?',
    options: [
      { id: 'cs4_0', text: 'We do not systematically track how competitors or peers utilize AI.', points: 0, order: 0 },
      { id: 'cs4_1', text: 'Occasional anecdotal discussions when interesting AI news or articles surface.', points: 1, order: 1 },
      { id: 'cs4_2', text: 'Regular benchmarking of competitor AI capabilities and market tech trends every quarter.', points: 2, order: 2 },
      { id: 'cs4_3', text: 'Proactive intelligence briefings driving rapid product and workflow counter-strategies.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_strat_5',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'STRATEGY',
    order: 5,
    text: 'What level of clear accountability exists for AI outcomes within the management team?',
    options: [
      { id: 'cs5_0', text: 'Nobody is responsible if AI initiatives succeed, stall, or introduce errors.', points: 0, order: 0 },
      { id: 'cs5_1', text: 'AI is loosely assumed to fall under generic IT support duties.', points: 1, order: 1 },
      { id: 'cs5_2', text: 'Specific functional heads (e.g. CTO, COO) own implementation and report progress to CEO.', points: 2, order: 2 },
      { id: 'cs5_3', text: 'Formal cross-functional AI steering committee with clear metrics tied to executive compensation.', points: 3, order: 3 },
    ],
  },

  // --- Use and Value (5 Questions) ---
  {
    id: 'comp_use_1',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'USE_VALUE',
    order: 6,
    text: 'Where are AI tools currently deployed in day-to-day operations?',
    options: [
      { id: 'cu1_0', text: 'Nowhere across core company workflows.', points: 0, order: 0 },
      { id: 'cu1_1', text: 'Ad-hoc individual tasks only (e.g. drafting emails, basic proofreading).', points: 1, order: 1 },
      { id: 'cu1_2', text: 'Integrated into several departmental workflows (e.g. customer support, code review, marketing).', points: 2, order: 2 },
      { id: 'cu1_3', text: 'Deeply embedded in mission-critical operations with automated multi-agent pipelines.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_use_2',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'USE_VALUE',
    order: 7,
    text: 'How does your company measure and track the business value generated from AI tools?',
    options: [
      { id: 'cu2_0', text: 'We do not measure ROI or time savings from AI.', points: 0, order: 0 },
      { id: 'cu2_1', text: 'Informal feedback that "it seems faster", with no documented metrics.', points: 1, order: 1 },
      { id: 'cu2_2', text: 'Defined baseline benchmarks measuring hours saved, error reduction, or cycle times.', points: 2, order: 2 },
      { id: 'cu2_3', text: 'Automated telemetry tracking financial impact, revenue enhancement, and labor efficiency.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_use_3',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'USE_VALUE',
    order: 8,
    text: 'What is the maturity ratio of your AI projects between isolated pilots and live production use?',
    options: [
      { id: 'cu3_0', text: 'No pilots or active deployments have been attempted.', points: 0, order: 0 },
      { id: 'cu3_1', text: 'Multiple speculative experiments, but none have transitioned into recurring production.', points: 1, order: 1 },
      { id: 'cu3_2', text: 'At least 2 to 3 successfully productionized use cases operating continuously.', points: 2, order: 2 },
      { id: 'cu3_3', text: 'A structured review process that systematically tests, validates, and rolls out pilots to production.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_use_4',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'USE_VALUE',
    order: 9,
    text: 'How are client or customer-facing touchpoints enhanced with AI?',
    options: [
      { id: 'cu4_0', text: 'Clients experience zero AI interaction; all touchpoints are purely manual.', points: 0, order: 0 },
      { id: 'cu4_1', text: 'Staff secretly use AI to draft client replies without company standardisation.', points: 1, order: 1 },
      { id: 'cu4_2', text: 'Sanctioned AI assistants assist staff in drafting proposals, support answers, or summaries.', points: 2, order: 2 },
      { id: 'cu4_3', text: 'Intelligent customer-facing self-service, personalized insights, or native product features.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_use_5',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'USE_VALUE',
    order: 10,
    text: 'How quickly does your organization adapt AI tools when new capabilities emerge?',
    options: [
      { id: 'cu5_0', text: 'Extremely slow or resistant; we ignore new model developments.', points: 0, order: 0 },
      { id: 'cu5_1', text: 'Curiosity exists, but evaluation takes months due to lack of a test sandbox.', points: 1, order: 1 },
      { id: 'cu5_2', text: 'We test major model releases within 2-4 weeks to determine operational relevance.', points: 2, order: 2 },
      { id: 'cu5_3', text: 'Agile architecture allows swapping or upgrading underlying models within days.', points: 3, order: 3 },
    ],
  },

  // --- Data and Technology (5 Questions) ---
  {
    id: 'comp_data_1',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'DATA_TECH',
    order: 11,
    text: 'How accessible, structured, and organized is your internal company data for AI systems?',
    options: [
      { id: 'cd1_0', text: 'Fragmented across personal laptops, locked PDFs, and chaotic email threads.', points: 0, order: 0 },
      { id: 'cd1_1', text: 'Central cloud storage exists, but files are unindexed, unorganized, and heavily duplicate.', points: 1, order: 1 },
      { id: 'cd1_2', text: 'Clean shared repositories (e.g. Notion, Google Drive, CRM) with searchable standards.', points: 2, order: 2 },
      { id: 'cd1_3', text: 'Unified company knowledge base with intelligent natural-language search and automated real-time syncing.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_data_2',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'DATA_TECH',
    order: 12,
    text: 'What tooling architecture is provided to staff for using AI capabilities?',
    options: [
      { id: 'cd2_0', text: 'No corporate tools provided; employees sign up for personal free accounts.', points: 0, order: 0 },
      { id: 'cd2_1', text: 'A few isolated paid consumer logins shared informally among team members.', points: 1, order: 1 },
      { id: 'cd2_2', text: 'Enterprise-tier AI licenses (e.g. ChatGPT Team/Enterprise, Copilot) with SSO and admin controls.', points: 2, order: 2 },
      { id: 'cd2_3', text: 'Custom internal AI portal/API hub connecting company data with enterprise LLM endpoints.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_data_3',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'DATA_TECH',
    order: 13,
    text: 'How is unsanctioned "Shadow AI" (employees pasting company data into unapproved tools) managed?',
    options: [
      { id: 'cd3_0', text: 'Completely unmonitored; leadership has no visibility into what tools staff use.', points: 0, order: 0 },
      { id: 'cd3_1', text: 'A blanket verbal policy telling people "don\'t use AI", which employees routinely bypass.', points: 1, order: 1 },
      { id: 'cd3_2', text: 'Clear roster of approved vs banned tools with network endpoint visibility.', points: 2, order: 2 },
      { id: 'cd3_3', text: 'Automated data leakage safeguards alongside approved, company-provided tools that satisfy employee needs.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_data_4',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'DATA_TECH',
    order: 14,
    text: 'How are your core software platforms (CRM, ERP, ticketing, code) integrated with AI APIs?',
    options: [
      { id: 'cd4_0', text: 'Completely disconnected; all AI usage requires manual copy-pasting back and forth.', points: 0, order: 0 },
      { id: 'cd4_1', text: 'Using default built-in AI widgets inside existing SaaS tools without coordination.', points: 1, order: 1 },
      { id: 'cd4_2', text: 'Custom webhooks or Zapier/Make automation connecting AI to key business workflows.', points: 2, order: 2 },
      { id: 'cd4_3', text: 'Bi-directional secure API architecture with automated state synchronization and audit logging.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_data_5',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'DATA_TECH',
    order: 15,
    text: 'What technical standards govern model evaluations and vendor software vetting?',
    options: [
      { id: 'cd5_0', text: 'No vetting; teams install browser extensions and apps without review.', points: 0, order: 0 },
      { id: 'cd5_1', text: 'Informal check on whether the vendor looks reputable.', points: 1, order: 1 },
      { id: 'cd5_2', text: 'Standard vendor security checklist including SOC2, data retention, and training data terms.', points: 2, order: 2 },
      { id: 'cd5_3', text: 'Rigorous vendor evaluation verifying accuracy, response speed, security compliance, and guarantees that vendor models do not retain or train on our data.', points: 3, order: 3 },
    ],
  },

  // --- Governance and Risk (5 Questions) ---
  {
    id: 'comp_gov_1',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'GOVERNANCE',
    order: 16,
    text: 'Does your company maintain a written AI Acceptable Use Policy?',
    options: [
      { id: 'cg1_0', text: 'No policy exists.', points: 0, order: 0 },
      { id: 'cg1_1', text: 'Informal bullet points shared in an email or Slack message.', points: 1, order: 1 },
      { id: 'cg1_2', text: 'Formal written AI policy signed or acknowledged by staff covering IP and confidentiality.', points: 2, order: 2 },
      { id: 'cg1_3', text: 'Living governance framework reviewed biannually with legal counsel, covering liability and ethical standards.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_gov_2',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'GOVERNANCE',
    order: 17,
    text: 'How does your company protect confidential customer data and trade secrets from LLM training?',
    options: [
      { id: 'cg2_0', text: 'Staff routinely input customer names, code, or finances into public AI tools.', points: 0, order: 0 },
      { id: 'cg2_1', text: 'Staff are verbally instructed to redact names, but compliance is unverified.', points: 1, order: 1 },
      { id: 'cg2_2', text: 'Zero-data-retention agreements and enterprise tenant privacy settings enforced.', points: 2, order: 2 },
      { id: 'cg2_3', text: 'Automated data redaction pipelines, strict mathematical privacy guarantees, and dedicated private enterprise environments.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_gov_3',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'GOVERNANCE',
    order: 18,
    text: 'What review protocol exists before AI-generated content or code is published or shipped?',
    options: [
      { id: 'cg3_0', text: 'AI outputs are used raw without mandatory human verification.', points: 0, order: 0 },
      { id: 'cg3_1', text: 'Staff are expected to glance over it, but errors frequently slip through.', points: 1, order: 1 },
      { id: 'cg3_2', text: 'Strict human-in-the-loop signoff required for any customer-facing or legal/financial output.', points: 2, order: 2 },
      { id: 'cg3_3', text: 'Documented multi-stage verification (automated hallucination checks + peer review signoff).', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_gov_4',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'GOVERNANCE',
    order: 19,
    text: 'How are intellectual property and copyright risks handled for AI outputs?',
    options: [
      { id: 'cg4_0', text: 'We have not considered copyright or IP ownership implications of AI outputs.', points: 0, order: 0 },
      { id: 'cg4_1', text: 'We avoid using AI for brand assets, but have no clear legal guidance.', points: 1, order: 1 },
      { id: 'cg4_2', text: 'Clear legal guidelines on patentability, copyright eligibility, and third-party infringement risks.', points: 2, order: 2 },
      { id: 'cg4_3', text: 'Enterprise indemnity coverage in place with vendor contractual warranties and IP audit logs.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_gov_5',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'GOVERNANCE',
    order: 20,
    text: 'What incident response plan is established if an AI tool makes an erroneous or biased decision?',
    options: [
      { id: 'cg5_0', text: 'No plan; we would handle it as a sudden emergency.', points: 0, order: 0 },
      { id: 'cg5_1', text: 'Treated like a general software bug with no specific AI escalation path.', points: 1, order: 1 },
      { id: 'cg5_2', text: 'Documented escalation protocol with designated lead to halt model and notify affected parties.', points: 2, order: 2 },
      { id: 'cg5_3', text: 'Comprehensive AI risk runbook with instant kill-switches, audit logs, and regulatory reporting procedures.', points: 3, order: 3 },
    ],
  },

  // --- People and Skills (5 Questions) ---
  {
    id: 'comp_peo_1',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'PEOPLE',
    order: 21,
    text: 'What structured AI education and training is provided to employees?',
    options: [
      { id: 'cp1_0', text: 'Zero training; employees are left to figure it out on their own.', points: 0, order: 0 },
      { id: 'cp1_1', text: 'One-off informal demo or sharing of YouTube links and external articles.', points: 1, order: 1 },
      { id: 'cp1_2', text: 'Role-specific onboarding modules and workshops covering prompt engineering and tools.', points: 2, order: 2 },
      { id: 'cp1_3', text: 'Continuous upskilling academy with practical certification and recurring masterclasses.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_peo_2',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'PEOPLE',
    order: 22,
    text: 'What is the general level of prompt engineering and model interaction proficiency across staff?',
    options: [
      { id: 'cp2_0', text: 'Most employees struggle to get useful results or believe AI is useless.', points: 0, order: 0 },
      { id: 'cp2_1', text: 'Basic conversational queries (asking simple questions like a search engine).', points: 1, order: 1 },
      { id: 'cp2_2', text: 'Advanced contextual prompting (few-shot examples, persona framing, system instructions).', points: 2, order: 2 },
      { id: 'cp2_3', text: 'Sophisticated prompt architectures, structured JSON outputs, chained prompts, and custom GPTs.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_peo_3',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'PEOPLE',
    order: 23,
    text: 'How widespread is active, productive AI adoption across non-technical departments?',
    options: [
      { id: 'cp3_0', text: 'Isolated strictly to 1 or 2 tech enthusiasts.', points: 0, order: 0 },
      { id: 'cp3_1', text: 'Used intermittently by less than 20% of knowledge workers.', points: 1, order: 1 },
      { id: 'cp3_2', text: 'Over 50% of knowledge workers incorporate AI weekly into regular tasks.', points: 2, order: 2 },
      { id: 'cp3_3', text: 'Near universal adoption (>80%) across sales, HR, finance, ops, and marketing with shared prompts.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_peo_4',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'PEOPLE',
    order: 24,
    text: 'How does company leadership address employee anxiety regarding AI job displacement?',
    options: [
      { id: 'cp4_0', text: 'The topic is ignored or met with unaddressed rumors and skepticism.', points: 0, order: 0 },
      { id: 'cp4_1', text: 'Generic assurances that "no one will be replaced" without concrete development plans.', points: 1, order: 1 },
      { id: 'cp4_2', text: 'Clear messaging framing AI as an amplifier of human capability, backed by training budgets.', points: 2, order: 2 },
      { id: 'cp4_3', text: 'Formal workforce transition pact: rewards for automation and guaranteed career path evolution.', points: 3, order: 3 },
    ],
  },
  {
    id: 'comp_peo_5',
    assessmentTypeId: 'COMPANY',
    dimensionId: 'PEOPLE',
    order: 25,
    text: 'How are internal AI successes and best-practice workflows shared across teams?',
    options: [
      { id: 'cp5_0', text: 'Not shared; each person keeps their discoveries to themselves.', points: 0, order: 0 },
      { id: 'cp5_1', text: 'Random mentions during casual watercooler conversations.', points: 1, order: 1 },
      { id: 'cp5_2', text: 'Dedicated Slack/Teams channel and monthly show-and-tell demo sessions.', points: 2, order: 2 },
      { id: 'cp5_3', text: 'Curated corporate prompt library and internal "AI Champions" guild coaching all departments.', points: 3, order: 3 },
    ],
  },
];

export const CLEVEL_DIMENSIONS = [
  { id: 'AI_FUNDAMENTALS', name: 'AI Fundamentals', weight: 0.16, domain: 'C-Level Competency', description: 'Core comprehension of LLM mechanics, probabilistic reasoning, context limits, and multimodal tech.', order: 1 },
  { id: 'STRATEGIC_OPP', name: 'Strategic Opportunity', weight: 0.18, domain: 'C-Level Competency', description: 'Identifying high-leverage business model innovations, market disruption, and competitive moat building.', order: 2 },
  { id: 'RISK_LEGAL', name: 'Risk & Legal Exposure', weight: 0.16, domain: 'C-Level Competency', description: 'Assessing compliance, contractual liability, copyright, hallucination exposure, and regulatory mandates.', order: 3 },
  { id: 'INVESTMENT_JUDGMENT', name: 'Investment Judgment', weight: 0.18, domain: 'C-Level Competency', description: 'Evaluating vendor build-vs-buy economics, token costs, productivity ROI, and capital payoff horizons.', order: 4 },
  { id: 'GOVERNANCE_ACCOUNTABILITY', name: 'Governance & Accountability', weight: 0.16, domain: 'C-Level Competency', description: 'Establishing oversight committees, data confidentiality guardrails, and audit trails.', order: 5 },
  { id: 'CHANGE_LEADERSHIP', name: 'Change Leadership', weight: 0.16, domain: 'C-Level Competency', description: 'Driving organizational cultural transformation, overcoming resistance, and inspiring talent.', order: 6 },
];

export const CLEVEL_QUESTIONS: SeedQuestion[] = [
  // --- Layer 1: Knowledge (Scenario Decision-Making) ---
  {
    id: 'clevel_k_1',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'AI_FUNDAMENTALS',
    layer: 'KNOWLEDGE',
    order: 1,
    roleFilter: 'ALL',
    scenarioContext: 'An enterprise sales director suggests using an AI model to draft binding contractual clauses and proposals automatically without legal review.',
    text: 'As an executive, how do you evaluate the technical risk and reliability of this proposal?',
    options: [
      { id: 'ck1_unaware', text: 'Assume AI models either know the law perfectly or will explicitly warn us if they are unsure.', mappedLevel: 'UNAWARE', order: 0 },
      { id: 'ck1_aware', text: 'Recognize that AI can hallucinate convincing citations, so human proofreading is advisable.', mappedLevel: 'AWARE', order: 1 },
      { id: 'ck1_practicing', text: 'Mandate Retrieval-Augmented Generation (RAG) against vetted clause libraries with mandatory legal signoff.', mappedLevel: 'PRACTICING', order: 2 },
      { id: 'ck1_proficient', text: 'Implement automated schema validation, confidence scoring thresholds, and strict human-in-the-loop signoff.', mappedLevel: 'PROFICIENT', order: 3 },
      { id: 'ck1_leading', text: 'Architect end-to-end continuous evaluation (evals) testing contract variations with automated regression alerts.', mappedLevel: 'LEADING', order: 4 },
    ],
  },
  {
    id: 'clevel_k_2',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'STRATEGIC_OPP',
    layer: 'KNOWLEDGE',
    order: 2,
    roleFilter: 'ALL',
    scenarioContext: 'Your main market competitor launches an AI-powered conversational feature that answers customer queries in real-time.',
    text: 'What is your executive strategic response to this development?',
    options: [
      { id: 'ck2_unaware', text: 'Dismiss it as a temporary marketing gimmick that will fade in relevance.', mappedLevel: 'UNAWARE', order: 0 },
      { id: 'ck2_aware', text: 'Acknowledge we should probably add an off-the-shelf chatbot to keep up appearances.', mappedLevel: 'AWARE', order: 1 },
      { id: 'ck2_practicing', text: 'Assess how AI can enhance our distinct proprietary data moat rather than cloning their generic widget.', mappedLevel: 'PRACTICING', order: 2 },
      { id: 'ck2_proficient', text: 'Redesign our end-to-end customer journey to combine predictive AI with high-touch human expertise.', mappedLevel: 'PROFICIENT', order: 3 },
      { id: 'ck2_leading', text: 'Create an entirely new recurring revenue stream by offering proactive autonomous workflows to our sector.', mappedLevel: 'LEADING', order: 4 },
    ],
  },
  {
    id: 'clevel_k_3',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'INVESTMENT_JUDGMENT',
    layer: 'KNOWLEDGE',
    order: 3,
    roleFilter: 'ALL',
    scenarioContext: 'Your technical leads request $120,000 to train a custom proprietary large language model from scratch on internal company records.',
    text: 'How do you analyze this capital expenditure proposal?',
    options: [
      { id: 'ck3_unaware', text: 'Approve or reject purely on instinct, unaware of the computing and dataset requirements.', mappedLevel: 'UNAWARE', order: 0 },
      { id: 'ck3_aware', text: 'Know that training models is expensive, but lack criteria to compare against existing commercial APIs.', mappedLevel: 'AWARE', order: 1 },
      { id: 'ck3_practicing', text: 'Challenge the team to pilot prompt engineering and fine-tuning or RAG on frontier models before considering pre-training.', mappedLevel: 'PRACTICING', order: 2 },
      { id: 'ck3_proficient', text: 'Conduct rigorous total-cost-of-ownership (TCO) analysis comparing API token pricing vs infrastructure hosting costs.', mappedLevel: 'PROFICIENT', order: 3 },
      { id: 'ck3_leading', text: 'Deploy a hybrid model routing architecture optimizing latency, precision, and unit economics across specialized open-weights.', mappedLevel: 'LEADING', order: 4 },
    ],
  },

  // Role-Specific Knowledge Blocks
  {
    id: 'clevel_k_cfo',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'INVESTMENT_JUDGMENT',
    layer: 'KNOWLEDGE',
    order: 4,
    roleFilter: 'CFO',
    scenarioContext: 'Assessing the unit economics, ongoing inference token consumption, and labor reallocation of an enterprise AI rollout.',
    text: 'How do you measure and structure AI financial returns and cost controls?',
    options: [
      { id: 'kcfo_unaware', text: 'Treat AI software licenses as a generic recurring IT overhead cost without tracking returns.', mappedLevel: 'UNAWARE', order: 0 },
      { id: 'kcfo_aware', text: 'Monitor software seat subscriptions and look for general team headcount reductions.', mappedLevel: 'AWARE', order: 1 },
      { id: 'kcfo_practicing', text: 'Calculate labor-hour savings per process and compare against monthly API and tooling expenses.', mappedLevel: 'PRACTICING', order: 2 },
      { id: 'kcfo_proficient', text: 'Model dynamic cost-per-transaction curves and establish strict unit economics for automated outputs.', mappedLevel: 'PROFICIENT', order: 3 },
      { id: 'kcfo_leading', text: 'Drive company operating leverage by reallocating saved operational capacity into revenue-generating product expansion.', mappedLevel: 'LEADING', order: 4 },
    ],
  },
  {
    id: 'clevel_k_cto',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'AI_FUNDAMENTALS',
    layer: 'KNOWLEDGE',
    order: 5,
    roleFilter: 'CTO',
    scenarioContext: 'Designing corporate engineering architecture, API security, and model integration across distributed applications.',
    text: 'What architecture do you establish for corporate AI infrastructure?',
    options: [
      { id: 'kcto_unaware', text: 'Permit direct curl requests to public third-party endpoints without central proxy or logging.', mappedLevel: 'UNAWARE', order: 0 },
      { id: 'kcto_aware', text: 'Set up a shared corporate API key for team developers to access OpenAI or Anthropic.', mappedLevel: 'AWARE', order: 1 },
      { id: 'kcto_practicing', text: 'Implement an internal gateway proxy enforcing rate limiting, credential isolation, and audit logging.', mappedLevel: 'PRACTICING', order: 2 },
      { id: 'kcto_proficient', text: 'Deploy a unified semantic layer with vector database indexing, token budget quotas, and failover redundancy.', mappedLevel: 'PROFICIENT', order: 3 },
      { id: 'kcto_leading', text: 'Build modular agentic orchestration with synthetic evals, distributed state management, and private VPC inference.', mappedLevel: 'LEADING', order: 4 },
    ],
  },
  {
    id: 'clevel_k_chro',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'CHANGE_LEADERSHIP',
    layer: 'KNOWLEDGE',
    order: 6,
    roleFilter: 'CHRO',
    scenarioContext: 'Handling employee anxiety, performance benchmarks, and organizational job redesign caused by rapid AI automation.',
    text: 'How do you manage workforce transitions and organizational capability as AI scales?',
    options: [
      { id: 'kchro_unaware', text: 'Assume AI is strictly a technical IT issue that does not impact human resources.', mappedLevel: 'UNAWARE', order: 0 },
      { id: 'kchro_aware', text: 'Send company-wide communications acknowledging AI and encouraging staff not to worry.', mappedLevel: 'AWARE', order: 1 },
      { id: 'kchro_practicing', text: 'Conduct talent skill-gap assessments and launch role-specific learning paths for prompt mastery.', mappedLevel: 'PRACTICING', order: 2 },
      { id: 'kchro_proficient', text: 'Redefine role descriptions, career progression ladders, and performance criteria around AI leverage.', mappedLevel: 'PROFICIENT', order: 3 },
      { id: 'kchro_leading', text: 'Champion human-AI hybrid organizational design with career security guarantees that turn employees into innovation leaders.', mappedLevel: 'LEADING', order: 4 },
    ],
  },

  // --- Layer 2: Awareness (Perception vs Reality) ---
  {
    id: 'clevel_a_1',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'DATA_TECH',
    layer: 'AWARENESS',
    order: 7,
    roleFilter: 'ALL',
    text: 'What percentage of knowledge workers in your company do you believe currently use AI tools (sanctioned or unsanctioned) weekly?',
    options: [
      { id: 'ca1_0', text: 'Under 10% — only a couple of tech enthusiasts.', points: 0, order: 0 },
      { id: 'ca1_1', text: 'Around 25% — mostly marketing or engineering.', points: 1, order: 1 },
      { id: 'ca1_2', text: 'Between 50% and 75% — widespread across multiple teams.', points: 2, order: 2 },
      { id: 'ca1_3', text: 'Over 85% — nearly everyone uses AI tools to assist their daily duties.', points: 3, order: 3 },
    ],
  },
  {
    id: 'clevel_a_2',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'GOVERNANCE',
    layer: 'AWARENESS',
    order: 8,
    roleFilter: 'ALL',
    text: 'How strictly do you believe company employees adhere to data confidentiality rules when prompting AI tools?',
    options: [
      { id: 'ca2_0', text: 'We have no confidentiality rules or nobody follows them.', points: 0, order: 0 },
      { id: 'ca2_1', text: 'Employees occasionally paste client data or code into public tools without thinking.', points: 1, order: 1 },
      { id: 'ca2_2', text: 'Most employees actively redact sensitive information before using tools.', points: 2, order: 2 },
      { id: 'ca2_3', text: 'Strict adherence backed by technical enterprise controls preventing any data leakage.', points: 3, order: 3 },
    ],
  },

  // --- Layer 3: Resistance (Concern Profiles) ---
  {
    id: 'clevel_r_1',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'RISK_LEGAL',
    layer: 'RESISTANCE',
    order: 9,
    roleFilter: 'ALL',
    scenarioContext: 'Evaluating the biggest organizational reservation when considering wider AI adoption across core departments.',
    text: 'When you contemplate expanding AI into vital operations, which scenario causes you the greatest hesitation?',
    options: [
      { id: 'cr1_risk', text: 'Legal, regulatory liability or copyright infringement resulting in reputational damage.', concernType: 'RISK_LIABILITY', order: 0 },
      { id: 'cr1_control', text: 'Losing operational command or opaque autonomous decisions going unnoticed until too late.', concernType: 'LOSS_OF_CONTROL', order: 1 },
      { id: 'cr1_return', text: 'Spending capital on subscriptions and consulting without achieving tangible bottom-line savings.', concernType: 'DOUBT_ABOUT_RETURN', order: 2 },
      { id: 'cr1_data', text: 'Exposure of customer records, proprietary trade secrets, or cyber vulnerability.', concernType: 'DATA_SECURITY', order: 3 },
    ],
  },
  {
    id: 'clevel_r_2',
    assessmentTypeId: 'CLEVEL',
    dimensionId: 'CHANGE_LEADERSHIP',
    layer: 'RESISTANCE',
    order: 10,
    roleFilter: 'ALL',
    scenarioContext: 'Reflecting on past major corporate software implementations and change management initiatives.',
    text: 'What internal friction or historical reality makes you cautious about mandating new AI workflows?',
    options: [
      { id: 'cr2_past', text: 'Past technology rollouts were painful, over budget, and produced employee frustration.', concernType: 'PAST_BAD_EXP', order: 0 },
      { id: 'cr2_time', text: 'Our leaders and staff are already overwhelmed with daily fires and lack time for new training.', concernType: 'LACK_OF_TIME', order: 1 },
      { id: 'cr2_job', text: 'Anxiety that automating core tasks will demoralize staff or damage company culture.', concernType: 'ROLE_JOB_IMPACT', order: 2 },
      { id: 'cr2_ethics', text: 'Moral and ethical questions regarding fairness, bias, and automated decision accountability.', concernType: 'ETHICS', order: 3 },
    ],
  },
];

export const THREE_SIXTY_QUESTIONS: SeedQuestion[] = [
  {
    id: 'ts_1',
    assessmentTypeId: 'THREE_SIXTY',
    dimensionId: 'USE_VALUE',
    order: 1,
    text: 'In your daily work, how frequently do you personally use AI tools (ChatGPT, Copilot, Claude, etc.)?',
    options: [
      { id: 'ts1_0', text: 'Never or tried once and stopped.', points: 0, order: 0 },
      { id: 'ts1_1', text: 'A few times a month for casual questions.', points: 1, order: 1 },
      { id: 'ts1_2', text: 'Multiple times a week to speed up tasks.', points: 2, order: 2 },
      { id: 'ts1_3', text: 'Daily as an essential part of my core workflow.', points: 3, order: 3 },
    ],
  },
  {
    id: 'ts_2',
    assessmentTypeId: 'THREE_SIXTY',
    dimensionId: 'PEOPLE',
    order: 2,
    text: 'Has your company provided you with formal training or guidelines on how to use AI safely and effectively?',
    options: [
      { id: 'ts2_0', text: 'None at all.', points: 0, order: 0 },
      { id: 'ts2_1', text: 'A brief email or mention in a meeting, but no practical training.', points: 1, order: 1 },
      { id: 'ts2_2', text: 'Structured guidance or workshops relevant to my job.', points: 2, order: 2 },
      { id: 'ts2_3', text: 'Ongoing hands-on coaching, prompt libraries, and clear support.', points: 3, order: 3 },
    ],
  },
  {
    id: 'ts_3',
    assessmentTypeId: 'THREE_SIXTY',
    dimensionId: 'STRATEGY',
    order: 3,
    text: 'How clear is leadership vision on how AI will shape your company future?',
    options: [
      { id: 'ts3_0', text: 'Completely unclear; leadership never talks about it.', points: 0, order: 0 },
      { id: 'ts3_1', text: 'Vague buzzwords, but no real direction or plan.', points: 1, order: 1 },
      { id: 'ts3_2', text: 'Reasonably clear goals communicated for key departments.', points: 2, order: 2 },
      { id: 'ts3_3', text: 'Inspiring, transparent roadmap with clear support for teams.', points: 3, order: 3 },
    ],
  },
  {
    id: 'ts_4',
    assessmentTypeId: 'THREE_SIXTY',
    dimensionId: 'GOVERNANCE',
    order: 4,
    text: 'Do you know which AI tools are approved by the company and what data you are allowed to enter into them?',
    options: [
      { id: 'ts4_0', text: 'I have no idea what the rules are.', points: 0, order: 0 },
      { id: 'ts4_1', text: 'I assume common sense applies, but there is no written list.', points: 1, order: 1 },
      { id: 'ts4_2', text: 'Yes, we have a clear approved list and data confidentiality rules.', points: 2, order: 2 },
      { id: 'ts4_3', text: 'Yes, and we use secure company-licensed accounts that protect data.', points: 3, order: 3 },
    ],
  },
  {
    id: 'ts_5',
    assessmentTypeId: 'THREE_SIXTY',
    dimensionId: 'PEOPLE',
    order: 5,
    text: 'How do you personally feel about AI adoption in your team?',
    options: [
      { id: 'ts5_0', text: 'Worried or skeptical about its impact on my job security and work quality.', points: 0, order: 0 },
      { id: 'ts5_1', text: 'Neutral / indifferent; waiting to see what happens.', points: 1, order: 1 },
      { id: 'ts5_2', text: 'Positive; excited to automate tedious work and learn new skills.', points: 2, order: 2 },
      { id: 'ts5_3', text: 'Highly enthusiastic champion helping my teammates leverage AI.', points: 3, order: 3 },
    ],
  },
];

