import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { quizForLearner, submitQuiz } from '@/lib/courses/progress';

export const dynamic = 'force-dynamic';

type Params = { params: { courseId: string; lessonId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    return NextResponse.json(await quizForLearner(user, params.courseId, params.lessonId));
  } catch (error) {
    return handleAuthError(error, 'Quiz load error');
  }
}

/** POST { answers: { questionId: optionId[] } } grades one attempt. */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { answers } = await request.json().catch(() => ({}));
    const clean: Record<string, string[]> = {};
    if (answers && typeof answers === 'object') {
      for (const [qid, v] of Object.entries(answers)) {
        if (Array.isArray(v)) clean[qid] = v.filter((x): x is string => typeof x === 'string').slice(0, 10);
      }
    }
    return NextResponse.json(await submitQuiz(user, params.courseId, params.lessonId, clean));
  } catch (error) {
    return handleAuthError(error, 'Quiz submit error');
  }
}
