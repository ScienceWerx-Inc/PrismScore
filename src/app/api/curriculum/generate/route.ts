import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CONCERN_INTERVENTIONS, CONCERN_TYPES, type ConcernKey } from '@/lib/scoring';
import { companyAccess, handleAuthError } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * The admin's view of the company's learning: each leader's gap-closing course
 * (status, progress, certificate) and the non-course interventions their
 * reported concerns call for. Courses themselves live under /learn.
 */
export async function GET(request: Request) {
  try {
    const { companyId } = await companyAccess(new URL(request.url).searchParams.get('companyId'), {
      allowDemo: true,
      roles: ['ADMIN'],
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        users: {
          // Leaders, plus team members taking the shared company course.
          where: { OR: [{ role: { in: ['ADMIN', 'EXECUTIVE'] } }, { enrollments: { some: {} } }] },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            role: true,
            execRoleTitle: true,
            concernProfiles: { select: { concernType: true } },
            submissions: { where: { status: 'COMPLETED' }, select: { assessmentTypeId: true } },
            enrollments: {
              select: {
                course: {
                  select: {
                    id: true,
                    kind: true,
                    status: true,
                    title: true,
                    lessons: { select: { id: true } },
                    certificates: { select: { code: true, issuedAt: true, revokedAt: true, userId: true } },
                  },
                },
              },
            },
            courses: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                kind: true,
                status: true,
                title: true,
                lessons: { select: { id: true } },
                certificates: { select: { code: true, issuedAt: true, revokedAt: true, userId: true } },
              },
            },
          },
        },
      },
    });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const lessonIds = company.users.flatMap((u) => [...u.courses, ...u.enrollments.map((e) => e.course)].flatMap((c) => c.lessons.map((l) => l.id)));
    const progress = await prisma.lessonProgress.groupBy({
      by: ['userId'],
      where: { lessonId: { in: lessonIds } },
      _count: { _all: true },
    });
    const doneByUser = new Map(progress.map((p) => [p.userId, p._count._all]));

    const learners = company.users.map((u) => {
      // A leader's own course first; a team member's shared company course otherwise.
      const mine = [...u.courses, ...u.enrollments.map((e) => e.course)];
      const course = mine[0];
      const total = mine.reduce((s, c) => s + c.lessons.length, 0);
      const cert = course?.certificates.find((c) => c.userId === u.id && !c.revokedAt);
      return {
        userId: u.id,
        isTeam: u.role === 'STAFF',
        name: u.name,
        role: u.execRoleTitle || u.role,
        isAdmin: u.role === 'ADMIN',
        assessmentDone: u.role === 'STAFF' || u.submissions.some((s) => s.assessmentTypeId === (u.role === 'ADMIN' ? 'COMPANY' : 'CLEVEL')),
        course: course
          ? {
              title: course.title,
              kind: course.kind,
              status: course.status,
              percent: total ? Math.round(((doneByUser.get(u.id) ?? 0) / total) * 100) : 0,
              certificateCode: cert?.code ?? null,
            }
          : null,
      };
    });

    // Interventions for the concerns leaders actually reported, most common first.
    const counts = new Map<ConcernKey, number>();
    for (const u of company.users) {
      for (const key of Array.from(new Set(u.concernProfiles.map((c) => c.concernType as ConcernKey)))) {
        if (key in CONCERN_INTERVENTIONS) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    const interventions = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, leaders]) => ({
        concern: CONCERN_TYPES[key],
        leaders,
        ...CONCERN_INTERVENTIONS[key],
      }));

    return NextResponse.json({ company: { id: company.id, name: company.name }, learners, interventions });
  } catch (error) {
    return handleAuthError(error, 'Curriculum overview error');
  }
}
