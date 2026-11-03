import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
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

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let parsedResult = null;
    if (submission.result) {
      parsedResult = {
        totalScore: submission.result.totalScore,
        band: submission.result.band,
        perDimensionPercentages: JSON.parse(submission.result.perDimensionPercentages),
        strengths: JSON.parse(submission.result.strengths),
        gaps: JSON.parse(submission.result.gaps),
        priorityActions: JSON.parse(submission.result.priorityActions),
      };
    }

    return NextResponse.json({
      submission,
      result: parsedResult,
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

