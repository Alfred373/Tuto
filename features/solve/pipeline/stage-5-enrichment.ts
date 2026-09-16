import { getProviderForCapability } from '../../../lib/ai/router';
import { geminiProvider } from '../../../lib/ai/providers/gemini';
import { recordModelCall } from '../../../lib/observability/model-call';
import { EnrichmentOutputSchema, type EnrichmentOutput, type StageResult } from '../schemas';

const SYSTEM_PROMPT = `You are the Pedagogical Enrichment Engine for Tuto.
Your goal is to build the 5-step guided lesson based on the student's question and solved steps:
1. 'explanation': A conceptual deep-dive (Step 3) explaining why the solution works, what underlying principles are used, and common mistakes Nigerian students make in WAEC/NECO.
2. 'followUpPrompt': A variant practice problem (Step 4) with similar difficulty for the student to try next.
3. 'followUpAnswer': The concise answer key to the follow-up problem.
4. 'quizItems': 2 multiple-choice questions (Step 5) with 4 options ('A', 'B', 'C', 'D'), correctOption, and rationale.

Return strictly a raw JSON object conforming to:
{
  "explanation": "Detailed conceptual explanation...",
  "followUpPrompt": "Now try this: Solve 3x + 4 = 19",
  "followUpAnswer": "x = 5",
  "quizItems": [
    {
      "ordinal": 1,
      "prompt": "What is the first step in isolating x in 2x + 5 = 15?",
      "options": ["A. Subtract 5 from both sides", "B. Divide by 2", "C. Add 5 to both sides", "D. Multiply by 2"],
      "correctOption": "A",
      "rationale": "Subtracting 5 isolates the variable term 2x."
    }
  ]
}
Output strictly valid JSON.`;

interface RunStage5Params {
  submissionId: string;
  questionText: string;
  solutionSummary: string;
  subject: string;
}

export async function runStage5Enrichment(params: RunStage5Params): Promise<StageResult<EnrichmentOutput>> {
  const provider = getProviderForCapability('structured');

  const promptContent = `Subject: ${params.subject}
Original Question:
${params.questionText}

Solution Steps:
${params.solutionSummary}

Generate the pedagogical explanation, follow-up challenge, and quiz items.`;

  let response = await provider.call({
    capability: 'structured',
    system: SYSTEM_PROMPT,
    input: {
      type: 'text',
      text: promptContent,
    },
    schema: EnrichmentOutputSchema,
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
      schema: EnrichmentOutputSchema,
      maxTokens: 2500,
      timeoutMs: 25000,
    });
  }

  await recordModelCall({
    submissionId: params.submissionId,
    stage: 'enrich',
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
