import { FileUpload } from '../files/FileUpload';
import { HistoryList } from '../chat/HistoryList';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  selectedEmbeddingModel: string;
}

export const Sidebar = ({ isOpen, selectedFiles, onFilesChange, selectedEmbeddingModel }: SidebarProps) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">Local Repo Chat</h1>
            <p className="text-sm text-sidebar-foreground/60">Powered by Ollama</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="p-4 border-b border-sidebar-border">
        <FileUpload 
          selectedFiles={selectedFiles}
          onFilesChange={onFilesChange}
          selectedEmbeddingModel={selectedEmbeddingModel}
        />
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <HistoryList />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 text-center space-y-1">
          <div>{selectedFiles.length} files loaded</div>
          <div>Embedding: {selectedEmbeddingModel}</div>
        </div>
      </div>
    </div>
  );
};