import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { clearSession, handleAuthError, requireUser } from '@/lib/auth/server';
import { DEMO_COMPANY_ID } from '@/lib/product';

export const dynamic = 'force-dynamic';

/**
 * POST { password, companyName } — the company admin permanently deletes the
 * company and everything under it: every member's account, assessments, results,
 * invitations, courses, progress and certificates (certificates stop verifying).
 * Needs the admin's password and the company name typed exactly. Irreversible.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireUser(['ADMIN']);
    if (admin.companyId === DEMO_COMPANY_ID) {
      return NextResponse.json({ error: 'The sample workspace cannot be deleted.' }, { status: 403 });
    }
    const { password, companyName } = await request.json().catch(() => ({}));
    const [creds, company] = await Promise.all([
      prisma.user.findUnique({ where: { id: admin.id }, omit: { passwordHash: false } }),
      prisma.company.findUnique({ where: { id: admin.companyId }, select: { id: true, name: true } }),
    ]);
    if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    if (typeof password !== 'string' || !(await verifyPassword(password, creds?.passwordHash))) {
      return NextResponse.json({ error: 'That password is not correct.' }, { status: 403 });
    }
    if (typeof companyName !== 'string' || companyName.trim() !== company.name) {
      return NextResponse.json({ error: 'Type the company name exactly as shown to confirm.' }, { status: 400 });
    }

    // Every company relation cascades (users, invitations, submissions, payments,
    // courses), and every user relation cascades from there.
    await prisma.$transaction([
      prisma.auditLog.create({
        data: { actor: admin.email, action: 'COMPANY_DELETED', entity: `Company:${company.id}`, details: company.name },
      }),
      prisma.company.delete({ where: { id: company.id } }),
    ]);
    return clearSession(NextResponse.json({ success: true }));
  } catch (error) {
    return handleAuthError(error, 'Company delete error');
  }
}
