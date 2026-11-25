import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { completeLesson } from '@/lib/courses/progress';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { courseId: string; lessonId: string } }) {
  try {
    const user = await requireUser();
    return NextResponse.json({ success: true, ...(await completeLesson(user, params.courseId, params.lessonId)) });
  } catch (error) {
    return handleAuthError(error, 'Lesson complete error');
  }
}
