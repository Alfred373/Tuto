import OpenAI from 'openai';
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

let deepseekClientInstance: OpenAI | null = null;

function getDeepseekClient(): OpenAI | null {
  if (!config.DEEPSEEK_API_KEY) {
    return null;
  }
  if (!deepseekClientInstance) {
    deepseekClientInstance = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: config.DEEPSEEK_API_KEY,
    });
  }
  return deepseekClientInstance;
}

export const deepseekProvider: Provider = {
  id: 'deepseek',
  capabilities: ['structured', 'reasoning', 'fast-text'] as Capability[],

  async call<T>(req: ModelRequest<T>): Promise<ModelResponse<T>> {
    const client = getDeepseekClient();
    const model = req.capability === 'reasoning' ? 'deepseek-reasoner' : 'deepseek-chat';

    if (!client) {
      return {
        ok: false,
        reason: 'missing_key',
        provider: 'deepseek',
        model,
        error: 'DEEPSEEK_API_KEY is not configured',
      };
    }

    if (req.input.type !== 'text') {
      return {
        ok: false,
        reason: 'refused',
        provider: 'deepseek',
        model,
        error: 'DeepSeek does not support multimodal image input.',
      };
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (req.system) {
      messages.push({ role: 'system', content: req.system });
    }
    messages.push({ role: 'user', content: req.input.text });

    const startTime = Date.now();

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages,
          temperature: 0,
          max_tokens: req.maxTokens ?? 2048,
          // JSON format requested if structured
          response_format: req.capability === 'structured' ? { type: 'json_object' } : undefined,
        },
        { timeout: req.timeoutMs ?? 20000 }
      );

      const latencyMs = Date.now() - startTime;
      const content = response.choices[0]?.message?.content;

      if (!content) {
        return {
          ok: false,
          reason: 'invalid_output',
          provider: 'deepseek',
          model,
          error: 'Empty response content from DeepSeek',
        };
      }

      const stripped = stripFences(content);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(stripped);
      } catch {
        return {
          ok: false,
          reason: 'invalid_output',
          provider: 'deepseek',
          model,
          error: 'Could not parse JSON response from DeepSeek',
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
          provider: 'deepseek',
          model,
          error: formatted,
        };
      }

      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;

      return {
        ok: true,
        data: validation.data,
        usage: { inputTokens, outputTokens },
        provider: 'deepseek',
        model,
        latencyMs,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown DeepSeek error';
      return {
        ok: false,
        reason: errorMsg.includes('timeout') ? 'timeout' : 'transport',
        provider: 'deepseek',
        model,
        error: errorMsg,
      };
    }
  },
};
