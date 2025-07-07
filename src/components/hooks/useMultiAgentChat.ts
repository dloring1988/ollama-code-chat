import { useState, useCallback } from 'react';
import { AgentManager } from '../agents/AgentManager';

export interface MultiAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentTrace?: any[];
  tools?: any[];
  enhancedQueries?: string[];
  contextUsed?: string[];
  verificationResults?: any;
}

export const useMultiAgentChat = (selectedModel: string, uploadedFiles: File[]) => {
  const [messages, setMessages] = useState<MultiAgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentManager] = useState(() => new AgentManager(selectedModel));

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: MultiAgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Process query through multi-agent system
      const result = await agentManager.processUserQuery(
        content,
        uploadedFiles,
        messages
      );

      const assistantMessage: MultiAgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        agentTrace: result.agentTrace,
        tools: result.tools,
        enhancedQueries: result.enhancedQueries,
        contextUsed: result.context,
        verificationResults: result.agentTrace.find(trace => trace.agent === 'verifier')?.result?.data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Multi-agent chat error:', error);
      const errorMessage: MultiAgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error while processing your request. The multi-agent system failed with: ${error.message}. Please ensure Ollama is running and try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, uploadedFiles, messages, agentManager]);

  // Update model when it changes
  const updateModel = useCallback((newModel: string) => {
    agentManager.updateModel(newModel);
  }, [agentManager]);

  return {
    messages,
    isLoading,
    sendMessage,
    updateModel,
  };
};