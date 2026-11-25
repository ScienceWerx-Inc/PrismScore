import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateCompanyScore, DimensionKey } from '@/lib/scoring';
import { COMPANY_QUESTIONS } from '@/lib/seed-data';
import { companyAccess, handleAuthError } from '@/lib/auth/server';
import { ownedSubmission } from '@/lib/auth/submissions';

export const dynamic = 'force-dynamic';

/**
 * Completes the signed-in admin's company assessment. The score is always
 * computed here from the server's question bank; the browser only names the
 * options it picked.
 */
export async function POST(request: Request) {
  try {
    const { companyId, user } = await companyAccess(null, { roles: ['ADMIN'] });
    const { submissionId, answers = {} } = await request.json();

    const submission = await ownedSubmission(submissionId, companyId, 'COMPANY');
    if (submission.status === 'COMPLETED') {
      return NextResponse.json({ success: true, submissionId: submission.id, alreadySubmitted: true });
    }

    // Answers saved one by one during the wizard, overridden by what was sent now.
    const saved = await prisma.response.findMany({ where: { submissionId: submission.id } });
    const picked: Record<string, string> = Object.fromEntries(saved.map((r) => [r.questionId, r.optionId]));
    if (answers && typeof answers === 'object') {
      for (const [qid, oid] of Object.entries(answers)) if (typeof oid === 'string') picked[qid] = oid;
    }

    const rawPoints: Record<DimensionKey, number> = { STRATEGY: 0, USE_VALUE: 0, DATA_TECH: 0, GOVERNANCE: 0, PEOPLE: 0 };
    const valid: Array<{ questionId: string; optionId: string }> = [];
    for (const q of COMPANY_QUESTIONS) {
      const opt = q.options.find((o) => o.id === picked[q.id]);
      if (!opt) continue;
      const dim = q.dimensionId as DimensionKey;
      if (rawPoints[dim] !== undefined) rawPoints[dim] += opt.points ?? 0;
      valid.push({ questionId: q.id, optionId: opt.id });
    }

    const scoring = calculateCompanyScore(rawPoints);
    const resultData = {
      totalScore: scoring.totalScore,
      band: scoring.band,
      perDimensionPercentages: JSON.stringify(scoring.dimensionPercentages),
      strengths: JSON.stringify(scoring.strengths),
      gaps: JSON.stringify(scoring.criticalGaps),
      priorityActions: JSON.stringify(scoring.priorityActions),
    };

    await prisma.$transaction([
      ...valid.map((r) =>
        prisma.response.upsert({
          where: { submissionId_questionId: { submissionId: submission.id, questionId: r.questionId } },
          update: { optionId: r.optionId },
          create: { submissionId: submission.id, ...r },
        }),
      ),
      prisma.result.upsert({
        where: { submissionId: submission.id },
        update: resultData,
        create: { submissionId: submission.id, ...resultData },
      }),
      prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          actor: user!.email,
          action: 'COMPANY_ASSESSMENT_COMPLETED',
          entity: `Submission:${submission.id}`,
          details: `Score ${scoring.totalScore} (${scoring.band})`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, submissionId: submission.id, scoringResult: scoring });
  } catch (error) {
    return handleAuthError(error, 'Company assessment submit error');
  }
}
