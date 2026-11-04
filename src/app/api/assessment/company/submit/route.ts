import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateCompanyScore, DimensionKey } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, companyId, companyName, answers = {} } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required.' }, { status: 400 });
    }

    // 1. Fetch submission if it exists in the current container DB
    let submission = await prisma.submission.findUnique({
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

    // 2. If not found in this serverless container, reconstruct or locate company
    if (!submission) {
      let targetCompany = null;
      if (companyId) {
        targetCompany = await prisma.company.findUnique({ where: { id: companyId } });
      }
      if (!targetCompany) {
        targetCompany = await prisma.company.findFirst({
          orderBy: { createdAt: 'desc' },
        });
      }
      if (!targetCompany) {
        targetCompany = await prisma.company.create({
          data: {
            name: companyName || 'Company',
            industry: 'Software & Technology',
            sizeBand: '11-50 employees',
            country: 'United States',
          },
        });
      }

      let user = await prisma.user.findFirst({
        where: { companyId: targetCompany.id },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: `initiator_${Date.now()}@prismscore.example`,
            name: 'Company Initiator',
            role: 'ADMIN',
            companyId: targetCompany.id,
          },
        });
      }

      submission = await prisma.submission.create({
        data: {
          id: submissionId,
          userId: user.id,
          companyId: targetCompany.id,
          assessmentTypeId: 'COMPANY',
          status: 'IN_PROGRESS',
        },
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
    }

    // 3. Save any answers passed directly from the client payload
    const answerEntries = Object.entries(answers);
    if (answerEntries.length > 0) {
      for (const [qId, optId] of answerEntries) {
        try {
          await prisma.response.upsert({
            where: {
              submissionId_questionId: {
                submissionId: submission.id,
                questionId: qId,
              },
            },
            update: {
              optionId: optId as string,
            },
            create: {
              submissionId: submission.id,
              questionId: qId,
              optionId: optId as string,
            },
          });
        } catch (saveErr) {
          console.warn('Upsert response fallback error:', saveErr);
        }
      }
    }

    // 4. Fetch all responses with question and option points
    const responses = await prisma.response.findMany({
      where: { submissionId: submission.id },
      include: {
        question: true,
        option: true,
      },
    });

    // 5. Aggregate points by dimension
    const rawPoints: Record<DimensionKey, number> = {
      STRATEGY: 0,
      USE_VALUE: 0,
      DATA_TECH: 0,
      GOVERNANCE: 0,
      PEOPLE: 0,
    };

    for (const resp of responses) {
      const dimKey = resp.question.dimensionId as DimensionKey;
      if (rawPoints[dimKey] !== undefined && resp.option) {
        rawPoints[dimKey] += resp.option.points;
      }
    }

    // If responses was empty in DB, compute directly from answers payload
    if (responses.length === 0 && answerEntries.length > 0) {
      const optionIds = Object.values(answers) as string[];
      const opts = await prisma.option.findMany({
        where: { id: { in: optionIds } },
        include: { question: true },
      });
      for (const opt of opts) {
        const dimKey = opt.question.dimensionId as DimensionKey;
        if (rawPoints[dimKey] !== undefined) {
          rawPoints[dimKey] += opt.points;
        }
      }
    }

    // 6. Compute score using published formula
    const scoringResult = calculateCompanyScore(rawPoints);

    // 7. Save Result
    const result = await prisma.result.upsert({
      where: { submissionId: submission.id },
      update: {
        totalScore: scoringResult.totalScore,
        band: scoringResult.band,
        perDimensionPercentages: JSON.stringify(scoringResult.dimensionPercentages),
        strengths: JSON.stringify(scoringResult.strengths),
        gaps: JSON.stringify(scoringResult.criticalGaps),
        priorityActions: JSON.stringify(scoringResult.priorityActions),
      },
      create: {
        submissionId: submission.id,
        totalScore: scoringResult.totalScore,
        band: scoringResult.band,
        perDimensionPercentages: JSON.stringify(scoringResult.dimensionPercentages),
        strengths: JSON.stringify(scoringResult.strengths),
        gaps: JSON.stringify(scoringResult.criticalGaps),
        priorityActions: JSON.stringify(scoringResult.priorityActions),
      },
    });

    // 8. Update submission status to COMPLETED
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        company: true,
        user: true,
        result: true,
        responses: {
          include: {
            question: true,
            option: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      resultId: result.id,
      submissionId: submission.id,
      scoringResult,
      submission: updatedSubmission,
      company: updatedSubmission.company,
    });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json({ error: error.message || 'Submission failed' }, { status: 500 });
  }
}
