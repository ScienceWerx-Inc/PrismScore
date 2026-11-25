import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { startCourse, type CourseKind } from '@/lib/courses/service';
import { coursesForLearner } from '@/lib/courses/view';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await coursesForLearner(user));
  } catch (error) {
    return handleAuthError(error, 'Course list error');
  }
}

/** POST { kind: 'COMPANY' | 'EXECUTIVE' } starts (or returns) the learner's course. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { kind } = await request.json().catch(() => ({}));
    const k: CourseKind = kind === 'COMPANY' ? 'COMPANY' : 'EXECUTIVE';
    const course = await startCourse(user, k);
    return NextResponse.json({ courseId: course.id, status: course.status });
  } catch (error) {
    return handleAuthError(error, 'Course start error');
  }
}
