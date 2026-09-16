---
trigger: always_on
---

# Uploads and Storage

Every upload is a photograph taken by a minor, on a metered connection, often of a page of their own handwriting. Handle accordingly.

Breaking any rule here fails the task even if the upload succeeds.

---

## Before upload

1. Never upload a raw camera file. Downscale to a maximum 1,600px long edge and compress client-side first (F2.3).
2. The uploaded file must be under 250KB after compression. An upload above that breaks the latency budget in PRD 6.3 and costs the student data they are paying for.
3. Run the blur and brightness check on the device before uploading. Never send an image that fails it — a rejected image must cost zero bytes and zero inference (F2.4).
4. Never skip client-side checks "because the server will catch it." The point is that the bytes never leave the phone.
5. Enforce the size and type limits on the server as well. Client checks are for cost; server checks are for safety.
6. Accept JPEG, PNG and WebP only. Validate the actual file content, never the filename or the client-supplied MIME type.

## Storage

7. All uploads go to Cloudflare R2 through `lib/storage`. Never write a file to the local filesystem, never store an image in Postgres, never base64 an image into a database column.
8. Never make an R2 bucket or object public. Serve images through short-lived signed URLs only.
9. Generate object keys server-side from the submission ID. Never build a key from a user-supplied filename.
10. Never put a personal identifier, phone number or original filename in an object key.
11. Never expose an R2 key to the client. The client gets a signed URL, never the key.

## Retention — this is the one that matters

12. Delete the uploaded image from R2 within 24 hours of processing, unless the student explicitly saved the session (PRD 7.5).
13. Set `imagePurgedAt` and null `imageKey` in the same operation as the delete. A purge that is not recorded is not provable.
14. Never make the scheduled purge job the only thing that deletes. If the job fails, the next successful run must catch everything still eligible — it is a sweep, not a queue.
15. The transcription persists. The photograph does not. Never re-derive or re-store an image after purge.
16. When a student deletes a saved session or an account is deleted, delete the object from R2 too. Never leave orphaned objects behind a deleted row.
17. Never copy an uploaded image to a second location — a backup bucket, a log, a debug folder, a Sentry attachment. One copy, one lifecycle.

## Handling failures

18. If the upload succeeds but the pipeline fails, the image is still purged on the normal 24-hour schedule. A failed solve is not a reason to keep a photograph.
19. If the R2 delete fails, retry and alert. Never mark `imagePurgedAt` for a delete that did not happen.
20. Never block the student's response on the purge. It is asynchronous.

## Serving

21. Signed URLs expire in minutes, not days.
22. Never serve an image to anyone but the student who uploaded it. Not to a parent, not to an admin surface without an explicit access check.
23. Set `max-width: 100%` and correct dimensions on every image the app renders. A layout shift on a slow connection is a real cost to this user.