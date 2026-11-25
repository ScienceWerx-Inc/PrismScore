import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { lessonView } from '@/lib/courses/view';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { courseId: string; lessonId: string } }) {
  try {
    const user = await requireUser();
    const lesson = await lessonView(user, params.courseId, params.lessonId);
    if (!lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    return NextResponse.json(lesson);
  } catch (error) {
    return handleAuthError(error, 'Lesson view error');
  }
}
