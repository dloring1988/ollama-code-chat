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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { searchSimilar } = useVectorStore();
  
  const {
    messages,
    isLoading,
    sendMessage,
    retrievedContext,
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
      context = await searchSimilar(content, 5);
    }
    
    await sendMessage(content, context);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Context Toggle */}
      {retrievedContext.length > 0 && (
        <div className="p-2 border-b border-border">
          <button
            onClick={() => setShowContext(!showContext)}
            className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
          >
            {showContext ? 'Hide' : 'Show'} Context ({retrievedContext.length} chunks)
          </button>
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
            ? "Ask about your code..." 
            : "Upload files to start chatting about your code"
          }
        />
      </div>
    </div>
  );
};