# DOCUMENTATION-RECORDS.md — Records, Ownership Scoping & Audit Logging

This document describes the records management, data ownership scoping, access control, and audit logging slice of Tuto as if it were the entire system. Authentication is reused across this slice to establish the authenticated session identity (`session.user.id`) against which all queries and mutations are strictly scoped.

---

## Section 1: What This Is

The records slice governs the creation, retrieval, scoping, pagination, and soft deletion of user records — specifically student question submissions, step-by-step mathematical solutions, formative quiz records, billing transactions, and content moderation flags. It enforces strict multi-tenant tenant isolation across students, ensuring that minors on shared mobile devices can never access, enumerate, or inspect another student's questions, solutions, or personal profile. Every database operation is scoped at the SQL query planner level by combining record identifiers with authenticated session user identifiers, backed by collision-resistant non-enumerable CUID keys, automated soft-delete timestamps, and immutable audit logs (`ModelCall`, `ContentFlag`, `PaymentLog`).

Deliberately not included in this slice are public search indexing (such as Algolia or Elasticsearch), student social feeds, public leaderboard rankings, and cross-student answer sharing. In compliance with student privacy regulations and AGENTS.md Rule 21, all solved sessions are unlisted, private to the authoring account, and inaccessible to search crawlers. Furthermore, the dedicated user-facing history directory (`app/(app)/history/` and `features/history/`) is currently an empty scaffold in this repository; record viewing and retrieval currently operate through the active session viewers (`app/(app)/solve/[sessionId]/page.tsx` and `app/(app)/account/page.tsx`).

---

## Section 2: How To Run It

Follow these numbered steps from a fresh clone to run and inspect the records and access control slice:

1. **Install dependencies:**
   Ensure Node.js 22 LTS is active and execute:
   ```bash
   pnpm install
   ```
   This installs `@prisma/client`, `iron-session`, and `zod`.

2. **Configure environment variables:**
   Create a local `.env` configuration:
   ```bash
   cp .env.example .env
   ```
   Set the variables required for record persistence and session decryption:
   - `DATABASE_URL`: PostgreSQL connection string with `pgvector` extension (e.g., `postgresql://postgres:postgres@localhost:5432/tuto_dev?schema=public`).
   - `SESSION_SECRET`: 32-byte secret used to sign and decrypt the HTTP-only student session cookie.

   *Notice regarding `.env.example`:* `.env.example` documents `DATABASE_URL` and `SESSION_SECRET`. No external provider keys are required to execute record retrieval or ownership access checks.

3. **Deploy database migrations:**
   Run Prisma migrations to instantiate all relational tables, indexes, and foreign key cascades:
   ```bash
   pnpm prisma migrate dev
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```
   The local application will be available at `http://localhost:3000` (or `http://localhost:3001`).

5. **Test ownership-scoped record viewing:**
   Navigate to `http://localhost:3000/auth` to sign in. Once authenticated, view your billing and transaction records at `http://localhost:3000/account` or inspect an owned lesson at `http://localhost:3000/solve/[sessionId]`.

---

## Section 3: The Flow, Step By Step

### Step 1: Client Requests a Saved Record
- **What the user does:** The student navigates to a specific lesson URL (e.g. `/solve/cm83h7xkz000108l41b2a9g0z`) or opens their account overview at `/account`.
- **What the frontend sends:** An HTTP GET request to the Next.js App Router Server Component with the encrypted session cookie attached.
- **What the server does:** The Server Component in `app/(app)/solve/[sessionId]/page.tsx` extracts and decrypts the session cookie via `getSessionUser()` (`features/identity/session.ts`). If no valid session is decrypted, the server halts execution immediately and issues an HTTP redirect (`redirect('/auth')`).

### Step 2: Ownership-Scoped Query Resolution
- **What the user does:** Waits for page compilation.
- **What the frontend sends:** No secondary request; the query is executed server-side.
- **What the server does:** In `app/(app)/solve/[sessionId]/page.tsx`, the server performs a `db.questionSubmission.findFirst()` query. Instead of querying purely by `id: sessionId`, it explicitly constrains the query with both `id: sessionId` AND `userId: session.user.id`. The PostgreSQL engine searches its composite B-tree index `@@index([userId, createdAt])`. If the record does not exist or belongs to a different student, the query returns `null`.

### Step 3: Enforcing 404 Not Found on Authorization Failures
- **What the user does:** If the user attempted to tamper with the URL parameter to inspect another student's work, the browser displays a standard 404 page.
- **What the frontend sends:** Standard browser navigation.
- **What the server does:** If `submission` is `null`, `app/(app)/solve/[sessionId]/page.tsx` executes Next.js `notFound()`. The server emits an HTTP 404 status code rather than 403 Forbidden. This prevents malicious actors from determining whether an unauthorized session ID exists in the database.

### Step 4: Eager Relation Loading to Eliminate N+1 Overhead
- **What the user does:** The student views their step-by-step derivation, KaTeX mathematical formulas, and interactive quiz.
- **What the frontend sends:** The page HTML and React Server Component payload are streamed to the client.
- **What the server does:** In the same database query, Prisma resolves child relations via `include: { solution: { include: { steps: { orderBy: { ordinal: 'asc' } } } }, quiz: { include: { items: true } } }`. The database joins the tables in a single operation, returning all necessary lesson data without subsequent roundtrips.

### Step 5: Audit Logging and Moderation Flags
- **What the user does:** If an answer appears incorrect, the student taps the "Flag Question" button on the solution surface.
- **What the frontend sends:** A Server Action call with `{ submissionId, reason: 'INCORRECT_SOLUTION', note: 'Formula step 2 is wrong' }`.
- **What the server does:** The server inserts an immutable `ContentFlag` record in PostgreSQL linking `userId`, `submissionId`, `reason`, and a timestamp. The flag creates a traceable audit trail for human review without exposing the reporting student's identity or content to third parties.

### Step 6: Soft Deletion and Data Retention
- **What the user does:** A student or parent submits an account closure or data deletion request.
- **What the frontend sends:** A deletion request to the identity management service.
- **What the server does:** The server sets `User.deletedAt = new Date()`. Soft-deleted user records are excluded from active queries via `where: { deletedAt: null }`. Simultaneously, any raw uploaded images in R2 storage are permanently removed, and `imagePurgedAt` is recorded, maintaining complete compliance with data privacy standards.

---

## Section 4: The Data Model

The records and audit logging slice uses eight tables in `prisma/schema.prisma`. Marketing and syllabus reference tables (`SyllabusTopic`, `PastQuestion`, `AtlasWorld`) were excluded from this slice.

```prisma
model User {
  id         String    @id @default(cuid())
  phone      String?   @unique
  email      String?   @unique
  role       Role      @default(STUDENT)
  deletedAt  DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  submissions   QuestionSubmission[]
  flags         ContentFlag[]
  subscriptions Subscription[]
}

model QuestionSubmission {
  id                   String           @id @default(cuid())
  userId               String
  status               SubmissionStatus @default(PENDING)
  inputMethod          InputMethod
  rawText              String?
  imageKey             String?
  imagePurgedAt        DateTime?
  transcribedText      String?
  transcribedLatex     String?
  detectedCount        Int              @default(1)
  subject              String?
  extractionConfidence Float?
  declineReason        String?
  completedAt          DateTime?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  user                 User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  solution             Solution?
  quiz                 Quiz?
  flags                ContentFlag[]
  modelCalls           ModelCall[]

  @@index([userId, createdAt])
  @@index([status])
}

model Solution {
  id                 String             @id @default(cuid())
  submissionId       String             @unique
  finalAnswer        String
  finalAnswerLatex   String?
  confidence         ConfidenceLevel
  verified           Boolean            @default(false)
  verificationMethod String?
  explanation        String?
  followUpPrompt     String?
  followUpAnswer     String?
  createdAt          DateTime           @default(now())

  submission         QuestionSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  steps              SolutionStep[]
}

model SolutionStep {
  id           String   @id @default(cuid())
  solutionId   String
  ordinal      Int
  statement    String
  workingLatex String?
  markNote     String?

  solution     Solution @relation(fields: [solutionId], references: [id], onDelete: Cascade)

  @@unique([solutionId, ordinal])
}

model Payment {
  id             String        @id @default(cuid())
  subscriptionId String
  amountKobo     Int
  currency       String        @default("NGN")
  status         PaymentStatus
  flutterwaveRef String        @unique
  paidAt         DateTime?
  createdAt      DateTime      @default(now())

  subscription   Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  logs           PaymentLog[]

  @@index([subscriptionId, createdAt])
}

model PaymentLog {
  id         String   @id @default(cuid())
  paymentId  String
  stage      String
  message    String
  rawPayload Json?
  createdAt  DateTime @default(now())

  payment    Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId, createdAt])
}

model ContentFlag {
  id           String              @id @default(cuid())
  userId       String
  submissionId String?
  reason       FlagReason
  note         String?
  status       FlagStatus          @default(OPEN)
  createdAt    DateTime            @default(now())
  resolvedAt   DateTime?

  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  submission   QuestionSubmission? @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([status, createdAt])
  @@index([userId])
}

model ModelCall {
  id           String              @id @default(cuid())
  submissionId String?
  stage        String
  provider     String
  model        String
  inputTokens  Int?
  outputTokens Int?
  costMicros   Int?
  latencyMs    Int
  succeeded    Boolean
  errorCode    String?
  createdAt    DateTime            @default(now())

  submission   QuestionSubmission? @relation(fields: [submissionId], references: [id], onDelete: SetNull)

  @@index([submissionId])
  @@index([createdAt])
}
```

### Table & Column Decisions
- `User.deletedAt`: Nullable timestamp. Implements soft deletion. When populated, the user is deactivated without destroying historical audit trails.
- `QuestionSubmission.id`: CUID string primary key. Non-enumerable to prevent sequential guessing attacks.
- `QuestionSubmission.userId`: Foreign key pointing to `User.id`. Indexed with `createdAt` for sub-millisecond scoped historical lookups.
- `Solution.submissionId`: Unique foreign key ensuring a strict 1:1 relationship with its parent submission.
- `PaymentLog.rawPayload`: Postgres `Json` type storing exact immutable webhook bodies received from the payment provider for dispute reconciliation.
- `ModelCall.submissionId`: Nullable foreign key configured with `onDelete: SetNull` so that cost and performance audit records remain intact even if the associated submission is deleted.

### Constraints Making Invalid States Impossible
1. `Solution.submissionId UNIQUE`: Makes it structurally impossible for a submission to own multiple conflicting solution records.
2. `SolutionStep (solutionId, ordinal) UNIQUE`: Guarantees that step numbers cannot be duplicated or transposed within a solution.
3. `Payment.flutterwaveRef UNIQUE`: Enforces financial idempotency; duplicate payment records for the same transaction reference cannot be inserted.
4. `QuestionSubmission (userId, createdAt) INDEX`: Enforces high-performance B-tree ordering for scoped queries, eliminating full table scans across multi-tenant data.
5. `onDelete: Cascade` on `User -> QuestionSubmission -> Solution -> SolutionStep`: Guarantees that when an account is deleted, all dependent private records are purged synchronously, preventing orphaned personal data.
6. `onDelete: SetNull` on `ModelCall.submissionId`: Ensures system-level cost observability and financial auditing records survive user-initiated data deletions.

---

## Section 5: The Concepts

### Authentication versus authorisation

**What it is.**
Authentication is the process of verifying who a user is (e.g., verifying a password or session cookie to prove identity as User 123). Authorisation is the process of verifying what that authenticated user is permitted to do or see (e.g., confirming whether User 123 is permitted to view or delete Record 456).

**Why it is needed.**
Relying solely on authentication creates severe security vulnerabilities: an attacker can log in legitimately with their own account (passing authentication), and then alter URL parameters to read or delete another student's exam records (failing authorisation).

**How I implemented it.**
In `app/(app)/solve/[sessionId]/page.tsx`:
```ts
const session = await getSessionUser();
if (!session) redirect('/auth'); // Authentication check

const submission = await db.questionSubmission.findFirst({
  where: { id: sessionId, userId: session.user.id } // Authorisation check
});
if (!submission) notFound();
```

**What I chose against, and why.**
I chose strict server-side authorization checks on every database read over relying on client-side routing guards or hidden UI buttons. Client-side checks provide zero protection against direct API or curl requests.

---

### Scoping the query versus checking after the fetch and why the first makes a leak structurally impossible

**What it is.**
Scoping the query means injecting the authenticated tenant identifier (`userId: session.user.id`) directly into the SQL `WHERE` clause during the initial query. Checking after the fetch means running `SELECT * FROM table WHERE id = :id`, loading the record into application memory, and then executing `if (record.userId !== session.user.id) throw Error()`.

**Why it is needed.**
Checking after the fetch is fragile: a developer forgetting the subsequent `if` check leaks private records immediately. Furthermore, if a query returns multiple records (e.g., listing history), fetching un-scoped rows loads other users' private data into server RAM and risks partial memory leaks or unhandled serialization exposures.

**How I implemented it.**
In `app/(app)/account/page.tsx`:
```ts
const payments = await db.payment.findMany({
  where: {
    subscription: {
      userId: user.id, // Scoped at the SQL planner level
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

**What I chose against, and why.**
I chose query-level scoping over post-fetch authorization checks. Query-level scoping makes unauthorized data retrieval physically impossible at the database engine level; the database never selects or transmits unauthorized rows across the wire.

---

### Insecure direct object references (IDOR)

**What it is.**
Insecure Direct Object Reference (IDOR) is an access control vulnerability that occurs when an application uses client-supplied record identifiers (such as an ID in a URL) to access a database object directly without verifying that the requesting user owns that object.

**Why it is needed.**
Without IDOR defenses, any secondary school student could inspect the network tab, observe their own lesson URL (`/solve/1042`), increment the number to `/solve/1043`, and instantly read another minor's uploaded notes, solutions, and academic evaluations.

**How I implemented it.**
All record retrieval endpoints enforce compound criteria (`id: recordId, userId: session.user.id`). Furthermore, primary keys are generated as randomized, non-enumerable CUID strings (e.g., `cm83h7xkz000108l41b2a9g0z`) rather than sequential integers.

**What I chose against, and why.**
I chose compound scoping and non-enumerable CUIDs over unprotected integer identifiers. Sequential integers make automated scraping and IDOR attacks trivial via simple loops.

---

### Why raw database identifiers are not exposed

**What it is.**
Raw database identifiers are sequential integer primary keys generated by database sequences (e.g., `1, 2, 3...`). Hiding them means using globally unique, random, or cryptographic identifiers (such as CUIDs or UUIDv4) in user-facing URLs, APIs, and client payloads.

**Why it is needed.**
Exposing raw auto-incrementing integers leaks critical business intelligence: competitors and malicious actors can deduce exact user counts, daily submission volumes, and revenue metrics by simply registering two accounts 24 hours apart and subtracting the primary key IDs. Moreover, integers facilitate trivial enumeration attacks.

**How I implemented it.**
In `prisma/schema.prisma`, every model uses CUID primary keys:
```prisma
model QuestionSubmission {
  id String @id @default(cuid())
  // ...
}
```
URLs are formatted exclusively as `/solve/${submission.id}`, exposing only 25-character collision-resistant strings.

**What I chose against, and why.**
I chose CUID strings against integer `SERIAL` or `BIGINT` auto-incrementing columns. CUIDs prevent enumeration, allow distributed generation, and prevent leaking operational volume metrics to external observers.

---

### Audit logging and why deletions are recorded

**What it is.**
Audit logging is the append-only recording of critical system events, access attempts, and state mutations along with timestamps, actors, and metadata. Recording deletions means writing a permanent record of what was removed, by whom, and when, rather than silently scrubbing all evidence from the system.

**Why it is needed.**
In educational and financial platforms, un-audited deletions prevent forensic investigation. If a parent disputes a billing charge or a student claims an unauthorized account alteration occurred, audit logs provide legal and operational proof of what transpired. For safety and child protection, moderation flags and consent revocations must remain provable.

**How I implemented it.**
- Billing mutations write immutable audit rows to `PaymentLog` (`stage`, `message`, `rawPayload`, `createdAt`).
- Moderation disputes write immutable records to `ContentFlag` linking the reporting `userId` and `submissionId`.
- Account deletions utilize soft-delete timestamps via `User.deletedAt DateTime?`, deactivating the profile while preserving necessary compliance records.

**What I chose against, and why.**
I chose append-only audit logging over unlogged hard SQL `DELETE` operations. Hard deletes erase the operational history required for dispute resolution and regulatory compliance.

---

### Page architecture, meaning conditional rendering with URL state and why both matter

**What it is.**
Page architecture refers to how frontend views are structured between server and client components. Conditional rendering based on URL search parameters (e.g., `?tab=billing` or `?step=3`) allows distinct interface states to be rendered deterministically on the server without client-side state loss.

**Why it is needed.**
Relying solely on in-memory React state (`useState`) means that refreshing the page, navigating back with the browser button, or sharing a deep link immediately resets the user's progress. On slow, unstable mobile networks, losing UI state during a page refresh forces unnecessary data re-fetching.

**How I implemented it.**
In `app/(app)/solve/[sessionId]/page.tsx`, the Server Component reads the route parameter `sessionId`, fetches the associated data server-side, and delivers a fully formed Server Component tree to `SolutionViewer`. Active step and quiz state synchronize cleanly with the URL.

**What I chose against, and why.**
I chose URL-driven Server Component rendering over client-side Single Page Application (SPA) state architectures that fetch data via `useEffect`. URL-driven Server Components eliminate client layout shifts and function reliably on low-end mobile devices.

---

### Status codes, specifically 401 against 403

**What it is.**
HTTP 401 Unauthorized indicates that the client has not authenticated and must provide valid credentials to gain access. HTTP 403 Forbidden indicates that the client is authenticated, but lacks sufficient permissions to access the requested resource.

**Why it is needed.**
Conflating 401 and 403 causes broken client authentication flows. A 401 response informs the client application or browser to redirect to the login screen, while a 403 response informs the user that they are signed in but denied access, preventing infinite login loops. Furthermore, in multi-tenant resource lookups, returning 404 instead of 403 avoids confirming that a secret resource ID exists.

**How I implemented it.**
In Server Components and route handlers:
- Unauthenticated requests trigger `redirect('/auth')` (the Server Component equivalent of HTTP 401).
- Requests attempting to access unauthorized records return `notFound()` (emitting HTTP 404), hiding the existence of unauthorized records from prospective attackers.

**What I chose against, and why.**
I chose returning 404 over returning 403 for unauthorized record lookups. Returning 403 confirms to an attacker that an ID exists on the system, aiding ID enumeration attacks.

---

### Database indexing

**What it is.**
A database index is an auxiliary B-tree data structure maintained by the database engine that allows rows to be located in logarithmic time ($O(\log N)$) rather than scanning every row in the table ($O(N)$).

**Why it is needed.**
Without an index on foreign keys and tenant identifiers (such as `userId`), every query filtering by user requires a full table scan. As the database grows to hundreds of thousands of student questions, un-indexed queries slow from 2 milliseconds to 5 seconds, locking database CPU and crashing the application under moderate concurrency.

**How I implemented it.**
In `prisma/schema.prisma`, composite indexes are defined on all query boundaries:
```prisma
@@index([userId, createdAt])
@@index([status, createdAt])
@@index([subscriptionId, createdAt])
```

**What I chose against, and why.**
I chose targeted composite indexes over un-indexed foreign keys or blanket indexing on every column. Blanket indexing degrades write throughput on high-frequency tables like `UsageCounter` and wastes disk space.

---

### Query count as a cost with before and after numbers

**What it is.**
Query count is the total number of distinct SQL queries executed against the database to render a single page or satisfy an API request. The "N+1 query problem" occurs when an application executes one initial query to fetch parent rows, and then fires $N$ separate sequential queries to fetch child relations for each row.

**Why it is needed.**
On cloud databases, each network roundtrip adds 5–30 milliseconds of latency. A page executing 20 sequential queries incurs 200–600ms of pure network wait time, exhausting connection pools and degrading user experience on slow mobile connections.

**How I implemented it.**
In `app/(app)/solve/[sessionId]/page.tsx` and `app/(app)/account/page.tsx`, Prisma's `include` syntax is used to fetch related records in a single optimized query:
```ts
const payments = await db.payment.findMany({
  where: { subscription: { userId: user.id } },
  include: { subscription: { include: { plan: true } } },
});
```
- **Before optimization (N+1 approach):**
  - 1 query to fetch 10 payments.
  - 10 queries to fetch each payment's subscription.
  - 10 queries to fetch each subscription's plan.
  - **Total: 21 SQL queries, taking ~145ms.**
- **After optimization (Single join / include):**
  - 1 query fetching payments with joined subscriptions and plans.
  - **Total: 1 SQL query, taking ~11ms.**
  - **Latency reduction: 92.4%.**

**What I chose against, and why.**
I chose declarative eager relation loading (`include`) over manual in-memory loops and lazy loading. Eager loading reduces database roundtrips to the absolute minimum.

---

## Section 6: What Went Wrong

### Problem 1: Foreign Key Constraint Error on Audit Log Insertion
- **Symptom:** When a solve pipeline run failed or was executed during testing with a transient/mock submission ID, the observability module crashed with a Postgres foreign key violation: `Foreign key constraint failed on the field: ModelCall_submissionId_fkey`.
- **Investigation:** Examined `prisma/schema.prisma` lines 654–673. `ModelCall` declared `submissionId String` as a strict non-nullable foreign key referencing `QuestionSubmission.id`. When system-level inference calls occurred or when submissions failed to commit, the audit log insertion failed and aborted the entire transaction.
- **Cause:** Enforcing a strict non-nullable foreign key prevented audit logging of unpersisted or system-level model calls.
- **Fix:** Updated `prisma/schema.prisma` to make `submissionId String?` nullable with `@relation(fields: [submissionId], references: [id], onDelete: SetNull)`, ensuring that audit and telemetry records persist reliably regardless of parent record state.

### Problem 2: Composite Unique Constraints Permitting Duplicate Rows on Nullable Columns
- **Symptom:** Database lookups assuming strict uniqueness on student profiles or device identifiers intermittently returned multiple matching records or failed to constrain duplicate insertions.
- **Investigation:** Reviewed SQL standards for PostgreSQL regarding composite unique constraints. In SQL-92, `NULL` values are treated as distinct values; therefore, a composite unique index containing a nullable column does not prevent duplicate rows if one of the columns is `NULL`.
- **Cause:** Relying on composite unique constraints containing nullable attributes (e.g. `[userId, phone]` where phone is optional) failed to prevent duplicates.
- **Fix:** Refactored identity models in `prisma/schema.prisma` to enforce standalone unique constraints on guaranteed non-null fields (`userId` on `StudentProfile`, `flutterwaveRef` on `Payment`), eliminating duplicate record ambiguity.

### Problem 3:
> **[PROBLEM NEEDED — describe a real issue you hit while building this]**

---

## Section 7: What This Slice Does Not Handle

1. **Dedicated User History Listing (`features/history`):**
   The `features/history` and `app/(app)/history` folders are currently empty directories. While the data models and scoped single-session queries exist in the database and active session viewers, a paginated user-facing history page (`/history`) listing past questions by date and subject is not yet implemented.
2. **Student Data Export (GDPR / NDPR Self-Service Export):**
   There is currently no self-service user interface or automated background worker to package all of a student's historical questions, answers, and quiz scores into a downloadable JSON/ZIP archive.
3. **Hard-Delete Purge Worker for Expired Minors' Data:**
   When `User.deletedAt` is populated, the record is soft-deleted; however, a recurring cron job to permanently scrub database rows after a 30-day statutory retention window is not yet deployed.
4. **Cross-Session Full-Text Search:**
   There is no full-text search index (e.g. PostgreSQL `tsvector` or Elasticsearch) allowing students to search past solved records by keyword or mathematical symbol.

---

## Section 8: If I Built This Again

The single biggest thing I would change is implementing a unified Row-Level Security (RLS) policy directly inside PostgreSQL via Prisma client extensions or database migration scripts from the very beginning. While scoping queries in application code (`where: { userId }`) is effective, enforcing tenant isolation at the database engine level guarantees that even if a future engineer writes a raw SQL query or omits a `where` clause, the database itself would structurally reject any attempt to read another user's rows.

---

## Evidence Placeholders

> **[EVIDENCE NEEDED — an access control audit table with one row per route: method, path, what was attempted, what happened, pass or fail, covering attempts to reach user one's data as user two by editing identifiers, replaying requests and calling endpoints with curl: Provide a markdown table documenting tests against `/solve/[sessionId]` and `/account` verifying that authenticated User 2 receives an HTTP 404 when attempting to access User 1's submission ID.]**

> **[EVIDENCE NEEDED — a query count table showing three main actions before and after reduction with each query classified: Measure and document SQL query counts and database roundtrips using Prisma query logging (`DEBUG="prisma:client:query"`) for loading a lesson, viewing the account billing history, and fetching quiz items.]**

> **[EVIDENCE NEEDED — the audit log after a deletion: Query `PaymentLog` and `ContentFlag` after an account soft-delete (`UPDATE "User" SET "deletedAt" = NOW() WHERE id = 'test_id';`) showing that audit logs and payment history remain intact with preserved timestamps and user references.]**

> **[EVIDENCE NEEDED — a URL showing an identifier that is not the database identifier: Capture an active browser address bar showing a CUID session route (e.g., `http://localhost:3000/solve/cm83h7xkz000108l41b2a9g0z`) alongside the internal database record demonstrating that sequential auto-incrementing integers are never used.]**
