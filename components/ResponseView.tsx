
import React from 'react';
import type { AppMode, ChatMessage } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface ResponseViewProps {
  mode: AppMode;
  isLoading: boolean;
  error: string | null;
  chatHistory: ChatMessage[];
  generatedImage: string | null;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
    </div>
);

const UserMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-slate-700/50 rounded-lg p-4 ml-10">
        <p className="text-slate-300 whitespace-pre-wrap">{message}</p>
    </div>
);

const ModelMessage: React.FC<{ message: string; isLoading: boolean }> = ({ message, isLoading }) => (
    <div className="bg-slate-800/50 rounded-lg p-4 mr-10">
        <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap">
            {message}
            {isLoading && !message && <LoadingSpinner />}
            {isLoading && message && <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />}
        </div>
    </div>
);

export const ResponseView: React.FC<ResponseViewProps> = ({ mode, isLoading, error, chatHistory, generatedImage }) => {
  const renderContent = () => {
    if (error) {
      return <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    if (mode === 'image') {
      if (isLoading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /> <span className="ml-3">Generating image...</span></div>;
      if (generatedImage) return <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg" />;
      return <div className="text-slate-500">The generated image will appear here.</div>;
    }
    
    // single turn or chat
    const lastMessage = chatHistory[chatHistory.length - 1];
    const isModelLoading = isLoading && lastMessage?.role === 'model';
    
    if (!isLoading && chatHistory.length === 0) {
        return <div className="text-slate-500">The AI response will appear here.</div>;
    }
    
    return (
        <div className="space-y-4">
            {chatHistory.map((msg, index) =>
                msg.role === 'user'
                    ? <UserMessage key={index} message={msg.content} />
                    : <ModelMessage key={index} message={msg.content} isLoading={isModelLoading && index === chatHistory.length - 1}/>
            )}
             {isLoading && chatHistory.length === 0 && <ModelMessage message="" isLoading={true}/>}
        </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-950/70 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className={`flex-1 ${mode === 'image' && 'flex items-center justify-center'}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
