import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVectorStore } from '../store/useVectorStore';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Upload } from 'lucide-react';

interface FileUploadProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  selectedEmbeddingModel: string;
}

export const FileUpload = ({ selectedFiles, onFilesChange, selectedEmbeddingModel }: FileUploadProps) => {
  const { processFiles } = useVectorStore();
  const { toast } = useToast();
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFiles = useCallback(async (files: File[]) => {
    const codeFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'md', 'txt'].includes(ext || '');
    });

    if (codeFiles.length === 0) {
      toast({
        title: 'No supported files',
        description: 'Please upload code files (ts, js, py, etc.) or text files',
        variant: 'destructive',
      });
      return;
    }

    onFilesChange([...selectedFiles, ...codeFiles]);
    
    // Process files for vector search with the selected embedding model
    try {
      toast({
        title: 'Processing files...',
        description: `Creating embeddings using ${selectedEmbeddingModel}`,
      });
      
      await processFiles(codeFiles, selectedEmbeddingModel);
      
      toast({
        title: 'Files processed!',
        description: `${codeFiles.length} files ready for chat with ${selectedEmbeddingModel} embeddings`,
      });
    } catch (error) {
      toast({
        title: 'Processing failed',
        description: `Could not create embeddings with ${selectedEmbeddingModel}. Check Ollama connection and model availability.`,
        variant: 'destructive',
      });
    }
  }, [selectedFiles, onFilesChange, processFiles, selectedEmbeddingModel, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    await processSelectedFiles(acceptedFiles);
  }, [processSelectedFiles]);

  const handleFolderSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      await processSelectedFiles(fileArray);
    }
  }, [processSelectedFiles]);

  const openFolderDialog = () => {
    folderInputRef.current?.click();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.md', '.txt'],
    },
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-sidebar-foreground">Upload Files</h3>
      
      {/* Embedding Model Info */}
      <div className="text-xs text-sidebar-foreground/60 bg-sidebar-accent/30 p-2 rounded">
        <div className="flex items-center gap-1">
          <span>🧮</span>
          <span>Embedding Model: <strong>{selectedEmbeddingModel}</strong></span>
        </div>
      </div>
      
      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        onChange={handleFolderSelect}
        style={{ display: 'none' }}
      />
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={openFolderDialog}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Select Folder
        </Button>
      </div>
      
      <Card 
        {...getRootProps()} 
        className={`p-6 border-dashed cursor-pointer transition-smooth ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-sidebar-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-sidebar-foreground/60" />
          <p className="text-sm text-sidebar-foreground/80">
            {isDragActive 
              ? 'Drop files here...' 
              : 'Drag & drop files or folders here'
            }
          </p>
          <p className="text-xs text-sidebar-foreground/50 mt-1">
            Supports: .ts, .js, .py, .java, .cpp, .md, etc.
          </p>
        </div>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-sidebar-foreground/80">Loaded Files</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-sidebar-accent rounded text-xs"
              >
                <span className="truncate text-sidebar-accent-foreground">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};