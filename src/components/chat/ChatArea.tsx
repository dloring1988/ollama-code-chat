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
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { searchWithEnhancedQueries } = useVectorStore();
  
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
    if (uploadedFiles.length === 0) {
      await sendMessage(content, []);
      return;
    }

    setIsSearching(true);
    
    try {
      // First, get enhanced queries for the current question
      const enhancedQueriesForSearch = await generateSearchQueries(content);
      
      // Search for relevant context using enhanced queries
      const context = await searchWithEnhancedQueries(enhancedQueriesForSearch, 10);
      
      // Send message with retrieved context
      await sendMessage(content, context);
    } catch (error) {
      console.error('Context search error:', error);
      // Fallback to sending without context
      await sendMessage(content, []);
    } finally {
      setIsSearching(false);
    }
  };

  const generateSearchQueries = async (query: string): Promise<string[]> => {
    // Generate search-optimized queries
    const searchQueries = [
      query, // Original query
      query.replace(/[?!.]/g, ''), // Clean query
      ...query.split(' ').filter(word => word.length > 3), // Individual keywords
    ];

    // Add context-specific queries based on query type
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('error') || queryLower.includes('bug')) {
      searchQueries.push('error handling', 'exception', 'try catch', 'debugging');
    }
    
    if (queryLower.includes('function') || queryLower.includes('method')) {
      searchQueries.push('function definition', 'method implementation', 'function call');
    }
    
    if (queryLower.includes('class') || queryLower.includes('component')) {
      searchQueries.push('class definition', 'component', 'constructor', 'interface');
    }
    
    if (queryLower.includes('test') || queryLower.includes('testing')) {
      searchQueries.push('test', 'spec', 'describe', 'it should', 'expect');
    }

    return [...new Set(searchQueries)].slice(0, 8); // Remove duplicates and limit
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Enhanced Context Controls */}
      {(retrievedContext.length > 0 || enhancedQueries.length > 0 || isSearching) && (
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              {isSearching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Searching codebase...
                </div>
              )}
              
              {retrievedContext.length > 0 && (
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {showContext ? 'Hide' : 'Show'} Context ({retrievedContext.length} chunks)
                </button>
              )}
              
              {enhancedQueries.length > 0 && (
                <button
                  onClick={() => setShowEnhancedQueries(!showEnhancedQueries)}
                  className="text-sm text-muted-foreground hover:text-primary transition-smooth flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {showEnhancedQueries ? 'Hide' : 'Show'} Search Queries ({enhancedQueries.length})
                </button>
              )}
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {uploadedFiles.length} files indexed
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Enhanced Queries Panel */}
      {showEnhancedQueries && enhancedQueries.length > 0 && (
        <div className="border-b border-border p-4 bg-muted/10">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enhanced Search Queries
          </h4>
          <div className="grid gap-2">
            {enhancedQueries.map((query, index) => (
              <div key={index} className="text-xs bg-background/50 rounded-md p-2 border border-border/50">
                <span className="text-primary font-medium">
                  {index === 0 ? '🎯 Original: ' : `🔍 Enhanced ${index}: `}
                </span>
                <span className="text-foreground">{query}</span>
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
          disabled={isLoading || isSearching}
          placeholder={uploadedFiles.length > 0 
            ? "Ask about your code (AI will search and enhance your query automatically)..." 
            : "Upload files to start chatting about your code"
          }
        />
        
        {uploadedFiles.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            💡 Tip: Ask specific questions about functions, classes, errors, or patterns in your code
          </div>
        )}
      </div>
    </div>
  );
};