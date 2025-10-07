
import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptEditor } from './components/PromptEditor';
import { ResponseView } from './components/ResponseView';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { PromptTemplate, ModelConfig, ChatMessage, AppMode } from './types';
import { DEFAULT_MODEL_CONFIG } from './constants';
import { nanoid } from 'nanoid';

export default function App() {
  const [promptTemplates, setPromptTemplates] = useLocalStorage<PromptTemplate[]>('prompt-templates', []);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const activeTemplate = useMemo(() => 
    promptTemplates.find(p => p.id === activeTemplateId) || null,
    [activeTemplateId, promptTemplates]
  );

  const handleSelectTemplate = useCallback((id: string | null) => {
    setActiveTemplateId(id);
    // Reset state when switching templates or creating new
    setChatHistory([]);
    setGeneratedImage(null);
    setError(null);
  }, []);

  const handleSaveTemplate = useCallback((template: Omit<PromptTemplate, 'id' | 'createdAt'>) => {
    if (activeTemplateId) {
      setPromptTemplates(prev => prev.map(p => p.id === activeTemplateId ? { ...p, ...template, content: template.content } : p));
    } else {
      const newTemplate: PromptTemplate = { ...template, id: nanoid(), createdAt: new Date().toISOString() };
      setPromptTemplates(prev => [newTemplate, ...prev]);
      setActiveTemplateId(newTemplate.id);
    }
  }, [activeTemplateId, setPromptTemplates]);

  const handleDeleteTemplate = useCallback((id: string) => {
    setPromptTemplates(prev => prev.filter(p => p.id !== id));
    if (activeTemplateId === id) {
      setActiveTemplateId(null);
    }
  }, [activeTemplateId, setPromptTemplates]);

  return (
    <div className="flex h-screen font-sans bg-slate-900 text-slate-200">
      <Sidebar
        templates={promptTemplates}
        activeTemplateId={activeTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <PromptEditor
          key={activeTemplateId} 
          activeTemplate={activeTemplate}
          onSave={handleSaveTemplate}
          mode={mode}
          setMode={setMode}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
          setChatHistory={setChatHistory}
          setGeneratedImage={setGeneratedImage}
          modelConfig={modelConfig}
          setModelConfig={setModelConfig}
        />
        <ResponseView
          mode={mode}
          isLoading={isLoading}
          error={error}
          chatHistory={chatHistory}
          generatedImage={generatedImage}
        />
      </main>
    </div>
  );
}
