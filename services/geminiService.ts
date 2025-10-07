
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import type { ModelConfig, ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

export const generateTextStream = async (
  prompt: string,
  config: ModelConfig,
  image?: { inlineData: { data: string; mimeType: string } }
) => {
    const contents = image ? { parts: [{ text: prompt }, image] } : prompt;
    
    const geminiConfig = {
      ...config,
      ...(config.maxOutputTokens > 0 && {
        maxOutputTokens: config.maxOutputTokens,
        thinkingConfig: { thinkingBudget: Math.min(100, config.maxOutputTokens / 2) }
      })
    };

    return ai.models.generateContentStream({
        model: textModel,
        contents,
        config: geminiConfig
    });
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("Image generation failed.");
};


export const createChatSession = (systemInstruction: string, history: ChatMessage[]): Chat => {
    return ai.chats.create({
        model: textModel,
        config: {
            systemInstruction
        },
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    });
};
