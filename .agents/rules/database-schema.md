---
trigger: glob
---

# Database and Schema Rules

Postgres with `pgvector`, accessed only through Prisma. The schema in PRD section 11 is the locked design. This file governs how you change it.

Breaking any rule here fails the task even if the app runs.

---

## Changing the schema

1. Never run `prisma db push` against any database other than your local scratch one. Every change to a shared database is a migration file.
2. Every migration has a descriptive name: `add_integrity_signal`, not `migration_3`.
3. Never edit a migration that has already been applied anywhere but your machine. Write a new one.
4. Never write a migration that drops a column or table in the same change that stops using it. Ship the code change first, drop later, in a separate migration.
5. Never write a data-destroying migration without saying so explicitly in your report and waiting for confirmation.
6. Run `prisma validate` and `prisma format` before every commit. A schema that does not validate is a failed task, not a warning.
7. Never add a relation without an explicit `onDelete`. Decide what happens to the child row and write it down.
8. Never remove an existing foreign key or `onDelete` clause. They were added deliberately after review.

## Deliberate design decisions — do not "fix" these

9. `UsageCounter` is a separate table, one row per user per UTC day. Never collapse it into a column on `User`. Metering is the highest-write path in the system and must survive concurrent requests from the same account on two devices.
10. `SolutionCache` has no relation to `User` and never will. The absence is the privacy guarantee: a cache hit must leak nothing between students.
11. `Solution.cacheId` is a relation, not a boolean. Never simplify it. When a cached answer is found wrong, you must be able to list every student who received it.
12. The embedding dimension is `768` in both `PastQuestion` and `SolutionCache`. Never change it. Doing so requires a backfill across the two largest tables.
13. `imageKey` is nullable and paired with `imagePurgedAt` so that a purged image is provably purged. Never make `imageKey` required.
14. `Plan.interval` is nullable so the free plan needs no fake billing interval. Uniqueness lives on `Plan.code`. Never restore a composite unique on a nullable column — Postgres does not constrain it.

## Types and money

15. Every monetary column is an integer in kobo, named `...Kobo`. Never `Float`, never `Decimal`, never `String`.
16. Every cost column is an integer in USD micros, named `...Micros`.
17. Use enums for closed sets. Never store a status, subject or tier as a free-text string.
18. Every timestamp is `DateTime` in UTC. Never store a local time or a formatted date string.

## Queries

19. Never write raw SQL unless Prisma genuinely cannot express it. If you do, parameterise it — never interpolate a value into a query string.
20. Never fetch a list without a `take`. Unbounded queries are how a history page dies.
21. Never write an N+1. Use `include` or `select`, and check the generated query if you are unsure.
22. Increment `UsageCounter` with a single atomic upsert. Never read-then-write. Never increment from more than one place in the codebase — route every increment through `features/metering`.
23. Never add an index without saying what query it serves. Never remove one without checking what breaks.
24. Build both `pgvector` indexes as HNSW.

## Seeding

25. `prisma/seed.ts` contains synthetic fixtures only. Never seed real WAEC or NECO past questions or marking schemes until the Phase 0 rights gate closes (PRD 14.1).
26. Never write a seed script that fetches from the network.
27. Every `PastQuestion` row, seeded or real, carries a `sourceLicence`. Never insert one without it.

## Asking first

28. Ask before denormalising, adding a counter cache, or duplicating a field across tables. Sometimes it is right. It is never your call alone.
29. Ask before adding a model. A new table is a schema decision, not an implementation detail.