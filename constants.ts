
import type { ModelConfig } from './types';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
};

export const PROMPT_CATEGORIES = ['General', 'Coding', 'Marketing', 'Creative Writing', 'Translation'];
