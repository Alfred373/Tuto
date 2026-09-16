-- DropIndex
DROP INDEX "PastQuestion_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "SolutionCache_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;
