import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateCompanyScore, DimensionKey } from '@/lib/scoring';

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required.' }, { status: 400 });
    }

    // 1. Fetch submission with all responses and question details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        company: true,
        user: true,
        responses: {
          include: {
            question: true,
            option: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    // 2. Aggregate points by dimension
    const rawPoints: Record<DimensionKey, number> = {
      STRATEGY: 0,
      USE_VALUE: 0,
      DATA_TECH: 0,
      GOVERNANCE: 0,
      PEOPLE: 0,
    };

    for (const resp of submission.responses) {
      const dimKey = resp.question.dimensionId as DimensionKey;
      if (rawPoints[dimKey] !== undefined) {
        rawPoints[dimKey] += resp.option.points;
      }
    }

    // 3. Compute score using published formula
    const scoringResult = calculateCompanyScore(rawPoints);

    // 4. Save or update Result
    const result = await prisma.result.upsert({
      where: { submissionId },
      update: {
        totalScore: scoringResult.totalScore,
        band: scoringResult.band,
        perDimensionPercentages: JSON.stringify(scoringResult.dimensionPercentages),
        strengths: JSON.stringify(scoringResult.strengths),
        gaps: JSON.stringify(scoringResult.criticalGaps),
        priorityActions: JSON.stringify(scoringResult.priorityActions),
      },
      create: {
        submissionId,
        totalScore: scoringResult.totalScore,
        band: scoringResult.band,
        perDimensionPercentages: JSON.stringify(scoringResult.dimensionPercentages),
        strengths: JSON.stringify(scoringResult.strengths),
        gaps: JSON.stringify(scoringResult.criticalGaps),
        priorityActions: JSON.stringify(scoringResult.priorityActions),
      },
    });

    // 5. Update submission status to COMPLETED
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actor: submission.user.name,
        action: 'COMPANY_ASSESSMENT_COMPLETED',
        entity: `Submission:${submissionId}`,
        details: `Score: ${scoringResult.totalScore}/500, Band: ${scoringResult.band}`,
      },
    });

    return NextResponse.json({
      success: true,
      resultId: result.id,
      submissionId,
      scoringResult,
    });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

