---
name: r2-storage-handler
description: Use when files move or die — uploads, image compression, signed URLs, storage keys, the purge sweep, deleting a saved session, or deleting an account. Teaches key construction, row-and-object pairing, and deletion parity.
---

# R2 Storage Handler

Handles photographs taken by minors. Gets them in cheaply and out completely.

Laws live in `.agents/rules/uploads-and-storage.md` and `.agents/rules/security.md`. Retention is PRD 7.5. This file is the sequence.

## Procedure: upload

1. **Compress on the device first.** Maximum 1,600px long edge, under 250KB after compression (F2.3). Never upload the raw camera file.

2. **Run the blur and brightness check on the device** (F2.4). A rejected image must cost zero bytes and zero inference.

3. **Validate on the server too.** Size, type, and actual file content. Never trust the filename or the client-supplied MIME type. Client checks protect the student's data budget; server checks protect you.

4. **Build the key server-side from IDs.** Never from a user-supplied filename, and never containing a phone number or original name.

5. **Write the `QuestionSubmission` row and the object together.** A row without an object is a broken session. An object without a row is an orphan nobody will ever delete.

6. **Never overwrite a key.** A re-upload is a new key and a new object. Originals are immutable, so a purge is provable.

## Procedure: serving

1. Generate a signed URL with an expiry in minutes, not days.
2. Check ownership before signing. Only the student who uploaded it (`security.md` 22). Not a parent, not an admin surface without an explicit check.
3. Never return the key to the client. The client gets a URL.
4. Never make a bucket or object public.

## Procedure: deletion parity

Four code paths delete an image. All four perform the same three-part operation, in the same order. Getting the order backwards is the trap.

**The three parts, in order:**

1. Delete the object from R2.
2. Confirm the delete succeeded.
3. Only then null `imageKey` and set `imagePurgedAt`.

Never set `imagePurgedAt` for a delete that did not happen (`uploads-and-storage.md` 19). A purge that is recorded but did not occur is worse than one that failed loudly.

**The four paths:**

| Path | Trigger | Notes |
|---|---|---|
| Scheduled sweep | 24 hours after processing | Unless the student saved the session (PRD 7.5) |
| Failed solve | Same 24-hour schedule | A failed solve is not a reason to keep a photograph |
| Session delete | Student deletes a saved session | Delete the object too |
| Account delete | Account deleted or consent revoked | Every object for that user |

The sweep is a sweep, not a queue. If it fails on Tuesday, Wednesday's run must pick up everything still eligible (`uploads-and-storage.md` 14).

## Skeleton

```ts
// lib/storage/keys.ts
// Ownership encoded in the key. No filename, no personal data.
export function submissionImageKey(userId: string, submissionId: string) {
  return `submissions/${userId}/${submissionId}/original.jpg`;
}
```

```ts
// features/solve/purge.ts
export async function purgeImage(submissionId: string): Promise<PurgeResult> {
  const row = await db.questionSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, imageKey: true, imagePurgedAt: true },
  });

  if (!row?.imageKey) return { ok: true, alreadyPurged: true };

  // 1 + 2 — delete, then confirm
  const deleted = await storage.delete(row.imageKey);
  if (!deleted.ok) {
    await alerts.raise('r2_purge_failed', { submissionId });
    return { ok: false, reason: 'delete_failed' };   // never mark it purged
  }

  // 3 — record only after a confirmed delete
  await db.questionSubmission.update({
    where: { id: submissionId },
    data: { imageKey: null, imagePurgedAt: new Date() },
  });

  return { ok: true, alreadyPurged: false };
}
```

```ts
// features/solve/sweep.ts
// A sweep, not a queue. Re-selects everything still eligible on every run.
export async function runPurgeSweep(now = new Date()) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const due = await db.questionSubmission.findMany({
    where: {
      imageKey: { not: null },
      imagePurgedAt: null,
      savedByStudent: false,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: 500,
  });

  for (const s of due) await purgeImage(s.id);
}
```

## Traps

- Marking `imagePurgedAt` before confirming the R2 delete. The record says purged; the object is still there.
- Building the sweep as a queue. One failed run and those images are never revisited.
- Keeping the image because the solve failed and someone might want to debug it.
- Attaching an uploaded image to a Sentry event. That is a second copy with its own lifecycle (`uploads-and-storage.md` 17).
- Copying an image to a debug or backup bucket.
- Deleting the database row and leaving the object behind.
- Building the key from the uploaded filename.
- Returning the R2 key to the client instead of a signed URL.
- A signed URL that lasts a day.
- Serving an image to a linked parent. Parents get counts and scores, never content (`security.md` 5).
- Skipping client-side compression because the server validates anyway. The point is that the bytes never leave the phone.

## Verify before done

- [ ] Client compresses to 1,600px and under 250KB before upload
- [ ] Blur and brightness checked on device
- [ ] Server re-validates size, type and actual content
- [ ] Key built server-side from IDs, no filename, no personal data
- [ ] Row and object created together
- [ ] Keys never overwritten
- [ ] Signed URLs only, expiry in minutes, ownership checked before signing
- [ ] No public bucket, no public object
- [ ] Purge deletes the object, confirms, then records
- [ ] `imagePurgedAt` never set on a failed delete
- [ ] All four deletion paths implemented
- [ ] Sweep re-selects everything eligible, not just new rows
- [ ] No second copy anywhere, including Sentry

Tests to write: a failed R2 delete leaves `imageKey` populated and `imagePurgedAt` null; a sweep after a failed run purges the backlog; a saved session survives the 24-hour cutoff; an unsaved session does not; deleting an account removes every object for that user; a signed URL request for another student's image is refused.