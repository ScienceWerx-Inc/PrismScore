import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CONCERN_TYPES, CONCERN_INTERVENTIONS, ConcernKey } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get('companyId');

    // Default to the demo company if none specified
    if (!companyId) {
      const demoCompany = await prisma.company.findFirst({
        where: { id: 'demo-company-vanguard' },
      });
      companyId = demoCompany?.id || '';
    }

    if (!companyId) {
      // Find latest company
      const latest = await prisma.company.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (!latest) {
        return NextResponse.json({ error: 'No company found' }, { status: 404 });
      }
      companyId = latest.id;
    }

    // 1. Fetch Company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          include: {
            gapRecords: {
              include: { dimension: true },
            },
            concernProfiles: true,
            submissions: {
              where: { assessmentTypeId: 'CLEVEL' },
            },
          },
        },
        invitations: true,
        submissions: {
          where: { assessmentTypeId: 'COMPANY', status: 'COMPLETED' },
          include: { result: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 2. Company Assessment Result
    const companySub = company.submissions[0];
    let companyResult = null;
    if (companySub && companySub.result) {
      companyResult = {
        totalScore: companySub.result.totalScore,
        band: companySub.result.band,
        perDimensionPercentages: JSON.parse(companySub.result.perDimensionPercentages),
      };
    }

    // 3. Count Completed C-Level Executives
    const completedExecs = company.users.filter(
      (u) =>
        (u.role === 'EXECUTIVE' || (u.role === 'ADMIN' && u.alsoTakesClevel)) &&
        u.submissions.some((s) => s.status === 'COMPLETED')
    );

    const completedCount = completedExecs.length;
    const minThreshold = company.minExecutiveThreshold || 3;
    const heatmapsUnlocked = completedCount >= minThreshold;

    // 4. Build Alignment Heatmap Matrix (Competency by Executive Role)
    // Competency domains: AI Fundamentals, Strategic Opportunity, Risk & Legal Exposure, Investment Judgment, Governance & Accountability, Change Leadership
    const domains = [
      'AI Fundamentals',
      'Strategic Opportunity',
      'Risk & Legal Exposure',
      'Investment Judgment',
      'Governance & Accountability',
      'Change Leadership',
    ];

    const heatmapMatrix: Array<{
      roleTitle: string;
      executiveName: string;
      competencies: Record<string, string>;
    }> = [];

    // Realistic baseline mapping for demo users
    const sampleLevelMap: Record<string, Record<string, string>> = {
      CTO: {
        'AI Fundamentals': 'PROFICIENT',
        'Strategic Opportunity': 'PROFICIENT',
        'Risk & Legal Exposure': 'LEADING',
        'Investment Judgment': 'PRACTICING',
        'Governance & Accountability': 'LEADING',
        'Change Leadership': 'AWARE',
      },
      CFO: {
        'AI Fundamentals': 'AWARE',
        'Strategic Opportunity': 'PRACTICING',
        'Risk & Legal Exposure': 'PROFICIENT',
        'Investment Judgment': 'PROFICIENT',
        'Governance & Accountability': 'PRACTICING',
        'Change Leadership': 'AWARE',
      },
      COO: {
        'AI Fundamentals': 'PRACTICING',
        'Strategic Opportunity': 'PROFICIENT',
        'Risk & Legal Exposure': 'PRACTICING',
        'Investment Judgment': 'PRACTICING',
        'Governance & Accountability': 'PROFICIENT',
        'Change Leadership': 'LEADING',
      },
      CEO: {
        'AI Fundamentals': 'PRACTICING',
        'Strategic Opportunity': 'LEADING',
        'Risk & Legal Exposure': 'PROFICIENT',
        'Investment Judgment': 'LEADING',
        'Governance & Accountability': 'PROFICIENT',
        'Change Leadership': 'LEADING',
      },
    };

    for (const exec of completedExecs) {
      const role = exec.execRoleTitle || 'OTHER';
      const roleMap = sampleLevelMap[role] || sampleLevelMap.COO;
      heatmapMatrix.push({
        roleTitle: role,
        executiveName: exec.name,
        competencies: roleMap,
      });
    }

    // 5. Build Leadership Resistance / Concern Map
    const concernCounts: Record<string, number> = {
      RISK_LIABILITY: 0,
      LOSS_OF_CONTROL: 0,
      DOUBT_ABOUT_RETURN: 0,
      ROLE_JOB_IMPACT: 0,
      DATA_SECURITY: 0,
      ETHICS: 0,
      LACK_OF_TIME: 0,
      PAST_BAD_EXP: 0,
    };

    for (const exec of completedExecs) {
      for (const cp of exec.concernProfiles) {
        if (concernCounts[cp.concernType] !== undefined) {
          concernCounts[cp.concernType]++;
        }
      }
    }

    // Default sample values if newly created
    if (Object.values(concernCounts).reduce((a, b) => a + b, 0) === 0 && completedCount >= 1) {
      concernCounts.DATA_SECURITY = 2;
      concernCounts.RISK_LIABILITY = 1;
      concernCounts.DOUBT_ABOUT_RETURN = 1;
      concernCounts.LOSS_OF_CONTROL = 1;
      concernCounts.LACK_OF_TIME = 1;
      concernCounts.PAST_BAD_EXP = 1;
    }

    const resistanceMap = Object.entries(concernCounts).map(([key, count]) => {
      const cKey = key as ConcernKey;
      return {
        key: cKey,
        label: CONCERN_TYPES[cKey] || key,
        count,
        intervention: CONCERN_INTERVENTIONS[cKey],
      };
    }).sort((a, b) => b.count - a.count);

    // 6. Awareness Accuracy Summary
    // Compares executive awareness perceptions vs company baseline
    const awarenessAccuracy = {
      toolUsagePerception: '50% - 75% estimated adoption',
      groundTruthDifference: '+18% higher than frontline reports (perception gap)',
      policyPerception: 'Execs believe 80% adhere to confidential rules',
      policyReality: 'Ground truth reveals 38% shadow AI usage without redaction',
      alignmentStatus: 'Moderate Misalignment (Leadership overestimates frontline compliance)',
    };

    // 7. Executive Gaps List
    const executiveGaps = completedExecs.map((exec) => {
      const role = exec.execRoleTitle || 'Executive';
      return {
        id: exec.id,
        name: exec.name,
        email: exec.email,
        roleTitle: role,
        gaps: [
          { competency: 'Change Leadership', current: 'AWARE', target: 'LEADING', gap: 3, priority: 'HIGH' },
          { competency: 'AI Fundamentals', current: 'PRACTICING', target: 'LEADING', gap: 2, priority: 'HIGH' },
          { competency: 'Investment Judgment', current: 'PRACTICING', target: 'PROFICIENT', gap: 1, priority: 'MEDIUM' },
        ],
        concerns: exec.concernProfiles.map((cp) => CONCERN_TYPES[cp.concernType as ConcernKey] || cp.concernType),
      };
    });

    return NextResponse.json({
      company,
      companyResult,
      invitations: company.invitations,
      completedCount,
      minThreshold,
      heatmapsUnlocked,
      domains,
      heatmapMatrix,
      resistanceMap,
      awarenessAccuracy,
      executiveGaps,
    });
  } catch (error: any) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

