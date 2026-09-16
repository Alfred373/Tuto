# Documentation — Assessment 1: Authentication

## 1. What This Is

This assessment slice implements the comprehensive Authentication and Identity layer for Tuto, a mobile-first exam preparation web application for Nigerian secondary students. It handles student registration, login via both phone (OTP) and email, strict parental consent gating for minors under 13, and secure session management.

**Deliberate Exclusions:** This slice focuses strictly on identity. It excludes the core AI solve pipeline (Gemini/SymPy), payment processing (Paystack), usage metering (UsageCounter), and Cloudflare R2 image handling, which are handled in separate service slices.

## 2. How to Run It

**Prerequisites:** 
- Node.js 22 LTS
- pnpm (package manager)
- PostgreSQL database (with `pgvector` extension installed)

**Setup Steps:**
1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the example environment file and configure your local variables (e.g., database connection string):
   ```bash
   cp .env.example .env
   ```
3. Run database migrations to set up the schema:
   ```bash
   pnpm exec prisma migrate dev
   ```
4. Start the Next.js development server:
   ```bash
   pnpm run dev
   ```

## 3. The Flow, Step by Step

### Email Authentication & Password Reset
1. **Sign in / Sign up via Email (`features/identity/service.ts` -> `loginStudentWithEmail`)**: Takes an email and password. If the user doesn't exist, it creates a `User` and `StudentProfile`, hashing the password, and sends an async welcome email.
2. **Email Verification**: Generates a 6-digit numeric token (`generateVerificationCode` in `features/identity/verification.ts`), stores its SHA-256 hash in the database, and emails the plaintext to the user. Verified via `verifyEmailTokenAction` in `app/actions/auth.ts`.
3. **Password Reset (`features/identity/service.ts` -> `requestPasswordReset` & `resetPassword`)**: Checks if the user exists, generates a 6-digit numeric reset code, emails it, and stores the hash. The user inputs the code and new password in `/auth`, submitting to `resetPasswordAction`, which verifies the code against the stored hash and updates the `passwordHash`.
4. **Session Management**: Successful actions call `setSessionUser` in `features/identity/session.ts` to log the user in.

## 4. The Data Model

The schema is defined in Prisma (`prisma/schema.prisma`) targeting PostgreSQL with the `citext` and `pgvector` extensions. It enforces strict relational constraints, atomic writes, and immutable audit logs.

### 4.1 Identity & Access Control

| Model | Field | Type | Attributes / Constraints | Description |
|---|---|---|---|---|
| **User** | `id` | `String` | `@id @default(cuid())` | Non-enumerable unique CUID primary key. |
| | `role` | `UserRole` | `@default(STUDENT)` | Enum: `STUDENT`, `PARENT`, `REVIEWER`, `ADMIN`. |
| | `phone` | `String?` | `@unique` | E.164 formatted phone number. |
| | `email` | `String?` | `@unique @db.Citext` | Case-insensitive unique email address. |
| | `displayName` | `String?` | Nullable | Full name of the student or parent. |
| | `passwordHash` | `String?` | Nullable | Argon2/bcrypt hash; never plaintext. |
| | `phoneVerified` | `Boolean` | `@default(false)` | OTP verification state. |
| | `emailVerified` | `Boolean` | `@default(false)` | Email token confirmation state. |
| | `emailVerificationToken` | `String?` | Nullable | SHA-256 hash of the 6-digit confirmation code. |
| | `emailVerificationTokenExpiresAt` | `DateTime?` | Nullable | 15-minute token TTL. |
| | `passwordResetToken` | `String?` | Nullable | SHA-256 hash of password reset OTP. |
| | `createdAt`, `updatedAt` | `DateTime` | `@default(now())`, `@updatedAt` | UTC audit timestamps. |
| **StudentProfile** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `userId` | `String` | `@unique`, FK -> `User` | 1-to-1 relation with `User(id)` on `onDelete: Cascade`. |
| | `classLevel` | `ClassLevel` | Required | Enum: `JSS1` through `SS3`. |
| | `targetExam` | `TargetExam` | `@default(NONE)` | Enum: `WAEC`, `NECO`, `JAMB`, `NONE`. |
| | `isMinorUnder13` | `Boolean` | `@default(false)` | Flag driving the strict parental consent lockout gate. |
| | `consentGrantedAt` | `DateTime?` | Nullable | Timestamp of verified guardian OTP consent. |
| | `consentPhone` | `String?` | Nullable | Guardian's phone number, distinct from student's. |
| **GuardianLink** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `guardianId` | `String` | FK -> `User` (`GuardianUser`) | Parent account (`onDelete: Cascade`). |
| | `studentId` | `String` | FK -> `User` (`StudentGuardian`) | Student account (`onDelete: Cascade`). |
| | `linkCode` | `String` | `@unique` | Secure random link invitation code. |
| | `confirmedAt` | `DateTime?` | Nullable | Timestamp of link confirmation. |
| **Device** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `userId` | `String` | FK -> `User` | User device relationship (`onDelete: Cascade`). |
| | `fingerprint` | `String` | Required | Browser/client device fingerprint hash. |

### 4.2 Billing & Subscriptions

| Model | Field | Type | Attributes / Constraints | Description |
|---|---|---|---|---|
| **Plan** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `code` | `String` | `@unique` | System slug: `free`, `plus_monthly`, `plus_annual`. |
| | `tier` | `PlanTier` | Required | Enum: `FREE`, `PLUS`, `ATLAS`. |
| | `interval` | `BillingInterval?`| Nullable | Enum: `MONTHLY`, `ANNUAL` (null for `FREE`). |
| | `priceKobo` | `Int` | Required | Whole integer in kobo (e.g. 249,900 kobo = ₦2,499). |
| | `dailyQuestionCap` | `Int?` | Nullable | 5 for Free, null for Plus (fair use unlimited). |
| | `monthlyQuestionCap` | `Int?` | Nullable | 60 for Free, null for Plus. |
| **Subscription** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `userId` | `String` | FK -> `User` | Subscribing user (`onDelete: Cascade`). |
| | `planId` | `String` | FK -> `Plan` | Associated plan row. |
| | `status` | `SubscriptionStatus` | `@default(ACTIVE)` | Enum: `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`. |
| | `currentPeriodStart` | `DateTime` | Required | Period start, strictly synchronized with payment `paidAt`. |
| | `currentPeriodEnd` | `DateTime` | Required | Period end (+1 month or +1 year from `paidAt`). |
| | `flutterwaveSubCode` | `String?` | Indexed | Provider recurring subscription reference. |
| **Payment** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `subscriptionId` | `String` | FK -> `Subscription` | Linked subscription (`onDelete: Cascade`). |
| | `amountKobo` | `Int` | Required | Whole integer in kobo. |
| | `feeKobo` | `Int?` | Nullable | Provider transaction processing fee in kobo. |
| | `flutterwaveRef` | `String` | `@unique` | Transaction reference; serves as idempotency key. |
| | `channel` | `String?` | Nullable | Payment channel: `card`, `bank_transfer`, `ussd`. |
| | `paidAt` | `DateTime?` | Nullable | Provider timestamp when funds were charged. |
| **PaymentLog** | `id` | `String` | `@id @default(cuid())` | Primary key. |
| | `source` | `PaymentLogSource` | Required | Enum: `WEBHOOK`, `REDIRECT_SYNC`, `API_VERIFY`. |
| | `event` | `String` | Required | Provider event identifier (e.g. `charge.completed`). |
| | `flutterwaveRef` | `String?` | Indexed | Provider reference for lookup. |
| | `txRef` | `String?` | Indexed | Internal transaction tracking reference. |
| | `userId` | `String?` | Indexed | Associated user ID. |
| | `verified` | `Boolean` | `@default(false)` | Cryptographic verification / API check outcome. |
| | `payload` | `Json` | Required | Full raw provider payload for forensic auditing. |

---

## 5. The Concepts

### 1. Server-Authoritative Identity & Web Crypto Sessions
* **Stateless HMAC-SHA256 Cookies:** Rather than storing sessions in a database table or Redis cache that incurs network roundtrips on throttled 3G connections, Tuto uses signed HTTP-only cookies (`tuto_session`) with a 90-day max age.
* **Platform Primitives:** Signed and verified using platform `crypto.subtle` (Web Crypto API) rather than third-party dependencies.
* **Zero Client Trust:** The client never dictates its own user ID, class level, or plan tier. Every route and server action fetches or verifies session credentials server-side from the verified cookie.

### 2. Child Protection by Architecture (NDPR & COPPA Compliance)
* **Default-Locked State:** When a student enters a date of birth indicating they are under 13 years old (`isMinorUnder13`), the account is created locked.
* **Hard Middleware & Route Gating:** Locked minors cannot access the `/solve`, `/quiz`, or `/dashboard` surfaces and are redirected to `/consent`.
* **Out-of-Band Guardian Consent:** Consent requires an OTP sent to a guardian’s verified phone number that is distinct from the student’s phone number. The consent event is stored with an immutable timestamp and the consenting number as legal proof.

### 3. Dual-Layer Resilient Payment Verification & Idempotency
* **The Webhook Delivery Problem:** In Nigerian networks and local/staging environments, webhooks can be dropped, delayed, or fail to hit local development ports without tunnels.
* **Dual-Path Architecture:** Tuto implements two synchronized verification layers:
  1. **Asynchronous Webhooks (`/api/webhooks/flutterwave`):** Cryptographically checks Flutterwave's `verif-hash` header against `FLW_SECRET_HASH` and validates payload schemas with Zod.
  2. **Synchronous Redirect Fallback (`syncPaymentFromRedirect` on `/dashboard?checkout=success`):** Directly queries Flutterwave's `/transactions/:id/verify` REST endpoint using secret key authentication to verify payment immediately when the user returns.
* **Atomic Idempotency:** Both paths execute identical business logic wrapped in `db.$transaction` gated by `Payment.flutterwaveRef`. If a transaction has already been recorded, subsequent events exit safely without double-crediting or extending periods twice.

### 4. Financial Representation Rules (Integer Kobo)
* Floating-point numbers (`0.1 + 0.2 = 0.30000000000000004`) lead to rounding errors, reconciliations failures, and regulatory non-compliance.
* Every monetary value across the database, business logic, APIs, and logs is stored as an integer number of **kobo** (`₦2,499 = 249900 kobo`). Conversion to naira is purely a presentation-layer concern.

### 5. Multi-Payment Option Flexibility
* Many Nigerian students and parents lack international-enabled cards or prefer direct virtual account transfers and USSD banking codes over entering card PANs.
* Checkout requests explicitly declare `payment_options: 'card,banktransfer,ussd,account,qr'` on Flutterwave's hosted gateway. Card details never touch Tuto servers (PCI-DSS compliance).

### 6. Audit-Grade Payment Logging (`PaymentLog`)
* The `PaymentLog` table serves as the single source of truth for all payment activities. Every webhook receipt, invalid signature attempt, and redirect verification is recorded with its verification status, client IP address, and raw payload.


## 6. What Went Wrong

### 1. Next.js Image Caching on Auth Page
- **Symptom:** Modifying the hero image (`auth-hero.jpg`) on the `/auth` page did not reflect in the browser.
- **Root Cause:** Next.js aggressively caches images loaded via string paths (e.g., `<Image src="/images/auth-hero.jpg" />`).
- **Fix:** Switched to a static import (`import authHeroImg from '@/public/images/auth-hero.jpg'`) in `app/(marketing)/auth/page.tsx`, which causes Next.js to append a unique hash to the filename and automatically invalidate the cache.

### 2. Password Reset OTP Schema Mismatch
- **Symptom:** Entering the correct password reset code on the `/auth` page resulted in a validation error: "OTP must be numeric". Additionally, the code sent to users was an 8-character hex string (e.g., `ac7925...`).
- **Root Cause:** The `generateVerificationCode` function in `features/identity/verification.ts` was generating an 8-character hex string using `crypto.randomBytes(4).toString('hex')`. However, the frontend UI (`maxLength={6}`) and Zod validation schema (`otpSchema` expecting `/^\d{6}$/`) were built for a 6-digit numeric code.
- **Fix:** Updated `generateVerificationCode` to use `crypto.randomInt(100000, 1000000).toString()` to generate a compliant 6-digit numeric string.

## 7. What This Slice Does Not Handle

TODO: Features outside this assessment, unhandled production requirements, scaling limits, and time-bounded items.

## 8. If I Built This Again

TODO: Single most important technical decision or architecture choice to do differently.
