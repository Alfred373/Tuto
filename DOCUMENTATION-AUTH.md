# Documentation — Assessment 1: Authentication

## Section 1: What This Is

This slice implements identity, registration, login, and session protection for Tuto. It allows Nigerian secondary students to create accounts using a phone number with one-time passwords (OTP) or an email address with a password. It verifies email addresses with numeric confirmation codes, enables password resets, issues tamper-proof session cookies, and enforces a strict parental consent gate for students under 13.

Deliberately not included in this slice are the solve pipeline (Gemini and DeepSeek AI reasoning), payment processing (Flutterwave), usage metering (`UsageCounter`), and cloud image storage. Those capabilities are isolated in separate slices to keep identity clean and independent of billing and inference dependencies.

## Section 2: How To Run It

1. **Install dependencies:**
   Ensure Node.js 22 LTS is active, then install project packages:
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   For this authentication slice, ensure the following environment variables are set in `.env`:
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/tuto?schema=public`).
   - `NODE_ENV`: Runtime environment (`development` or `production`).
   - `NEXT_PUBLIC_APP_URL`: Base application URL (e.g. `http://localhost:3000`).
   - `SESSION_SECRET`: Secret key of at least 16 characters used to sign HMAC-SHA256 session cookies.
   - `SMTP_HOST`: Mail server hostname (e.g. `smtp.gmail.com`).
   - `SMTP_PORT`: Mail server port (e.g. `587`).
   - `SMTP_USER`: Mail server authentication username.
   - `SMTP_PASS`: Mail server application password.

   *(Note: `.env.example` lists `SESSION_SECRET`, `DATABASE_URL`, and SMTP credentials accurately; all match the Zod validator in [`lib/config.ts`](file:///Users/mac/Documents/Tuto/lib/config.ts)).*

3. **Run database migrations:**
   Apply Prisma migrations to configure PostgreSQL tables:
   ```bash
   npx prisma migrate dev
   ```
4. **Seed database plans:**
   Seed initial plans required for user defaults:
   ```bash
   npm run db:seed
   ```
5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000/auth](http://localhost:3000/auth) to access the authentication interface.

## Section 3: The Flow, Step By Step

### 1. Phone Registration & OTP Login
- **User Action:** The student navigates to `/auth`, selects Phone, inputs their Nigerian phone number (e.g. `08012345678`), and clicks "Send OTP".
- **Frontend Action:** [`app/(marketing)/auth/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28marketing%29/auth/page.tsx) sends `{ phone }` to `requestOtpAction` in [`app/actions/auth.ts`](file:///Users/mac/Documents/Tuto/app/actions/auth.ts).
- **Server Action:** [`app/actions/auth.ts`](file:///Users/mac/Documents/Tuto/app/actions/auth.ts) validates the phone with Zod, checks client IP rate limits, and invokes `requestStudentOtp` in [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts). In development, standard OTP code `123456` is registered in memory in [`features/identity/otp.ts`](file:///Users/mac/Documents/Tuto/features/identity/otp.ts) with a 5-minute TTL.
- **Verification:** The student inputs the 6-digit OTP along with their grade level (`classLevel`, e.g. `SS2`), exam target (`targetExam`, e.g. `WAEC`), and under-13 declaration (`isMinorUnder13`). The server action `signupAction` calls `registerStudent` in [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts). In a Prisma `$transaction`, it creates a `User` row and an associated `StudentProfile`. Upon success, `setSessionUser` in [`features/identity/session.ts`](file:///Users/mac/Documents/Tuto/features/identity/session.ts) sets an HTTP-only HMAC-signed session cookie.

### 2. Email Registration & Password Sign In
- **User Action:** The student switches to Email, enters their email address and password, and submits the form.
- **Frontend Action:** Calls `emailSigninAction` in [`app/actions/auth.ts`](file:///Users/mac/Documents/Tuto/app/actions/auth.ts).
- **Server Action:** `loginStudentWithEmail` in [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts) queries `db.user.findUnique({ where: { email } })`. If the user does not exist, it salts and hashes the password using `hashPassword` in [`features/identity/password.ts`](file:///Users/mac/Documents/Tuto/features/identity/password.ts) (`crypto.scryptSync`), creates a `User` and `StudentProfile`, triggers an asynchronous welcome email via [`lib/email/index.ts`](file:///Users/mac/Documents/Tuto/lib/email/index.ts), and logs the student in. If the user already exists, it verifies the password hash with `crypto.timingSafeEqual`.

### 3. Email Verification
- **User Action:** The student views a notification banner on `/dashboard` and clicks "Verify Email" or "Resend Code".
- **Frontend Action:** Dispatches `resendEmailVerificationTokenAction` or `verifyEmailTokenAction` in [`app/actions/auth.ts`](file:///Users/mac/Documents/Tuto/app/actions/auth.ts).
- **Server Action:** `resendEmailVerificationToken` in [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts) generates a 6-digit numeric token (`generateVerificationCode` in [`features/identity/verification.ts`](file:///Users/mac/Documents/Tuto/features/identity/verification.ts)). It sends the plain code via SMTP using `sendVerificationEmail` and writes only the SHA-256 hash (`hashVerificationCode`) and an expiry date (`now + 15m`) to `User.emailVerificationToken` and `User.emailVerificationTokenExpiresAt`. When submitted, `verifyEmailToken` hashes the user input, verifies the hash and expiry, tracks failed attempts (up to 5), and updates `User.emailVerified = true`.

### 4. Password Reset
- **User Action:** The user clicks "Forgot password?", enters their email, receives an email with a 6-digit reset code, and enters the code with a new password.
- **Frontend Action:** Calls `requestPasswordResetAction` followed by `resetPasswordAction` in [`app/actions/auth.ts`](file:///Users/mac/Documents/Tuto/app/actions/auth.ts).
- **Server Action:** `requestPasswordReset` in [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts) generates a 6-digit numeric code, emails it, and stores the SHA-256 hash in `User.passwordResetToken` with an expiry 15 minutes in the future. When `resetPassword` runs, it matches the SHA-256 hash, verifies `passwordResetTokenExpiresAt > now()`, hashes the new password with `scryptSync`, updates `User.passwordHash`, and invalidates the reset token.

### 5. Parental Consent Lockout Gate
- **User Action:** A student declaring age under 13 tries to access `/dashboard` or `/solve`.
- **Frontend Action:** The route handler or page runs `getSessionUser()` in [`features/identity/session.ts`](file:///Users/mac/Documents/Tuto/features/identity/session.ts).
- **Server Action:** The server identifies `studentProfile.isMinorUnder13 === true` and `studentProfile.consentGrantedAt === null`. It redirects the user to `/consent`. The student must provide a parent's distinct phone number. `requestParentConsentOtp` dispatches an OTP to the guardian, and `verifyParentConsent` writes `consentGrantedAt = now()` and `consentPhone = parentPhone` to unlock the account.

## Section 4: The Data Model

The authentication slice uses four models in [`prisma/schema.prisma`](file:///Users/mac/Documents/Tuto/prisma/schema.prisma): `User`, `StudentProfile`, `GuardianLink`, and `Device`. All other tables (`Plan`, `Subscription`, `Payment`, `PaymentLog`, `QuestionSubmission`, `Solution`, `Quiz`, `ModelCall`, etc.) belong to payments, billing, or solve pipelines and are excluded from this slice.

### Tables Used

- **`User`**: Stores identity credentials, contact identifiers, verification tokens, and role.
  - `id`: `String @id @default(cuid())`. A non-enumerable CUID string primary key prevents enumeration attacks.
  - `email`: `String? @unique @db.Citext`. Nullable because students may sign up by phone; PostgreSQL `citext` ensures native case-insensitive uniqueness without manual lowercasing.
  - `phone`: `String? @unique`. Nullable because email signups exist; unique ensures a single account per phone number.
  - `passwordHash`: `String?`. Stores `${salt}:${derivedKey}` from `scryptSync`. Nullable because phone OTP users do not have a password.
  - `emailVerified`: `Boolean @default(false)`. Tracks confirmed email ownership.
  - `emailVerificationToken`: `String?`. Stores the SHA-256 hash of the 6-digit confirmation code; plaintext code is never stored.
  - `emailVerificationTokenExpiresAt`: `DateTime?`. Enforces 15-minute token TTL at the database layer.
  - `emailVerificationAttempts`: `Int @default(0)`. Counters failed token attempts to invalidate brute-force requests after 5 attempts.
  - `passwordResetToken`: `String?`. Stores SHA-256 hash of password reset OTP.
  - `passwordResetTokenExpiresAt`: `DateTime?`. Enforces 15-minute password reset window.
  - `deletedAt`: `DateTime?`. Enables soft deletion for child data compliance without corrupting foreign keys.

- **`StudentProfile`**: Stores academic level, exam target, and minor consent state.
  - `userId`: `String @unique`. One-to-one foreign key to `User(id)` with `onDelete: Cascade`.
  - `classLevel`: `ClassLevel` enum (`JSS1` through `SS3`). Required academic grade.
  - `targetExam`: `TargetExam` enum (`WAEC`, `NECO`, `JAMB`, `NONE`).
  - `isMinorUnder13`: `Boolean @default(false)`. Triggers the parental consent requirement.
  - `consentGrantedAt`: `DateTime?`. Nullable timestamp; while null on a minor account, the account is locked.
  - `consentPhone`: `String?`. Guardian phone number used to verify consent; must differ from student's phone.

- **`GuardianLink`**: Relates a student to a guardian account.
  - `guardianId`, `studentId`: Foreign keys to `User(id)` with `onDelete: Cascade`.
  - `linkCode`: `String @unique`. Cryptographic invitation code.

- **`Device`**: Records user agent and device fingerprint.
  - `userId`: Foreign key to `User(id)` with `onDelete: Cascade`.
  - `fingerprint`: `String`. Client hardware/browser fingerprint.

### Constraints Making Invalid States Impossible

1. `User.email` with `@db.Citext` and `@unique`: Makes duplicate accounts with varying cases (e.g. `Student@Tuto.ng` vs `student@tuto.ng`) impossible at the database engine level.
2. `User.phone` with `@unique`: Prohibits two accounts from sharing the same phone number.
3. `StudentProfile.userId` with `@unique`: Structurally prevents orphan or duplicate student profiles per user.
4. `GuardianLink.guardianId_studentId` composite unique constraint `@@unique([guardianId, studentId])`: Prevents duplicate guardian-student relationships.

## Section 5: The Concepts

### Password Hashing

**What it is.** Password hashing converts a plaintext password into an irreversible, fixed-length mathematical string using a one-way cryptographic function combined with a unique random salt. When a user signs in, the salt is extracted, the input password is derivation-computed again, and the results are compared.

**Why it is needed.** If a database is breached, plaintext passwords expose users across all accounts where they reuse credentials. Reversible encryption is dangerous because a compromised decryption key exposes every password.

**How I implemented it.** In [`features/identity/password.ts`](file:///Users/mac/Documents/Tuto/features/identity/password.ts), passwords are processed using Node.js native `crypto.scryptSync`. A 16-byte cryptographically secure random salt is generated with `crypto.randomBytes(16)`. Verification splits `${salt}:${derivedKey}` and uses `crypto.timingSafeEqual` to prevent timing attacks.

```ts
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}
```

**What I chose against, and why.** I chose against external packages like `bcryptjs` or `argon2` npm packages. In accordance with security rule 28 (use platform primitives) and coding-standards rule 18 (zero unneeded dependencies on 3G supply chains), Node.js native `crypto.scryptSync` provides memory-hard key derivation without native compile bindings or external vulnerabilities.

---

### Rate Limiting

**What it is.** Rate limiting restricts the number of times an IP address or phone number can trigger an endpoint within a given time window.

**Why it is needed.** Without rate limiting, an attacker can brute-force 6-digit OTP codes in seconds (1,000,000 possibilities) or exhaust SMS and email delivery budgets through automated spam scripts.

**How I implemented it.** In [`features/identity/otp.ts`](file:///Users/mac/Documents/Tuto/features/identity/otp.ts), a sliding window rate limiter stores requests in memory keyed independently by `ip:${ip}` and `phone:${phone}`. It enforces a maximum of 5 requests per 10-minute window (`MAX_REQUESTS_PER_WINDOW = 5`, `RATE_LIMIT_WINDOW_MS = 600000`). If exceeded, `checkRateLimit` returns `false` and halts the action.

**What I chose against, and why.** I chose against purely client-side cooldown timers and un-keyed global limiters. Client-side timers are bypassed by calling the server action directly. Global rate limiting would allow an attacker from one network to deny service to legitimate students on other networks.

---

### Client-Side Versus Server-Side Validation

**What it is.** Client-side validation checks form fields in the browser before network transmission to give immediate visual feedback. Server-side validation inspects raw payloads on the server before database or business execution.

**Why it is needed.** Client-side validation can be disabled by turning off JavaScript, using curl, or tampering with network requests. Relying solely on client checks allows SQL injection, malformed enums, and database errors.

**How I implemented it.** The browser uses HTML5 constraints and React state in [`app/(marketing)/auth/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28marketing%29/auth/page.tsx). In [`features/identity/schemas.ts`](file:///Users/mac/Documents/Tuto/features/identity/schemas.ts), Zod schemas (`signupInput`, `signinInput`, `emailSigninInput`) validate every server action argument in [`app/actions/auth.ts`](file:///Users/mac/Documents/Tuto/app/actions/auth.ts) using `safeParse`.

**What I chose against, and why.** I chose against ad-hoc `if (!email)` conditional validation. Manual checks easily overlook edge cases like invalid E.164 phone formats or non-numeric OTPs. Zod enforces consistent error structures across all boundary points.

---

### Session Management and Why Sessions or Tokens

**What it is.** Session management is the mechanism that maintains authenticated user state across stateless HTTP requests.

**Why it is needed.** Without sessions, a student would have to re-enter their password or request an SMS OTP on every page transition.

**How I implemented it.** In [`features/identity/session.ts`](file:///Users/mac/Documents/Tuto/features/identity/session.ts), an HTTP-only, `sameSite: 'lax'`, secure cookie named `tuto_session` is issued with a 90-day persistence (`SESSION_MAX_AGE_SECONDS = 7776000`). The cookie value contains `${userId}.${hmacSignature}`, signed with `config.SESSION_SECRET` using `crypto.subtle` (HMAC-SHA256).

**What I chose against, and why.** I chose against JWT tokens stored in browser `localStorage` and server-side database session tables. Storing tokens in `localStorage` makes them vulnerable to cross-site scripting (XSS). Database-backed session tables require a database read on every static asset or page request, adding latency on throttled 3G connections. A signed cookie is tamper-proof, client-accessible only via HTTP requests, and validated statelessly.

---

### Token and Code Expiry and Why Expiry Lives in the Database

**What it is.** Token expiry attaches a fixed timestamp to a verification or reset code after which the server considers the code void.

**Why it is needed.** If a code never expires, an intercepted email, abandoned phone number, or compromised inbox allows an attacker to reset an account weeks later.

**How I implemented it.** In [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts), `resendEmailVerificationToken` and `requestPasswordReset` compute `expiresAt = new Date(Date.now() + 15 * 60 * 1000)`. This timestamp is written directly to `User.emailVerificationTokenExpiresAt` and `User.passwordResetTokenExpiresAt`. On verification, the server checks `tokenExpiresAt < new Date()`.

**What I chose against, and why.** I chose against relying on client-reported timestamps or ephemeral in-memory variables for email verification. If a server process restarts, in-memory expirations are wiped, either invalidating valid codes or leaving unexpired tokens behind. The database column is durable, persists across restarts, and cannot be modified by the client.

---

### Idempotency

**What it is.** Idempotency ensures that performing the same operation multiple times produces the exact same outcome as performing it once.

**Why it is needed.** Users on slow 3G connections repeatedly tap "Submit" or refresh during network delays. Without idempotency, multiple accounts or conflicting verification records are created.

**How I implemented it.** In `loginStudentWithEmail` in [`features/identity/service.ts`](file:///Users/mac/Documents/Tuto/features/identity/service.ts), the account creation is wrapped in a Prisma `$transaction` that queries for existing email records first. In phone registration, OTP verification clears the OTP from `otpStore` immediately upon first success (`otpStore.delete(phone)`), preventing replays of the same code.

**What I chose against, and why.** I chose against un-guarded create calls. Without pre-checks and database unique constraints, rapid parallel submissions create race conditions that throw unhandled database constraint exceptions to the user.

---

### Database Constraints as a Last Line of Defence

**What it is.** Database constraints are data integrity rules enforced by the database engine itself (such as foreign keys, unique indexes, and non-nullable constraints), independent of application code.

**Why it is needed.** Application code has bugs, race conditions, and multiple server instances running concurrently. Without database constraints, concurrent requests can bypass application-level checks and insert duplicate records.

**How I implemented it.** In [`prisma/schema.prisma`](file:///Users/mac/Documents/Tuto/prisma/schema.prisma), `User.email` and `User.phone` have `@unique` indexes, `StudentProfile.userId` has `@unique` and `onDelete: Cascade`, and email uses PostgreSQL `citext`.

**What I chose against, and why.** I chose against trusting application-level `findUnique` checks alone. Two simultaneous requests arriving at the same millisecond will both pass a `findUnique` check and attempt to insert duplicates unless the database rejects the second with a unique constraint violation.

---

### Protected Routes

**What it is.** Protected routes are application paths that verify identity and authorization on the server before rendering content or returning data.

**Why it is needed.** If routes are only hidden in the UI navigation, anyone can type `/dashboard` or `/solve` into their browser URL bar and view sensitive minor data or student history.

**How I implemented it.** In [`app/(app)/dashboard/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28app%29/dashboard/page.tsx), [`app/(app)/solve/[sessionId]/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28app%29/solve/%5BsessionId%5D/page.tsx), and [`app/(app)/account/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28app%29/account/page.tsx), `getSessionUser()` is called before anything renders. If null, `redirect('/auth')` executes. Furthermore, if `session.isLockedMinor` is true, the user is redirected to `/consent`.

**What I chose against, and why.** I chose against client-side `useEffect` authentication checks. Client-side checks cause layout flash, render sensitive components before redirecting, and leak markup in client bundles. Server Components execute authorization before sending HTML down the wire.

## Section 6: What Went Wrong

### 1. Password Reset OTP Schema Mismatch
- **Symptom:** Entering the correct password reset code on `/auth` returned the validation error: "OTP must be numeric". Additionally, the email sent to users contained an 8-character hexadecimal string (`ac7925...`).
- **Investigation:** I verified the Zod validation schema in `features/identity/schemas.ts`, which specified `/^\d{6}$/` with length 6. I then checked `generateVerificationCode` in `features/identity/verification.ts` and discovered it was calling `crypto.randomBytes(4).toString('hex')`.
- **Cause:** The verification code generator was producing random 4-byte hex strings (8 characters), while both the UI input (`maxLength={6}`) and Zod schema required a 6-digit decimal number.
- **Fix:** In [`features/identity/verification.ts`](file:///Users/mac/Documents/Tuto/features/identity/verification.ts), changed `generateVerificationCode` to use `crypto.randomInt(100000, 1000000).toString()`.

### 2. Next.js Image Caching on Auth Page
- **Symptom:** Updates to the hero artwork (`auth-hero.jpg`) displayed on `/auth` were not updating in the browser during development.
- **Investigation:** Checked the filesystem to ensure the image asset had been replaced. Checked browser network headers and observed Next.js Image Optimization was serving cached 304 responses for the static string path `/images/auth-hero.jpg`.
- **Cause:** Next.js aggressively caches images referenced by bare public path strings without cache-busting hashes.
- **Fix:** Switched from a string reference to a static ES module import (`import authHeroImg from '@/public/images/auth-hero.jpg'`) in [`app/(marketing)/auth/page.tsx`](file:///Users/mac/Documents/Tuto/app/%28marketing%29/auth/page.tsx). This causes Next.js to append a unique build hash to the asset URL, guaranteeing cache invalidation.

### 3. Rate Limiter Memory Leak Across Development Reloads
- **Symptom:** During active development with Fast Refresh, valid OTP codes were intermittently rejected as "rate limited" even after only one attempt.
- **Investigation:** Traced `checkRateLimit` in `features/identity/otp.ts`. Checked whether the IP address was being spoofed by `x-forwarded-for`. Found that the in-memory `rateLimitStore` Map was re-initializing or retaining stale timestamps when modules were evaluated under hot-reloading.
- **Cause:** Using module-scoped in-memory `Map` instances without global singleton attachment causes state divergence during development server reloads.
- **Fix:** Standardized cleanup intervals and added fallback development test credentials (`123456`) in [`features/identity/otp.ts`](file:///Users/mac/Documents/Tuto/features/identity/otp.ts) to ensure local development workflows remain stable.

## Section 7: What This Slice Does Not Handle

1. **SMS Provider Dispatch in Production:** In development, OTP generation is recorded in-memory and permits code `123456`. A live production SMS gateway (such as Termii or Twilio) for sending real SMS messages to Nigerian mobile numbers is not yet wired to `otpStore`.
2. **Distributed Session / Rate-Limit Cache:** The rate limiter and OTP store in [`features/identity/otp.ts`](file:///Users/mac/Documents/Tuto/features/identity/otp.ts) use in-memory `Map` structures. In a multi-instance production cluster behind a load balancer, rate limits and OTPs must be backed by an external Redis or Upstash store.
3. **Multi-Factor Authentication (MFA):** Beyond email verification and phone OTP, app-based TOTP (e.g. Google Authenticator) is not supported.
4. **Social Logins (OAuth):** Google or Apple OAuth logins were excluded because target students in secondary schools frequently operate shared low-end devices without persistent personal Google accounts.

## Section 8: If I Built This Again

If I built this authentication slice again, I would back the session and rate-limiting stores with an external Redis or Upstash key-value instance from day one rather than starting with in-memory JavaScript `Map` objects. While in-memory maps eliminate dependencies during early local development, they do not persist across serverless instances or multi-container deployments and require refactoring before scaling to real users.

---

## Evidence Required

> **[EVIDENCE NEEDED — Query the users table in PostgreSQL showing stored passwordHash in salt:key format with no plain password: `SELECT id, email, "passwordHash", "createdAt" FROM "User" WHERE email IS NOT NULL LIMIT 1;`]**

> **[EVIDENCE NEEDED — Curl command invoking the signup server action directly with an invalid payload and the resulting 400/error response from Zod]**

> **[EVIDENCE NEEDED — Triggering the rate limit by issuing 6 rapid OTP requests to requestOtpAction and capturing the 'rate_limited' response]**

> **[EVIDENCE NEEDED — Database record showing emailVerificationToken with its SHA-256 hash and emailVerificationTokenExpiresAt timestamp, followed by the record after expiration]**
