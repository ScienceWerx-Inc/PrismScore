import 'server-only';
import { prisma } from '@/lib/db';
import { DEMO_COMPANY_ID } from '@/lib/product';
import { calculateReadinessBand } from '@/lib/scoring';
import { certificateExpiry } from '@/lib/courses/rules';
import { notFound } from './provider';
import { SELF_APP, type CertificatesResponse, type ConnectCardLine, type SummaryResponse } from './types';

/**
 * What Prism School tells a peer about one person. Only accounts whose email
 * has been verified are found: otherwise another app could show Prism data
 * from an account the mailbox owner never controlled.
 */

const PUBLIC_BASE = 'https://www.prismscore.us';
export const publicBaseUrl = () => (process.env.APP_URL?.trim() || PUBLIC_BASE).replace(/\/+$/, '');

const dateLabel = (d: Date) => d.toISOString().slice(0, 10);

async function verifiedUser(email: string) {
  return prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      emailVerifiedAt: { not: null },
      companyId: { not: DEMO_COMPANY_ID },
    },
    select: { id: true, role: true, execRoleTitle: true, companyId: true, alsoTakesClevel: true, company: { select: { name: true } } },
  });
}

async function courseProgress(userId: string) {
  const courses = await prisma.course.findMany({
    where: { userId, status: 'READY' },
    select: { id: true, updatedAt: true, lessons: { select: { id: true } } },
  });
  const lessonIds = courses.flatMap((c) => c.lessons.map((l) => l.id));
  const [done, latestDone] = await Promise.all([
    lessonIds.length ? prisma.lessonProgress.count({ where: { userId, lessonId: { in: lessonIds } } }) : 0,
    prisma.lessonProgress.findFirst({ where: { userId }, orderBy: { completedAt: 'desc' }, select: { completedAt: true } }),
  ]);
  return { courses: courses.length, lessons: lessonIds.length, done, lastActivity: latestDone?.completedAt ?? null };
}

function progressLine(p: Awaited<ReturnType<typeof courseProgress>>): ConnectCardLine {
  if (p.courses === 0) return { label: 'Course progress', value: 'No course started yet' };
  const pct = p.lessons ? Math.round((p.done / p.lessons) * 100) : 0;
  const prefix = p.courses > 1 ? `${p.courses} courses · ` : '';
  return { label: 'Course progress', value: `${prefix}${p.done} of ${p.lessons} lessons done (${pct}%)` };
}

export async function prismSummary(email: string): Promise<SummaryResponse> {
  const user = await verifiedUser(email);
  if (!user) return notFound();

  const [progress, certificateCount, clevel] = await Promise.all([
    courseProgress(user.id),
    prisma.certificate.count({ where: { userId: user.id, revokedAt: null } }),
    prisma.submission.findFirst({
      where: { userId: user.id, assessmentTypeId: 'CLEVEL', status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
  ]);
  const base = publicBaseUrl();
  const lines: ConnectCardLine[] = [{ label: 'Company', value: user.company.name }];
  const dates: (Date | null | undefined)[] = [progress.lastActivity, clevel?.completedAt];
  let title: string;
  let headline: string;
  let url: string;

  if (user.role === 'ADMIN') {
    const latest = await prisma.submission.findFirst({
      where: { companyId: user.companyId, assessmentTypeId: 'COMPANY', status: 'COMPLETED', result: { isNot: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true, result: { select: { totalScore: true } } },
    });
    title = 'PrismScore company AI readiness';
    url = `${base}/dashboard`;
    if (latest?.result) {
      const score = Math.round(latest.result.totalScore);
      headline = `${score} / 500 · ${calculateReadinessBand(score)}`;
      if (latest.completedAt) lines.push({ label: 'Assessed', value: dateLabel(latest.completedAt) });
      dates.push(latest.completedAt);
    } else {
      headline = 'Company assessment not completed yet';
    }
    if (user.alsoTakesClevel || clevel) {
      lines.push({ label: 'C-level diagnostic', value: clevel ? 'Completed' : 'Not taken yet' });
    }
  } else {
    title = 'PrismScore leadership diagnostic';
    url = `${base}/learn`;
    const role = user.execRoleTitle || 'Executive';
    headline = clevel ? `${role} · C-level diagnostic completed` : `${role} · C-level diagnostic not taken yet`;
  }

  lines.push(progressLine(progress));
  lines.push({ label: 'Certificates', value: String(certificateCount) });

  const updated = dates.filter((d): d is Date => d instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0];
  return {
    app: SELF_APP,
    found: true,
    card: { title, headline, lines: lines.slice(0, 5), url, updatedAt: (updated ?? new Date()).toISOString() },
  };
}

export async function prismCertificates(email: string): Promise<CertificatesResponse> {
  const user = await verifiedUser(email);
  if (!user) return notFound();
  const certs = await prisma.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: 'desc' } });
  const now = new Date();
  const base = publicBaseUrl();
  return {
    app: SELF_APP,
    found: true,
    certificates: certs.map((c) => {
      const expiresAt = certificateExpiry(c.issuedAt);
      return {
        code: c.code,
        title: c.courseTitle,
        issuer: 'Prism School',
        issuedAt: c.issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: c.revokedAt ? 'REVOKED' : expiresAt < now ? 'EXPIRED' : 'VALID',
        verifyUrl: `${base}/verify/${c.code}`,
      };
    }),
  };
}
