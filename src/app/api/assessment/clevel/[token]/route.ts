import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        company: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation token.' }, { status: 404 });
    }

    // Role filter: fetch ALL questions + role-specific questions matching their execRole
    const execRole = invitation.execRole || 'OTHER';

    const questions = await prisma.question.findMany({
      where: {
        assessmentTypeId: 'CLEVEL',
        OR: [
          { roleFilter: 'ALL' },
          { roleFilter: execRole },
        ],
      },
      orderBy: { order: 'asc' },
      include: {
        dimension: true,
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      invitation,
      questions,
    });
  } catch (error: any) {
    console.error('Error fetching C-level assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

