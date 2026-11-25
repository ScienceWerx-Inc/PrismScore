import 'server-only';
import { prisma } from '@/lib/db';
import type { User } from '@/lib/auth/server';
import { courseSource, ownedCourse } from './service';
import { certificateExpiry, QUIZ_POLICY } from './rules';

/** The learner's course list, plus which courses they could start. */
export async function coursesForLearner(user: User) {
  const [courses, company, clevel] = await Promise.all([
    prisma.course.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { lessons: { select: { id: true, status: true } }, certificates: { where: { userId: user.id } } },
    }),
    courseSource(user, 'COMPANY'),
    courseSource(user, 'EXECUTIVE'),
  ]);
  const done = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lesson: { courseId: { in: courses.map((c) => c.id) } } },
    select: { lessonId: true },
  });
  const doneSet = new Set(done.map((d) => d.lessonId));
  const has = (sourceId?: string) => Boolean(sourceId && courses.some((c) => c.sourceSubmissionId === sourceId));

  return {
    courses: courses.map((c) => ({
      id: c.id,
      kind: c.kind,
      status: c.status,
      title: c.title,
      subtitle: c.subtitle,
      lessons: c.lessons.length,
      written: c.lessons.filter((l) => l.status === 'DONE').length,
      completed: c.lessons.filter((l) => doneSet.has(l.id)).length,
      certificateCode: c.certificates[0]?.code ?? null,
      createdAt: c.createdAt,
    })),
    canStart: {
      COMPANY: Boolean(company) && !has(company?.id),
      EXECUTIVE: Boolean(clevel) && !has(clevel?.id),
    },
  };
}

/** One course: outline, build state and this learner's progress. */
export async function courseView(user: User, courseId: string) {
  const course = await ownedCourse(courseId, user);
  const [modules, progress, attempts, certificate] = await Promise.all([
    prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, kind: true, title: true, durationMin: true, isWorkshop: true, status: true },
        },
      },
    }),
    prisma.lessonProgress.findMany({ where: { userId: user.id, lesson: { courseId } }, select: { lessonId: true } }),
    prisma.quizAttempt.findMany({ where: { userId: user.id, lesson: { courseId } }, select: { lessonId: true, percent: true, passed: true } }),
    prisma.certificate.findUnique({ where: { courseId_userId: { courseId, userId: user.id } } }),
  ]);
  const done = new Set(progress.map((p) => p.lessonId));
  const total = modules.reduce((s, m) => s + m.lessons.length, 0);

  return {
    id: course.id,
    kind: course.kind,
    status: course.status,
    error: course.status === 'ERROR' ? course.error : null,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    percent: total ? Math.round((done.size / total) * 100) : 0,
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => {
        const mine = attempts.filter((a) => a.lessonId === l.id);
        return {
          ...l,
          completed: done.has(l.id),
          ...(l.kind === 'QUIZ'
            ? {
                bestPercent: mine.length ? Math.max(...mine.map((a) => a.percent)) : null,
                attemptsLeft: Math.max(0, QUIZ_POLICY.maxAttempts - mine.length),
              }
            : {}),
        };
      }),
    })),
    certificate: certificate && {
      code: certificate.code,
      issuedAt: certificate.issuedAt,
      expiresAt: certificateExpiry(certificate.issuedAt),
      grade: certificate.grade,
      revoked: Boolean(certificate.revokedAt),
    },
  };
}

/** A written lesson's content for its learner. */
export async function lessonView(user: User, courseId: string, lessonId: string) {
  const course = await ownedCourse(courseId, user);
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson || lesson.courseId !== course.id || lesson.status !== 'DONE') return null;
  const [siblings, progress] = await Promise.all([
    prisma.lesson.findMany({ where: { courseId }, orderBy: { order: 'asc' }, select: { id: true, title: true, kind: true } }),
    prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } }),
  ]);
  const i = siblings.findIndex((s) => s.id === lessonId);
  return {
    id: lesson.id,
    kind: lesson.kind,
    title: lesson.title,
    moduleTitle: lesson.module.title,
    durationMin: lesson.durationMin,
    isWorkshop: lesson.isWorkshop,
    content: lesson.kind === 'LESSON' ? lesson.content : null,
    completed: Boolean(progress),
    courseReady: course.status === 'READY',
    prev: siblings[i - 1] ?? null,
    next: siblings[i + 1] ?? null,
  };
}
