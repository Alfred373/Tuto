import { getProviderForCapability } from '../../../lib/ai/router';
import type { ModelInput } from '../../../lib/ai/types';
import { recordModelCall } from '../../../lib/observability/model-call';
import { ExtractionOutputSchema, type ExtractionOutput, type StageResult } from '../schemas';

const SYSTEM_PROMPT = `You are the Extraction and Transcription Engine for Tuto, an educational platform for Nigerian secondary school students preparing for WAEC, NECO, and JAMB.
Your task is to examine the provided question image (which may be handwritten notes, a textbook photo, or past paper) and extract the question accurately.

Instructions:
1. Transcribe the question text faithfully. If there is handwriting, decipher it carefully without guessing.
2. If there are mathematical formulas, equations, or scientific symbols, represent them in clean standard LaTeX (e.g. $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$).
3. Classify the subject into one of: "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "ENGLISH", "HISTORY".
4. Determine the detected question count. If the image contains multiple questions, indicate the count.
5. Provide an extraction confidence score between 0.0 and 1.0 (where 1.0 is crystal clear and 0.5 or below is difficult to decipher).
6. Return a raw JSON object conforming to:
{
  "transcribedText": "full question text",
  "transcribedLatex": "LaTeX version of question if mathematical/scientific",
  "subject": "MATHEMATICS",
  "detectedQuestionCount": 1,
  "extractionConfidence": 0.95,
  "topicTitle": "Quadratic Equations"
}
Output strictly valid JSON. Do not wrap with explanation.`;

interface RunStage1Params {
  submissionId: string;
  input: ModelInput;
  subjectHint?: string | null;
}

export async function runStage1Extraction(params: RunStage1Params): Promise<StageResult<ExtractionOutput>> {
  const provider = getProviderForCapability('vision');

  const promptText = params.input.type === 'multimodal'
    ? (params.input.text ? `Student notes: ${params.input.text}\nExtract the question from the attached image.` : 'Extract the question from the attached image.')
    : `Extract and classify this question:\n${params.input.text}`;

  const modelInput: ModelInput = params.input.type === 'multimodal'
    ? {
        type: 'multimodal',
        text: promptText,
        imageBase64: params.input.imageBase64,
        mimeType: params.input.mimeType,
      }
    : {
        type: 'text',
        text: promptText,
      };

  const response = await provider.call({
    capability: 'vision',
    system: SYSTEM_PROMPT,
    input: modelInput,
    schema: ExtractionOutputSchema,
    maxTokens: 1500,
    timeoutMs: 15000,
  });

  await recordModelCall({
    submissionId: params.submissionId,
    stage: 'extract',
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
