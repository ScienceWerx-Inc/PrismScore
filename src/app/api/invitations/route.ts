import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, companyId, name, email, execRole, token, invitationId } = body;

    if (action === 'create_or_send') {
      if (!companyId || !email) {
        return NextResponse.json({ error: 'Company and email are required.' }, { status: 400 });
      }

      // Check duplicates
      const existing = await prisma.invitation.findFirst({
        where: { companyId, email: email.toLowerCase().trim(), status: { not: 'EXPIRED' } },
      });

      if (existing) {
        // Resend / refresh
        const updated = await prisma.invitation.update({
          where: { id: existing.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, invitation: updated, message: 'Invitation resent' });
      }

      const newToken = crypto.randomBytes(24).toString('hex');
      const invitation = await prisma.invitation.create({
        data: {
          companyId,
          name: name || 'Executive Leader',
          email: email.toLowerCase().trim(),
          role: 'EXECUTIVE',
          execRole: execRole || 'OTHER',
          token: newToken,
          status: 'SENT',
          invitedBy: 'Company Admin',
        },
      });

      await prisma.auditLog.create({
        data: {
          actor: 'Admin',
          action: 'INVITATION_SENT',
          entity: `Invitation:${invitation.id}`,
          details: `Invited ${email} as ${execRole}`,
        },
      });

      return NextResponse.json({ success: true, invitation });
    }

    if (action === 'remind') {
      const inv = await prisma.invitation.update({
        where: { id: invitationId },
        data: { sentAt: new Date(), status: 'SENT' },
      });
      return NextResponse.json({ success: true, invitation: inv, message: 'Reminder sent' });
    }

    if (action === 'revoke') {
      const inv = await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ success: true, invitation: inv, message: 'Invitation revoked' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Invitation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

