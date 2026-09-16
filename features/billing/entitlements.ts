import { db } from '@/lib/db';

export async function entitlementsFor(userId: string) {
  const sub = await db.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { plan: true },
  });

  const plan = sub?.plan ?? await freePlan();
  return {
    dailyQuestionCap: plan.dailyQuestionCap,
    monthlyQuestionCap: plan.monthlyQuestionCap,
    allowsOffline: plan.allowsOffline,
    allowsParentSummary: plan.allowsParentSummary,
  };
}

export interface UserPlanInfo {
  tier: 'FREE' | 'PLUS' | 'ATLAS';
  code: string;
  name: string;
  isPlus: boolean;
  currentPeriodEnd: Date | null;
  currentPeriodStart: Date | null;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | null;
}

export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  const sub = await db.subscription.findFirst({
    where: { 
      userId, 
      status: 'ACTIVE',
      currentPeriodEnd: { gte: new Date() }
    },
    orderBy: { currentPeriodEnd: 'desc' },
    include: { plan: true },
  });

  if (!sub) {
    const free = await freePlan();
    return {
      tier: free.tier,
      code: free.code,
      name: 'Free',
      isPlus: false,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      status: null,
    };
  }

  return {
    tier: sub.plan.tier,
    code: sub.plan.code,
    name: sub.plan.interval === 'ANNUAL' ? 'Tuto Plus Annual' : 'Tuto Plus Monthly',
    isPlus: sub.plan.tier === 'PLUS',
    currentPeriodEnd: sub.currentPeriodEnd,
    currentPeriodStart: sub.currentPeriodStart,
    status: sub.status,
  };
}

async function freePlan() {
  const plan = await db.plan.findUnique({ where: { code: 'free' } });
  if (!plan) {
    throw new Error('Free plan not found in database');
  }
  return plan;
}

