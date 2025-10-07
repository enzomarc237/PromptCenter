
import React, { useState } from 'react';
import type { PromptTemplate } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SidebarProps {
  templates: PromptTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (id: string | null) => void;
  onDeleteTemplate: (id:string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ templates, activeTemplateId, onSelectTemplate, onDeleteTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this template?")) {
        onDeleteTemplate(id);
    }
  }

  return (
    <aside className="w-80 bg-slate-950/70 border-r border-slate-800 flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-cyan-400" />
            Prompt Center
        </h1>
        <button
          onClick={() => onSelectTemplate(null)}
          className="p-2 rounded-md hover:bg-cyan-500/20 text-cyan-400 transition-colors"
          title="New Prompt"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <nav className="flex-1 overflow-y-auto -mr-2 pr-2">
        <ul className="space-y-1">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <li key={template.id}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onSelectTemplate(template.id); }}
                  className={`group flex items-center justify-between p-2.5 rounded-md text-sm transition-colors ${
                    activeTemplateId === template.id
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col truncate">
                      <span className="font-medium truncate">{template.name}</span>
                      <span className="text-xs text-slate-500 group-hover:text-slate-400">{template.category}</span>
                  </div>
                  <button onClick={(e) => handleDelete(e, template.id)} className="p-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity">
                      <TrashIcon className="w-4 h-4" />
                  </button>
                </a>
              </li>
            ))
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No templates found.</p>
          )}
        </ul>
      </nav>
    </aside>
  );
};
