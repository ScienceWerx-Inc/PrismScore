import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { companyAccess, handleAuthError } from '@/lib/auth/server';
import { progressSnapshot } from '@/lib/courses/view';

export const dynamic = 'force-dynamic';

/**
 * The admin's read-only view of one person's learning: each course they have
 * (their own, and the shared company course if enrolled) with outline, progress,
 * grade and certificate. Never their quiz or self-check answers.
 */
export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  try {
    const { companyId } = await companyAccess(null, { roles: ['ADMIN'] });
    const person = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, role: true, execRoleTitle: true, companyId: true },
    });
    // Another company's person answers exactly like an unknown id.
    if (!person || person.companyId !== companyId) {
      return NextResponse.json({ error: 'Person not found.' }, { status: 404 });
    }
    const courses = await prisma.course.findMany({
      where: {
        companyId,
        OR: [{ userId: person.id }, { sharedWithTeam: true, enrollments: { some: { userId: person.id } } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    const snapshots = await Promise.all(courses.map((c) => progressSnapshot(c, person.id)));
    return NextResponse.json({
      person: { name: person.name, role: person.execRoleTitle || person.role },
      courses: snapshots.map((s, i) => ({ ...s, shared: courses[i].userId !== person.id })),
    });
  } catch (error) {
    return handleAuthError(error, 'Learner overview error');
  }
}
