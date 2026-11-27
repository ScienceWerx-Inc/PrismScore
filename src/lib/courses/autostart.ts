import 'server-only';
import { waitUntil } from '@vercel/functions';
import type { User } from '@/lib/auth/server';
import { buildInBackground, startCourse, type CourseKind } from './service';

/**
 * Starts the learner's course right after their assessment and keeps writing it
 * after the response is sent, so it is (nearly) ready when they open /learn.
 * Never throws: the assessment result must not depend on the course.
 */
export async function autostartCourse(user: User, kind: CourseKind): Promise<string | null> {
  try {
    const course = await startCourse(user, kind);
    if (course.status === 'OUTLINING' || course.status === 'WRITING') {
      waitUntil(buildInBackground(course.id, user));
    }
    return course.id;
  } catch (error) {
    console.error('Course autostart failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
