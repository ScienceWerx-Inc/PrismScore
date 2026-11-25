import { PrismaClient } from '@prisma/client';

// DATABASE_URL comes from the Prisma Postgres integration on Vercel and from
// .env locally. One client per process; dev hot-reload reuses it.
// Credential fields are omitted from every query by default, so an
// `include: { user: true }` can never send them to a browser. Auth code opts
// back in with `omit: { passwordHash: false, sessionVersion: false }`.
function createClient() {
  return new PrismaClient({
    omit: { user: { passwordHash: true, sessionVersion: true } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createClient> | undefined };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
