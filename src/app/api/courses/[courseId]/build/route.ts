import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { buildStep } from '@/lib/courses/service';

export const dynamic = 'force-dynamic';
// One model call per request; a long lesson can take a minute.
export const maxDuration = 120;

export async function POST(_request: Request, { params }: { params: { courseId: string } }) {
  try {
    const user = await requireUser();
    return NextResponse.json(await buildStep(params.courseId, user));
  } catch (error) {
    // A failed model call is logged and reported; the browser's next call retries it.
    return handleAuthError(error, 'Course build step error');
  }
}
