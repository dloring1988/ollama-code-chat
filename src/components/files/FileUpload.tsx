import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVectorStore } from '../store/useVectorStore';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
}

export const FileUpload = ({ selectedFiles, onFilesChange }: FileUploadProps) => {
  const { processFiles } = useVectorStore();
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const codeFiles = acceptedFiles.filter(file => {
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
    
    // Process files for vector search
    try {
      toast({
        title: 'Processing files...',
        description: 'Creating embeddings for vector search',
      });
      
      await processFiles(codeFiles);
      
      toast({
        title: 'Files processed!',
        description: `${codeFiles.length} files ready for chat`,
      });
    } catch (error) {
      toast({
        title: 'Processing failed',
        description: 'Could not create embeddings. Check Ollama connection.',
        variant: 'destructive',
      });
    }
  }, [selectedFiles, onFilesChange, processFiles, toast]);

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
          <svg className="w-8 h-8 mx-auto mb-2 text-sidebar-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-sidebar-foreground/80">
            {isDragActive 
              ? 'Drop files here...' 
              : 'Drag & drop code files, or click to select'
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