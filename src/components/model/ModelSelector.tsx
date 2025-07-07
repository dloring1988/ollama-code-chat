import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

const DEFAULT_MODELS = [
  { name: 'llama3.2', description: 'Latest Llama model, great for general tasks', size: '2.0GB' },
  { name: 'codellama', description: 'Specialized for code generation and understanding', size: '3.8GB' },
  { name: 'mistral', description: 'Fast and efficient for most tasks', size: '4.1GB' },
  { name: 'llava', description: 'Multimodal model that can understand images', size: '4.5GB' },
  { name: 'deepseek-coder', description: 'Optimized for coding tasks', size: '6.2GB' },
];

export const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const { toast } = useToast();

  const checkOllamaConnection = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        setOllamaConnected(true);
        return true;
      }
    } catch (error) {
      console.error('Ollama connection failed:', error);
    }
    
    setOllamaConnected(false);
    return false;
  };

  useEffect(() => {
    checkOllamaConnection();
  }, [isOpen]);

  const handleModelSelect = (modelName: string) => {
    onModelChange(modelName);
    setIsOpen(false);
    toast({
      title: 'Model changed',
      description: `Now using ${modelName}`,
    });
  };

  const pullModel = async (modelName: string) => {
    setLoading(true);
    try {
      toast({
        title: 'Downloading model...',
        description: `Pulling ${modelName} from Ollama registry`,
      });

      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (response.ok) {
        toast({
          title: 'Model downloaded!',
          description: `${modelName} is now available`,
        });
        await checkOllamaConnection(); // Refresh model list
      } else {
        throw new Error('Failed to pull model');
      }
    } catch (error) {
      toast({
        title: 'Download failed',
        description: `Could not download ${modelName}. Check your connection.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)}GB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="font-mono text-sm">{selectedModel}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Model Selection
            <Badge variant={ollamaConnected ? "default" : "destructive"} className="ml-2">
              {ollamaConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {!ollamaConnected ? (
          <Card className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Ollama Not Connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Make sure Ollama is running on your system and accessible at localhost:11434
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded font-mono">
              # Install Ollama<br />
              curl -fsSL https://ollama.ai/install.sh | sh<br /><br />
              # Start Ollama<br />
              ollama serve
            </div>
            <Button onClick={checkOllamaConnection} className="mt-4">
              Retry Connection
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Available Models */}
            {availableModels.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Available Models</h3>
                <div className="grid gap-2">
                  {availableModels.map((model) => (
                    <Card
                      key={model.name}
                      className={`p-4 cursor-pointer transition-smooth ${
                        selectedModel === model.name
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleModelSelect(model.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium font-mono text-sm">{model.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatSize(model.size)} • Modified {new Date(model.modified_at).toLocaleDateString()}
                          </div>
                        </div>
                        {selectedModel === model.name && (
                          <Badge>Active</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Models */}
            <div>
              <h3 className="font-medium mb-3">Recommended Models</h3>
              <div className="grid gap-2">
                {DEFAULT_MODELS
                  .filter(model => !availableModels.some(am => am.name === model.name))
                  .map((model) => (
                    <Card key={model.name} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium font-mono text-sm">{model.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {model.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Size: {model.size}
                          </div>
                        </div>
                        <Button
                          onClick={() => pullModel(model.name)}
                          disabled={loading}
                          size="sm"
                          className="ml-4"
                        >
                          {loading ? 'Pulling...' : 'Pull'}
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};