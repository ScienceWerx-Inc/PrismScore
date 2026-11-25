import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { companyAccess, handleAuthError, normalizeEmail } from '@/lib/auth/server';
import { inviteExpiry, newInviteToken } from '@/lib/auth/invites';

const EXEC_ROLES = new Set(['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO', 'OTHER']);

/** Executive invitations for the signed-in admin's own company. */
export async function POST(request: Request) {
  try {
    const { companyId, user } = await companyAccess(null, { roles: ['ADMIN'] });
    const { action, name, email: rawEmail, execRole, invitationId } = await request.json();

    if (action === 'create_or_send') {
      const email = normalizeEmail(rawEmail);
      if (!email) {
        return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
      }
      const role = EXEC_ROLES.has(execRole) ? execRole : 'OTHER';

      const existing = await prisma.invitation.findFirst({
        where: { companyId, email, status: { not: 'EXPIRED' } },
      });
      if (existing) {
        const updated = await prisma.invitation.update({
          where: { id: existing.id },
          data: { status: 'SENT', sentAt: new Date(), expiresAt: inviteExpiry() },
        });
        return NextResponse.json({ success: true, invitation: updated, message: 'Invitation resent' });
      }

      const invitation = await prisma.invitation.create({
        data: {
          companyId,
          name: typeof name === 'string' && name.trim() ? name.trim() : 'Executive Leader',
          email,
          role: 'EXECUTIVE',
          execRole: role,
          token: newInviteToken(),
          status: 'SENT',
          invitedBy: user!.name,
          expiresAt: inviteExpiry(),
        },
      });

      await prisma.auditLog.create({
        data: {
          actor: user!.email,
          action: 'INVITATION_SENT',
          entity: `Invitation:${invitation.id}`,
          details: `Invited ${email} as ${role}`,
        },
      });

      return NextResponse.json({ success: true, invitation });
    }

    if (action === 'remind' || action === 'revoke') {
      // Scope the update to this company so another company's invitation id does nothing.
      const data =
        action === 'remind'
          ? { sentAt: new Date(), status: 'SENT', expiresAt: inviteExpiry() }
          : { status: 'EXPIRED' };
      const { count } = await prisma.invitation.updateMany({
        where: { id: String(invitationId || ''), companyId, status: { not: 'ACCEPTED' } },
        data,
      });
      if (count === 0) {
        return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
      }
      const invitation = await prisma.invitation.findUnique({ where: { id: String(invitationId) } });
      return NextResponse.json({
        success: true,
        invitation,
        message: action === 'remind' ? 'Reminder sent' : 'Invitation revoked',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return handleAuthError(error, 'Invitation error');
  }
}
