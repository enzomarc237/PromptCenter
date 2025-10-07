
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { PromptTemplate, ModelConfig, AppMode, ChatMessage } from '../types';
import { PROMPT_CATEGORIES } from '../constants';
import { generateTextStream, generateImage, createChatSession } from '../services/geminiService';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { PhotoIcon } from './icons/PhotoIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SaveIcon } from './icons/SaveIcon';
import { Chat } from '@google/genai';

interface PromptEditorProps {
  activeTemplate: PromptTemplate | null;
  onSave: (template: Omit<PromptTemplate, 'id' | 'createdAt'>) => void;
  mode: AppMode;
  setMode: React.Dispatch<React.SetStateAction<AppMode>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setGeneratedImage: React.Dispatch<React.SetStateAction<string | null>>;
  modelConfig: ModelConfig;
  setModelConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const PromptEditor: React.FC<PromptEditorProps> = ({
  activeTemplate, onSave, mode, setMode, isLoading, setIsLoading, setError, setChatHistory, setGeneratedImage, modelConfig, setModelConfig
}) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(PROMPT_CATEGORIES[0]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<{ file: File; data: string; mimeType: string; } | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    setName(activeTemplate?.name || 'New Prompt');
    setContent(activeTemplate?.content || '');
    setCategory(activeTemplate?.category || PROMPT_CATEGORIES[0]);
    setVariables({});
    setImageFile(null);
    setChatSession(null);
  }, [activeTemplate]);

  const detectedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  }, [content]);

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const finalPrompt = useMemo(() => {
    return content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => variables[key] || '');
  }, [content, variables]);

  const handleSave = () => {
    onSave({ name, content, category });
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImageFile({ file, data: base64, mimeType: file.type });
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setChatHistory([]);
    setGeneratedImage(null);

    try {
        if (mode === 'image') {
            const imageUrl = await generateImage(finalPrompt);
            setGeneratedImage(imageUrl);
        } else {
            const imagePart = imageFile ? { inlineData: { data: imageFile.data, mimeType: imageFile.mimeType } } : undefined;
            const stream = await generateTextStream(finalPrompt, modelConfig, imagePart);
            let fullResponse = "";
            setChatHistory([{ role: 'user', content: finalPrompt }]);
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setChatHistory(prev => [{ role: 'user', content: finalPrompt }, { role: 'model', content: fullResponse }]);
            }
        }
    } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    const currentInput = chatInput;
    setChatInput('');
    
    setChatHistory(prev => [...prev, { role: 'user', content: currentInput }]);
    
    try {
        const session = chatSession || createChatSession(finalPrompt, []);
        if(!chatSession) setChatSession(session);

        const stream = await session.sendMessageStream({ message: currentInput });
        let fullResponse = "";
        setChatHistory(prev => [...prev, { role: 'model', content: fullResponse }]);

        for await (const chunk of stream) {
            fullResponse += chunk.text;
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { role: 'model', content: fullResponse };
                return newHistory;
            });
        }
    } catch(e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
        setChatHistory(prev => prev.slice(0, -1)); // remove optimistic user message
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
        <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md px-2 -ml-2"
        />
        <div className="flex items-center space-x-2">
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                {PROMPT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <Button onClick={handleSave} variant="secondary" title="Save Template">
                <SaveIcon className="w-4 h-4" />
            </Button>
        </div>
      </div>
      
      {/* Editor & Config */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Prompt & Variables */}
        <div className="flex flex-col w-2/3">
          <label className="text-sm font-semibold text-slate-400 mb-2">
              {mode === 'chat' ? 'System Instruction / Preamble' : 'Prompt Template'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your prompt here. Use {{variable_name}} for dynamic values."
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-base font-mono resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {detectedVariables.length > 0 && mode !== 'chat' && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Variables</h3>
                <div className="grid grid-cols-2 gap-3">
                    {detectedVariables.map(key => (
                        <div key={key}>
                            <label className="block text-xs text-slate-400 mb-1">{key}</label>
                            <input 
                                type="text"
                                value={variables[key] || ''}
                                onChange={(e) => handleVariableChange(key, e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col w-1/3 space-y-6">
            <div>
                <label className="text-sm font-semibold text-slate-400 mb-2 block">Execution Mode</label>
                <div className="flex space-x-2">
                    <Button onClick={() => setMode('single')} variant={mode === 'single' ? 'primary' : 'secondary'} className="flex-1">
                        <SparklesIcon className="w-4 h-4 mr-2" /> Single Turn
                    </Button>
                    <Button onClick={() => setMode('chat')} variant={mode === 'chat' ? 'primary' : 'secondary'} className="flex-1">
                        <ChatBubbleIcon className="w-4 h-4 mr-2" /> Chat
                    </Button>
                    <Button onClick={() => setMode('image')} variant={mode === 'image' ? 'primary' : 'secondary'} className="flex-1">
                        <PhotoIcon className="w-4 h-4 mr-2" /> Image
                    </Button>
                </div>
            </div>

            { (mode === 'single' || mode === 'chat') && (
                <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300">Model Configuration</h3>
                    <Slider label="Temperature" min={0} max={1} step={0.01} value={modelConfig.temperature} onChange={v => setModelConfig(c => ({...c, temperature: v}))} />
                    <Slider label="Top-P" min={0} max={1} step={0.01} value={modelConfig.topP} onChange={v => setModelConfig(c => ({...c, topP: v}))} />
                    <Slider label="Top-K" min={1} max={100} step={1} value={modelConfig.topK} onChange={v => setModelConfig(c => ({...c, topK: v}))} />
                </div>
            )}
            
            { mode === 'single' && (
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Image Input (Optional)</h3>
                    <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <label htmlFor="image-upload" className="w-full cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-md p-2 flex items-center justify-center">
                        <PhotoIcon className="w-4 h-4 mr-2"/>
                        {imageFile ? imageFile.file.name : 'Upload Image'}
                    </label>
                    {imageFile && <img src={`data:${imageFile.mimeType};base64,${imageFile.data}`} alt="upload preview" className="mt-2 rounded-md max-h-24 w-auto"/>}
                </div>
            )}
            
            {mode !== 'chat' && <Button onClick={handleGenerate} disabled={isLoading} className="w-full justify-center text-lg py-3">Generate</Button>}
        </div>
      </div>
       {mode === 'chat' && (
            <div className="mt-4 flex items-center gap-4">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isLoading}
                />
                <Button onClick={handleSendChatMessage} disabled={isLoading || !chatInput.trim()}>
                    Send
                </Button>
            </div>
        )}
    </div>
  );
};
