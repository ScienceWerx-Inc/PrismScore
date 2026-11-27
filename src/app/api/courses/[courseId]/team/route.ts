import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { removeFromCourse, shareCourse, teamForCourse } from '@/lib/courses/team';

export const dynamic = 'force-dynamic';

type Params = { params: { courseId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const admin = await requireUser(['ADMIN']);
    return NextResponse.json(await teamForCourse(admin, params.courseId));
  } catch (error) {
    return handleAuthError(error, 'Course team load error');
  }
}

/** POST { emails?: string[], everyone?: true } shares the company course. */
export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireUser(['ADMIN']);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(await shareCourse(admin, params.courseId, body, new URL(request.url).origin));
  } catch (error) {
    return handleAuthError(error, 'Course share error');
  }
}

/** DELETE { userId } removes one learner from the shared course. */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const admin = await requireUser(['ADMIN']);
    const { userId } = await request.json().catch(() => ({}));
    return NextResponse.json(await removeFromCourse(admin, params.courseId, userId));
  } catch (error) {
    return handleAuthError(error, 'Course team remove error');
  }
}
