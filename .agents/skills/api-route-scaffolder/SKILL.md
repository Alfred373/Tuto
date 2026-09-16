---
name: api-route-scaffolder
description: Use when creating or editing a route handler, server action, API endpoint, form submission, webhook receiver, or any server entry point. Teaches the opening ritual and thin-handler discipline.
---

# API Route Scaffolder

Builds a server entry point that checks the right things in the right order, then delegates.

Laws live in `.agents/rules/security.md`, `.agents/rules/money-and-billing.md`, and AGENTS.md section 4. This file is the order.

## The opening ritual

Every server entry point does these four in this exact order. Order matters: you cannot check ownership before you know who is asking, and you must not spend a question credit on input that will fail validation.

1. **Session.** Read the user from the session on the server. Never take a user ID, plan tier or class level from the client (`security.md` 2).

2. **Input.** Parse with a Zod schema. Reject before anything else runs (`coding-standards.md` 6).

3. **Ownership.** Scope every query by the session user ID. A student may only read their own submissions, solutions, quizzes and history (`security.md` 6). A parent linked by `GuardianLink` gets counts and scores, never question content (`security.md` 5).

4. **Limits.** Check three gates, in this order:
   - Account lock. An under-13 account without consent cannot reach the pipeline (`security.md` 7).
   - Rate limit. Per account, independent of tier (`security.md` 23).
   - Tier cap. Server-side, via `features/metering`, never in a component (`money-and-billing.md` 12).

Only after all four do you call the feature function.

## Procedure

1. Create the handler in `app/`. It contains routing only. No Prisma call, no model call, no business logic (AGENTS.md 29).

2. Define the input schema in the feature module, not the route file. Import it.

3. Run the four-step ritual above.

4. Call one function from `features/`. The handler passes validated input and the session user ID, and returns what comes back.

5. Map failures to a typed blocked response. Never return a bare 500 and never return a generic message. A blocked request tells the student why and what they can do (F6.3 requires the remaining allowance to be visible at all times).

6. Never log question content, transcribed text, phone numbers or image keys. Log IDs (`security.md` 11).

## Skeleton

```ts
// app/(app)/solve/actions.ts
'use server';

import { getSessionUser } from '@/features/identity/session';
import { submitQuestionInput } from '@/features/solve/schemas';
import { submitQuestion } from '@/features/solve/submit';
import type { BlockedReason } from '@/features/solve/types';

export async function submitQuestionAction(raw: unknown) {
  // 1. session
  const user = await getSessionUser();
  if (!user) return blocked('not_authenticated');

  // 2. input
  const parsed = submitQuestionInput.safeParse(raw);
  if (!parsed.success) return blocked('invalid_input');

  // 3. ownership — the feature scopes every query by this id
  // 4. limits — inside submitQuestion, which owns the metering call
  return submitQuestion({ userId: user.id, input: parsed.data });
}

function blocked(reason: BlockedReason) {
  return { ok: false as const, reason };
}
```

The blocked response the client renders:

```ts
type BlockedReason =
  | 'not_authenticated'
  | 'invalid_input'
  | 'consent_pending'     // security.md 7
  | 'rate_limited'        // security.md 23
  | 'daily_cap_reached'   // money-and-billing.md 8
  | 'monthly_cap_reached';

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: BlockedReason; remaining?: number };
```

Webhook receiver, which reverses the order because there is no session:

```ts
// app/api/webhooks/paystack/route.ts
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifySignature(raw, signature)) {
    return new Response('invalid signature', { status: 401 });
  }

  const parsed = paystackEvent.safeParse(JSON.parse(raw));
  if (!parsed.success) return new Response('bad payload', { status: 400 });

  await handlePaystackEvent(parsed.data); // idempotent, see paystack-billing
  return new Response('ok', { status: 200 });
}
```

## Traps

- Checking the cap in a React component and treating it as enforced. It is a display hint, nothing more.
- Reading `userId` from the request body. Read it from the session.
- Doing work before validating input, so a malformed request still costs a question credit.
- Returning a generic error for a cap hit. The student needs to know which cap and what remains.
- Counting a question that the pipeline declined to solve. Declines do not decrement the cap (PRD 6.4).
- Putting Prisma in the route file because the handler is small.
- Granting access on a client-side Paystack callback. Access comes from the verified webhook only.
- Forgetting the consent lock, so an under-13 account reaches the pipeline.

## Verify before done

- [ ] Session read on the server; nothing identifying comes from the client
- [ ] Zod validation before any work
- [ ] Every query scoped by the session user ID
- [ ] Consent lock, rate limit and tier cap all checked, in that order
- [ ] Cap checked server-side through `features/metering` only
- [ ] Handler contains no Prisma call and no model call
- [ ] Every failure returns a typed blocked reason, never a bare 500
- [ ] No question content, phone number or image key in any log
- [ ] Webhook handlers verify signature before doing anything

Tests to write: an unauthenticated call returns `not_authenticated`; a call with another student's ID returns nothing of theirs; a call at the daily cap returns `daily_cap_reached` with `remaining: 0`; a declined solve leaves the counter unchanged; a locked under-13 account returns `consent_pending`.