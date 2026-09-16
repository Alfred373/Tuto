import { PrismaClient } from '@prisma/client';
import { config } from './config';

/**
 * ============================================================================
 * Prisma Database Client Singleton
 * ============================================================================
 * 
 * AGENTS.md Rule 36: One PrismaClient, exported from lib/db.ts. Never instantiate another.
 * AGENTS.md Rule 32: Nothing reads process.env except lib/config.ts.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
