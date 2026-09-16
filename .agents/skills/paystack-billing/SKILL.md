---
name: paystack-billing
description: Use when kobo moves — payments, checkout, the Paystack webhook, subscriptions, upgrades, downgrades, cancellation, refunds, plan changes, or tier caps. Teaches webhook order of operations and idempotency.
---

# Paystack Billing

Moves money without double-charging, double-granting, or losing a record.

Provider is Paystack and is locked (AGENTS.md section 2, `money-and-billing.md` 18). Laws live in `.agents/rules/money-and-billing.md` and `.agents/rules/security.md`. This file is the order.

## Webhook order of operations

Five steps. Do not reorder them. Each one protects the one after it.

1. **Read the raw body.** Not the parsed JSON. Signature verification needs the exact bytes.
2. **Verify the signature.** Reject with 401 if it fails. Never touch the payload first (`security.md` 24).
3. **Parse and validate with Zod.** Reject with 400 if it fails.
4. **Check idempotency by `paystackRef`.** If a `Payment` with that reference exists, return 200 and stop. Paystack delivers the same event twice (`money-and-billing.md` 21).
5. **Write `Payment` and update `Subscription` in one transaction.** Both or neither.

Return 200 quickly. A slow webhook gets retried, which is why step 4 exists.

## Procedure

1. **Read every price and cap from the `Plan` table.** Never write ₦2,499, 5, 60 or any fee as a literal anywhere in code (`money-and-billing.md` 6).

2. **Keep every amount in kobo as an integer.** Including values that only exist in memory for a moment (`money-and-billing.md` 1).

3. **Initialise checkout server-side.** Send the plan code, not a price. The client never sends an amount.

4. **Never build a card form.** Card entry happens in Paystack's hosted flow. If you find yourself writing a CVV field, stop (`money-and-billing.md` 19).

5. **Grant access on the verified webhook only.** Never on the client-side success callback (`money-and-billing.md` 22).

6. **Pair every balance change with its record.** A `Subscription` moving to `ACTIVE` and the `Payment` row that caused it are written in the same transaction. Never one without the other.

7. **Check status, not row existence.** A `Subscription` row with status `PAST_DUE` grants nothing (`money-and-billing.md` 27).

8. **On lapse, fall back to free tier caps.** Never leave a lapsed account on paid limits (`money-and-billing.md` 28).

9. **Handle cancellation two ways.** Within 48 hours of the first payment: full refund. Otherwise: effect at period end, no proration (`money-and-billing.md` 24, 25).

10. **Never delete a `Payment` or `Subscription` row.** Mark state, keep history (`money-and-billing.md` 26).

## Skeleton

```ts
// features/billing/webhook.ts
export async function handlePaystackEvent(event: PaystackEvent) {
  const ref = event.data.reference;

  // step 4 — idempotency by reference
  const seen = await db.payment.findUnique({ where: { paystackRef: ref } });
  if (seen) return;

  // step 5 — one transaction, both writes
  await db.$transaction(async (tx) => {
    const sub = await tx.subscription.findFirst({
      where: { paystackSubCode: event.data.subscription_code },
    });
    if (!sub) throw new UnknownSubscription(ref);

    await tx.payment.create({
      data: {
        subscriptionId: sub.id,
        amountKobo: event.data.amount,        // Paystack sends kobo
        feeKobo: event.data.fees ?? null,
        currency: 'NGN',
        status: event.data.status,
        channel: event.data.channel ?? null,
        paystackRef: ref,
        paidAt: new Date(event.data.paid_at),
      },
    });

    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(event.data.paid_at),
        currentPeriodEnd: periodEndFor(sub.planId, event.data.paid_at),
      },
    });
  });
}
```

Entitlement check, the only way to ask what a student may do:

```ts
// features/billing/entitlements.ts
export async function entitlementsFor(userId: string) {
  const sub = await db.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },           // status, not existence
    include: { plan: true },
  });

  const plan = sub?.plan ?? await freePlan();      // lapse falls back to free
  return {
    dailyQuestionCap: plan.dailyQuestionCap,       // null means fair use
    monthlyQuestionCap: plan.monthlyQuestionCap,
    allowsOffline: plan.allowsOffline,
    allowsParentSummary: plan.allowsParentSummary,
  };
}
```

## Traps

- Parsing the body before verifying the signature. The verification then runs on re-serialised bytes and fails or, worse, passes on something altered.
- Trusting the client-side success callback. A student can trigger it without paying.
- No idempotency check, so a retried webhook creates a second `Payment` and a second period.
- Writing `Payment` and updating `Subscription` in two separate calls. A crash between them leaves money taken and no access granted.
- Hardcoding ₦2,499 in a pricing component. It will be right until the day the `Plan` row changes.
- Rounding ₦2,499 to ₦2,500. That one naira is the Paystack flat-fee waiver.
- Storing an amount as a float because the UI shows a decimal.
- Prorating an upgrade. Not in scope.
- Deleting a cancelled subscription row.
- Granting paid features on a `PAST_DUE` subscription.

## Verify before done

- [ ] Signature verified on the raw body, before anything else
- [ ] Zod validation on the payload
- [ ] Idempotency keyed on `paystackRef`
- [ ] `Payment` and `Subscription` written in one transaction
- [ ] Every amount is integer kobo
- [ ] Every price and cap read from `Plan`, none literal in code
- [ ] Access granted by webhook only
- [ ] Entitlements check status, not row existence
- [ ] Lapse falls back to free tier caps
- [ ] 48-hour refund path and period-end cancellation both implemented
- [ ] No row deleted

Tests to write: the same webhook delivered twice creates one `Payment`; an invalid signature returns 401 and writes nothing; a transaction failure leaves neither row; a `PAST_DUE` subscription grants free tier caps; cancellation at 47 hours refunds and at 49 hours does not; every amount asserted as an integer.