import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DUMMY_HASH, verifyPassword } from '@/lib/auth/password';
import { attachSession, handleAuthError, normalizeEmail } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

const INVALID = 'That email and password do not match an account.';

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password } = await request.json();
    const email = normalizeEmail(rawEmail);
    if (!email || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      omit: { passwordHash: false, sessionVersion: false },
    });
    // Always run one scrypt so unknown emails take as long as wrong passwords.
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !ok) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastSignInAt: new Date() } });
    await prisma.auditLog.create({
      data: { actor: user.email, action: 'SIGNED_IN', entity: `User:${user.id}` },
    });

    return attachSession(
      NextResponse.json({ success: true, role: user.role, companyId: user.companyId }),
      user,
    );
  } catch (error) {
    return handleAuthError(error, 'Sign-in error');
  }
}
