import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface ModelSelectorProps {
  selectedModel: string;
  selectedEmbeddingModel: string;
  onModelChange: (model: string) => void;
  onEmbeddingModelChange: (model: string) => void;
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

const DEFAULT_LLM_MODELS = [
  { name: 'llama3.2', description: 'Latest Llama model, great for general tasks', size: '2.0GB', category: 'llm' },
  { name: 'codellama', description: 'Specialized for code generation and understanding', size: '3.8GB', category: 'llm' },
  { name: 'mistral', description: 'Fast and efficient for most tasks', size: '4.1GB', category: 'llm' },
  { name: 'deepseek-coder', description: 'Optimized for coding tasks', size: '6.2GB', category: 'llm' },
  { name: 'qwen2.5-coder', description: 'Advanced coding assistant', size: '4.7GB', category: 'llm' },
];

const DEFAULT_EMBEDDING_MODELS = [
  { name: 'nomic-embed-text', description: 'High-quality text embeddings, recommended', size: '274MB', category: 'embedding' },
  { name: 'mxbai-embed-large', description: 'Large embedding model for better accuracy', size: '669MB', category: 'embedding' },
  { name: 'all-minilm', description: 'Lightweight and fast embedding model', size: '23MB', category: 'embedding' },
  { name: 'snowflake-arctic-embed', description: 'Snowflake\'s embedding model', size: '669MB', category: 'embedding' },
];

export const ModelSelector = ({ 
  selectedModel, 
  selectedEmbeddingModel, 
  onModelChange, 
  onEmbeddingModelChange 
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'llm' | 'embedding'>('llm');
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

  const handleModelSelect = (modelName: string, type: 'llm' | 'embedding') => {
    if (type === 'llm') {
      onModelChange(modelName);
      toast({
        title: 'LLM Model changed',
        description: `Now using ${modelName} for chat responses`,
      });
    } else {
      onEmbeddingModelChange(modelName);
      toast({
        title: 'Embedding Model changed',
        description: `Now using ${modelName} for vector embeddings`,
      });
    }
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

  const getAvailableModelsByType = (type: 'llm' | 'embedding') => {
    return availableModels.filter(model => {
      if (type === 'embedding') {
        return model.name.includes('embed') || model.name.includes('embedding');
      } else {
        return !model.name.includes('embed') && !model.name.includes('embedding');
      }
    });
  };

  const getRecommendedModelsByType = (type: 'llm' | 'embedding') => {
    const defaultModels = type === 'llm' ? DEFAULT_LLM_MODELS : DEFAULT_EMBEDDING_MODELS;
    const availableNames = availableModels.map(m => m.name);
    return defaultModels.filter(model => !availableNames.includes(model.name));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className="flex flex-col items-start">
            <span className="font-mono text-xs">{selectedModel}</span>
            <span className="font-mono text-xs text-muted-foreground">{selectedEmbeddingModel}</span>
          </div>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Model Configuration
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
            {/* Model Type Tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('llm')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'llm'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🤖 LLM Models
              </button>
              <button
                onClick={() => setActiveTab('embedding')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'embedding'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🧮 Embedding Models
              </button>
            </div>

            {/* Current Selection */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-medium mb-2">Current Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">LLM Model:</span>
                  <div className="font-mono font-medium">{selectedModel}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Embedding Model:</span>
                  <div className="font-mono font-medium">{selectedEmbeddingModel}</div>
                </div>
              </div>
            </Card>

            {/* Available Models */}
            {getAvailableModelsByType(activeTab).length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  Available {activeTab === 'llm' ? 'LLM' : 'Embedding'} Models
                  <Badge variant="outline">{getAvailableModelsByType(activeTab).length}</Badge>
                </h3>
                <div className="grid gap-2">
                  {getAvailableModelsByType(activeTab).map((model) => {
                    const isSelected = activeTab === 'llm' 
                      ? selectedModel === model.name 
                      : selectedEmbeddingModel === model.name;
                    
                    return (
                      <Card
                        key={model.name}
                        className={`p-4 cursor-pointer transition-smooth ${
                          isSelected
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleModelSelect(model.name, activeTab)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium font-mono text-sm">{model.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatSize(model.size)} • Modified {new Date(model.modified_at).toLocaleDateString()}
                            </div>
                          </div>
                          {isSelected && (
                            <Badge>Active</Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Recommended Models */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                Recommended {activeTab === 'llm' ? 'LLM' : 'Embedding'} Models
                <Badge variant="outline">{getRecommendedModelsByType(activeTab).length}</Badge>
              </h3>
              
              {activeTab === 'embedding' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <div className="font-medium text-blue-900">Embedding Models Required</div>
                      <div className="text-blue-700">
                        Embedding models are essential for vector search and context retrieval. 
                        <strong> nomic-embed-text</strong> is recommended for best results.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                {getRecommendedModelsByType(activeTab).map((model) => (
                  <Card key={model.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium font-mono text-sm">{model.name}</div>
                          {model.name === 'nomic-embed-text' && activeTab === 'embedding' && (
                            <Badge variant="default" className="text-xs">Recommended</Badge>
                          )}
                        </div>
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

            {/* Usage Instructions */}
            <Card className="p-4 bg-muted/30">
              <h4 className="font-medium mb-2">💡 Quick Setup Guide</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>1. <strong>LLM Model:</strong> Choose a model for chat responses (e.g., llama3.2, codellama)</div>
                <div>2. <strong>Embedding Model:</strong> Choose a model for vector search (recommended: nomic-embed-text)</div>
                <div>3. Pull any missing models using the "Pull" button</div>
                <div>4. Both models will work together for optimal code analysis</div>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};