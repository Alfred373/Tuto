import { z } from 'zod';

export type Capability = 'vision' | 'structured' | 'reasoning' | 'fast-text';

export type ProviderId = 'gemini' | 'deepseek';

export type Usage = {
  inputTokens: number;
  outputTokens: number;
};

export type ModelInput =
  | { type: 'text'; text: string }
  | { type: 'multimodal'; text: string; imageBase64: string; mimeType: string };

export type ModelRequest<T> = {
  capability: Capability;
  system?: string;
  input: ModelInput;
  schema: z.ZodSchema<T>;
  maxTokens?: number;
  timeoutMs?: number;
};

export type ModelFailure =
  | 'timeout'
  | 'invalid_output'
  | 'refused'
  | 'rate_limited'
  | 'transport'
  | 'missing_key';

export type ModelResponse<T> =
  | { ok: true; data: T; usage: Usage; provider: ProviderId; model: string; latencyMs: number }
  | { ok: false; reason: ModelFailure; provider: ProviderId; model: string; error?: string };

export interface Provider {
  id: ProviderId;
  capabilities: Capability[];
  call<T>(req: ModelRequest<T>): Promise<ModelResponse<T>>;
}
