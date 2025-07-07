import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ContextPanel } from './ContextPanel';
import { AgentTracePanel } from './AgentTracePanel';
import { useMultiAgentChat } from '../hooks/useMultiAgentChat';

interface MultiAgentChatAreaProps {
  selectedModel: string;
  uploadedFiles: File[];
}

export const MultiAgentChatArea = ({ selectedModel, uploadedFiles }: MultiAgentChatAreaProps) => {
  const [showContext, setShowContext] = useState(false);
  const [showAgentTrace, setShowAgentTrace] = useState(false);
  const [showEnhancedQueries, setShowEnhancedQueries] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    sendMessage,
    updateModel,
  } = useMultiAgentChat(selectedModel, uploadedFiles);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    updateModel(selectedModel);
  }, [selectedModel, updateModel]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const lastMessage = messages[messages.length - 1];
  const hasAgentData = lastMessage?.role === 'assistant' && (
    lastMessage.agentTrace?.length > 0 || 
    lastMessage.contextUsed?.length > 0 || 
    lastMessage.enhancedQueries?.length > 0
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Multi-Agent Controls */}
      {hasAgentData && (
        <div className="p-3 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">Multi-Agent System Active</span>
              </div>
              
              {lastMessage?.agentTrace?.length > 0 && (
                <button
                  onClick={() => setShowAgentTrace(!showAgentTrace)}
                  className="text-sm text-muted-foreground hover:text-primary transition-smooth flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {showAgentTrace ? 'Hide' : 'Show'} Agent Trace ({lastMessage.agentTrace.length} agents)
                </button>
              )}
              
              {lastMessage?.contextUsed?.length > 0 && (
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {showContext ? 'Hide' : 'Show'} Context ({lastMessage.contextUsed.length} chunks)
                </button>
              )}
              
              {lastMessage?.enhancedQueries?.length > 0 && (
                <button
                  onClick={() => setShowEnhancedQueries(!showEnhancedQueries)}
                  className="text-sm text-muted-foreground hover:text-accent transition-smooth flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {showEnhancedQueries ? 'Hide' : 'Show'} Enhanced Queries ({lastMessage.enhancedQueries.length})
                </button>
              )}
            </div>
            
            {lastMessage?.verificationResults && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quality Score:</span>
                <div className={`text-xs font-medium px-2 py-1 rounded ${
                  lastMessage.verificationResults.overallConfidence > 0.8 
                    ? 'bg-green-100 text-green-800' 
                    : lastMessage.verificationResults.overallConfidence > 0.6
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(lastMessage.verificationResults.overallConfidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Agent Trace Panel */}
      {showAgentTrace && lastMessage?.agentTrace && (
        <div className="border-b border-border">
          <AgentTracePanel agentTrace={lastMessage.agentTrace} />
        </div>
      )}
      
      {/* Enhanced Queries Panel */}
      {showEnhancedQueries && lastMessage?.enhancedQueries?.length > 0 && (
        <div className="border-b border-border p-4 bg-muted/10">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enhanced Search Queries
          </h4>
          <div className="grid gap-2">
            {lastMessage.enhancedQueries.map((query, index) => (
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
      {showContext && lastMessage?.contextUsed && (
        <div className="border-b border-border">
          <ContextPanel context={lastMessage.contextUsed} />
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
            ? "Ask about your code (Multi-agent system will analyze and provide comprehensive answers)..." 
            : "Upload files to start chatting with the multi-agent system"
          }
        />
        
        {uploadedFiles.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            🤖 Multi-Agent System: Context Fetcher → Manager → Query Enhancer → QA Agent → Verifier
          </div>
        )}
      </div>
    </div>
  );
};