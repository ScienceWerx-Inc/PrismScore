import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { companyAccess, handleAuthError, normalizeEmail } from '@/lib/auth/server';
import { inviteExpiry, newInviteToken } from '@/lib/auth/invites';
import { sendExecutiveInvite } from '@/lib/auth/inviteEmail';

const REMIND_EVERY_MS = 60 * 60 * 1000;

const EXEC_ROLES = new Set(['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO', 'OTHER']);

async function emailInvite(
  inv: { id: string; email: string; name: string | null; execRole: string | null; token: string },
  companyId: string,
  invitedBy: string,
  origin: string,
  reminder = false,
): Promise<boolean> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
  try {
    const outcome = await sendExecutiveInvite(inv, { companyName: company?.name ?? 'your company', invitedBy, origin, reminder });
    return outcome === 'sent';
  } catch (e) {
    console.error('[email] executive invite failed:', (e as Error).name);
    return false;
  }
}

/** Executive invitations for the signed-in admin's own company. Each one is emailed. */
export async function POST(request: Request) {
  try {
    const { companyId, user } = await companyAccess(null, { roles: ['ADMIN'] });
    const { action, name, email: rawEmail, execRole, invitationId } = await request.json();
    const origin = new URL(request.url).origin;

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
        if (existing.status === 'ACCEPTED') {
          return NextResponse.json({ error: 'This person has already completed the diagnostic.' }, { status: 409 });
        }
        const updated = await prisma.invitation.update({
          where: { id: existing.id },
          data: { status: 'SENT', sentAt: new Date(), expiresAt: inviteExpiry() },
        });
        const emailed = await emailInvite(updated, companyId, user!.name, origin, true);
        return NextResponse.json({ success: true, invitation: updated, emailed, message: emailed ? 'Invitation emailed again' : 'Invitation refreshed; email could not be sent' });
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

      const emailed = await emailInvite(invitation, companyId, user!.name, origin);
      return NextResponse.json({ success: true, invitation, emailed });
    }

    if (action === 'remind') {
      const inv = await prisma.invitation.findFirst({
        where: { id: String(invitationId || ''), companyId, status: { in: ['PENDING', 'SENT'] } },
      });
      if (!inv) return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
      // One reminder an hour per person, so the button can't be used to flood someone's inbox.
      if (inv.status === 'SENT' && inv.sentAt && Date.now() - inv.sentAt.getTime() < REMIND_EVERY_MS) {
        return NextResponse.json({ error: 'A reminder was sent less than an hour ago.' }, { status: 429 });
      }
      const updated = await prisma.invitation.update({
        where: { id: inv.id },
        data: { sentAt: new Date(), status: 'SENT', expiresAt: inviteExpiry() },
      });
      const emailed = await emailInvite(updated, companyId, user!.name, origin, true);
      return NextResponse.json({ success: true, invitation: updated, emailed, message: emailed ? 'Reminder emailed' : 'Email could not be sent' });
    }

    if (action === 'revoke') {
      // Scope the update to this company so another company's invitation id does nothing.
      const { count } = await prisma.invitation.updateMany({
        where: { id: String(invitationId || ''), companyId, status: { not: 'ACCEPTED' } },
        data: { status: 'EXPIRED' },
      });
      if (count === 0) {
        return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
      }
      const invitation = await prisma.invitation.findUnique({ where: { id: String(invitationId) } });
      return NextResponse.json({
        success: true,
        invitation,
        message: 'Invitation revoked',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return handleAuthError(error, 'Invitation error');
  }
}
