import 'server-only';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { AuthError, type User } from '@/lib/auth/server';
import { learnerCourse } from './service';
import { gradeAttempt, QUIZ_POLICY, certificateExpiry, type QuizKeyItem } from './rules';

/**
 * Learner progress on a READY course: lessons the learner marks done, graded
 * module quizzes, and the certificate issued once every lesson is done and every
 * quiz is passed. Rules (pass mark, attempts, validity) live in rules.ts.
 */

async function readyLesson(user: User, courseId: string, lessonId: string) {
  const course = await learnerCourse(courseId, user);
  if (course.status !== 'READY') throw new AuthError(404, 'This course is still being written.');
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.courseId !== course.id) throw new AuthError(404, 'Lesson not found.');
  return { course, lesson };
}

export async function completeLesson(user: User, courseId: string, lessonId: string) {
  const { course, lesson } = await readyLesson(user, courseId, lessonId);
  if (lesson.kind !== 'LESSON') throw new AuthError(404, 'Quizzes are completed by passing them.');
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId },
  });
  return { certificate: await maybeIssueCertificate(user, course.id) };
}

/** Quiz questions without their answer keys, plus this learner's attempts so far. */
export async function quizForLearner(user: User, courseId: string, lessonId: string) {
  const { lesson } = await readyLesson(user, courseId, lessonId);
  if (lesson.kind !== 'QUIZ') throw new AuthError(404, 'Quiz not found.');
  const [questions, attempts] = await Promise.all([
    prisma.quizQuestion.findMany({ where: { lessonId }, orderBy: { order: 'asc' } }),
    prisma.quizAttempt.findMany({ where: { userId: user.id, lessonId }, orderBy: { createdAt: 'asc' } }),
  ]);
  const passed = attempts.some((a) => a.passed);
  const over = passed || attempts.length >= QUIZ_POLICY.maxAttempts;
  return {
    lesson: { id: lesson.id, title: lesson.title },
    policy: QUIZ_POLICY,
    attempts: attempts.map((a) => ({ percent: a.percent, passed: a.passed, createdAt: a.createdAt })),
    passed,
    attemptsLeft: Math.max(0, QUIZ_POLICY.maxAttempts - attempts.length),
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options,
      points: q.points,
      // Answers and explanations only once the quiz is over for this learner.
      ...(over ? { correctOptionIds: q.correctOptionIds, explanation: q.explanation } : {}),
    })),
  };
}

export async function submitQuiz(user: User, courseId: string, lessonId: string, answers: Record<string, string[]>) {
  const { course, lesson } = await readyLesson(user, courseId, lessonId);
  if (lesson.kind !== 'QUIZ') throw new AuthError(404, 'Quiz not found.');

  const [questions, previous] = await Promise.all([
    prisma.quizQuestion.findMany({ where: { lessonId }, orderBy: { order: 'asc' } }),
    prisma.quizAttempt.findMany({ where: { userId: user.id, lessonId } }),
  ]);
  if (previous.some((a) => a.passed)) throw new AuthError(403, 'You have already passed this quiz.');
  if (previous.length >= QUIZ_POLICY.maxAttempts) throw new AuthError(403, 'No attempts left on this quiz.');

  const key: QuizKeyItem[] = questions.map((q) => ({
    id: q.id,
    points: q.points,
    correctOptionIds: q.correctOptionIds as string[],
  }));
  const graded = gradeAttempt(key, answers);

  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      lessonId,
      answers,
      score: graded.score,
      maxScore: graded.maxScore,
      percent: graded.percent,
      passed: graded.passed,
    },
  });
  if (graded.passed) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {},
      create: { userId: user.id, lessonId },
    });
  }

  const over = graded.passed || previous.length + 1 >= QUIZ_POLICY.maxAttempts;
  return {
    percent: graded.percent,
    passed: graded.passed,
    attemptsLeft: Math.max(0, QUIZ_POLICY.maxAttempts - previous.length - 1),
    // Per-question feedback only when the quiz is over, so attempts can't be used to map the key.
    feedback: over
      ? questions.map((q) => ({
          id: q.id,
          correct: graded.correctIds.includes(q.id),
          correctOptionIds: q.correctOptionIds,
          explanation: q.explanation,
        }))
      : null,
    certificate: graded.passed ? await maybeIssueCertificate(user, course.id) : null,
  };
}

/** Issues the course certificate once everything is complete. Idempotent. */
export async function maybeIssueCertificate(user: User, courseId: string) {
  const existing = await prisma.certificate.findUnique({ where: { courseId_userId: { courseId, userId: user.id } } });
  if (existing) return existing.code;

  const lessons = await prisma.lesson.findMany({ where: { courseId }, select: { id: true, kind: true } });
  const done = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: lessons.map((l) => l.id) } },
    select: { lessonId: true },
  });
  if (lessons.length === 0 || done.length < lessons.length) return null;

  const quizIds = lessons.filter((l) => l.kind === 'QUIZ').map((l) => l.id);
  const attempts = await prisma.quizAttempt.findMany({ where: { userId: user.id, lessonId: { in: quizIds } } });
  const best = quizIds.map((id) => Math.max(0, ...attempts.filter((a) => a.lessonId === id).map((a) => a.percent)));
  const grade = best.length ? Math.round(best.reduce((s, p) => s + p, 0) / best.length) : 100;

  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId }, include: { company: true } });
  try {
    const cert = await prisma.certificate.create({
      data: {
        code: newCertificateCode(),
        courseId,
        userId: user.id,
        learnerName: user.name,
        courseTitle: course.title ?? 'PrismScore course',
        companyName: course.company.name,
        grade,
      },
    });
    return cert.code;
  } catch {
    // Issued concurrently by a parallel request.
    const cert = await prisma.certificate.findUnique({ where: { courseId_userId: { courseId, userId: user.id } } });
    return cert?.code ?? null;
  }
}

/** PS- plus 10 uppercase hex characters (40 random bits). */
export function newCertificateCode(): string {
  return `PS-${randomBytes(5).toString('hex').toUpperCase()}`;
}

/** Public certificate lookup for /verify. Only what the certificate itself prints. */
export async function verifyCertificate(code: string) {
  if (!/^PS-[0-9A-F]{10}$/.test(code)) return null;
  const cert = await prisma.certificate.findUnique({ where: { code } });
  if (!cert) return null;
  const expiresAt = certificateExpiry(cert.issuedAt);
  return {
    code: cert.code,
    learnerName: cert.learnerName,
    courseTitle: cert.courseTitle,
    companyName: cert.companyName,
    grade: cert.grade,
    issuedAt: cert.issuedAt,
    expiresAt,
    status: cert.revokedAt ? 'REVOKED' : expiresAt < new Date() ? 'EXPIRED' : 'VALID',
  } as const;
}

/**
 * Questions the learner got wrong, for review. Only quizzes that are over for
 * them (passed, or out of attempts) are included, so this never reveals an
 * answer key that is still in play. Uses each quiz's best attempt.
 */
export async function reviewFor(user: User, courseId: string) {
  const course = await learnerCourse(courseId, user);
  const quizzes = await prisma.lesson.findMany({
    where: { courseId: course.id, kind: 'QUIZ' },
    orderBy: { order: 'asc' },
    include: { module: { select: { title: true } }, questions: { orderBy: { order: 'asc' } } },
  });
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id, lessonId: { in: quizzes.map((q) => q.id) } },
    orderBy: { createdAt: 'asc' },
  });

  const sections = [];
  let pending = 0;
  for (const quiz of quizzes) {
    const mine = attempts.filter((a) => a.lessonId === quiz.id);
    const over = mine.some((a) => a.passed) || mine.length >= QUIZ_POLICY.maxAttempts;
    if (!over) {
      if (mine.length) pending += 1;
      continue;
    }
    // Best attempt; the latest one wins a tie.
    const best = mine.reduce((b, a) => (a.percent >= b.percent ? a : b));
    const answers = (best.answers ?? {}) as Record<string, string[]>;
    const missed = quiz.questions
      .map((q) => {
        const right = q.correctOptionIds as string[];
        const chosen = Array.isArray(answers[q.id]) ? answers[q.id] : [];
        const correct = chosen.length === right.length && right.every((id) => chosen.includes(id));
        return correct
          ? null
          : {
              id: q.id,
              stem: q.stem,
              options: q.options as { id: string; label: string }[],
              chosen,
              correctOptionIds: right,
              explanation: q.explanation,
            };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    sections.push({ quizId: quiz.id, moduleTitle: quiz.module.title, bestPercent: best.percent, missed });
  }
  return { courseTitle: course.title, sections, pendingQuizzes: pending };
}
