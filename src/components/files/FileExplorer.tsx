import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileExplorerProps {
  files: File[];
}

export const FileExplorer = ({ files }: FileExplorerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (selectedFile?.name === file.name) {
      setSelectedFile(null);
      setFileContent('');
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    
    try {
      const content = await file.text();
      setFileContent(content);
    } catch (error) {
      setFileContent('Error reading file');
    } finally {
      setLoading(false);
    }
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'md': 'markdown',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
    };
    return langMap[ext || ''] || 'text';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'ts': '#3178c6',
      'tsx': '#3178c6',
      'js': '#f7df1e',
      'jsx': '#61dafb',
      'py': '#3776ab',
      'java': '#ed8b00',
      'cpp': '#00599c',
      'c': '#a8b9cc',
      'cs': '#239120',
      'go': '#00add8',
      'rs': '#ce422b',
      'php': '#777bb4',
      'rb': '#cc342d',
      'swift': '#fa7343',
      'kt': '#7f52ff',
      'md': '#083fa1',
      'json': '#292929',
    };
    
    return (
      <div 
        className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: iconMap[ext || ''] || '#64748b' }}
      >
        {ext?.charAt(0).toUpperCase() || 'F'}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium">File Explorer</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {files.length} files loaded
        </p>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* File List */}
        <div className="border-b border-border">
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {files.map((file, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleFileSelect(file)}
                  className={`w-full justify-start text-left p-2 h-auto ${
                    selectedFile?.name === file.name 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-2 w-full">
                    {getFileIcon(file.name)}
                    <span className="text-xs truncate">{file.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* File Content */}
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-border bg-muted/20">
                <div className="flex items-center space-x-2">
                  {getFileIcon(selectedFile.name)}
                  <span className="text-xs font-medium">{selectedFile.name}</span>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading file content...
                  </div>
                ) : (
                  <div className="text-xs">
                    <SyntaxHighlighter
                      language={getLanguage(selectedFile.name)}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        background: 'transparent',
                        fontSize: '11px',
                        lineHeight: '1.4',
                      }}
                      showLineNumbers
                      wrapLines
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-4">
              <div>
                <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-muted-foreground">
                  Select a file to view its content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};