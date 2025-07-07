import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from '../chat/ChatArea';
import { FileExplorer } from '../files/FileExplorer';
import { ModelSelector } from '../model/ModelSelector';

export const MainLayout = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedFiles={selectedFiles}
        onFilesChange={setSelectedFiles}
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
          
          <div className="flex-1" />
          
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            <ChatArea 
              selectedModel={selectedModel}
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