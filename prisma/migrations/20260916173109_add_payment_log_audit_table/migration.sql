-- CreateEnum
CREATE TYPE "PaymentLogSource" AS ENUM ('WEBHOOK', 'REDIRECT_SYNC', 'API_VERIFY');

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "source" "PaymentLogSource" NOT NULL,
    "event" TEXT NOT NULL,
    "flutterwaveRef" TEXT,
    "txRef" TEXT,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "amountKobo" INTEGER,
    "feeKobo" INTEGER,
    "currency" TEXT DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "channel" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_flutterwaveRef_idx" ON "PaymentLog"("flutterwaveRef");

-- CreateIndex
CREATE INDEX "PaymentLog_txRef_idx" ON "PaymentLog"("txRef");

-- CreateIndex
CREATE INDEX "PaymentLog_userId_idx" ON "PaymentLog"("userId");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");
