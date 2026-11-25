import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AuthError, companyAccess, handleAuthError } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;

    // The report's company must be the caller's own; anonymous visitors may
    // only open the public sample report of the demo company.
    const owner = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { companyId: true, assessmentTypeId: true },
    });
    if (!owner || owner.assessmentTypeId !== 'COMPANY') {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }
    try {
      await companyAccess(owner.companyId, { allowDemo: true, roles: ['ADMIN'] });
    } catch (e) {
      // Do not reveal that another company's report exists.
      if (e instanceof AuthError && e.status === 403) {
        return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
      }
      throw e;
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        company: { select: { id: true, name: true, industry: true, sizeBand: true, country: true, planStatus: true } },
        user: { select: { name: true, execRoleTitle: true } },
        result: true,
        responses: { include: { question: true, option: true } },
      },
    });

    if (!submission || !submission.result) {
      return NextResponse.json({ error: 'This assessment has not been submitted yet.' }, { status: 404 });
    }

    const isPaid = (submission.company?.planStatus || 'FREE').toUpperCase() === 'PAID';

    const sortedResponses = (submission.responses || []).slice().sort((a: any, b: any) => {
      const orderA = a.question?.order ?? 999;
      const orderB = b.question?.order ?? 999;
      return orderA - orderB;
    });

    const parsedPercentages: Record<string, number> = typeof submission.result.perDimensionPercentages === 'string'
      ? JSON.parse(submission.result.perDimensionPercentages)
      : (submission.result.perDimensionPercentages || {});

    // Derive 3-tier analysis directly from percentages for complete consistency
    const dimNames: Record<string, string> = {
      STRATEGY: 'Strategy and Leadership',
      USE_VALUE: 'Use and Value',
      DATA_TECH: 'Data and Technology',
      GOVERNANCE: 'Governance and Risk',
      PEOPLE: 'People and Skills',
    };

    const derivedStrengths: string[] = [];
    const derivedModerateGaps: string[] = [];
    const derivedCriticalGaps: string[] = [];

    for (const [dimKey, pct] of Object.entries(parsedPercentages)) {
      const name = dimNames[dimKey] || dimKey;
      const numPct = typeof pct === 'number' ? pct : parseFloat(pct as any) || 0;
      if (numPct >= 70) {
        derivedStrengths.push(`${name} (${numPct}%): Strong operational baseline and established practices.`);
      } else if (numPct <= 40) {
        derivedCriticalGaps.push(`${name} (${numPct}%): Underdeveloped practices expose the organization to significant operational risk.`);
      } else {
        derivedModerateGaps.push(`${name} (${numPct}%): Developing baseline requiring targeted operational refinement.`);
      }
    }

    const parsedActions = typeof submission.result.priorityActions === 'string'
      ? JSON.parse(submission.result.priorityActions)
      : (submission.result.priorityActions || []);

    // Server-side paywall gating: free tier receives score, band, dimensional bars & preview; full deliverables require PAID status
    const gatedResult = isPaid
      ? {
          totalScore: submission.result.totalScore,
          band: submission.result.band,
          perDimensionPercentages: parsedPercentages,
          strengths: derivedStrengths,
          moderateGaps: derivedModerateGaps,
          criticalGaps: derivedCriticalGaps,
          gaps: [...derivedCriticalGaps, ...derivedModerateGaps],
          priorityActions: parsedActions,
        }
      : {
          totalScore: submission.result.totalScore,
          band: submission.result.band,
          perDimensionPercentages: parsedPercentages,
          strengths: derivedStrengths, // Surface all qualified strengths (never silently cap)
          moderateGaps: derivedModerateGaps,
          criticalGaps: derivedCriticalGaps,
          gaps: [...derivedCriticalGaps, ...derivedModerateGaps],
          priorityActions: parsedActions.slice(0, 1).map((act: any) => ({
            ...act,
            nextStep: 'Complete step-by-step roadmap available in paid executive report.',
          })),
        };

    return NextResponse.json({
      submission: {
        ...submission,
        responses: isPaid ? sortedResponses : sortedResponses.slice(0, 3),
      },
      result: gatedResult,
    });
  } catch (error) {
    return handleAuthError(error, 'Report load error');
  }
}
