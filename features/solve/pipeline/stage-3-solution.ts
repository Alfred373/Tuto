import { getProviderForCapability } from '../../../lib/ai/router';
import { geminiProvider } from '../../../lib/ai/providers/gemini';
import { recordModelCall } from '../../../lib/observability/model-call';
import { SolutionOutputSchema, type SolutionOutput, type StageResult } from '../schemas';

const SYSTEM_PROMPT = `You are the Expert Solver Engine for Tuto, tailored for Nigerian students preparing for WAEC, NECO, and JAMB.
Your task is to solve the student's question with pedagogical clarity, rigorous step-by-step mathematical/conceptual derivations, and marking-scheme awareness.

Instructions:
1. Provide an ordered sequence of clear, numbered steps explaining each derivation.
2. For mathematical/scientific steps, provide the exact LaTeX working in 'workingLatex' (e.g. "2x = 10 \\implies x = 5").
3. For each step, provide a brief 'markNote' indicating what a WAEC/NECO marking scheme awards (e.g. "Method mark M1 for isolating x").
4. Provide a clear, definitive 'finalAnswer' and 'finalAnswerLatex'.
5. Set confidence to "HIGH" if certain, or "MEDIUM" if edge-case/ambiguous.
6. Return strictly a raw JSON object conforming to:
{
  "steps": [
    {
      "ordinal": 1,
      "statement": "Isolate the variable term by subtracting 5 from both sides.",
      "workingLatex": "2x + 5 - 5 = 15 - 5 \\implies 2x = 10",
      "markNote": "M1 (Method mark)"
    }
  ],
  "finalAnswer": "x = 5",
  "finalAnswerLatex": "x = 5",
  "confidence": "HIGH"
}
Output strictly valid JSON without wrapping explanation.`;

interface RunStage3Params {
  submissionId: string;
  questionText: string;
  questionLatex?: string | null;
  subject: string;
}

export async function runStage3Solution(params: RunStage3Params): Promise<StageResult<SolutionOutput>> {
  const provider = getProviderForCapability('reasoning');

  const promptContent = `Subject: ${params.subject}
Question:
${params.questionText}
${params.questionLatex ? `LaTeX: ${params.questionLatex}` : ''}

Solve this question completely step by step.`;

  let response = await provider.call({
    capability: 'reasoning',
    system: SYSTEM_PROMPT,
    input: {
      type: 'text',
      text: promptContent,
    },
    schema: SolutionOutputSchema,
    maxTokens: 2500,
    timeoutMs: 25000,
  });

  // Fallback to Gemini if DeepSeek fails (e.g. 402 Insufficient Balance or rate limited)
  if (!response.ok && provider.id !== 'gemini') {
    response = await geminiProvider.call({
      capability: 'structured',
      system: SYSTEM_PROMPT,
      input: {
        type: 'text',
        text: promptContent,
      },
      schema: SolutionOutputSchema,
      maxTokens: 2500,
      timeoutMs: 25000,
    });
  }

  await recordModelCall({
    submissionId: params.submissionId,
    stage: 'solve',
    provider: response.provider,
    model: response.model,
    inputTokens: response.ok ? response.usage.inputTokens : undefined,
    outputTokens: response.ok ? response.usage.outputTokens : undefined,
    latencyMs: response.ok ? response.latencyMs : 0,
    succeeded: response.ok,
    errorCode: response.ok ? undefined : response.reason,
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: response.reason === 'timeout' ? 'timeout' : 'provider_error',
      error: response.error,
    };
  }

  return {
    ok: true,
    data: response.data,
  };
}
