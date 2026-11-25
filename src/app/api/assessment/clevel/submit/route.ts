import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  computeExecutiveGap,
  DEFAULT_TARGET_LEVELS_BY_ROLE,
  CompetencyLevel,
} from '@/lib/scoring';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { attachSession, handleAuthError } from '@/lib/auth/server';
import { clevelQuestionFilter, usableExecutiveInvite } from '@/lib/auth/clevel';
import { sendVerificationEmailQuietly } from '@/lib/auth/verifyEmail';

/**
 * POST { token, responses: { questionId: optionId }, password? }
 * Records an invited executive's C-level diagnostic. When the person has no
 * account yet, `password` creates one and signs them in.
 */
export async function POST(request: Request) {
  try {
    const { token, responses, password } = await request.json();
    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Responses are required.' }, { status: 400 });
    }

    const invitation = await usableExecutiveInvite(token);
    const roleTitle = invitation.execRole || 'OTHER';

    const existing = await prisma.user.findUnique({
      where: { email: invitation.email },
      omit: { passwordHash: false },
    });
    if (existing && existing.companyId !== invitation.companyId) {
      // One account belongs to one company; never move it because of an invite.
      return NextResponse.json(
        { error: 'This email already belongs to another PrismScore workspace.' },
        { status: 409 },
      );
    }

    const settingPassword = !existing?.passwordHash;
    if (settingPassword && password !== undefined) {
      const problem = passwordProblem(password);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    }

    // Only options of questions this executive was actually shown count.
    const optionIds = Object.entries(responses)
      .filter(([, v]) => typeof v === 'string')
      .map(([, v]) => v as string);
    const options = await prisma.option.findMany({
      where: { id: { in: optionIds }, question: clevelQuestionFilter(roleTitle) },
      include: { question: { include: { dimension: true } } },
    });
    const chosen = options.filter((o) => responses[o.questionId] === o.id);

    const roleTargets = DEFAULT_TARGET_LEVELS_BY_ROLE[roleTitle] || DEFAULT_TARGET_LEVELS_BY_ROLE.OTHER;
    const passwordHash =
      settingPassword && typeof password === 'string' ? await hashPassword(password) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      // Claim the invitation first so a link cannot be submitted twice.
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, status: { in: ['PENDING', 'SENT'] } },
        data: { status: 'ACCEPTED' },
      });
      if (claimed.count === 0) throw new Error('INVITE_ALREADY_USED');

      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            omit: { sessionVersion: false },
            data: {
              // A company admin who also takes the C-level stays an admin.
              role: existing.role === 'ADMIN' ? 'ADMIN' : 'EXECUTIVE',
              execRoleTitle: roleTitle,
              ...(passwordHash ? { passwordHash } : {}),
            },
          })
        : await tx.user.create({
            omit: { sessionVersion: false },
            data: {
              email: invitation.email,
              name: invitation.name || 'Executive',
              role: 'EXECUTIVE',
              execRoleTitle: roleTitle,
              companyId: invitation.companyId,
              ...(passwordHash ? { passwordHash } : {}),
            },
          });

      const submission = await tx.submission.create({
        data: {
          userId: user.id,
          companyId: invitation.companyId,
          assessmentTypeId: 'CLEVEL',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // A retake replaces the previous gap and concern picture.
      await tx.gapRecord.deleteMany({ where: { userId: user.id } });
      await tx.concernProfile.deleteMany({ where: { userId: user.id } });

      for (const opt of chosen) {
        await tx.response.create({
          data: { submissionId: submission.id, questionId: opt.questionId, optionId: opt.id },
        });

        if (opt.question.layer === 'KNOWLEDGE' && opt.mappedLevel) {
          const competencyName = opt.question.dimension.name;
          const gap = computeExecutiveGap(
            competencyName,
            opt.mappedLevel as CompetencyLevel,
            (roleTargets[competencyName] || 'LEADING') as CompetencyLevel,
          );
          await tx.gapRecord.create({
            data: {
              userId: user.id,
              dimensionId: opt.question.dimensionId,
              currentLevel: gap.currentLevel,
              targetLevel: gap.targetLevel,
              gap: gap.gap,
              priority: gap.priority,
            },
          });
        }

        if (opt.question.layer === 'RESISTANCE' && opt.concernType) {
          await tx.concernProfile.create({
            data: { userId: user.id, concernType: opt.concernType, strength: 0.9 },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actor: user.email,
          action: 'EXECUTIVE_ASSESSMENT_COMPLETED',
          entity: `User:${user.id}`,
          details: `C-level diagnostic completed (${roleTitle})`,
        },
      });

      return { user, submission };
    });

    // The invitation link proves nothing about who opened it; ask them to confirm the address.
    if (passwordHash) await sendVerificationEmailQuietly(result.user, request.url);

    const res = NextResponse.json({
      success: true,
      submissionId: result.submission.id,
      signedIn: Boolean(passwordHash),
      needsSignIn: !passwordHash,
    });
    return passwordHash ? attachSession(res, result.user) : res;
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITE_ALREADY_USED') {
      return NextResponse.json({ error: 'This invitation has already been used. Please sign in.' }, { status: 409 });
    }
    return handleAuthError(error, 'C-level submit error');
  }
}
