export type DimensionKey =
  | 'STRATEGY'
  | 'USE_VALUE'
  | 'DATA_TECH'
  | 'GOVERNANCE'
  | 'PEOPLE';

export interface DimensionWeight {
  key: DimensionKey;
  name: string;
  weight: number; // e.g. 0.25
  maxPoints: number; // typically 5 questions * 3 = 15
}

export const DIMENSIONS: Record<DimensionKey, DimensionWeight> = {
  STRATEGY: {
    key: 'STRATEGY',
    name: 'Strategy and Leadership',
    weight: 0.25,
    maxPoints: 15,
  },
  USE_VALUE: {
    key: 'USE_VALUE',
    name: 'Use and Value',
    weight: 0.20,
    maxPoints: 15,
  },
  DATA_TECH: {
    key: 'DATA_TECH',
    name: 'Data and Technology',
    weight: 0.20,
    maxPoints: 15,
  },
  GOVERNANCE: {
    key: 'GOVERNANCE',
    name: 'Governance and Risk',
    weight: 0.20,
    maxPoints: 15,
  },
  PEOPLE: {
    key: 'PEOPLE',
    name: 'People and Skills',
    weight: 0.15,
    maxPoints: 15,
  },
};

export type ReadinessBand = 'Unaware' | 'Exploring' | 'Established' | 'AI-led';

export interface ScoringResult {
  totalScore: number; // 0 to 500
  band: ReadinessBand;
  dimensionPercentages: Record<DimensionKey, number>; // 0 to 100
  dimensionRawPoints: Record<DimensionKey, number>;
  strengths: string[];
  criticalGaps: string[];
  priorityActions: Array<{
    dimension: string;
    action: string;
    whyItMatters: string;
    nextStep: string;
    scoreImpact: string;
  }>;
}

export function calculateReadinessBand(score: number): ReadinessBand {
  if (score <= 200) return 'Unaware';
  if (score <= 300) return 'Exploring';
  if (score <= 400) return 'Established';
  return 'AI-led';
}

/**
 * Calculates Company Assessment score based on the specification formula:
 * Score = 5 * (Strategy * 0.25 + Use * 0.20 + Data * 0.20 + Governance * 0.20 + People * 0.15)
 * Where each dimension is on a 0 to 100 percentage scale.
 */
export function calculateCompanyScore(
  rawPoints: Record<DimensionKey, number>
): ScoringResult {
  const dimensionPercentages: Record<DimensionKey, number> = {
    STRATEGY: 0,
    USE_VALUE: 0,
    DATA_TECH: 0,
    GOVERNANCE: 0,
    PEOPLE: 0,
  };

  let weightedSum = 0;

  for (const key of Object.keys(DIMENSIONS) as DimensionKey[]) {
    const dim = DIMENSIONS[key];
    const earned = Math.max(0, Math.min(dim.maxPoints, rawPoints[key] || 0));
    const pct = Math.round((earned / dim.maxPoints) * 100 * 10) / 10;
    dimensionPercentages[key] = pct;
    weightedSum += pct * dim.weight;
  }

  // Score = 5 * weightedSum
  const totalScore = Math.round(5 * weightedSum * 10) / 10;
  const band = calculateReadinessBand(totalScore);

  // Derive strengths, gaps, and priority actions
  const strengths: string[] = [];
  const criticalGaps: string[] = [];
  const priorityActions: ScoringResult['priorityActions'] = [];

  for (const key of Object.keys(DIMENSIONS) as DimensionKey[]) {
    const dim = DIMENSIONS[key];
    const pct = dimensionPercentages[key];

    if (pct >= 70) {
      strengths.push(`${dim.name} (${pct}%): Strong baseline and operational foundation.`);
    } else if (pct <= 40) {
      criticalGaps.push(`${dim.name} (${pct}%): Underdeveloped practices expose the organization to inefficiency and blind spots.`);
    }

    // Add actionable recommendation based on threshold
    if (pct < 60) {
      if (key === 'STRATEGY') {
        priorityActions.push({
          dimension: dim.name,
          action: 'Establish formal AI steering and executive ownership',
          whyItMatters: 'Without executive alignment, AI experiments stall in fragmented silos without ROI.',
          nextStep: 'Convene a half-day executive workshop to define high-impact AI use cases and appoint a sponsor.',
          scoreImpact: '+25 to +40 points',
        });
      } else if (key === 'USE_VALUE') {
        priorityActions.push({
          dimension: dim.name,
          action: 'Transition from ad-hoc prompting to tracked workflow pilots',
          whyItMatters: 'Unmeasured AI usage fails to deliver predictable commercial value.',
          nextStep: 'Benchmark 2 core business workflows and measure time-saved / quality metrics over 30 days.',
          scoreImpact: '+20 to +35 points',
        });
      } else if (key === 'DATA_TECH') {
        priorityActions.push({
          dimension: dim.name,
          action: 'Unify internal data access and address shadow AI tools',
          whyItMatters: 'Fragmented data prevents contextual AI models and creates proprietary leak hazards.',
          nextStep: 'Audit active AI tools in use and centralize access through vetted enterprise gateways.',
          scoreImpact: '+20 to +35 points',
        });
      } else if (key === 'GOVERNANCE') {
        priorityActions.push({
          dimension: dim.name,
          action: 'Publish an internal AI usage & data handling policy',
          whyItMatters: 'Protects the company from copyright, confidentiality breaches, and regulatory liabilities.',
          nextStep: 'Deploy a clear 1-page acceptable use policy and establish a vendor security vetting checklist.',
          scoreImpact: '+20 to +30 points',
        });
      } else if (key === 'PEOPLE') {
        priorityActions.push({
          dimension: dim.name,
          action: 'Launch role-based AI literacy and workflow training',
          whyItMatters: 'Tools alone do not create value; employee confidence and skill drive sustained productivity.',
          nextStep: 'Roll out practical prompt engineering and automation playbooks tailored to departments.',
          scoreImpact: '+15 to +25 points',
        });
      }
    }
  }

  if (priorityActions.length === 0) {
    priorityActions.push({
      dimension: 'Strategy and Leadership',
      action: 'Scale autonomous agent workflows and frontier capability pilots',
      whyItMatters: 'You have mastered core AI literacy; the next frontier is autonomous system integration.',
      nextStep: 'Pilot multi-agent orchestration for complex multi-step cross-functional processes.',
      scoreImpact: '+10 to +20 points',
    });
  }

  return {
    totalScore,
    band,
    dimensionPercentages,
    dimensionRawPoints: { ...rawPoints },
    strengths,
    criticalGaps,
    priorityActions,
  };
}

// Competency Levels for C-Level & 360
export type CompetencyLevel = 'UNAWARE' | 'AWARE' | 'PRACTICING' | 'PROFICIENT' | 'LEADING';

export const LEVEL_NUMERICS: Record<CompetencyLevel, number> = {
  UNAWARE: 1,
  AWARE: 2,
  PRACTICING: 3,
  PROFICIENT: 4,
  LEADING: 5,
};

export const DEFAULT_TARGET_LEVELS_BY_ROLE: Record<string, Record<string, CompetencyLevel>> = {
  CEO: {
    'AI Fundamentals': 'PRACTICING',
    'Strategic Opportunity': 'LEADING',
    'Risk & Legal Exposure': 'PROFICIENT',
    'Investment Judgment': 'LEADING',
    'Governance & Accountability': 'PROFICIENT',
    'Change Leadership': 'LEADING',
  },
  CTO: {
    'AI Fundamentals': 'LEADING',
    'Strategic Opportunity': 'PROFICIENT',
    'Risk & Legal Exposure': 'LEADING',
    'Investment Judgment': 'PROFICIENT',
    'Governance & Accountability': 'LEADING',
    'Change Leadership': 'PROFICIENT',
  },
  CFO: {
    'AI Fundamentals': 'AWARE',
    'Strategic Opportunity': 'PROFICIENT',
    'Risk & Legal Exposure': 'PROFICIENT',
    'Investment Judgment': 'LEADING',
    'Governance & Accountability': 'PROFICIENT',
    'Change Leadership': 'PRACTICING',
  },
  COO: {
    'AI Fundamentals': 'PRACTICING',
    'Strategic Opportunity': 'PROFICIENT',
    'Risk & Legal Exposure': 'PRACTICING',
    'Investment Judgment': 'PROFICIENT',
    'Governance & Accountability': 'PRACTICING',
    'Change Leadership': 'LEADING',
  },
  CHRO: {
    'AI Fundamentals': 'AWARE',
    'Strategic Opportunity': 'PRACTICING',
    'Risk & Legal Exposure': 'PROFICIENT',
    'Investment Judgment': 'PRACTICING',
    'Governance & Accountability': 'PROFICIENT',
    'Change Leadership': 'LEADING',
  },
  CMO: {
    'AI Fundamentals': 'PRACTICING',
    'Strategic Opportunity': 'LEADING',
    'Risk & Legal Exposure': 'PRACTICING',
    'Investment Judgment': 'PROFICIENT',
    'Governance & Accountability': 'AWARE',
    'Change Leadership': 'PROFICIENT',
  },
  OTHER: {
    'AI Fundamentals': 'PRACTICING',
    'Strategic Opportunity': 'PRACTICING',
    'Risk & Legal Exposure': 'PRACTICING',
    'Investment Judgment': 'PRACTICING',
    'Governance & Accountability': 'PRACTICING',
    'Change Leadership': 'PRACTICING',
  },
};

export interface GapCalculation {
  competency: string;
  currentLevel: CompetencyLevel;
  targetLevel: CompetencyLevel;
  gap: number; // target - current (positive means deficiency)
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function computeExecutiveGap(
  competency: string,
  currentLevel: CompetencyLevel,
  targetLevel: CompetencyLevel
): GapCalculation {
  const currentNum = LEVEL_NUMERICS[currentLevel];
  const targetNum = LEVEL_NUMERICS[targetLevel];
  const gap = Math.max(0, targetNum - currentNum);

  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (gap >= 2) priority = 'HIGH';
  else if (gap === 1) priority = 'MEDIUM';

  return {
    competency,
    currentLevel,
    targetLevel,
    gap,
    priority,
  };
}

export const CONCERN_TYPES = {
  RISK_LIABILITY: 'Risk & Liability',
  LOSS_OF_CONTROL: 'Loss of Control',
  DOUBT_ABOUT_RETURN: 'Doubt About Return (ROI)',
  ROLE_JOB_IMPACT: 'Role & Job Impact',
  DATA_SECURITY: 'Data & Security',
  ETHICS: 'Ethics & Trust',
  LACK_OF_TIME: 'Lack of Time / Bandwidth',
  PAST_BAD_EXP: 'Past Bad Experience with Tech',
} as const;

export type ConcernKey = keyof typeof CONCERN_TYPES;

export const CONCERN_INTERVENTIONS: Record<ConcernKey, { title: string; description: string }> = {
  RISK_LIABILITY: {
    title: 'Legal & Risk Guardrails Workshop',
    description: 'Facilitated session with external counsel or compliance specialists to establish safe boundaries.',
  },
  LOSS_OF_CONTROL: {
    title: 'Human-in-the-Loop Workflow Governance',
    description: 'Establish explicit approval gates and override controls so leaders retain complete supervisory command.',
  },
  DOUBT_ABOUT_RETURN: {
    title: 'Rapid ROI Proof-of-Value Pilot',
    description: 'A focused 3-week pilot with defined commercial KPIs and pre/post efficiency metrics.',
  },
  ROLE_JOB_IMPACT: {
    title: 'Workforce Augmentation & Upskilling Briefing',
    description: 'Demonstrate how AI elevates executive and team capacity rather than displacing specialized talent.',
  },
  DATA_SECURITY: {
    title: 'Enterprise Architecture & Zero-Retention Audit',
    description: 'Technical walkthrough of private tenant hosting, data isolation, and vendor vetting procedures.',
  },
  ETHICS: {
    title: 'Responsible AI & Transparency Charter',
    description: 'Collaborative development of corporate ethical AI principles and bias monitoring.',
  },
  LACK_OF_TIME: {
    title: 'Micro-learning & Turnkey Automation',
    description: 'Bite-sized 10-minute async briefings and ready-to-run automation templates requiring zero setup.',
  },
  PAST_BAD_EXP: {
    title: 'Peer Case Studies & Failure De-risking',
    description: 'Review proven case studies of peer companies in the same industry with post-mortem lessons applied.',
  },
};

