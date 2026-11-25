import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { courseView } from '@/lib/courses/view';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { courseId: string } }) {
  try {
    const user = await requireUser();
    return NextResponse.json(await courseView(user, params.courseId));
  } catch (error) {
    return handleAuthError(error, 'Course view error');
  }
}
