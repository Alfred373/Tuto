---
trigger: glob
---

# Money and Billing

Every rule here fails the task when broken, even if the checkout completes.

---

## Representation

1. Store and compute every amount in kobo, as a whole-number integer. Never a float, never a `Decimal`, never a formatted string. This includes intermediate values in memory.
2. Name every monetary field `...Kobo`. A field named `price` or `amount` is ambiguous and is a defect.
3. Never do arithmetic on a formatted string. Format for display only, at the last moment, in a presentation helper.
4. Round only at the point of display, and round consistently. Never let a rounding difference accumulate into a stored value.
5. Store costs in USD micros in `ModelCall.costMicros` and `UsageCounter.inferenceCostMicros`. Never mix naira and dollars in one field.

## Prices and caps

6. Never write a price, cap, fee or tier limit as a literal in application code, a component, or a config file. Read every one from the `Plan` table.
7. Plus is ₦2,499 monthly and ₦22,000 annually. Never round ₦2,499 to ₦2,500 — the exact figure sits one naira below the Paystack flat-fee waiver and was chosen for that reason (PRD 8.1).
8. Free tier is 5 questions per day and 60 per calendar month. Enforce both.
9. There is no quiz cap on any tier. Never add one. Never make a quiz consume a question credit (PRD 8.1).
10. Never change a price by editing code. Prices change by changing `Plan` rows.

## Metering

11. Every question credit increment goes through `features/metering`. Never increment `UsageCounter` from anywhere else.
12. Check the cap on the server before the pipeline starts. Never check it in a React component and consider it enforced.
13. Increment atomically with a single upsert keyed on `(userId, day)`. Never read-then-write — two devices on one account will race.
14. Count a question when the pipeline accepts it. Do not count a question that the pipeline declines to solve (PRD 6.4 / 8.1).
15. Days are UTC. Never reset a cap on local time.
16. Write `ModelCall` for every model call, including failures, and roll its cost into `UsageCounter.inferenceCostMicros`. An unmeasured margin is a fictional margin.
17. Never make a model call from a code path that cannot write a `ModelCall` row.

## Payments

18. Paystack only. Never call it directly — everything goes through `lib/payments`. Never add a second provider.
19. Never accept, store, log or transmit a card number, CVV or PAN. Card entry happens in Paystack's hosted flow. If you find yourself building a card form, stop and ask.
20. Verify the webhook signature before processing. Never act on an unsigned payload.
21. Make every webhook handler idempotent, keyed on `Payment.paystackRef`. The same event arriving twice must never create two payments or two subscriptions.
22. Never grant access on a client-side success callback. Access is granted by the verified webhook, never by the browser saying the payment worked.
23. Never mutate a subscription from the client. Subscription state changes come from the webhook or from an authenticated server action.

## Subscription lifecycle

24. Cancellation within 48 hours of the first payment refunds in full. Every other cancellation takes effect at period end and never refunds pro rata (F6.4).
25. Never prorate. The PRD specifies period-end changes; proration is a new billing behaviour and is out of scope.
26. Never delete a `Payment` or `Subscription` row. Mark state; keep history.
27. Never grant paid features on a subscription whose status is not `ACTIVE`. Check status, not the presence of a row.
28. When a subscription lapses, the account falls back to the free tier and its caps. Never leave a lapsed account on paid limits.

## Reporting

29. Whenever you touch anything in this file, state in your report which rules apply and how you satisfied each one.