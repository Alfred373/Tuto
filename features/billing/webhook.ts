import { db } from '@/lib/db';
import { z } from 'zod';

export const flutterwaveEventSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number(),
    tx_ref: z.string(),
    flw_ref: z.string(),
    device_fingerprint: z.string().optional(),
    amount: z.number(),
    currency: z.string(),
    charged_amount: z.number(),
    app_fee: z.number(),
    merchant_fee: z.number(),
    processor_response: z.string(),
    auth_model: z.string(),
    ip: z.string().optional(),
    narration: z.string().optional(),
    status: z.string(),
    payment_type: z.string().optional(),
    created_at: z.string(),
    account_id: z.number().optional(),
    customer: z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      phone_number: z.string().optional().nullable(),
      email: z.string().optional(),
      created_at: z.string().optional(),
    }),
  }),
});

export type FlutterwaveEvent = z.infer<typeof flutterwaveEventSchema>;

export async function handleFlutterwaveEvent(
  event: FlutterwaveEvent,
  source: 'WEBHOOK' | 'REDIRECT_SYNC' | 'API_VERIFY' = 'WEBHOOK'
) {
  if (event.event !== 'charge.completed' || event.data.status !== 'successful') {
    return;
  }

  const txRef = event.data.tx_ref;
  const flwRef = event.data.flw_ref;
  
  // Extract identifiers from txRef
  let subscriptionId: string | null = null;
  let checkoutUserId: string | null = null;
  let checkoutPlanId: string | null = null;

  const checkoutMatch = txRef.match(/^TUTO_CHECKOUT_([^_]+)_([^_]+)_/);
  if (checkoutMatch && checkoutMatch[1] && checkoutMatch[2]) {
    checkoutUserId = checkoutMatch[1];
    checkoutPlanId = checkoutMatch[2];
  } else {
    const subMatch = txRef.match(/^TUTO_SUB_([^_]+)_/);
    if (subMatch && subMatch[1]) {
      subscriptionId = subMatch[1];
    }
  }

  // Idempotency check by reference
  const seen = await db.payment.findUnique({ where: { flutterwaveRef: flwRef } });
  if (seen) return;

  // Single transaction for atomicity
  await db.$transaction(async (tx) => {
    // Parse the payment timestamp accurately
    const rawDate = event.data.created_at ? new Date(event.data.created_at) : new Date();
    const paidAt = isNaN(rawDate.getTime()) ? new Date() : rawDate;

    let targetPlan: { id: string; interval: string | null } | null = null;
    let subId = subscriptionId;

    if (subId) {
      const existingSub = await tx.subscription.findUnique({
        where: { id: subId },
        include: { plan: true },
      });
      if (!existingSub) {
        throw new Error(`Subscription not found for transaction ${txRef}`);
      }
      targetPlan = existingSub.plan;
    } else if (checkoutUserId && checkoutPlanId) {
      const plan = await tx.plan.findUnique({
        where: { id: checkoutPlanId },
      });
      if (!plan) {
        throw new Error(`Plan not found for transaction ${txRef}`);
      }
      targetPlan = plan;
    } else {
      throw new Error(`Transaction ${txRef} does not contain valid subscription or checkout IDs`);
    }

    // Calculate subscription period starting strictly from paidAt
    const nextPeriodEnd = new Date(paidAt);
    if (targetPlan.interval === 'ANNUAL') {
      nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
    } else {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    }

    if (subId) {
      await tx.subscription.update({
        where: { id: subId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: paidAt,
          currentPeriodEnd: nextPeriodEnd,
        },
      });
    } else if (checkoutUserId && checkoutPlanId) {
      const existing = await tx.subscription.findFirst({
        where: { userId: checkoutUserId, planId: checkoutPlanId },
      });

      if (existing) {
        const updated = await tx.subscription.update({
          where: { id: existing.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: paidAt,
            currentPeriodEnd: nextPeriodEnd,
          },
        });
        subId = updated.id;
      } else {
        const created = await tx.subscription.create({
          data: {
            userId: checkoutUserId,
            planId: checkoutPlanId,
            status: 'ACTIVE',
            currentPeriodStart: paidAt,
            currentPeriodEnd: nextPeriodEnd,
          },
        });
        subId = created.id;
      }
    }

    if (!subId) {
      throw new Error(`Could not determine subscription ID for transaction ${txRef}`);
    }

    // Convert NGN to kobo for fee and amount
    const feeKobo = Math.round(event.data.app_fee * 100);

    const payment = await tx.payment.create({
      data: {
        subscriptionId: subId,
        amountKobo: Math.round(event.data.amount * 100),
        feeKobo,
        currency: event.data.currency,
        status: event.data.status,
        channel: event.data.payment_type ?? null,
        flutterwaveRef: flwRef,
        paidAt,
      },
    });

    // Write audit-grade PaymentLog in the same transaction if available
    if ('paymentLog' in tx && typeof (tx as any).paymentLog?.create === 'function') {
      await (tx as any).paymentLog.create({
        data: {
          source,
          event: event.event,
          flutterwaveRef: flwRef,
          txRef,
          userId: checkoutUserId || (subId ? (await tx.subscription.findUnique({ where: { id: subId } }))?.userId : null),
          subscriptionId: subId,
          amountKobo: Math.round(event.data.amount * 100),
          feeKobo,
          currency: event.data.currency,
          status: event.data.status,
          channel: event.data.payment_type ?? null,
          verified: true,
          ipAddress: event.data.ip ?? null,
          payload: event as any,
        },
      });
    }
  });
}

export async function logPaymentEvent(data: {
  source: 'WEBHOOK' | 'REDIRECT_SYNC' | 'API_VERIFY';
  event: string;
  flutterwaveRef?: string | null;
  txRef?: string | null;
  userId?: string | null;
  subscriptionId?: string | null;
  amountKobo?: number | null;
  feeKobo?: number | null;
  currency?: string | null;
  status: string;
  channel?: string | null;
  verified: boolean;
  ipAddress?: string | null;
  payload: any;
}) {
  try {
    if ('paymentLog' in db && typeof (db as any).paymentLog?.create === 'function') {
      await (db as any).paymentLog.create({
        data: {
          source: data.source,
          event: data.event,
          flutterwaveRef: data.flutterwaveRef,
          txRef: data.txRef,
          userId: data.userId,
          subscriptionId: data.subscriptionId,
          amountKobo: data.amountKobo,
          feeKobo: data.feeKobo,
          currency: data.currency || 'NGN',
          status: data.status,
          channel: data.channel,
          verified: data.verified,
          ipAddress: data.ipAddress,
          payload: data.payload,
        },
      });
    }
  } catch (err) {
    console.error('Failed to record payment log:', err);
  }
}
