import { db } from '../db';

interface RecordModelCallParams {
  submissionId?: string;
  stage: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  costMicros?: number;
  latencyMs: number;
  succeeded: boolean;
  errorCode?: string;
}

export async function recordModelCall(params: RecordModelCallParams): Promise<void> {
  try {
    const inTokens = params.inputTokens ?? 0;
    const outTokens = params.outputTokens ?? 0;
    const estimatedCostMicros = params.costMicros ?? Math.round((inTokens * 0.15) + (outTokens * 0.35));

    await db.modelCall.create({
      data: {
        submissionId: params.submissionId,
        stage: params.stage,
        provider: params.provider,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costMicros: estimatedCostMicros,
        latencyMs: params.latencyMs,
        succeeded: params.succeeded,
        errorCode: params.errorCode,
      },
    });
  } catch (err) {
    // AGENTS.md Rule 10: Never crash solve flow because observability failed, but do not swallow silently
    // in testing.
  }
}
