# AGENTS.md — Tuto

This file tells you how to behave while building. It is not a description of the product. Every line here is an order.

The PRD (`Tuto-PRD-v0.2.md`) is the single source of truth for **what** to build. This file is the single source of truth for **how** to build it. Where they appear to conflict, follow this file and raise the conflict. Never resolve a conflict silently.

---

## 1. What is this project

Tuto is a mobile-first web application for Nigerian secondary students, JSS1 to SS3, roughly ages 11 to 17, preparing for WAEC, NECO and JAMB.

A student photographs an exam question. Tuto returns a five-step guided lesson: Understand, Solution, Explanation, Follow-up, Quiz. Every question is mapped to a syllabus topic. Students use it; parents pay for it.

**You are building v1 only.** v1 is defined in PRD section 3 as the Phase 2 exit state: the core solve loop, four subjects, two tiers (Free and Plus), Paystack payments, parent link, offline reading of history. Nothing else.

Assume the target user is on a shared low-end Android phone over a throttled 3G connection, paying for every megabyte. Every decision you make is judged against that device, not yours.

---

## 2. What is locked

You did not choose these. The team did. **Never change, swap, upgrade, wrap in an abstraction "for flexibility", or improve any item on this list.** If you believe one is wrong, stop and say so. Do not act on the belief.

### Stack

| Layer | Locked to |
|---|---|
| Framework | Next.js, App Router |
| Language | TypeScript, strict mode |
| ORM | Prisma |
| Database | PostgreSQL with the `pgvector` extension |
| Runtime | Node.js 22 LTS. The solve route runs on the Node runtime, never Edge |
| Package manager | pnpm |

### Services

| Purpose | Locked to |
|---|---|
| Payments | Paystack. Not Flutterwave, not Stripe, not anything else |
| Primary model | Gemini 2.5 Flash |
| Escalation model | **Undecided (PRD Q6).** Call it through the provider interface only. Never hardcode a second vendor |
| Symbolic verification | A separate Python service running SymPy, called over HTTP |
| Maths rendering | KaTeX, subset. Never MathJax |
| Object storage | Cloudflare R2 |
| Queue | Upstash QStash or Inngest, behind a queue interface |
| Analytics | PostHog |
| Errors | Sentry |

### Data model

The Prisma schema in PRD section 11 is the locked design. Specifically:

- **Never** add a field to `User` that belongs on `StudentProfile` or `UsageCounter`.
- **Never** collapse `UsageCounter` into a column on `User`. It is a separate table because metering is the highest-write path and must be atomic.
- **Never** remove a foreign key or an `onDelete` clause. They were added deliberately after review.
- **Never** give `SolutionCache` a relation to `User`. The absence is deliberate: a cache hit must leak nothing between students.
- The embedding dimension is `768` and is fixed by the embedding model. Changing it requires a backfill migration across two tables. **Never** change it without an explicit instruction.
- Any schema change is a migration with a name that says what it does. Never `prisma db push` against anything but a local scratch database.

---

## 3. What must never happen

Each line is a direct order. **Breaking any rule on this list means the task failed, even if the code compiles, the tests pass and the feature works in the browser.** Report a broken rule immediately; do not patch over it.

### Money

1. Store every amount in kobo, as a whole-number integer. Never a float, never a decimal, never a formatted string. Anywhere. Ever. This includes fees, refunds, totals and anything you compute in memory.
2. Tuto Plus is ₦2,499 monthly and ₦22,000 annually. Never round ₦2,499 to ₦2,500. The exact figure sits one naira below the Paystack flat-fee waiver and was chosen for that reason (PRD 8.1).
3. Never write a price, cap or fee as a literal in application code. Read them from the `Plan` table. A price that lives in two places will diverge.
4. Never take, store, log or transmit a raw card number, CVV or PAN. All card data goes through Paystack's hosted flow. If you find yourself building a card form, stop.
5. A cancellation within 48 hours of first payment refunds in full (F6.4). Every other cancellation takes effect at period end and never refunds pro rata.

### Access and metering

6. Enforce every tier cap **server-side**, against `UsageCounter`, in a single atomic upsert. Never trust a client-supplied count. Never check a cap in a React component and consider it enforced.
7. Free tier is 5 questions per day and 60 per calendar month (PRD 8.1). Enforce both.
8. There is **no quiz cap on any tier**. Never add one, never reintroduce one, never make a quiz consume a question credit. A quiz cap on free caps the company's north-star metric at 20 percent; this was v0.1's worst error and it is not coming back.
9. A question Tuto declines to solve never decrements the daily cap (PRD 6.4).
10. Write a `ModelCall` row for every single model call, including failures, with stage, model, tokens, cost in micros and latency. An unmeasured margin is a fictional margin. Never make a model call from a path that cannot write this row.

### Answer integrity

11. Never render a quantitative answer at `HIGH` confidence unless symbolic verification passed. If the verification service is down or times out, fall back to second-model verification and cap confidence at `MEDIUM` (PRD 6.2). Never let an outage silently promote confidence.
12. Never fabricate an answer. When the pipeline cannot solve reliably, return the decline state with the syllabus topic and related examples. A plausible guess presented as fact is the single fastest way to destroy this product (PRD R1).
13. Never render Step 2 (Solution) before the student has taken the F3.2 action. One tap, either path, but the action must happen. Never add a "skip" that bypasses it.
14. Never generate a written essay, essay body, or paragraphs a student could submit as their own (F4.3). English essay questions get structure, a thesis suggestion and marking-scheme guidance only. This is the line between a study tool and a cheating tool.
15. When an image contains more than one question, stop and ask which one. Never silently solve the first (F2.6).
16. Every rendered solution carries a working one-tap flag control (F3.7). A solution surface shipped without it is incomplete.
17. When a solution is served from cache, always populate `Solution.cacheId`. Never record a cache hit as an untraceable boolean. If a cached answer is later found wrong, you must be able to find every student who received it.

### Privacy, minors and data

18. Purge uploaded images from R2 within 24 hours of processing unless the student explicitly saved the session, and set `imagePurgedAt` when you do. The transcription persists; the photograph does not (PRD 7.5).
19. Never upload a raw camera file. Downscale to a 1,600px long edge and compress client-side first (F2.3). Never skip the client-side blur and brightness check (F2.4).
20. An account declaring an age under 13 is created **locked** and cannot solve until a parent confirms by OTP sent to a different phone number. Store the consent event with its timestamp and the consenting number (F1.4). Never ship a code path that lets a locked account reach the pipeline.
21. Never make solved questions publicly accessible, crawlable, or reachable by guessing an ID. Session URLs are authenticated and unlisted. Tuto does not index student questions and this is a deliberate contrast with competitors (PRD 7.5).
22. Never log question content, transcribed text, phone numbers or image keys to Sentry, PostHog or stdout. Log IDs.
23. Never send a student's question content to the linked parent. The weekly summary carries counts, subjects, topics and quiz scores only (F6.5).

### Scope

24. **Never build any part of the Atlas layer.** The Atlas models exist in the schema so the data shape is settled. No Atlas route, no Atlas UI, no Atlas generation code, no Atlas tier in the pricing table or the upgrade flow. It is Appendix A, deferred to Phase 3, conditional on a signal test that has not run (PRD 14.5).
25. Never ingest, seed, scrape, or commit any WAEC or NECO past-question or marking-scheme data until the Phase 0 rights gate closes (PRD 14.1). Build against synthetic fixtures. If you find yourself writing a scraper, stop.
26. Every `PastQuestion` row carries a `sourceLicence`. Never insert one without it.
27. Never build mastery tracking, adaptive study plans, weak-topic profiles, multi-question batch processing, a native app, a tutor marketplace, or a school or teacher dashboard. All are explicit non-goals for v1 (PRD 3.3).
28. Never implement a feature from a later phase because it "was easy while I was in there."

---

## 4. How the work is arranged

Routes are thin. Business logic lives in `features/`. Anything crossing a network boundary lives behind an interface in `lib/`.

```
tuto/
├─ app/                          # routing only. No business logic, no Prisma calls.
│  ├─ (marketing)/               # public pages, statically rendered
│  ├─ (app)/
│  │  ├─ solve/                  # capture + active session
│  │  ├─ solve/[sessionId]/      # rendered sequence
│  │  ├─ history/
│  │  ├─ account/
│  │  └─ parent/
│  └─ api/
│     ├─ webhooks/paystack/route.ts
│     └─ internal/verify/route.ts
│
├─ features/                     # one folder per capability. Where logic lives.
│  ├─ solve/
│  │  ├─ pipeline/               # stages 0–5, one file per stage
│  │  ├─ actions.ts              # server actions, thin
│  │  ├─ schemas.ts              # zod contracts for every stage boundary
│  │  └─ components/
│  ├─ quiz/
│  ├─ billing/                   # plans, subscriptions, Paystack webhook handling
│  ├─ metering/                  # UsageCounter reads and atomic increments
│  ├─ integrity/                 # IntegritySignal writes, honour-code prompts
│  ├─ identity/                  # auth, consent, guardian links
│  └─ history/
│
├─ lib/                          # adapters. Every external boundary, behind an interface.
│  ├─ db.ts                      # the single PrismaClient instance
│  ├─ ai/                        # provider interface + Gemini adapter. No vendor names outside.
│  ├─ verification/              # HTTP client for the Python service, with timeout + fallback
│  ├─ payments/                  # payment interface + Paystack adapter
│  ├─ storage/                    # R2 adapter
│  ├─ queue/                     # queue interface + adapter
│  ├─ cache/                     # SolutionCache lookup and write
│  ├─ observability/             # ModelCall writes, Sentry, PostHog
│  └─ config.ts                  # typed, validated env. Nothing reads process.env directly.
│
├─ components/ui/                # presentational only. No data fetching, no Prisma.
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts                    # synthetic fixtures only. Never real past questions.
├─ verification-service/         # Python + SymPy. Separate deploy. Own README, own tests.
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ benchmark/                 # the 500-item accuracy benchmark, run in CI
└─ scripts/
```

### Boundary rules

29. `app/` never imports Prisma and never calls a model provider. It calls a server action or a feature function.
30. `components/ui/` never fetches data and never imports from `features/`. Props in, markup out.
31. Every external call — model, payment, storage, queue, verification — goes through its `lib/` interface. Never import a vendor SDK outside its adapter folder. Swapping Paystack for Flutterwave at expansion must be one week of work, and it stays that way only if this rule holds.
32. Nothing reads `process.env` except `lib/config.ts`.
33. The solve pipeline enqueues work and streams results. Never implement it as a single blocking request handler. A dropped 3G connection must not lose a job the student already paid a credit for (PRD 7.1).
34. Never reimplement symbolic verification in TypeScript. There is no Node CAS that can do it, which is the entire reason the Python service exists. Call the service.
35. The verification service stays stateless and single-purpose. It never reads the database.
36. One `PrismaClient`, exported from `lib/db.ts`. Never instantiate another.

---

## 5. How the code should look

Modern, boring and readable. Aim for code a new engineer understands on first read.

- **TypeScript strict.** `strict: true`, `noUncheckedIndexedAccess: true`. Never `any`. Never `as` to silence an error — fix the type. `unknown` plus a narrowing check where input is genuinely unknown.
- **Validate at every boundary.** Zod schemas for every model response, every webhook payload, every form, every stage handoff in the pipeline. Model output is untrusted input.
- **Server Components by default.** Add `'use client'` only where you need state, an event handler or a browser API. Every client component you add costs bundle bytes against a hard budget.
- **Named exports** everywhere except Next.js route files, which require default exports.
- **Explicit return types** on exported functions.
- **Errors are values in the pipeline.** Each stage returns a discriminated result (`{ ok: true, data }` or `{ ok: false, reason }`) so failure states from PRD 6.4 are handled, not thrown past.
- **Never swallow an error.** No empty catch blocks. Catch, classify, record, degrade.
- **No `console.log` in committed code.** Use the observability module.
- **Naming:** `camelCase` variables and functions, `PascalCase` components and types, `SCREAMING_SNAKE` constants, `kebab-case` files.
- **Comments explain why, never what.** If you needed a comment to explain what the code does, rename things instead.
- **Keep functions under about 50 lines and files under about 300.** A pipeline stage that outgrows this is two stages.
- **No premature abstraction.** Two similar things are two things. Extract on the third.
- **Formatting is not your decision.** Prettier and ESLint config are committed. Never edit them to make an error go away.
- **Dependencies:** do not add one without asking. Every package is bytes on a 3G connection and a supply-chain surface.

---

## 6. What counts as done

A task is done when every box below is ticked. **End every task by outputting this checklist filled in, with the PRD requirement IDs you satisfied.** A task with an unticked box is not done, and saying it is done is itself a failure.

```
## Definition of Done — <task name>

Requirements satisfied
- [ ] PRD requirement IDs covered: F_._, F_._
- [ ] Nothing outside those IDs was built (no scope added)

Build and types
- [ ] `pnpm build` completes with zero errors
- [ ] `pnpm typecheck` passes with zero errors and zero new `any`
- [ ] `pnpm lint` passes with zero errors and zero new warnings

Database
- [ ] `prisma validate` passes
- [ ] `prisma format` applied
- [ ] Migration created with a descriptive name, and it runs forward cleanly

Tests
- [ ] Unit tests for new logic, covering the failure paths, not only the happy path
- [ ] Integration test for any new pipeline stage or route
- [ ] Existing tests still pass

Rule compliance (Section 3)
- [ ] No money handled as anything but integer kobo
- [ ] Any tier cap touched is enforced server-side against UsageCounter
- [ ] Any model call added writes a ModelCall row
- [ ] No confidence state promoted without verification
- [ ] No Atlas code, no later-phase scope, no real past-question data
- [ ] No question content, phone number or image key in any log

Performance (PRD 7.3)
- [ ] Solve route total transferred bytes still under 500KB
- [ ] JS bundle still under 180KB gzipped
- [ ] CI budget check passes

Reporting
- [ ] Every assumption I made, listed
- [ ] Every rule I could not follow and why, listed
- [ ] Files changed, listed
```

Never mark a box you did not verify. If a check cannot run in your environment, say so on that line rather than ticking it.

---

## 7. What to do when unsure

Stop. Ask. Do not improvise.

37. **Never invent scope.** If the task does not name it and the PRD does not specify it, it is not in scope. Ask.
38. **Never resolve an ambiguity by guessing.** The PRD has open questions (Q2 pricing, Q4 tagline, Q6 escalation model, Q9 Atlas pricing) that are deliberately unanswered. If your task depends on one, stop and say which question blocks you. Do not pick an answer and proceed.
39. **Never write placeholder or throwaway code to get unblocked.** No stubbed functions that return fake data, no `// TODO: implement properly`, no duplicated logic copied to avoid touching a shared file, no commented-out alternatives left in. Spaghetti written under uncertainty is worse than no code, because the next agent will build on it.
40. **Never delete or rewrite something you do not understand.** Ask what it is for.
41. **Never silently widen a change.** If fixing the thing you were asked to fix requires touching three other files, say so before you touch them.
42. **When a rule in section 3 blocks your task, the rule wins.** Report the block. Do not find a way around it.
43. **When this file and the PRD disagree, this file wins and you report the disagreement.** When the task and this file disagree, this file wins and you report it.

The shape of a good "unsure" response: state what you were asked, state precisely what is ambiguous, list the two or three options you see with their trade-offs, state which you would pick and why, and then stop and wait. Do not pick and proceed.