import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { CONCERN_TYPES, type ConcernKey } from '@/lib/scoring';
import { AuthError, type User } from '@/lib/auth/server';
import { generateLesson, generateModuleQuiz, generateOutline, type LessonContent } from './ai';
import { planForCompany, planForExecutive, type Answers, type GapPlan } from './plan';

/**
 * Building a course, one model call per request. The browser drives it
 * (CourseBuilder calls POST /api/courses/:id/build until it reports `ready`),
 * so no single serverless invocation runs long. Every step is claimed with a
 * conditional update, so parallel or repeated calls never write a lesson twice,
 * and a step whose worker died is retried once its lease is stale.
 */

const LEASE_MS = 150_000;
const MAX_ATTEMPTS = 3;

export type CourseKind = 'COMPANY' | 'EXECUTIVE';

/** The assessment a learner's course of the given kind is built from, if they have one. */
export async function courseSource(user: User, kind: CourseKind) {
  if (kind === 'COMPANY') {
    if (user.role !== 'ADMIN') return null;
    return prisma.submission.findFirst({
      where: { companyId: user.companyId, assessmentTypeId: 'COMPANY', status: 'COMPLETED', result: { isNot: null } },
      orderBy: { completedAt: 'desc' },
      include: { responses: true, result: true },
    });
  }
  return prisma.submission.findFirst({
    where: { userId: user.id, assessmentTypeId: 'CLEVEL', status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: { responses: true, result: true },
  });
}

async function planFor(user: User, kind: CourseKind, source: NonNullable<Awaited<ReturnType<typeof courseSource>>>): Promise<GapPlan> {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: user.companyId } });
  const profile = { name: company.name, industry: company.industry, sizeBand: company.sizeBand, country: company.country };
  const answers: Answers = Object.fromEntries(source.responses.map((r) => [r.questionId, r.optionId]));
  const learner = { name: user.name, role: user.execRoleTitle || (kind === 'COMPANY' ? 'CEO' : 'OTHER') };

  if (kind === 'COMPANY') {
    return planForCompany({
      company: profile,
      learner,
      totalScore: source.result?.totalScore ?? 0,
      band: source.result?.band ?? '',
      answers,
    });
  }
  const concerns = await prisma.concernProfile.findMany({ where: { userId: user.id } });
  return planForExecutive({
    company: profile,
    learner,
    answers,
    concerns: Array.from(new Set(concerns.map((c) => CONCERN_TYPES[c.concernType as ConcernKey] ?? c.concernType))),
  });
}

/** Creates the learner's course for their latest assessment, or returns the one that exists. */
export async function startCourse(user: User, kind: CourseKind) {
  const source = await courseSource(user, kind);
  if (!source) {
    throw new AuthError(404, kind === 'COMPANY'
      ? 'Complete the company assessment first.'
      : 'Complete your C-level diagnostic first.');
  }
  const existing = await prisma.course.findUnique({
    where: { userId_sourceSubmissionId: { userId: user.id, sourceSubmissionId: source.id } },
  });
  if (existing) return existing;

  const plan = await planFor(user, kind, source);
  try {
    return await prisma.course.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        kind,
        sourceSubmissionId: source.id,
        plan: plan as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Two tabs pressed "build" at once: the unique key let only one through.
    return prisma.course.findUniqueOrThrow({
      where: { userId_sourceSubmissionId: { userId: user.id, sourceSubmissionId: source.id } },
    });
  }
}

export async function ownedCourse(courseId: string, user: User) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== user.id) throw new AuthError(404, 'Course not found.');
  return course;
}

type StepResult = { status: string; did: 'outline' | 'lesson' | 'quiz' | 'none'; waiting?: boolean };

/** Does at most one model call for the course and reports where the build stands. */
export async function buildStep(courseId: string, user: User): Promise<StepResult> {
  const course = await ownedCourse(courseId, user);
  if (course.status === 'READY' || course.status === 'ERROR') return { status: course.status, did: 'none' };
  const plan = course.plan as unknown as GapPlan;

  if (course.status === 'OUTLINING') {
    const stale = new Date(Date.now() - LEASE_MS);
    const claimed = await prisma.course.updateMany({
      where: { id: course.id, status: 'OUTLINING', OR: [{ stepStartedAt: null }, { stepStartedAt: { lt: stale } }] },
      data: { stepStartedAt: new Date() },
    });
    if (claimed.count === 0) return { status: 'OUTLINING', did: 'none', waiting: true };

    try {
      const outline = await generateOutline(plan, course.id);
      await prisma.$transaction(async (tx) => {
        let order = 0;
        for (let mi = 0; mi < outline.modules.length; mi++) {
          const m = outline.modules[mi];
          const mod = await tx.courseModule.create({ data: { courseId: course.id, key: m.key, title: m.title, order: mi } });
          for (let li = 0; li < m.lessons.length; li++) {
            const l = m.lessons[li];
            await tx.lesson.create({
              data: {
                courseId: course.id,
                moduleId: mod.id,
                order: order++,
                kind: 'LESSON',
                title: l.title,
                brief: l.brief,
                focusIds: l.focusQuestionIds,
                durationMin: l.durationMin,
                isWorkshop: li === m.lessons.length - 1,
              },
            });
          }
          await tx.lesson.create({
            data: {
              courseId: course.id,
              moduleId: mod.id,
              order: order++,
              kind: 'QUIZ',
              title: `Module quiz: ${m.title}`,
              brief: 'Graded quiz on this module. 70% to pass, three attempts.',
              focusIds: [],
              durationMin: 8,
            },
          });
        }
        await tx.course.update({
          where: { id: course.id },
          data: {
            title: outline.title,
            subtitle: outline.subtitle,
            description: outline.description,
            status: 'WRITING',
            error: null,
            stepStartedAt: null,
          },
        });
      });
      return { status: 'WRITING', did: 'outline' };
    } catch (e) {
      await prisma.course.update({
        where: { id: course.id },
        data: { stepStartedAt: null, error: e instanceof Error ? e.message.slice(0, 500) : 'Outline failed.' },
      });
      throw e;
    }
  }

  // WRITING: claim the next lesson (or a quiz whose module's lessons are all written).
  const lessons = await prisma.lesson.findMany({ where: { courseId: course.id }, orderBy: { order: 'asc' } });
  const now = Date.now();
  const claimable = (l: (typeof lessons)[number]) =>
    l.status === 'PENDING' ||
    (l.status === 'RUNNING' && (!l.startedAt || now - l.startedAt.getTime() > LEASE_MS)) ||
    (l.status === 'ERROR' && l.attempts < MAX_ATTEMPTS);
  const moduleWritten = (moduleId: string) =>
    lessons.every((l) => l.moduleId !== moduleId || l.kind !== 'LESSON' || l.status === 'DONE');

  for (const next of lessons) {
    if (!claimable(next)) continue;
    if (next.kind === 'QUIZ' && !moduleWritten(next.moduleId)) continue;

    const claimed = await prisma.lesson.updateMany({
      where: { id: next.id, status: next.status, attempts: next.attempts },
      data: { status: 'RUNNING', startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue; // another request took it

    try {
      await writeLesson(next.id, lessons, plan, course.id);
      return { status: 'WRITING', did: next.kind === 'QUIZ' ? 'quiz' : 'lesson' };
    } catch (e) {
      await prisma.lesson.update({
        where: { id: next.id },
        data: { status: 'ERROR', error: e instanceof Error ? e.message.slice(0, 500) : 'Generation failed.' },
      });
      throw e;
    }
  }

  // Nothing left to claim: finished, still in flight elsewhere, or out of retries.
  const fresh = await prisma.lesson.findMany({ where: { courseId: course.id }, select: { status: true, attempts: true } });
  if (fresh.every((l) => l.status === 'DONE')) {
    await prisma.course.update({ where: { id: course.id }, data: { status: 'READY', error: null } });
    return { status: 'READY', did: 'none' };
  }
  if (fresh.some((l) => l.status === 'ERROR' && l.attempts >= MAX_ATTEMPTS) && !fresh.some((l) => l.status === 'RUNNING' || l.status === 'PENDING')) {
    await prisma.course.update({ where: { id: course.id }, data: { status: 'ERROR', error: 'Some lessons could not be written.' } });
    return { status: 'ERROR', did: 'none' };
  }
  return { status: 'WRITING', did: 'none', waiting: true };
}

async function writeLesson(
  lessonId: string,
  all: Array<{ id: string; moduleId: string; kind: string; title: string; brief: string; order: number; focusIds: Prisma.JsonValue; durationMin: number; isWorkshop: boolean }>,
  plan: GapPlan,
  courseId: string,
) {
  const lesson = all.find((l) => l.id === lessonId)!;
  const modules = await prisma.courseModule.findMany({ where: { courseId }, orderBy: { order: 'asc' } });
  const mod = modules.find((m) => m.id === lesson.moduleId)!;
  const planModule = plan.modules.find((m) => m.key === mod.key) ?? plan.modules[mod.order];

  if (lesson.kind === 'QUIZ') {
    const taught = await prisma.lesson.findMany({
      where: { moduleId: mod.id, kind: 'LESSON' },
      orderBy: { order: 'asc' },
      select: { title: true, brief: true, content: true },
    });
    const questions = await generateModuleQuiz(
      {
        plan,
        moduleTitle: mod.title,
        lessons: taught.map((t) => ({
          title: t.title,
          brief: t.brief,
          keyPoints: (t.content as unknown as LessonContent | null)?.keyPoints ?? [],
        })),
      },
      courseId,
    );
    await prisma.$transaction([
      prisma.quizQuestion.deleteMany({ where: { lessonId } }),
      ...questions.map((q, i) =>
        prisma.quizQuestion.create({
          data: {
            lessonId,
            order: i,
            type: q.type,
            stem: q.stem,
            options: q.options,
            correctOptionIds: q.correctOptionIds,
            points: q.points,
            difficulty: q.difficulty,
            explanation: q.explanation,
          },
        }),
      ),
      prisma.lesson.update({ where: { id: lessonId }, data: { status: 'DONE', error: null } }),
    ]);
    return;
  }

  const teaching = all.filter((l) => l.kind === 'LESSON').sort((a, b) => a.order - b.order);
  const idx = teaching.findIndex((l) => l.id === lessonId);
  const content = await generateLesson(
    {
      plan,
      module: planModule,
      moduleTitle: mod.title,
      lesson: {
        title: lesson.title,
        brief: lesson.brief,
        focusQuestionIds: (lesson.focusIds as string[]) ?? [],
        durationMin: lesson.durationMin,
      },
      previousTitles: teaching.slice(0, idx).map((l) => l.title),
      nextTitle: teaching[idx + 1]?.title,
      isWorkshop: lesson.isWorkshop,
    },
    courseId,
  );
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: 'DONE', error: null, content: content as unknown as Prisma.InputJsonValue },
  });
}
