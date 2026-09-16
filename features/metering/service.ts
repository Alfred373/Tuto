import { db } from '@/lib/db';
import { entitlementsFor } from '@/features/billing/entitlements';

export function getUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function checkAndIncrementQuestionQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const entitlements = await entitlementsFor(userId);
  const today = getUtcMidnight();

  const counter = await db.usageCounter.upsert({
    where: {
      userId_day: {
        userId,
        day: today,
      },
    },
    create: {
      userId,
      day: today,
      questionsUsed: 1,
    },
    update: {
      questionsUsed: {
        increment: 1,
      },
    },
  });

  if (entitlements.dailyQuestionCap !== null && counter.questionsUsed > entitlements.dailyQuestionCap) {
    // Exceeded quota, revert increment
    await db.usageCounter.update({
      where: { id: counter.id },
      data: { questionsUsed: { decrement: 1 } },
    });
    return { allowed: false, remaining: 0 };
  }

  const remaining = entitlements.dailyQuestionCap !== null
    ? Math.max(0, entitlements.dailyQuestionCap - counter.questionsUsed)
    : 999999;
  return { allowed: true, remaining };
}

export async function refundQuestionQuota(userId: string): Promise<void> {
  const today = getUtcMidnight();
  try {
    const counter = await db.usageCounter.findUnique({
      where: {
        userId_day: {
          userId,
          day: today,
        },
      },
    });

    if (counter && counter.questionsUsed > 0) {
      await db.usageCounter.update({
        where: { id: counter.id },
        data: { questionsUsed: { decrement: 1 } },
      });
    }
  } catch {
    // Non-fatal rollback
  }
}
