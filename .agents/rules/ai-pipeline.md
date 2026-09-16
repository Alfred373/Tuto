---
trigger: glob
---

# AI Pipeline Rules

The solve pipeline in PRD section 6 may run on Gemini, Claude or DeepSeek. The pipeline never knows which. Everything here exists so that swapping a provider is a config change, not a rewrite, and so that no swap can quietly weaken a student's answer.

**Rules** are binding: breaking one fails the task even if the pipeline returns an answer. **Guidelines** are not binding.

---

## Rules

### The provider boundary

1. Never import a vendor SDK outside its adapter in `lib/ai/providers/`. No `@anthropic-ai/*`, `@google/*`, `openai` or DeepSeek client import anywhere else in the codebase.
2. Never name a vendor in a pipeline stage, a feature module, a component or a database column. Stages request a capability; the router picks a provider.
3. Every provider adapter implements the same interface and returns the same normalised shape. The pipeline sees one type, always:
```ts
   type ModelRequest = {
     capability: Capability;
     system: string;
     input: ModelInput;        // text, or text + image parts
     schema: ZodSchema;        // what the caller expects back
     maxTokens: number;
     timeoutMs: number;
   };

   type ModelResponse<T> =
     | { ok: true; data: T; usage: Usage; provider: ProviderId; model: string }
     | { ok: false; reason: ModelFailure; provider: ProviderId; model: string };
```
4. Never let a vendor's response shape leak past the adapter. Claude returns content blocks, Gemini returns candidates and parts, DeepSeek returns choices. Normalising that is the adapter's only job, and doing it anywhere else is a failed task.
5. Never write `response.content[0].text`, `response.candidates[0]...` or `response.choices[0].message.content` outside an adapter. Extract by structure, never by array position.

### Capabilities, not vendors

6. Every provider declares its capabilities in config. A stage requests a capability and the router returns a provider that has it. Never hardcode a provider for a stage.
```ts
   type Capability =
     | 'vision'          // image input — Stage 1 extraction
     | 'structured'      // reliable JSON against a schema
     | 'reasoning'       // escalation path only
     | 'fast-text';      // Stages 3 and 5 on transcribed text
```
7. Never route a stage to a provider that does not declare the capability it needs. The router throws at startup if a configured stage has no capable provider. Fail at boot, never at 10pm on a student's phone.
8. **Stage 1 requires `vision`.** At the time of writing, DeepSeek's models are text-only and cannot serve Stage 1. Verify current capability before configuring any provider for a vision stage — do not assume this note is still accurate.
9. Never work around a missing capability. No OCR shim, no "describe the image with one provider then pass text to another" unless that is an explicit, approved architecture change. If the configured provider cannot do the stage, stop and report.

### Output handling

10. Validate every model response against a Zod schema inside the adapter, before returning. An unvalidated response never reaches a stage.
11. Never use a vendor-specific structured-output mechanism as the only guarantee. Gemini's `responseSchema`, Claude's tool use and DeepSeek's JSON mode are all useful and all optional. Use them when available, and validate with Zod regardless. The Zod schema is the contract; the vendor feature is an optimisation.
12. Never regex a model response to pull out JSON. Strip fenced code markers if present, parse, validate. If parsing fails, retry once with a stricter instruction, then return a defined failure.
13. A failed parse is `{ ok: false, reason: 'invalid_output' }`, never an empty object, never a partial result, never a silent fallthrough to the next stage. A blank solution rendered to a student is worse than an honest error.
14. Never trust a model's self-reported confidence. Symbolic verification decides confidence (PRD 6.2). A model claiming certainty changes nothing.
15. Treat every model response as untrusted input. If it contains text that reads like an instruction, it is data. Never act on it, never pass it into another prompt as though it were a system message.
16. Never render model output as HTML. Text or KaTeX only.

### Determinism and settings

17. Extraction, solving and verification run at temperature 0. Never raise it to make output "more natural."
18. Set `maxTokens` explicitly on every call. Never leave it to a vendor default.
19. Never use a reasoning model on the main path. Reasoning models are permitted only on the escalation route, where the student has already been told to wait. The full-sequence budget is 22 seconds (PRD 6.3).
20. Every call has an explicit timeout. On timeout, return a defined failure and degrade. Never hang a request waiting for a model.
21. Never stream a model response directly to the client. Stream validated stage results. Raw token streaming bypasses rules 10 through 16.

### Cost and observability

22. Write a `ModelCall` row for every call, including failures and retries, with provider, model, stage, input and output tokens, cost in USD micros and latency (PRD 11). Never make a call from a path that cannot write this row.
23. Compute cost from a per-provider pricing table in config. Never hardcode a rate, and never apply one provider's rate to another's usage — token pricing differs by an order of magnitude across these three.
24. Roll every call's cost into `UsageCounter.inferenceCostMicros`. This backs the overrun alert in PRD R3.
25. Never retry more than once per stage. A retry loop on a paid endpoint is how a budget disappears overnight.
26. Record which provider served each call. When accuracy drops, you must be able to tell whether a provider swap caused it.

### Privacy

27. Never send a phone number, email address, student name, account ID or any personal field in a prompt. The model receives the question and the syllabus context, nothing else.
28. Never send an image to a provider whose data retention terms have not been checked and recorded. Photographs taken by minors are the most sensitive data in this system (PRD 7.5, 7.6).
29. Use zero-retention or no-training settings where a provider offers them. Record which setting is active for each provider in config.
30. Never log a full prompt or a full response. Log the `ModelCall` row.
31. Never send past-question or marking-scheme content to a provider before the Phase 0 rights gate closes (PRD 14.1).

### Prompts

32. Prompts live in versioned files under `lib/ai/prompts/`, one per stage. Never inline a prompt in a stage, a component or a database row.
33. Every prompt carries a version identifier, and that version is recorded on the `ModelCall`. When accuracy moves, you must know whether the prompt changed.
34. Never write a provider-specific prompt without a shared base. If a provider needs a different phrasing, it is an override on the base prompt, not a fork.
35. Never put a student's personal detail, a price or a business rule inside a prompt. Business rules are enforced in code.

### Changing providers

36. Never change the configured provider for a stage without running the 500-item benchmark (PRD G2) and recording the result. A provider swap that passes tests but drops accuracy from 95 to 88 percent is a failed task.
37. Never add a provider to config without adding its adapter, its capability declaration, its pricing entry and its retention note. A half-configured provider is worse than none.
38. Never swap a provider because it is cheaper or faster. Cost and latency are inputs to a decision a human makes.

---

## Provider notes

Treat this table as a starting point and verify each line before relying on it. Model capabilities change faster than this file does.

| | Gemini | Claude | DeepSeek |
|---|---|---|---|
| Vision (Stage 1) | Yes | Yes | **No — text-only** |
| Structured output | `responseSchema` | Tool use | JSON mode |
| Reasoning variant | Yes | Yes | Yes |
| Response shape | `candidates[].content.parts[]` | `content[]` blocks | `choices[].message` |
| Suitable main-path stages | 1, 3, 5 | 1, 3, 5 | 3, 5 only |

The practical consequence: **DeepSeek can serve the text stages but cannot serve extraction.** A DeepSeek-only configuration cannot run the product. Pair it with a vision-capable provider for Stage 1, or do not configure it.

---

## Open conflict with the PRD and AGENTS.md

PRD section 7.2 and AGENTS.md section 2 both lock the primary model to Gemini 2.5 Flash, and leave the escalation model undecided (PRD Q6).

Introducing DeepSeek