import { GoogleGenAI } from '@google/genai';
import { config } from '../../config';
import type { Provider, ModelRequest, ModelResponse, Capability } from '../types';

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  return trimmed;
}

let geminiClientInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!config.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({
      apiKey: config.GEMINI_API_KEY,
    });
  }
  return geminiClientInstance;
}

export const geminiProvider: Provider = {
  id: 'gemini',
  capabilities: ['vision', 'structured', 'fast-text'] as Capability[],

  async call<T>(req: ModelRequest<T>): Promise<ModelResponse<T>> {
    const ai = getGeminiClient();
    const model = config.GEMINI_MODEL || 'gemini-3.6-flash';

    if (!ai) {
      return {
        ok: false,
        reason: 'missing_key',
        provider: 'gemini',
        model,
        error: 'GEMINI_API_KEY is not configured',
      };
    }

    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (req.input.type === 'multimodal') {
      if (req.input.text) {
        parts.push({ text: req.input.text });
      }
      parts.push({
        inlineData: {
          mimeType: req.input.mimeType,
          data: req.input.imageBase64,
        },
      });
    } else {
      parts.push({ text: req.input.text });
    }

    const startTime = Date.now();

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          systemInstruction: req.system,
          temperature: 0,
          maxOutputTokens: req.maxTokens ?? 2048,
          responseMimeType: req.capability === 'structured' ? 'application/json' : undefined,
        },
      });

      const latencyMs = Date.now() - startTime;
      const textContent = response.text ?? '';

      if (!textContent) {
        return {
          ok: false,
          reason: 'invalid_output',
          provider: 'gemini',
          model,
          error: 'Empty response text from Gemini',
        };
      }

      const stripped = stripFences(textContent);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(stripped);
      } catch {
        return {
          ok: false,
          reason: 'invalid_output',
          provider: 'gemini',
          model,
          error: 'Could not parse JSON response from Gemini',
        };
      }

      const validation = req.schema.safeParse(parsedJson);
      if (!validation.success) {
        const formatted = validation.error.issues
          .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
          .join(', ');
        return {
          ok: false,
          reason: 'invalid_output',
          provider: 'gemini',
          model,
          error: formatted,
        };
      }

      const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

      return {
        ok: true,
        data: validation.data,
        usage: { inputTokens, outputTokens },
        provider: 'gemini',
        model,
        latencyMs,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown Gemini error';
      return {
        ok: false,
        reason: errorMsg.includes('timeout') ? 'timeout' : 'transport',
        provider: 'gemini',
        model,
        error: errorMsg,
      };
    }
  },
};
