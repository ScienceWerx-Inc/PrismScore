import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { reviewFor } from '@/lib/courses/progress';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { courseId: string } }) {
  try {
    const user = await requireUser();
    return NextResponse.json(await reviewFor(user, params.courseId));
  } catch (error) {
    return handleAuthError(error, 'Course review error');
  }
}
