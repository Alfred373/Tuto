---
trigger: always_on
---

# Git Conventions

Rules are binding. Guidelines are not.

---

## Rules

### Secrets

1. Never commit `.env`, `.env.local`, or any file containing a key, token, password or connection string. If you do, the task has failed even after you remove it — the value is in history and must be rotated.
2. Never commit a real API key inside example or test files. Use obvious placeholders.
3. `.env.example` is committed with keys and empty values, never with real values.

### Destructive operations

4. Never `git push --force` to `main` or any shared branch. Use `--force-with-lease` on your own branch only.
5. Never rewrite history on a branch someone else may have pulled.
6. Never `git reset --hard` or `git checkout -- .` across work you did not write without asking first.
7. Never delete a branch you did not create.

### Commit scope

8. One concern per commit. Never mix a schema migration, a pricing change and a UI tweak in one commit — a rule violation must be revertible without taking working code with it.
9. Never commit generated output: `node_modules`, `.next`, build artefacts, coverage reports, Prisma client output.
10. Never commit a migration and the code that depends on it in separate commits. They land together or the branch is broken mid-history.
11. Never commit code that does not build. If you must save work in progress, say so in the message.

### Branching

12. Never commit directly to `main`. Every change goes through a branch.
13. Never merge your own work without saying it is ready for review.

### Pull requests

14. Every PR description states: which PRD requirement IDs it satisfies, which files changed and why, and the completed Definition of Done checklist from `AGENTS.md`.
15. Never open a PR that mixes v1 scope with anything from a later phase.

---

## Guidelines (not binding)

- Branch names: `feat/solve-pipeline-stage-1`, `fix/usage-counter-race`, `chore/bump-prisma`.
- Commit format: `type(scope): imperative summary`, e.g. `feat(solve): add extraction stage schema`.
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`.
- Keep the subject line under ~72 characters and explain the why in the body.
- Rebase your branch on `main` before opening a PR.