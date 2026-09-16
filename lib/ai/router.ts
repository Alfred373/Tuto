import type { Capability, Provider } from './types';
import { geminiProvider } from './providers/gemini';
import { deepseekProvider } from './providers/deepseek';
import { config } from '../config';

export function getProviderForCapability(capability: Capability): Provider {
  if (capability === 'vision') {
    return geminiProvider;
  }

  if (capability === 'reasoning') {
    if (config.DEEPSEEK_API_KEY) {
      return deepseekProvider;
    }
    return geminiProvider;
  }

  // Structured / fast-text
  if (config.DEEPSEEK_API_KEY) {
    return deepseekProvider;
  }
  return geminiProvider;
}
