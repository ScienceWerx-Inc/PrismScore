import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    // 1. Fetch Company Assessment Type and Questions
    const dimensions = await prisma.dimension.findMany({
      where: { assessmentTypeId: 'COMPANY' },
      orderBy: { order: 'asc' },
    });

    const questions = await prisma.question.findMany({
      where: { assessmentTypeId: 'COMPANY' },
      orderBy: { order: 'asc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // 2. Fetch existing responses if submissionId is provided
    let existingResponses: Record<string, string> = {};
    let submission = null;

    if (submissionId) {
      submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          responses: true,
          company: true,
          user: true,
        },
      });

      if (submission) {
        for (const resp of submission.responses) {
          existingResponses[resp.questionId] = resp.optionId;
        }
      }
    }

    return NextResponse.json({
      dimensions,
      questions,
      existingResponses,
      submission,
    });
  } catch (error: any) {
    console.error('Error fetching company assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

