import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inviteIsUsable } from '@/lib/auth/invites';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { attachSession, handleAuthError } from '@/lib/auth/server';
import { sendVerificationEmailQuietly } from '@/lib/auth/verifyEmail';

export const dynamic = 'force-dynamic';

/**
 * Joining a shared company course from a LEARNER invitation. The token is the
 * credential; it works once and expires. A new person gets a staff account in
 * the inviting company and is enrolled in the course.
 */
async function usableLearnerInvite(token: string) {
  if (typeof token !== 'string' || token.length < 16) return null;
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!inv || inv.role !== 'LEARNER' || !inv.courseId || !inviteIsUsable(inv)) return null;
  const course = await prisma.course.findUnique({
    where: { id: inv.courseId },
    select: { id: true, title: true, sharedWithTeam: true, companyId: true, status: true },
  });
  if (!course || !course.sharedWithTeam || course.companyId !== inv.companyId || course.status !== 'READY') return null;
  return { inv, course };
}

const INVALID = 'This invitation link is not valid or has expired. Ask your administrator for a new one.';

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  try {
    const found = await usableLearnerInvite(params.token);
    if (!found) return NextResponse.json({ error: INVALID }, { status: 404 });
    const existing = await prisma.user.findUnique({ where: { email: found.inv.email }, select: { id: true } });
    return NextResponse.json({
      email: found.inv.email,
      invitedBy: found.inv.invitedBy,
      company: found.inv.company.name,
      courseTitle: found.course.title,
      hasAccount: Boolean(existing),
    });
  } catch (error) {
    return handleAuthError(error, 'Join invitation load error');
  }
}

/** POST { name, password } creates the learner's account and enrolls them. */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const found = await usableLearnerInvite(params.token);
    if (!found) return NextResponse.json({ error: INVALID }, { status: 404 });
    const { inv, course } = found;
    const { name, password } = await request.json().catch(() => ({}));

    const existing = await prisma.user.findUnique({ where: { email: inv.email }, select: { id: true, companyId: true } });
    if (existing) {
      if (existing.companyId !== inv.companyId) {
        return NextResponse.json({ error: 'This email already belongs to another PrismScore workspace.' }, { status: 409 });
      }
      // Already a member: enroll them and let them sign in with their own password.
      await prisma.$transaction([
        prisma.courseEnrollment.upsert({
          where: { courseId_userId: { courseId: course.id, userId: existing.id } },
          update: {},
          create: { courseId: course.id, userId: existing.id },
        }),
        prisma.invitation.update({ where: { id: inv.id }, data: { status: 'ACCEPTED' } }),
      ]);
      return NextResponse.json({ success: true, needsSignIn: true, courseId: course.id });
    }

    const problem = passwordProblem(password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    const displayName = typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : inv.email.split('@')[0];
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: inv.id, status: { in: ['PENDING', 'SENT'] } },
        data: { status: 'ACCEPTED' },
      });
      if (claimed.count === 0) throw new Error('INVITE_ALREADY_USED');
      const created = await tx.user.create({
        omit: { sessionVersion: false },
        data: {
          email: inv.email,
          name: displayName,
          role: 'STAFF',
          companyId: inv.companyId,
          passwordHash,
          lastSignInAt: new Date(),
        },
      });
      await tx.courseEnrollment.create({ data: { courseId: course.id, userId: created.id } });
      await tx.auditLog.create({
        data: { actor: created.email, action: 'LEARNER_JOINED', entity: `Course:${course.id}`, details: `Invited by ${inv.invitedBy}` },
      });
      return created;
    });

    await sendVerificationEmailQuietly({ ...user, emailVerifiedAt: null }, request.url);
    return attachSession(NextResponse.json({ success: true, courseId: course.id }), user);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITE_ALREADY_USED') {
      return NextResponse.json({ error: INVALID }, { status: 404 });
    }
    return handleAuthError(error, 'Join error');
  }
}
