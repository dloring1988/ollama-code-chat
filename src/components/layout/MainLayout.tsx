import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MultiAgentChatArea } from '../chat/MultiAgentChatArea';
import { FileExplorer } from '../files/FileExplorer';
import { ModelSelector } from '../model/ModelSelector';

export const MainLayout = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState('nomic-embed-text');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedFiles={selectedFiles}
        onFilesChange={setSelectedFiles}
        selectedEmbeddingModel={selectedEmbeddingModel}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 bg-card border-b border-border flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-smooth"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Multi-Agent System</span>
          </div>
          
          <div className="flex-1" />
          
          <ModelSelector 
            selectedModel={selectedModel}
            selectedEmbeddingModel={selectedEmbeddingModel}
            onModelChange={setSelectedModel}
            onEmbeddingModelChange={setSelectedEmbeddingModel}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            <MultiAgentChatArea 
              selectedModel={selectedModel}
              selectedEmbeddingModel={selectedEmbeddingModel}
              uploadedFiles={selectedFiles}
            />
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="w-80 border-l border-border">
              <FileExplorer files={selectedFiles} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};