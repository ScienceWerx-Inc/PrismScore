import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { companyAccess, handleAuthError } from '@/lib/auth/server';
import { ownedSubmission } from '@/lib/auth/submissions';

export async function POST(request: Request) {
  try {
    const { companyId } = await companyAccess(null, { roles: ['ADMIN'] });
    const { submissionId, questionId, optionId } = await request.json();

    if (!submissionId || !questionId || !optionId) {
      return NextResponse.json({ error: 'Missing required response parameters.' }, { status: 400 });
    }

    const submission = await ownedSubmission(submissionId, companyId, 'COMPANY');
    if (submission.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'This assessment has already been submitted.' }, { status: 409 });
    }

    // The option must belong to the question, and the question to the company assessment.
    const option = await prisma.option.findFirst({
      where: { id: optionId, questionId, question: { assessmentTypeId: 'COMPANY' } },
      select: { id: true },
    });
    if (!option) {
      return NextResponse.json({ error: 'Unknown question or answer.' }, { status: 400 });
    }

    await prisma.response.upsert({
      where: { submissionId_questionId: { submissionId: submission.id, questionId } },
      update: { optionId },
      create: { submissionId: submission.id, questionId, optionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error, 'Save response error');
  }
}
