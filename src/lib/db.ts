import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

function getAbsoluteDatabaseUrl(): string {
  // If explicitly overridden via env var with an absolute file URL or other scheme, honor it
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:/')) {
    return process.env.DATABASE_URL;
  }

  // Candidate paths where dev.db may reside across different execution contexts
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

  // Fallback to resolving relative to process.cwd()
  return `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;
}

const dbUrl = getAbsoluteDatabaseUrl();

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
