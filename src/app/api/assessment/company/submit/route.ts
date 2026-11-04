import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateCompanyScore, DimensionKey } from '@/lib/scoring';
import { COMPANY_QUESTIONS } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, companyId, companyName, answers = {} } = body;

    const effectiveSubId = submissionId || `sub_${Date.now()}`;

    // 1. Calculate score directly and deterministically from answers using the question bank
    const rawPoints: Record<DimensionKey, number> = {
      STRATEGY: 0,
      USE_VALUE: 0,
      DATA_TECH: 0,
      GOVERNANCE: 0,
      PEOPLE: 0,
    };

    const builtResponses: Array<{
      id: string;
      questionId: string;
      optionId: string;
      question: { id: string; text: string; dimensionId: string };
      option: { id: string; text: string; points: number };
    }> = [];

    for (const q of COMPANY_QUESTIONS) {
      const selectedOptId = answers[q.id];
      if (selectedOptId) {
        const opt = q.options.find((o) => o.id === selectedOptId);
        if (opt) {
          const dimKey = q.dimensionId as DimensionKey;
          if (rawPoints[dimKey] !== undefined) {
            rawPoints[dimKey] += opt.points ?? 0;
          }
          builtResponses.push({
            id: `resp_${q.id}`,
            questionId: q.id,
            optionId: opt.id,
            question: { id: q.id, text: q.text, dimensionId: q.dimensionId },
            option: { id: opt.id, text: opt.text, points: opt.points ?? 0 },
          });
        }
      }
    }

    const scoringResult = calculateCompanyScore(rawPoints);

    // 2. Persist in database (with graceful fallback if container DB is fresh)
    let companyRecord = null;
    let userRecord = null;
    let submissionRecord = null;

    try {
      if (companyId) {
        companyRecord = await prisma.company.findUnique({ where: { id: companyId } });
      }
      if (!companyRecord) {
        companyRecord = await prisma.company.findFirst({ orderBy: { createdAt: 'desc' } });
      }
      if (!companyRecord) {
        companyRecord = await prisma.company.create({
          data: {
            id: companyId || undefined,
            name: companyName || 'Company',
            industry: 'Software & Technology',
            sizeBand: '11-50 employees',
            country: 'United States',
          },
        });
      }

      userRecord = await prisma.user.findFirst({
        where: { companyId: companyRecord.id },
      });
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            email: `leader_${Date.now()}@prismscore.example`,
            name: 'Company Leader',
            role: 'ADMIN',
            companyId: companyRecord.id,
          },
        });
      }

      // Upsert submission
      submissionRecord = await prisma.submission.upsert({
        where: { id: effectiveSubId },
        update: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        create: {
          id: effectiveSubId,
          userId: userRecord.id,
          companyId: companyRecord.id,
          assessmentTypeId: 'COMPANY',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Save responses
      for (const resp of builtResponses) {
        try {
          await prisma.response.upsert({
            where: {
              submissionId_questionId: {
                submissionId: submissionRecord.id,
                questionId: resp.questionId,
              },
            },
            update: { optionId: resp.optionId },
            create: {
              submissionId: submissionRecord.id,
              questionId: resp.questionId,
              optionId: resp.optionId,
            },
          });
        } catch {}
      }

      // Upsert result
      await prisma.result.upsert({
        where: { submissionId: submissionRecord.id },
        update: {
          totalScore: scoringResult.totalScore,
          band: scoringResult.band,
          perDimensionPercentages: JSON.stringify(scoringResult.dimensionPercentages),
          strengths: JSON.stringify(scoringResult.strengths),
          gaps: JSON.stringify(scoringResult.criticalGaps),
          priorityActions: JSON.stringify(scoringResult.priorityActions),
        },
        create: {
          submissionId: submissionRecord.id,
          totalScore: scoringResult.totalScore,
          band: scoringResult.band,
          perDimensionPercentages: JSON.stringify(scoringResult.dimensionPercentages),
          strengths: JSON.stringify(scoringResult.strengths),
          gaps: JSON.stringify(scoringResult.criticalGaps),
          priorityActions: JSON.stringify(scoringResult.priorityActions),
        },
      });
    } catch (dbErr) {
      console.warn('Database persistence warning in submit (non-fatal):', dbErr);
    }

    const finalCompany = companyRecord || {
      id: companyId || 'company_default',
      name: companyName || 'Company',
      industry: 'Software & Technology',
      sizeBand: '11-50 employees',
      country: 'United States',
      planStatus: 'FREE',
    };

    const finalSubmission = {
      id: effectiveSubId,
      companyId: finalCompany.id,
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      company: finalCompany,
      responses: builtResponses,
    };

    return NextResponse.json({
      success: true,
      submissionId: effectiveSubId,
      scoringResult,
      submission: finalSubmission,
      company: finalCompany,
    });
  } catch (error: any) {
    console.error('Submit fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Submission failed' },
      { status: 500 }
    );
  }
}
