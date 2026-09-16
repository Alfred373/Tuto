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

TODO: Document database tables used by this assessment (User, StudentProfile, ConsentEvent), column details, nullability, and constraints.

## 5. The Concepts

TODO: Core engineering concepts required for this assessment slice with explanations and tradeoffs.

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
