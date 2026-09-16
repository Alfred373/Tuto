---
name: pipeline-job-builder
description: Use when building or editing anything that runs in the solve pipeline or the worker — a stage, a queue job, a job processor, streaming, retries, or background work. Teaches job granularity and the three cost gates.
---

# Pipeline Job Builder

Builds a solve pipeline stage that never spends money it should not, and never renders an answer it cannot stand behind.

Laws live in `.agents/rules/ai-pipeline.md` and `.agents/rules/money-and-billing.md`. The stage definitions are PRD 6.1. The failure states are PRD 6.4. This file is the sequence.

## Job granularity

One stage, one job. Stages 1 to 5 in PRD 6.1 are five jobs, not one. Three reasons: each has its own timeout, each writes its own `ModelCall`, and a dropped 3G connection must not lose work the student already paid a credit for (AGENTS.md 33).

Never implement the pipeline as a single blocking request handler.

## The three cost gates

Run these in order before any AI spend. Each one is cheaper than the one after it.

1. **Input gate.** The client already rejected blurry and dark images (F2.4) and compressed to under 250KB (F2.3). The server confirms size, type and actual file content. A bad image costs zero inference.

2. **Cap gate.** Check the tier cap server-side through `features/metering` (`money-and-billing.md` 12). Blocked means the pipeline never starts.

3. **Cache gate.** Look up `SolutionCache` by normalised hash, then by embedding near-match. A hit serves the stored payload and spends nothing. This is the largest cost lever in PRD 8.5.

Only after all three do you call a model.

## Procedure

1. **Define the stage contract.** A Zod schema for the input and a Zod schema for the output. A stage without both is unfinished (`coding-standards.md` 7).

2. **Declare the capability, never the vendor.** Request `vision`, `structured`, `fast-text` or `reasoning`. The router picks the provider (`ai-pipeline.md` 6).

3. **Set an explicit timeout** from the budget in PRD 6.3. Stage 1 is 2.5s, Stage 3 is 5s, Stage 4 is 2s, Stage 5 is 4s.

4. **Run the three cost gates** above.

5. **Call the model through `lib/ai`.** Never import a vendor SDK here (`ai-pipeline.md` 1).

6. **Write the `ModelCall` row on every path**, including failures, timeouts and retries (`ai-pipeline.md` 22). Put the write in a `finally`, not after the happy-path return. This is the single most common place the rule breaks.

7. **Roll the cost into `UsageCounter.inferenceCostMicros`** (`money-and-billing.md` 16).

8. **Map every failure to a named state from PRD 6.4.** Never return a generic error. Each state has defined copy the student sees.

9. **Retry once at most** (`ai-pipeline.md` 25).

10. **Count the question only if the pipeline accepted it.** A decline does not decrement the cap (PRD 6.4, `money-and-billing.md` 14).

11. **Stream stage results, never tokens.** Step 1 renders at about 8.7 seconds while Stage 5 is still generating (PRD 6.3). Raw token streaming bypasses validation (`ai-pipeline.md` 21).

12. **On a cache hit, populate `Solution.cacheId`.** Never record a hit as an untraceable boolean (AGENTS.md 17).

## Skeleton

```ts
// features/solve/pipeline/stage-3-solution.ts
import { z } from 'zod';
import { callModel } from '@/lib/ai';
import { recordModelCall } from '@/lib/observability';
import type { StageResult } from './types';

const output = z.object({
  steps: z.array(z.object({
    statement: z.string(),
    workingLatex: z.string().nullable(),
    markNote: z.string().nullable(),
  })).min(1),
  finalAnswer: z.string(),
});

type SolutionDraft = z.infer<typeof output>;

export async function runSolutionStage(
  ctx: StageContext,
): Promise<StageResult<SolutionDraft>> {
  const started = Date.now();
  let usage: Usage | undefined;
  let provider = 'unknown';
  let model = 'unknown';
  let failure: string | undefined;

  try {
    const res = await callModel({
      capability: ctx.escalate ? 'reasoning' : 'fast-text',
      system: prompts.solution.v3,
      input: { text: ctx.transcribedText, context: ctx.markingScheme },
      schema: output,
      maxTokens: 1500,
      timeoutMs: 5000,
    });

    provider = res.provider;
    model = res.model;

    if (!res.ok) {
      failure = res.reason;
      return { ok: false, reason: mapToStudentFailure(res.reason) };
    }

    usage = res.usage;
    return { ok: true, data: res.data };
  } finally {
    // runs on success, failure, timeout and throw — ai-pipeline.md 22
    await recordModelCall({
      submissionId: ctx.submissionId,
      stage: 'solve',
      provider,
      model,
      promptVersion: prompts.solution.version,
      inputTokens: usage?.input ?? null,
      outputTokens: usage?.output ?? null,
      costMicros: usage ? priceOf(provider, model, usage) : 0,
      latencyMs: Date.now() - started,
      succeeded: !failure,
      errorCode: failure ?? null,
    });
  }
}
```

The three gates, before the first stage runs:

```ts
// features/solve/submit.ts
export async function submitQuestion({ userId, input }: SubmitArgs) {
  // gate 1 — input
  const file = await validateUpload(input.imageKey);
  if (!file.ok) return blocked('invalid_image');

  // gate 2 — cap
  const allowance = await metering.check(userId);
  if (!allowance.ok) return blocked(allowance.reason, allowance.remaining);

  // gate 3 — cache
  const hit = await cache.lookup(input.normalisedHash, input.embedding);
  if (hit) {
    await metering.increment(userId);
    return serveFromCache(hit); // sets Solution.cacheId — AGENTS.md 17
  }

  await metering.increment(userId);
  return queue.enqueue('solve.extract', { userId, submissionId: input.id });
}
```

## Traps

- Writing the `ModelCall` after the happy-path return, so every failure is unrecorded and the margin is fictional.
- Building the pipeline as one blocking request because it is simpler. It loses paid work on a dropped connection.
- Calling a model before the cap check, so a blocked student still costs you money.
- Skipping the cache lookup. It is the largest cost lever in the product.
- Decrementing the cap on a decline.
- Returning a generic error instead of a named PRD 6.4 state, so the student sees nothing useful.
- Using a reasoning model on the main path. It blows the 22-second budget.
- Streaming raw tokens to the client.
- Retrying in a loop.

## Verify before done

- [ ] Input and output Zod schemas both exist
- [ ] Capability requested, no vendor named in the stage
- [ ] Explicit timeout matching the PRD 6.3 budget
- [ ] Three cost gates run in order before any model call
- [ ] `ModelCall` written in a `finally`, on every path
- [ ] Cost rolled into `UsageCounter.inferenceCostMicros`
- [ ] Every failure maps to a named PRD 6.4 state
- [ ] At most one retry
- [ ] Declines do not consume a credit
- [ ] Cache hits set `Solution.cacheId`
- [ ] Stage results stream; tokens do not

Tests to write: a model timeout still writes a `ModelCall`; a blocked cap never reaches the model; a cache hit spends nothing and sets `cacheId`; each PRD 6.4 failure condition returns its named state; a decline leaves `UsageCounter` unchanged.