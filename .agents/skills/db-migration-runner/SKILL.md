---
name: db-migration-runner
description: Use when changing schema.prisma or when a task mentions migration, schema, database, new table, new column, new field, new model, relation, index, enum, storing something new, or db push. Teaches the safe migration sequence.
---

# Database Migration Runner

Runs a schema change end to end without breaking the locked design in PRD section 11.

Laws live in `.agents/rules/database-schema.md`. Money representation laws live in `.agents/rules/money-and-billing.md`. This file is the sequence, not the laws.

## Procedure

1. **Read the current schema first.** Open `prisma/schema.prisma` and read the models you are about to touch, including their relations. Never edit from memory.

2. **Check the change against the locked design.** Stop and ask if your change would: collapse `UsageCounter` into `User`, add a relation to `SolutionCache`, turn `Solution.cacheId` back into a boolean, change the `768` embedding dimension, make `imageKey` required, or restore a composite unique on `Plan.interval`. Those six are deliberate (`database-schema.md` 9 to 14).

3. **Ask before you add a model.** A new table is a schema decision. Report what you want and why, then wait.

4. **Write the field with the right type.**
   - Money: `Int`, named `...Kobo`.
   - Cost: `Int`, named `...Micros`.
   - Closed set: an `enum`, never a free-text string.
   - Time: `DateTime`, UTC.

5. **Set `onDelete` on every new relation.** Decide first what happens to the child row, then write it. A relation without an explicit `onDelete` is an unfinished relation.
   - Child cannot exist alone → `Cascade`.
   - Child should survive, losing the link → `SetNull`, and the scalar must be nullable.

6. **Run `prisma format`, then `prisma validate`.** Fix anything they report before going further.

7. **Generate the migration with a descriptive name.**
```bash
   pnpm prisma migrate dev --name add_integrity_signal --create-only
```
   `--create-only` stops it applying so you can read the SQL first.

8. **Read the generated SQL.** Look for three things: an unexpected `DROP`, a `NOT NULL` added to a table that already has rows, and a missing index on a new foreign key.

9. **Split any destructive change into two migrations.** Migration one stops the code using the column. Migration two drops it, in a later task. Never both at once.

10. **Handle a `NOT NULL` on an existing table in three steps.** Add the column nullable. Backfill it. Make it required in a second migration.

11. **Apply forward against your local scratch database only.**
```bash
    pnpm prisma migrate dev
```
    Never run `prisma db push` against anything shared.

12. **Regenerate the client and typecheck.**
```bash
    pnpm prisma generate && pnpm typecheck
```

13. **Fix the call sites.** A new required field breaks every create. Fix them now, not in a follow-up.

14. **Commit the migration and the dependent code together.** One commit. A branch with the migration in one commit and the code in another is broken mid-history.

## Skeleton

```prisma
model IntegritySignal {
  id          String              @id @default(cuid())
  userId      String
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  signalType  IntegritySignalType
  itemCount   Int?
  notedAt     DateTime            @default(now())

  @@index([userId, notedAt])
}
```

Money field:

```prisma
model Plan {
  priceKobo Int    // kobo, integer, never Float or Decimal
  code      String @unique
}
```

Atomic metering increment, the only way to touch `UsageCounter`:

```ts
await db.usageCounter.upsert({
  where: { userId_day: { userId, day } },
  create: { userId, day, questionsUsed: 1 },
  update: { questionsUsed: { increment: 1 } },
});
```

## Traps

- Running `prisma db push` because it is faster. It works on your machine and diverges every shared database.
- Generating a migration without reading its SQL. Prisma will happily write a `DROP COLUMN`.
- Adding a relation and leaving `onDelete` off. Prisma defaults quietly; your intent is not recorded.
- Editing a migration that has already been applied. Write a new one.
- Adding a money field as `Float` because the value has a decimal point in the UI. It does not have one in the database.
- Forgetting `sourceLicence` when touching `PastQuestion`. Every row needs it.
- Writing a seed that fetches from the network, or that seeds real WAEC or NECO content before the Phase 0 gate closes.

## Verify before done

- [ ] `prisma validate` passes
- [ ] `prisma format` applied
- [ ] Migration has a descriptive name
- [ ] Generated SQL read, and no unexpected `DROP`
- [ ] Every new relation has an explicit `onDelete`
- [ ] Every money field is `Int` named `...Kobo`; every cost field is `Int` named `...Micros`
- [ ] No locked design decision changed (`database-schema.md` 9 to 14)
- [ ] `pnpm prisma generate` then `pnpm typecheck` both clean
- [ ] Migration and dependent code in one commit

Tests to write: an integration test that creates the new row and reads it back; a cascade test that deletes the parent and asserts the child is gone or nulled as intended; for any `UsageCounter` change, a concurrency test that fires two increments at once and asserts the count is two, not one.