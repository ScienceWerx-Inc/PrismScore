import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearSession, currentUser, handleAuthError } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/** POST { everywhere?: true } — `everywhere` also ends this user's sessions on other devices. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.everywhere) {
      const user = await currentUser();
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
      }
    }
    return clearSession(NextResponse.json({ success: true }));
  } catch (error) {
    return handleAuthError(error, 'Sign-out error');
  }
}
