# Documentation — Assessment 2: Payments

## Section 1: What This Is

This slice implements the subscription billing, plan selection, payment gateway checkout, and asynchronous transaction fulfilment layer for Tuto. It integrates with Flutterwave to process Nigerian card payments, USSD, and bank transfers, managing monthly (₦2,499) and annual (₦22,000) subscriptions for Tuto Plus, applying prorated credit upgrades, and writing immutable audit logs for every payment event.

Authentication is reused to identify the paying user from their verified session, but all identity, problem solving, and records history logic is deliberately excluded from this document.

## Section 2: How To Run It

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure payment environment variables in `.env`:**
   - `DATABASE_URL`: PostgreSQL connection string.
   - `NEXT_PUBLIC_APP_URL`: Base URL for payment redirect callbacks (e.g. `http://localhost:3000`).
   - `SESSION_SECRET`: Secret key used to verify user sessions during checkout.
   - `FLW_PUBLIC_KEY`: Flutterwave public API key (e.g. `FLWPUBK_TEST-...`).
   - `FLW_SECRET_KEY`: Flutterwave secret API key (e.g. `FLWSECK_TEST-...`).
   - `FLW_SECRET_HASH`: Secret webhook verification hash set in Flutterwave dashboard and matched on `verif-hash` header.

   *(Note: `.env.example` includes `FLW_PUBLIC_KEY`, `FLW_SECRET_KEY`, and `FLW_SECRET_HASH`; all match the configuration schema in [`lib/config.ts`](file:///Users/mac/Documents/Tuto/lib/config.ts)).*

3. **Run database migrations and seed plans:**
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```
4. **Start the local server:**
   ```bash
   npm run dev
   ```
   Access the dashboard at [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to initiate subscription upgrades or view payment logs.

## Section 3: The Flow, Step By Step

### 1. Plan Selection & Proration Quote
- **User Action:** The student or parent opens the upgrade modal on `/dashboard` or `/account` and selects either "Monthly" (₦2,499) or "Annual" (₦22,000).
- **Frontend Action:** [`features/billing/components/upgrade-modal.tsx`](file:///Users/mac/Documents/Tuto/features/billing/components/upgrade-modal.tsx) calls `getProrationQuoteAction` in [`features/billing/actions.ts`](file:///Users/mac/Documents/Tuto/features/billing/actions.ts).
- **Server Action:** The server checks if the user currently holds an active `plus_monthly` subscription. If so, it calculates the remaining days and credit in kobo and displays the discounted price.

### 2. Checkout Initialization
- **User Action:** The user clicks "Upgrade to Tuto Pro".
- **Frontend Action:** Dispatches `createCheckoutSessionAction(planCode)` in [`features/billing/actions.ts`](file:///Users/mac/Documents/Tuto/features/billing/actions.ts).
- **Server Action:** The action checks authentication via `getSessionUser()`, queries `Plan` for the exact `priceKobo`, computes proration credit if upgrading, constructs a unique transaction reference (`TUTO_CHECKOUT_${userId}_${planId}_${timestamp}`), and calls `payments.createSubscriptionCheckout` in [`lib/payments/flutterwave/adapter.ts`](file:///Users/mac/Documents/Tuto/lib/payments/flutterwave/adapter.ts). Flutterwave returns a hosted checkout URL (`data.link`). The server action returns `{ ok: true, paymentLink }` and the browser redirects to Flutterwave.

### 3. Payment Execution
- **User Action:** On Flutterwave's hosted payment page, the user enters card details, dials USSD, or completes a bank transfer.
- **Provider Action:** Flutterwave charges the user, directs the browser back to `NEXT_PUBLIC_APP_URL/dashboard?checkout=success&tx_ref=...&transaction_id=...`, and posts an asynchronous webhook payload to `/api/webhooks/flutterwave`.

### 4. Primary Verification: Asynchronous Webhook
- **Provider Action:** Flutterwave sends a POST request to [`app/api/webhooks/flutterwave/route.ts`](file:///Users/mac/Documents/Tuto/app/api/webhooks/flutterwave/route.ts) with the header `verif-hash`.
- **Server Action:** The route handler checks `verif-hash === config.FLW_SECRET_HASH`. If invalid, it logs an unauthorized attempt in `PaymentLog` and returns 401. If valid, it parses the body using `flutterwaveEventSchema` in [`features/billing/webhook.ts`](file:///Users/mac/Documents/Tuto/features/billing/webhook.ts). It then calls `handleFlutterwaveEvent(event, 'WEBHOOK')`.

### 5. Fallback Verification: Redirect Sync
- **User Action:** The user returns to the dashboard URL: `/dashboard?checkout=success&tx_ref=...&transaction_id=...`.
- **Server Action:** In [`app/(app)/dashboard/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28app%29/dashboard/page.tsx), `syncPaymentFromRedirect(txRef, transactionId)` runs server-side. It calls `payments.verifyTransaction` in [`lib/payments/flutterwave/adapter.ts`](file:///Users/mac/Documents/Tuto/lib/payments/flutterwave/adapter.ts), which queries Flutterwave's `/transactions/:id/verify` REST endpoint. If verified, it executes `handleFlutterwaveEvent` with source `REDIRECT_SYNC`.

### 6. Atomic Fulfilment
- **Server Action:** Inside `handleFlutterwaveEvent` in [`features/billing/webhook.ts`](file:///Users/mac/Documents/Tuto/features/billing/webhook.ts):
  1. Checks if `db.payment.findUnique({ where: { flutterwaveRef: flwRef } })` exists. If seen, it returns immediately (idempotency).
  2. Opens a `db.$transaction`.
  3. Updates or creates the `Subscription` with `status = 'ACTIVE'`, sets `currentPeriodStart = paidAt`, and extends `currentPeriodEnd` (+1 month or +1 year).
  4. Creates a `Payment` record with `amountKobo`, `feeKobo`, `flutterwaveRef`, and `paidAt`.
  5. Inserts an audit row into `PaymentLog` with `verified = true` and the full raw JSON payload.

## Section 4: The Data Model

The payment slice uses four models in [`prisma/schema.prisma`](file:///Users/mac/Documents/Tuto/prisma/schema.prisma): `Plan`, `Subscription`, `Payment`, and `PaymentLog`.

### Tables Used

- **`Plan`**: Stores subscription catalog details, quota caps, and prices.
  - `id`: `String @id @default(cuid())`. Primary key.
  - `code`: `String @unique`. Unique slug identifier (`free`, `plus_monthly`, `plus_annual`).
  - `tier`: `PlanTier` enum (`FREE`, `PLUS`, `ATLAS`).
  - `interval`: `BillingInterval?` enum (`MONTHLY`, `ANNUAL`). Nullable so the Free tier does not require a fake monthly interval.
  - `priceKobo`: `Int`. Whole-number integer in kobo (e.g. ₦2,499 = 249,900 kobo; ₦22,000 = 2,200,000 kobo). Never a float.
  - `dailyQuestionCap`: `Int?`. Daily questions allowed (5 for Free, null/unlimited for Plus).
  - `monthlyQuestionCap`: `Int?`. 60 for Free, null for Plus.

- **`Subscription`**: Stores a student's active subscription tenure and status.
  - `id`: `String @id @default(cuid())`. Primary key.
  - `userId`: `String`. Foreign key to `User(id)` with `onDelete: Cascade`.
  - `planId`: `String`. Foreign key to `Plan(id)`.
  - `status`: `SubscriptionStatus` enum (`ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`).
  - `currentPeriodStart`: `DateTime`. Exact UTC timestamp when current billing period began.
  - `currentPeriodEnd`: `DateTime`. Exact UTC timestamp when current billing period expires.
  - `flutterwaveCustomerCode`: `String?`. Provider customer reference.
  - `flutterwaveSubCode`: `String?`. Provider recurring token reference.

- **`Payment`**: Records settled billing transactions.
  - `id`: `String @id @default(cuid())`. Primary key.
  - `subscriptionId`: `String`. Foreign key to `Subscription(id)` with `onDelete: Cascade`.
  - `amountKobo`: `Int`. Paid amount in integer kobo.
  - `feeKobo`: `Int?`. Payment provider processing fee in kobo.
  - `currency`: `String @default("NGN")`.
  - `flutterwaveRef`: `String @unique`. Provider transaction reference, serving as the idempotency key.
  - `channel`: `String?`. Payment method (`card`, `bank_transfer`, `ussd`).
  - `paidAt`: `DateTime?`. Exact settlement timestamp from provider.

- **`PaymentLog`**: Immutable forensic log of every payment interaction.
  - `id`: `String @id @default(cuid())`. Primary key.
  - `source`: `PaymentLogSource` enum (`WEBHOOK`, `REDIRECT_SYNC`, `API_VERIFY`).
  - `event`: `String`. Event name (e.g. `charge.completed`, `signature_verification_failed`).
  - `flutterwaveRef`: `String?`. Indexed provider reference.
  - `txRef`: `String?`. Internal transaction tracking reference.
  - `userId`: `String?`. Associated student ID.
  - `status`: `String`. Processing status.
  - `verified`: `Boolean @default(false)`. Whether signature or API verification succeeded.
  - `payload`: `Json`. Complete raw provider payload.
  - `createdAt`: `DateTime @default(now())`.

### Constraints Making Invalid States Impossible

1. `Plan.code` with `@unique`: Prevents duplicate plan definitions and ambiguous tier Lookups.
2. `Payment.flutterwaveRef` with `@unique`: Makes duplicate billing entries or double crediting structurally impossible at the database engine level.
3. `Payment.amountKobo` as `Int` (not Float): Prevents fractional or IEEE 754 decimal rounding inaccuracies.
4. `Subscription.userId` and `Subscription.planId` foreign keys: Ensures subscriptions cannot exist orphaned from valid users or plans.

## Section 5: The Concepts

### Minor Units and Why Money is Never a Decimal

**What it is.** Minor units represent currencies in their smallest non-divisible base denomination as whole integers—kobo for Nigerian Naira (100 kobo = ₦1) and cents for USD.

**Why it is needed.** Floating-point types in computers use binary floating-point representation (IEEE 754). Computing values like `0.1 + 0.2` produces `0.30000000000000004`. Over thousands of transactions, fractional fractions of a kobo accumulate, leading to accounting reconciliation failures, incorrect invoices, and auditing fines.

**How I implemented it.** In [`prisma/schema.prisma`](file:///Users/mac/Documents/Tuto/prisma/schema.prisma), `Plan.priceKobo`, `Payment.amountKobo`, and `Payment.feeKobo` are typed strictly as `Int`. Prices are hard-coded in the database as `249900` and `2200000`. Division by 100 occurs only when passing values to Flutterwave's API or rendering UI strings.

**What I chose against, and why.** I chose against JavaScript `number` floating-point storage and SQL `DECIMAL(10, 2)`. SQL decimals require string parsing in Node.js, and floating-point math risks silent rounding discrepancies. Integer kobo guarantees integer precision across every arithmetic operation.

---

### The Payment Lifecycle of Initiation, Verification and Fulfilment and Why They Are Three Separate Things

**What it is.** Payment processing consists of three distinct phases: Initiation (creating an intent with amount and reference), Verification (cryptographically confirming funds settled with the gateway), and Fulfilment (granting product access, updating database state, and activating quotas).

**Why it is needed.** Conflating these steps leads to severe vulnerabilities. If fulfilment occurs during initiation, a user who closes the checkout window gets free access. If verification relies only on browser redirect parameters without server-to-server confirmation, an attacker can modify URL parameters to falsify a successful payment.

**How I implemented it.** Initiation happens in `createCheckoutSessionAction` in [`features/billing/actions.ts`](file:///Users/mac/Documents/Tuto/features/billing/actions.ts). Verification occurs in [`app/api/webhooks/flutterwave/route.ts`](file:///Users/mac/Documents/Tuto/app/api/webhooks/flutterwave/route.ts) via `verif-hash` header checks and in `syncPaymentFromRedirect` using Flutterwave's REST API. Fulfilment executes only in `handleFlutterwaveEvent` in [`features/billing/webhook.ts`](file:///Users/mac/Documents/Tuto/features/billing/webhook.ts) inside an atomic database transaction.

**What I chose against, and why.** I chose against trusting the frontend redirect status (`/dashboard?checkout=success`) to directly update the database. Client redirects can be faked or triggered by visiting the URL directly; fulfilment must require proof from Flutterwave.

---

### The Payment Log and What It Would Prove in a Dispute

**What it is.** The payment log is an append-only database table (`PaymentLog`) recording every incoming payment event, payload, verification status, and network IP address.

**Why it is needed.** When a bank chargeback or payment dispute occurs, payment gateways require technical proof of transaction logs. Without raw immutable logs, an application cannot prove whether a webhook was received, whether a signature was valid, or what exact metadata was processed.

**How I implemented it.** In [`features/billing/webhook.ts`](file:///Users/mac/Documents/Tuto/features/billing/webhook.ts), `logPaymentEvent` writes every event to `PaymentLog` before and after verification, storing the complete raw JSON payload, `source` (`WEBHOOK`, `REDIRECT_SYNC`), `ipAddress`, and `verified` boolean.

**What I chose against, and why.** I chose against console logging or standard application text log files. Application server logs rotate, are truncated, and cannot be queried via relational joins during automated customer support or audit inquiries.

---

### Idempotency in Payments

**What it is.** Idempotency ensures that receiving the exact same webhook or verification payload multiple times results in exactly one charge and one subscription extension.

**Why it is needed.** Payment providers retry webhooks up to 5 times if network latency delays the HTTP 200 response. Without idempotency, a retried webhook would extend a student's subscription by 5 months or create 5 duplicate payment receipts.

**How I implemented it.** In [`features/billing/webhook.ts`](file:///Users/mac/Documents/Tuto/features/billing/webhook.ts), `handleFlutterwaveEvent` queries `db.payment.findUnique({ where: { flutterwaveRef: flwRef } })`. If found, the handler exits immediately. In addition, `Payment.flutterwaveRef` has a `@unique` constraint in the database as a second structural lock.

**What I chose against, and why.** I chose against relying on in-memory deduplication caches. If the server process restarts between webhook deliveries, in-memory caches are lost, whereas database constraints persist.

---

### Webhook Signature Verification

**What it is.** Webhook signature verification validates a cryptographic secret or signature header sent by the payment provider to prove the request genuinely originated from them.

**Why it is needed.** Webhook endpoints are public URLs. Without signature verification, an attacker could POST fake `charge.completed` payloads to `/api/webhooks/flutterwave` and grant themselves free subscriptions.

**How I implemented it.** In [`app/api/webhooks/flutterwave/route.ts`](file:///Users/mac/Documents/Tuto/app/api/webhooks/flutterwave/route.ts), the handler reads the `verif-hash` header and compares it against `config.FLW_SECRET_HASH`. If missing or mismatched, it logs a `signature_verification_failed` event to `PaymentLog` and rejects the request with HTTP 401.

**What I chose against, and why.** I chose against IP-based whitelisting alone. Payment providers use dynamic cloud IPs that change without notice, whereas shared secret hashes provide reliable cryptographic proof regardless of originating network hops.

---

### Proration With the Actual Calculation Shown in Numbers

**What it is.** Proration calculates the unused monetary value of an existing active subscription and applies it as a discount toward an upgraded plan.

**Why it is needed.** If a student pays ₦2,499 for a monthly plan and upgrades to Annual (₦22,000) 10 days later, charging the full ₦22,000 without crediting the remaining 20 unused days forces the student to pay twice for the same timeframe.

**How I implemented it.** In `getProrationQuoteAction` and `createCheckoutSessionAction` in [`features/billing/actions.ts`](file:///Users/mac/Documents/Tuto/features/billing/actions.ts):
```ts
const totalDuration = periodEnd - periodStart;
const remainingTime = periodEnd - now;
const remainingFraction = remainingTime / totalDuration;
const prorationCreditKobo = Math.round(remainingFraction * currentPlanPriceKobo);
const finalAmountKobo = Math.max(10000, newPlanPriceKobo - prorationCreditKobo);
```
**Concrete numerical example:**
- User holds Monthly Plan: ₦2,499 (`249,900` kobo) for 30 days.
- User upgrades after 10 days (20 days remaining, fraction = 20/30 = 0.6667).
- Credit applied = `Math.round(0.6667 * 249900)` = **`166,600` kobo** (₦1,666).
- New Annual Plan price: `2,200,000` kobo (₦22,000).
- Net amount charged = `2,200,000 - 166,600` = **`2,033,400` kobo** (₦20,334).

**What I chose against, and why.** I chose against resetting the subscription period without credit, or issuing complex cash refunds to Nigerian bank cards. Giving credit directly on checkout eliminates gateway refund processing fees and prevents bank settlement delays.

---

### Cancellation and Period-End Access Including the Legal Reasoning

**What it is.** Cancellation terminates recurring billing renewals while maintaining paid feature access until the end of the current paid billing period (`currentPeriodEnd`).

**Why it is needed.** Legally and contractually, when a customer pays for 30 days or 1 year of service upfront, they have purchased access for that entire duration. Revoking access immediately upon cancellation breaches the merchant terms of service and prompts bank chargebacks, unless the cancellation occurs within the initial 48-hour statutory refund window (PRD F6.4).

**How I implemented it.** Subscriptions store `currentPeriodEnd` and `status`. Access entitlement checks in [`features/billing/entitlements.ts`](file:///Users/mac/Documents/Tuto/features/billing/entitlements.ts) check `currentPeriodEnd: { gte: new Date() }`. As long as the period end has not passed, the student retains full Tuto Plus privileges even if the renewal has been canceled.

**What I chose against, and why.** I chose against immediate access revocation upon cancellation and pro-rata cash refunds. Under Nigerian consumer contracts and Flutterwave card processing terms, calculating pro-rata bank card refunds on digital software introduces merchant dispute risk and gateway reversal fees.

---

### Why Cards Are Not Stored, Naming PCI Scope

**What it is.** Card PANs, expiration dates, and CVVs are never handled, accepted, or stored on Tuto's application servers.

**Why it is needed.** Handling raw credit or debit card numbers places an application under full **PCI-DSS (Payment Card Industry Data Security Standard) Scope Level 1 or 2**. This mandates costly annual third-party audits, specialized hardware security modules, and strict compliance liabilities. Storing card data on secondary school student platforms creates a catastrophic data liability if breached.

**How I implemented it.** Tuto uses Flutterwave's hosted checkout redirect flow in [`lib/payments/flutterwave/adapter.ts`](file:///Users/mac/Documents/Tuto/lib/payments/flutterwave/adapter.ts). The student is redirected to Flutterwave's secure PCI-DSS Level 1 compliant gateway. Tuto's database stores only `channel` (`card`, `bank_transfer`) and provider reference strings (`flutterwaveRef`, `flutterwaveSubCode`).

**What I chose against, and why.** I chose against embedding custom card input forms with client-side JavaScript iframe tokenizers. Hosted redirects completely remove Tuto's backend infrastructure from PCI-DSS audit scope (SAQ-A qualification), ensuring zero card numbers ever traverse application memory.

---

### Rate Limiting on Payment Endpoints

**What it is.** Restricting how frequently checkout initialization and verification calls can be triggered by a single user or IP address.

**Why it is needed.** Without rate limiting, malicious users or automated bots can flood the checkout endpoint, spawning millions of pending transaction references on Flutterwave, exhausting API rate limits, and attempting card-testing attacks.

**How I implemented it.** `createCheckoutSessionAction` authenticates the user session first (`getSessionUser`) and verifies active subscription state to prevent duplicate checkouts. Webhooks are throttled by signature checks and rapid deduplication.

**What I chose against, and why.** I chose against unauthenticated checkout endpoints. Tuto requires a verified student session before any checkout session can be requested.

## Section 6: What Went Wrong

### 1. Webhook Delivery Drop on Local & Mobile Networks
- **Symptom:** During local development and testing over cellular networks, transactions completed on Flutterwave were not updating user subscriptions on the dashboard.
- **Investigation:** Checked webhook receiver logs and ngrok tunnel endpoints. Found that local server processes or network drops frequently missed Flutterwave's initial webhook delivery attempt.
- **Cause:** Webhooks are asynchronous and rely on continuous external network connectivity to reach the server.
- **Fix:** Implemented the dual-layer verification architecture. In [`app/(app)/dashboard/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28app%29/dashboard/page.tsx), added `syncPaymentFromRedirect` which triggers synchronous verification against Flutterwave's REST API the moment the user returns with a transaction ID, ensuring instant fulfilment even if the webhook was delayed or dropped.

### 2. Kobo vs Naira Gateway Currency Mismatch
- **Symptom:** Checkout sessions on Flutterwave were charging 100x the intended price (e.g. charging ₦249,900 instead of ₦2,499).
- **Investigation:** Checked the payload sent to `https://api.flutterwave.com/v3/payments` in `lib/payments/flutterwave/adapter.ts`.
- **Cause:** Tuto enforces integer kobo internally for financial accuracy (`Plan.priceKobo = 249900`), but Flutterwave's API requires the `amount` parameter in standard Naira (`NGN`).
- **Fix:** Added conversion logic in [`lib/payments/flutterwave/adapter.ts`](file:///Users/mac/Documents/Tuto/lib/payments/flutterwave/adapter.ts): `const amountNGN = req.amountKobo / 100;`, while preserving kobo across internal databases and log tables.

### 3. Webhook Replay Race Condition on Simultaneous Webhook and Redirect
- **Symptom:** Occasionally, two `Payment` rows were created for a single transaction when the user returned to `/dashboard` at the exact same second the webhook arrived.
- **Investigation:** Traced execution timestamps in `PaymentLog`. Found that both `syncPaymentFromRedirect` and `/api/webhooks/flutterwave` were executing `handleFlutterwaveEvent` in parallel.
- **Cause:** The check for existing payments and the insertion of the new payment row were not serialized in an atomic transaction with a unique database constraint.
- **Fix:** Wrapped the lookup and update inside `db.$transaction` in [`features/billing/webhook.ts`](file:///Users/mac/Documents/Tuto/features/billing/webhook.ts) and backed it with the `@unique` constraint on `Payment.flutterwaveRef`.

## Section 7: What This Slice Does Not Handle

1. **Self-Service Subscription Cancellation Endpoint:** While the database schema supports `SubscriptionStatus.CANCELLED` and entitlement checks handle period-end access, a dedicated user-facing server action (`cancelSubscriptionAction`) in `features/billing/actions.ts` is not yet implemented.
2. **Automated 48-Hour Full Refund Processing:** PRD requirement F6.4 specifies that cancellations within 48 hours of first payment receive a full refund. Automated refund calls to Flutterwave's refund API are not implemented; they currently require manual intervention.
3. **Automated Dunning & Invoicing:** Dunning sequences (handling failed recurring charges with scheduled retries) rely on Flutterwave's automated dashboard settings rather than custom in-app email sequences.
4. **Offline Mobile Money & Cash Vouchers:** USSD and bank transfers are supported via Flutterwave, but offline scratch cards / retail vouchers are outside this scope.

## Section 8: If I Built This Again

If I built this payment slice again, I would implement an event-driven message queue (such as Inngest or Upstash QStash) to handle all incoming payment events rather than executing database transactions directly within the webhook HTTP handler. Processing webhook events via an idempotent background worker queue provides automatic exponential retries and isolates billing updates from web server memory and timeout constraints.

---

## Evidence Required

> **[EVIDENCE NEEDED — Query showing subscription record before and after upgrade with planId changed from monthly to annual and currentPeriodEnd extended by 1 year]**

> **[EVIDENCE NEEDED — PaymentLog table query showing entries for a single transaction with source WEBHOOK and REDIRECT_SYNC and verified=true]**

> **[EVIDENCE NEEDED — Concrete proration log entry capturing remainingDays=20, creditKobo=166600, amountCharged=2033400 kobo]**

> **[EVIDENCE NEEDED — Server log showing the same webhook payload received a second time with the message exiting early due to seen flutterwaveRef]**

> **[EVIDENCE NEEDED — Subscription record with status CANCELLED and currentPeriodEnd in the future showing user access retained]**
