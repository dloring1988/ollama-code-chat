import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ContextPanel } from './ContextPanel';
import { useChat } from '../hooks/useChat';
import { useVectorStore } from '../store/useVectorStore';

interface ChatAreaProps {
  selectedModel: string;
  uploadedFiles: File[];
}

export const ChatArea = ({ selectedModel, uploadedFiles }: ChatAreaProps) => {
  const [showContext, setShowContext] = useState(false);
  const [showEnhancedQueries, setShowEnhancedQueries] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { searchSimilar, searchWithEnhancedQueries } = useVectorStore();
  
  const {
    messages,
    isLoading,
    sendMessage,
    retrievedContext,
    enhancedQueries,
  } = useChat(selectedModel, uploadedFiles);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Search for relevant context if files are loaded
    let context: string[] = [];
    if (uploadedFiles.length > 0) {
      // First, try to get the enhanced queries or use the original content
      const searchQueries = enhancedQueries.length > 0 ? enhancedQueries : [content];
      context = await searchWithEnhancedQueries(searchQueries, 8);
    }
    
    await sendMessage(content, context);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Enhanced Context Controls */}
      {(retrievedContext.length > 0 || enhancedQueries.length > 0) && (
        <div className="p-2 border-b border-border flex gap-4">
          {retrievedContext.length > 0 && (
            <button
              onClick={() => setShowContext(!showContext)}
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              {showContext ? 'Hide' : 'Show'} Context ({retrievedContext.length} chunks)
            </button>
          )}
          {enhancedQueries.length > 0 && (
            <button
              onClick={() => setShowEnhancedQueries(!showEnhancedQueries)}
              className="text-sm text-muted-foreground hover:text-primary transition-smooth"
            >
              {showEnhancedQueries ? 'Hide' : 'Show'} Enhanced Queries ({enhancedQueries.length})
            </button>
          )}
        </div>
      )}
      
      {/* Enhanced Queries Panel */}
      {showEnhancedQueries && enhancedQueries.length > 0 && (
        <div className="border-b border-border p-3 bg-muted/30">
          <h4 className="text-sm font-medium mb-2">Enhanced Search Queries:</h4>
          <div className="space-y-1">
            {enhancedQueries.map((query, index) => (
              <div key={index} className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                {index === 0 ? '🎯 Original: ' : '🔍 Enhanced: '}{query}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Context Panel */}
      {showContext && (
        <div className="border-b border-border">
          <ContextPanel context={retrievedContext} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={uploadedFiles.length > 0 
            ? "Ask about your code (AI will enhance your query for better results)..." 
            : "Upload files to start chatting about your code"
          }
        />
      </div>
    </div>
  );
};