
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface ModelConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export type AppMode = 'single' | 'chat' | 'image';
