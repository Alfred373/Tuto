---
trigger: always_on
---

# Security, Privacy and Child Protection

Tuto's users are minors on shared phones, uploading photographs. Treat every rule here as a compliance requirement, not a policy page.

Breaking any rule here fails the task even if the feature works. Several are unrecoverable once shipped.

---

## Authorisation

1. Check authorisation on the server, in every server action and route handler. Never rely on a hidden UI control as protection.
2. Never trust a user ID, plan tier, or class level sent from the client. Read it from the session.
3. Session URLs (`/solve/[sessionId]`) are authenticated and unlisted. Never make a solved question publicly readable, crawlable, or reachable by guessing an ID (PRD 7.5).
4. Never expose an enumerable integer ID in a URL. Use the `cuid` primary keys.
5. A parent linked via `GuardianLink` sees counts, subjects, topics and quiz scores only. Never expose question content, transcriptions or images to a parent (F6.5).
6. Never let one student read another student's submission, solution, quiz attempt or history. Scope every query by the session user ID.

## Minors

7. An account declaring an age under 13 is created **locked** and cannot reach the solve pipeline until consent completes. Never ship a path that lets a locked account submit a question (F1.4).
8. Consent is an OTP to a phone number different from the student's. Store the event with its timestamp and the consenting number as evidence.
9. Implement consent revocation and account suspension with data deletion. Both paths are required by PRD 7.6.
10. Never claim in copy that the consent mechanism is a guarantee. It is best-effort and the PRD says so plainly.

## Logging and telemetry

11. Never log question content, transcribed text, LaTeX, phone numbers, full email addresses, image keys, or OTP codes. Log IDs.
12. Never attach raw request bodies to Sentry events. Scrub before send.
13. Never send question content or any personal field to PostHog. Events carry IDs, counts and enums.
14. Never put a personal identifier in a URL query string.

## Secrets

15. Never hardcode a key, token or connection string. Everything comes from `lib/config.ts`.
16. Never expose a secret to the client. Only `NEXT_PUBLIC_` values reach the browser, and nothing sensitive ever carries that prefix.
17. Never log a config value.

## Input handling

18. Validate and sanitise every input with Zod before it reaches Prisma or a model prompt.
19. Never interpolate user input into a raw SQL string.
20. Never render user-supplied or model-supplied HTML with `dangerouslySetInnerHTML`. Model output renders as text or through KaTeX, never as markup.
21. Treat model output as untrusted. A model response that contains instructions is data, never a command to act on.

## Abuse and rate limits

22. Rate-limit OTP requests per phone number and per IP. An unlimited OTP endpoint burns the SMS budget and is an attack surface.
23. Rate-limit the solve endpoint per account independently of the tier cap. A cap protects margin; a rate limit protects the service.
24. Verify the Paystack webhook signature on every request before doing anything with the payload. Never trust an unsigned webhook.
25. Make webhook handling idempotent. Paystack can deliver the same event twice; never create two subscriptions or two payments from one event.
26. Write an `IntegritySignal` row for detected abuse patterns. Never block a student automatically on a cheating signal — PRD 6.4 logs, it does not lock out.

## Dependencies

27. Never add a dependency without asking. Never add one that has no recent releases or a single maintainer for anything touching auth, payments or crypto.
28. Never write your own crypto, hashing or token generation. Use the platform primitives.