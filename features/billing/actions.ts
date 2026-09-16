'use server';

import { getSessionUser } from '@/features/identity/session';
import { db } from '@/lib/db';
import { payments } from '@/lib/payments/flutterwave/adapter';

export type CheckoutResult = 
  | { ok: true; paymentLink: string }
  | { ok: false; reason: string; message: string };

export async function createCheckoutSessionAction(planCode: 'plus_monthly' | 'plus_annual'): Promise<CheckoutResult> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, reason: 'unauthorized', message: 'You must be signed in to subscribe.' };
  }

  // Look up the exact price from the database
  const plan = await db.plan.findUnique({
    where: { code: planCode }
  });

  if (!plan) {
    return { ok: false, reason: 'invalid_plan', message: 'The selected plan does not exist.' };
  }

  if (plan.priceKobo === 0) {
    return { ok: false, reason: 'free_plan', message: 'You cannot purchase a free plan.' };
  }

  let finalAmountKobo = plan.priceKobo;
  let prorationCreditKobo = 0;

  // Check if user already has an active subscription
  const existingActiveSub = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() },
    },
    include: { plan: true },
  });

  if (existingActiveSub) {
    if (existingActiveSub.plan.code === 'plus_annual') {
      return {
        ok: false,
        reason: 'already_annual',
        message: 'You already have an active Tuto Pro Annual subscription.',
      };
    }

    if (existingActiveSub.plan.code === planCode) {
      return {
        ok: false,
        reason: 'already_subscribed',
        message: 'You already have an active subscription to this plan.',
      };
    }

    // Prorated Upgrade: from Monthly to Annual
    if (existingActiveSub.plan.code === 'plus_monthly' && planCode === 'plus_annual') {
      const now = new Date();
      const periodStart = existingActiveSub.currentPeriodStart.getTime();
      const periodEnd = existingActiveSub.currentPeriodEnd.getTime();
      const totalDuration = Math.max(1, periodEnd - periodStart);
      const remainingTime = Math.max(0, periodEnd - now.getTime());
      const remainingFraction = remainingTime / totalDuration;

      prorationCreditKobo = Math.round(remainingFraction * existingActiveSub.plan.priceKobo);
      finalAmountKobo = Math.max(10000, plan.priceKobo - prorationCreditKobo);
    }
  }

  const txRef = `TUTO_CHECKOUT_${session.user.id}_${plan.id}_${Date.now()}`;

  // Prepare checkout request
  const req = {
    userId: session.user.id,
    email: session.user.email || session.user.phone || 'student@tuto.test',
    planId: plan.id,
    amountKobo: finalAmountKobo,
    interval: plan.interval || undefined,
    currency: plan.currency,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    customTxRef: txRef,
  };

  const response = await payments.createSubscriptionCheckout(req);

  if (response.ok && response.paymentLink) {
    return { ok: true, paymentLink: response.paymentLink };
  }

  return { ok: false, reason: 'provider_error', message: response.reason || 'Failed to initialize checkout.' };
}

export async function syncPaymentFromRedirect(txRef: string, transactionId?: string) {
  const result = await payments.verifyTransaction(txRef, transactionId);
  if (result.ok && result.data) {
    const { handleFlutterwaveEvent } = await import('./webhook');
    
    // Mimic webhook payload
    const mockEvent: any = {
      event: 'charge.completed',
      data: result.data
    };

    try {
      await handleFlutterwaveEvent(mockEvent, 'REDIRECT_SYNC');
    } catch (err) {
      console.error('Failed to sync payment from redirect:', err);
    }
  } else {
    const { logPaymentEvent } = await import('./webhook');
    await logPaymentEvent({
      source: 'REDIRECT_SYNC',
      event: 'redirect_verification_failed',
      txRef,
      status: 'failed',
      verified: false,
      payload: result,
    });
  }
}

export async function getProrationQuoteAction(): Promise<{
  canUpgrade: boolean;
  currentPlanCode: string;
  regularPriceKobo: number;
  proratedPriceKobo: number;
  creditKobo: number;
  remainingDays: number;
}> {
  const session = await getSessionUser();
  if (!session) {
    return {
      canUpgrade: false,
      currentPlanCode: 'none',
      regularPriceKobo: 2200000,
      proratedPriceKobo: 2200000,
      creditKobo: 0,
      remainingDays: 0,
    };
  }

  const annualPlan = await db.plan.findUnique({ where: { code: 'plus_annual' } });
  const regularPriceKobo = annualPlan?.priceKobo ?? 2200000;

  const existingActiveSub = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() },
    },
    include: { plan: true },
  });

  if (!existingActiveSub || existingActiveSub.plan.code !== 'plus_monthly') {
    return {
      canUpgrade: existingActiveSub?.plan.code !== 'plus_annual',
      currentPlanCode: existingActiveSub?.plan.code ?? 'free',
      regularPriceKobo,
      proratedPriceKobo: regularPriceKobo,
      creditKobo: 0,
      remainingDays: 0,
    };
  }

  const now = new Date();
  const periodStart = existingActiveSub.currentPeriodStart.getTime();
  const periodEnd = existingActiveSub.currentPeriodEnd.getTime();
  const totalDuration = Math.max(1, periodEnd - periodStart);
  const remainingTime = Math.max(0, periodEnd - now.getTime());
  const remainingFraction = remainingTime / totalDuration;
  const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

  const creditKobo = Math.round(remainingFraction * existingActiveSub.plan.priceKobo);
  const proratedPriceKobo = Math.max(10000, regularPriceKobo - creditKobo);

  return {
    canUpgrade: true,
    currentPlanCode: 'plus_monthly',
    regularPriceKobo,
    proratedPriceKobo,
    creditKobo,
    remainingDays,
  };
}
