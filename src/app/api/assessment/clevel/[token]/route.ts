import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleAuthError } from '@/lib/auth/server';
import { clevelQuestionFilter, usableExecutiveInvite } from '@/lib/auth/clevel';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  try {
    const invitation = await usableExecutiveInvite(params.token);

    const [questions, account] = await Promise.all([
      prisma.question.findMany({
        where: clevelQuestionFilter(invitation.execRole),
        orderBy: { order: 'asc' },
        include: {
          dimension: { select: { id: true, name: true, domain: true } },
          // Levels and concern types are how answers are scored; keep them server-side.
          options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } },
        },
      }),
      prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } }),
    ]);

    return NextResponse.json({
      invitation: {
        name: invitation.name,
        email: invitation.email,
        execRole: invitation.execRole,
        invitedBy: invitation.invitedBy,
        company: { name: invitation.company.name },
      },
      hasAccount: Boolean(account),
      questions,
    });
  } catch (error) {
    return handleAuthError(error, 'C-level assessment load error');
  }
}
