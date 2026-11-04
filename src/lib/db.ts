import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  // If explicitly overridden via env var with a custom remote URL or non-file scheme, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    // Vercel serverless filesystem is strictly read-only outside of /tmp
    const tmpDbPath = '/tmp/prism_dev.db';

    if (!fs.existsSync(tmpDbPath)) {
      // Find the bundled seeded SQLite database
      const candidatePaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve(__dirname, '../../../../prisma/dev.db'),
        path.resolve(__dirname, '../../../prisma/dev.db'),
        path.resolve(__dirname, '../../prisma/dev.db'),
        path.resolve(__dirname, '../prisma/dev.db'),
        '/var/task/prisma/dev.db',
        '/var/task/dev.db',
      ];

      const sourceDb = candidatePaths.find((p) => {
        try {
          return fs.existsSync(p);
        } catch {
          return false;
        }
      });

      if (sourceDb) {
        try {
          fs.copyFileSync(sourceDb, tmpDbPath);
          fs.chmodSync(tmpDbPath, 0o666);
        } catch (copyErr) {
          console.error('Failed to copy database to /tmp:', copyErr);
        }
      } else {
        console.warn('No bundled source database found for Vercel /tmp copy');
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Local development: resolve absolute path to avoid cwd mismatch
  const candidatePaths = [
    path.resolve(process.cwd(), 'prisma', 'dev.db'),
    path.resolve(process.cwd(), 'dev.db'),
    path.resolve(__dirname, '../../../../prisma/dev.db'),
    path.resolve(__dirname, '../../../prisma/dev.db'),
    path.resolve(__dirname, '../../prisma/dev.db'),
    path.resolve(__dirname, '../prisma/dev.db'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return `file:${candidate}`;
    }
  }

  return `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
