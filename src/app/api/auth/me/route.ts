import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUser, handleAuthError } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ user: null });
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, name: true, planStatus: true },
    });
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, execRoleTitle: user.execRoleTitle },
      company,
    });
  } catch (error) {
    return handleAuthError(error, 'Session lookup error');
  }
}
