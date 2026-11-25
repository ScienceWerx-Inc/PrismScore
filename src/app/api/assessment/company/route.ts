import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { companyAccess, handleAuthError } from '@/lib/auth/server';
import { ownedSubmission } from '@/lib/auth/submissions';

export const dynamic = 'force-dynamic';

/**
 * Questions plus the signed-in admin's saved answers. Without ?submissionId=
 * it resumes the company's open assessment, or opens a new one.
 */
export async function GET(request: Request) {
  try {
    const { companyId, user } = await companyAccess(null, { roles: ['ADMIN'] });
    const requested = new URL(request.url).searchParams.get('submissionId');

    const base = requested
      ? await ownedSubmission(requested, companyId, 'COMPANY')
      : (await prisma.submission.findFirst({
          where: { companyId, assessmentTypeId: 'COMPANY', status: 'IN_PROGRESS' },
          orderBy: { startedAt: 'desc' },
        })) ??
        (await prisma.submission.create({
          data: { userId: user!.id, companyId, assessmentTypeId: 'COMPANY', status: 'IN_PROGRESS' },
        }));

    const [dimensions, questions, submission] = await Promise.all([
      prisma.dimension.findMany({ where: { assessmentTypeId: 'COMPANY' }, orderBy: { order: 'asc' } }),
      prisma.question.findMany({
        where: { assessmentTypeId: 'COMPANY' },
        orderBy: { order: 'asc' },
        // Point values stay on the server; the wizard only needs the option text.
        include: { options: { orderBy: { order: 'asc' }, select: { id: true, questionId: true, text: true, order: true } } },
      }),
      prisma.submission.findUnique({
        where: { id: base.id },
        include: { responses: true, company: { select: { id: true, name: true } } },
      }),
    ]);

    const existingResponses: Record<string, string> = {};
    for (const resp of submission?.responses ?? []) existingResponses[resp.questionId] = resp.optionId;

    return NextResponse.json({
      dimensions,
      questions,
      existingResponses,
      submission: submission && {
        id: submission.id,
        status: submission.status,
        company: submission.company,
      },
    });
  } catch (error) {
    return handleAuthError(error, 'Company assessment load error');
  }
}
