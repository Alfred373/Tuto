# Tuto Verification Service

Stateless Python microservice running SymPy over HTTP for symbolic verification of quantitative answers (maths, physics, chemistry stoichiometry).

## Constraints & Rules (AGENTS.md Section 4)

- **Stateless and single-purpose.** Does not read the database and does not access external APIs.
- **Separate deployment.** Deployed as a containerized Python service, called by the Next.js Node.js runtime over HTTP.
- **Strict latency budget:** Returns symbolic verification or timeout fallback within 2.5s (PRD 6.3).
- **Never reimplement in TypeScript:** There is no Node.js CAS capable of robust symbolic algebra and calculus; all symbolic verification must route to this service.
