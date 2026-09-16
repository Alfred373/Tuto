---
trigger: always_on
---

# Coding Standards

Two sections. **Rules** are binding: breaking one fails the task even if the code works. **Guidelines** are not binding and are never grounds for rejecting work.

---

## Rules

### Types

1. Never use `any`. Use `unknown` plus a narrowing check where input is genuinely unknown.
2. Never use `as` to silence a type error. Fix the type. `as const` and `as unknown as X` inside a tested adapter boundary are the only exceptions, and each needs a comment saying why.
3. Never use `@ts-ignore` or `@ts-expect-error` in committed code.
4. `strict: true` and `noUncheckedIndexedAccess: true` stay on. Never weaken `tsconfig.json` to make an error go away.
5. Every exported function has an explicit return type.

### Untrusted input

6. Validate with Zod at every boundary: model responses, webhook payloads, form submissions, URL params, and every handoff between solve pipeline stages. Model output is untrusted input, always.
7. Never pass an unvalidated object from one pipeline stage to the next. If a stage has no schema, it is not finished.

### Errors

8. Never write an empty `catch`. Catch, classify, record, then degrade to a defined state.
9. Pipeline stages return a discriminated result, never throw across a stage boundary:
```ts
   type StageResult<T> =
     | { ok: true; data: T }
     | { ok: false; reason: StageFailure };
```
10. Every failure condition listed in PRD 6.4 maps to a named `StageFailure` member. Never collapse distinct failures into a generic error.
11. Never let a caught error silently produce a success state. A failed verification that returns `ok: true` is a critical defect.

### Boundaries

12. Never read `process.env` outside `lib/config.ts`. Config is parsed and validated once, at startup, with Zod.
13. Never import a vendor SDK outside its adapter folder in `lib/`. No `@google/*`, Paystack, R2 or queue import anywhere else.
14. Never instantiate a second `PrismaClient`. Import the one from `lib/db.ts`.
15. `app/` contains routing only. Never call Prisma or a model provider from a route or page file.
16. `components/ui/` never fetches data and never imports from `features/`.

### Client code

17. Default to Server Components. Add `'use client'` only for state, event handlers or browser APIs. Every client component costs bytes against the budget in PRD 7.3.
18. Never add a dependency without asking first. Every package is bytes on a 3G connection and a supply-chain surface.
19. Never import a whole library for one function (`lodash`, `moment`). Write the function or import the single module.

### Logging

20. Never use `console.log`, `console.error` or `console.warn` in committed code. Use `lib/observability`.
21. Never log question content, transcribed text, phone numbers, image keys or full email addresses. Log IDs.

### Dead code

22. Never commit commented-out code, stubbed functions returning fake data, or `// TODO: implement properly`. If it is not finished, say it is not finished.

---

## Guidelines (not binding)

- Aim for functions under ~50 lines and files under ~300. A pipeline stage that outgrows this is usually two stages.
- Named exports everywhere except Next.js route files, which need defaults.
- Naming: `camelCase` values, `PascalCase` components and types, `SCREAMING_SNAKE` constants, `kebab-case` filenames.
- Comments explain why, not what. If a comment explains what, rename things instead.
- Two similar things are two things. Extract on the third.
- Prettier and ESLint config are committed. Do not edit them to clear an error.