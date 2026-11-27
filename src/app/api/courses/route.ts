import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { type CourseKind } from '@/lib/courses/service';
import { autostartCourse } from '@/lib/courses/autostart';
import { startCourse } from '@/lib/courses/service';
import { coursesForLearner } from '@/lib/courses/view';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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
    // startCourse surfaces "complete your assessment first"; autostart then keeps building after the response.
    const course = await startCourse(user, k);
    await autostartCourse(user, k);
    return NextResponse.json({ courseId: course.id, status: course.status });
  } catch (error) {
    return handleAuthError(error, 'Course start error');
  }
}
