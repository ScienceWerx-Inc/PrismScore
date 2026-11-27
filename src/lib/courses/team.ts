import 'server-only';
import { prisma } from '@/lib/db';
import { AuthError, normalizeEmail, type User } from '@/lib/auth/server';
import { inviteExpiry, newInviteToken } from '@/lib/auth/invites';
import { sendEmail } from '@/lib/email';
import { ownedCourse } from './service';
import { progressSnapshot } from './view';

/**
 * Sharing the company course with the team. Only the admin who owns a READY
 * company course can share it. Existing members of the company are enrolled
 * directly; anyone else gets a LEARNER invitation link to join the company as
 * staff and take the course. Everyone's progress, quizzes and certificate stay
 * their own.
 */

const MAX_INVITES_PER_CALL = 50;

async function shareableCourse(admin: User, courseId: string) {
  if (admin.role !== 'ADMIN') throw new AuthError(403, 'Only the company admin can share the course.');
  const course = await ownedCourse(courseId, admin);
  if (course.kind !== 'COMPANY') throw new AuthError(403, 'Only the company course can be shared with the team.');
  if (course.status !== 'READY') throw new AuthError(403, 'Share the course once it has been written.');
  return course;
}

function appUrl(origin?: string) {
  return (process.env.APP_URL || origin || 'https://www.prismscore.us').replace(/\/$/, '');
}

/**
 * Shares the course. `emails` may name existing members (enrolled now) or new
 * people (invited by email). With `everyone`, every current member is enrolled.
 */
export async function shareCourse(
  admin: User,
  courseId: string,
  input: { emails?: unknown; everyone?: unknown },
  origin?: string,
) {
  const course = await shareableCourse(admin, courseId);
  const raw = Array.isArray(input.emails) ? input.emails : [];
  if (raw.length > MAX_INVITES_PER_CALL) {
    throw new AuthError(403, `Add at most ${MAX_INVITES_PER_CALL} people at a time.`);
  }
  const emails = Array.from(new Set(raw.map(normalizeEmail).filter((e): e is string => Boolean(e))));

  await prisma.course.update({ where: { id: course.id }, data: { sharedWithTeam: true } });

  const members = await prisma.user.findMany({
    where: { companyId: admin.companyId, id: { not: admin.id } },
    select: { id: true, email: true },
  });
  const byEmail = new Map(members.map((m) => [m.email, m.id]));
  const toEnroll = new Set<string>(input.everyone === true ? members.map((m) => m.id) : []);
  const toInvite: string[] = [];
  const elsewhere: string[] = [];

  for (const email of emails) {
    const memberId = byEmail.get(email);
    if (memberId) {
      toEnroll.add(memberId);
      continue;
    }
    if (email === admin.email) continue;
    // An account in another company can't join this one.
    const other = await prisma.user.findUnique({ where: { email }, select: { companyId: true } });
    if (other) elsewhere.push(email);
    else toInvite.push(email);
  }

  if (toEnroll.size) {
    await prisma.courseEnrollment.createMany({
      data: Array.from(toEnroll).map((userId) => ({ courseId: course.id, userId })),
      skipDuplicates: true,
    });
  }

  const company = await prisma.company.findUniqueOrThrow({ where: { id: admin.companyId }, select: { name: true } });
  const invited: { email: string; link: string; emailed: boolean }[] = [];
  for (const email of toInvite) {
    // Reuse an open invitation for the same person and course instead of piling them up.
    const open = await prisma.invitation.findFirst({
      where: { companyId: admin.companyId, email, role: 'LEARNER', courseId: course.id, status: { in: ['PENDING', 'SENT'] } },
    });
    const inv = open
      ? await prisma.invitation.update({ where: { id: open.id }, data: { sentAt: new Date(), expiresAt: inviteExpiry() } })
      : await prisma.invitation.create({
          data: {
            companyId: admin.companyId,
            email,
            role: 'LEARNER',
            courseId: course.id,
            token: newInviteToken(),
            status: 'SENT',
            invitedBy: admin.name,
            expiresAt: inviteExpiry(),
          },
        });
    const link = `${appUrl(origin)}/join/${inv.token}`;
    const outcome = await sendEmail(
      email,
      `${admin.name} shared a course with you on PrismScore`,
      `Hi,\n\n${admin.name} at ${company.name} shared "${course.title ?? 'a course'}" with you on PrismScore, ` +
        `the AI-readiness learning platform by ScienceWerx.\n\nCreate your account and start learning:\n${link}\n\n` +
        `The link works once and expires in 14 days.`,
    );
    invited.push({ email, link, emailed: outcome === 'sent' });
  }

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'COURSE_SHARED',
      entity: `Course:${course.id}`,
      details: `Enrolled ${toEnroll.size}, invited ${invited.length}`,
    },
  });

  return { enrolled: toEnroll.size, invited, alreadyElsewhere: elsewhere };
}

/** The admin's view of who has the course and how far each person is. Never answers. */
export async function teamForCourse(admin: User, courseId: string) {
  const course = await shareableCourse(admin, courseId).catch(async (e) => {
    // A course still being written has no team yet; report that rather than failing.
    if (e instanceof AuthError && e.status === 403) {
      const c = await ownedCourse(courseId, admin);
      if (c.kind === 'COMPANY') return c;
    }
    throw e;
  });
  const [enrollments, invites, members] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { courseId: course.id },
      include: { user: { select: { id: true, name: true, email: true, role: true, execRoleTitle: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { companyId: admin.companyId, role: 'LEARNER', courseId: course.id, status: { in: ['PENDING', 'SENT'] } },
      select: { id: true, email: true, sentAt: true, expiresAt: true },
    }),
    prisma.user.count({ where: { companyId: admin.companyId, id: { not: admin.id } } }),
  ]);

  const learners = await Promise.all(
    enrollments.map(async (e) => {
      const snap = await progressSnapshot(course, e.user.id);
      return {
        userId: e.user.id,
        name: e.user.name,
        email: e.user.email,
        role: e.user.execRoleTitle || e.user.role,
        percent: snap.percent,
        grade: snap.grade,
        certificateCode: snap.certificate?.code ?? null,
      };
    }),
  );
  return {
    shared: course.sharedWithTeam,
    ready: course.status === 'READY',
    learners,
    pendingInvites: invites.filter((i) => !i.expiresAt || i.expiresAt > new Date()),
    membersNotEnrolled: Math.max(0, members - enrollments.length),
  };
}

/** Removes one person from the shared course. Their progress is kept but they lose access. */
export async function removeFromCourse(admin: User, courseId: string, userId: unknown) {
  const course = await shareableCourse(admin, courseId);
  if (typeof userId !== 'string') throw new AuthError(404, 'Learner not found.');
  const { count } = await prisma.courseEnrollment.deleteMany({ where: { courseId: course.id, userId } });
  if (!count) throw new AuthError(404, 'Learner not found.');
  return { removed: true };
}
