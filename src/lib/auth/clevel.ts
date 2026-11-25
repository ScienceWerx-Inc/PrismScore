import 'server-only';
import { prisma } from '@/lib/db';
import { DEMO_COMPANY_ID } from '@/lib/product';
import { inviteIsUsable } from './invites';
import { AuthError } from './server';

/**
 * Resolves a C-level invitation link. The token is the credential: it must be
 * an executive invitation that is still usable, and never one in the public
 * demo company (its token is visible on the demo dashboard).
 */
export async function usableExecutiveInvite(token: unknown) {
  if (typeof token !== 'string' || token.length < 16) throw new AuthError(404, 'This invitation link is not valid.');
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!invitation || invitation.role !== 'EXECUTIVE' || invitation.companyId === DEMO_COMPANY_ID) {
    throw new AuthError(404, 'This invitation link is not valid.');
  }
  if (!inviteIsUsable(invitation)) {
    throw new AuthError(404, invitation.status === 'ACCEPTED'
      ? 'This invitation has already been used. Please sign in.'
      : 'This invitation has expired. Ask your administrator for a new link.');
  }
  return invitation;
}

export function clevelQuestionFilter(execRole: string | null) {
  return {
    assessmentTypeId: 'CLEVEL',
    OR: [{ roleFilter: 'ALL' }, { roleFilter: execRole || 'OTHER' }],
  };
}
