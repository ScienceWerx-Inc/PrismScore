import { beforeEach, describe, expect, it, vi } from 'vitest';

/** PrismScore as a provider: who is found, and what is shared. Prisma is faked. */

const db = vi.hoisted(() => ({
  user: { findFirst: vi.fn() },
  course: { findMany: vi.fn() },
  lessonProgress: { count: vi.fn(), findFirst: vi.fn() },
  certificate: { count: vi.fn(), findMany: vi.fn() },
  submission: { findFirst: vi.fn() },
}));
vi.mock('@/lib/db', () => ({ prisma: db }));

import { prismCertificates, prismSummary } from '../connect/prismscore';

const ADMIN = { id: 'u1', role: 'ADMIN', execRoleTitle: 'CEO', companyId: 'c1', alsoTakesClevel: false, company: { name: 'Nile Freight' } };

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.APP_URL;
  db.course.findMany.mockResolvedValue([{ id: 'k1', updatedAt: new Date(), lessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }] }]);
  db.lessonProgress.count.mockResolvedValue(1);
  db.lessonProgress.findFirst.mockResolvedValue({ completedAt: new Date('2026-11-21T00:00:00Z') });
  db.certificate.count.mockResolvedValue(2);
});

describe('prismscore provider', () => {
  it('only looks up verified, non-demo accounts, case-insensitively', async () => {
    db.user.findFirst.mockResolvedValue(null);
    expect(await prismSummary('someone@example.com')).toEqual({ app: 'prismscore', found: false });
    expect(await prismCertificates('someone@example.com')).toEqual({ app: 'prismscore', found: false });
    const where = db.user.findFirst.mock.calls[0][0].where;
    expect(where.email).toEqual({ equals: 'someone@example.com', mode: 'insensitive' });
    expect(where.emailVerifiedAt).toEqual({ not: null });
    expect(where.companyId).toEqual({ not: 'demo-company-vanguard' });
  });

  it('admin: company score, band, assessment date, course progress, certificate count', async () => {
    db.user.findFirst.mockResolvedValue(ADMIN);
    db.submission.findFirst.mockImplementation(async (args: { where: { assessmentTypeId: string } }) =>
      args.where.assessmentTypeId === 'COMPANY'
        ? { completedAt: new Date('2026-11-20T10:00:00Z'), result: { totalScore: 312.4 } }
        : null,
    );
    const out = await prismSummary('owner@nile.example');
    expect(out.found).toBe(true);
    if (!out.found) return;
    expect(out.card.headline).toBe('312 / 500 · Established');
    expect(out.card.url).toBe('https://www.prismscore.us/dashboard');
    expect(out.card.lines).toEqual([
      { label: 'Company', value: 'Nile Freight' },
      { label: 'Assessed', value: '2026-11-20' },
      { label: 'Course progress', value: '1 of 4 lessons done (25%)' },
      { label: 'Certificates', value: '2' },
    ]);
    expect(out.card.updatedAt).toBe('2026-11-21T00:00:00.000Z');
  });

  it('executive: role and whether the C-level diagnostic is done', async () => {
    process.env.APP_URL = 'https://staging.prism.test/';
    db.user.findFirst.mockResolvedValue({ ...ADMIN, role: 'EXECUTIVE', execRoleTitle: 'CFO' });
    db.submission.findFirst.mockResolvedValue({ completedAt: new Date('2026-11-19T00:00:00Z') });
    db.course.findMany.mockResolvedValue([]);
    const out = await prismSummary('cfo@nile.example');
    if (!out.found) throw new Error('expected found');
    expect(out.card.headline).toBe('CFO · C-level diagnostic completed');
    expect(out.card.url).toBe('https://staging.prism.test/learn');
    expect(out.card.lines).toContainEqual({ label: 'Course progress', value: 'No course started yet' });
  });

  it('certificates carry status and a verify link', async () => {
    db.user.findFirst.mockResolvedValue(ADMIN);
    const recent = new Date(Date.now() - 24 * 3600 * 1000);
    db.certificate.findMany.mockResolvedValue([
      { code: 'PS-AAAAAAAAAA', courseTitle: 'Plan A', issuedAt: recent, revokedAt: null },
      { code: 'PS-BBBBBBBBBB', courseTitle: 'Plan B', issuedAt: new Date('2025-01-01T00:00:00Z'), revokedAt: null },
      { code: 'PS-CCCCCCCCCC', courseTitle: 'Plan C', issuedAt: recent, revokedAt: new Date() },
    ]);
    const out = await prismCertificates('owner@nile.example');
    if (!out.found) throw new Error('expected found');
    expect(out.certificates.map((c) => c.status)).toEqual(['VALID', 'EXPIRED', 'REVOKED']);
    expect(out.certificates[0]).toMatchObject({
      issuer: 'PrismScore',
      title: 'Plan A',
      verifyUrl: 'https://www.prismscore.us/verify/PS-AAAAAAAAAA',
    });
    expect(out.certificates[1].expiresAt).toBe('2025-07-01T00:00:00.000Z');
  });
});
