import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { submissionId, questionId, optionId } = await request.json();

    if (!submissionId || !questionId || !optionId) {
      return NextResponse.json(
        { error: 'Missing required response parameters.' },
        { status: 400 }
      );
    }

    // Upsert response
    const response = await prisma.response.upsert({
      where: {
        submissionId_questionId: {
          submissionId,
          questionId,
        },
      },
      update: {
        optionId,
      },
      create: {
        submissionId,
        questionId,
        optionId,
      },
    });

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Error saving response:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

