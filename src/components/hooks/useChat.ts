import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tools?: ToolCall[];
  enhancedQueries?: string[];
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
  result?: string;
}

export const useChat = (selectedModel: string, uploadedFiles: File[]) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retrievedContext, setRetrievedContext] = useState<string[]>([]);
  const [enhancedQueries, setEnhancedQueries] = useState<string[]>([]);

  const generateEnhancedQueries = useCallback(async (originalQuery: string): Promise<string[]> => {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: `You are a query enhancement assistant. Given a user's question about code, generate 3-5 different search queries that would help find relevant code snippets and documentation.

User's question: "${originalQuery}"

Generate queries that would help find:
1. Direct code implementations
2. Related functions/classes
3. Documentation or comments
4. Error handling patterns
5. Usage examples

Return only the queries, one per line, without numbering or explanation:`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate enhanced queries');
      }

      const data = await response.json();
      const queries = data.response
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .slice(0, 5);
      
      return [originalQuery, ...queries];
    } catch (error) {
      console.error('Query enhancement error:', error);
      return [originalQuery];
    }
  }, [selectedModel]);

  const executeTools = useCallback(async (query: string): Promise<ToolCall[]> => {
    const tools: ToolCall[] = [];
    
    // Code analysis tool
    if (query.toLowerCase().includes('analyze') || query.toLowerCase().includes('explain')) {
      tools.push({
        name: 'code_analyzer',
        parameters: { query, type: 'analysis' },
        result: 'Code analysis initiated for deeper understanding'
      });
    }
    
    // Pattern search tool
    if (query.toLowerCase().includes('pattern') || query.toLowerCase().includes('example')) {
      tools.push({
        name: 'pattern_search',
        parameters: { query, type: 'pattern' },
        result: 'Searching for code patterns and examples'
      });
    }
    
    return tools;
  }, []);

  const sendMessage = useCallback(async (content: string, context: string[] = []) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setRetrievedContext(context);

    try {
      // Generate enhanced queries for better context retrieval
      const queries = await generateEnhancedQueries(content);
      setEnhancedQueries(queries);
      
      // Execute tools if applicable
      const toolCalls = await executeTools(content);
      
      // Construct RAG prompt with context and tools
      let prompt = content;
      if (context.length > 0) {
        prompt = `Context from uploaded files:
${context.map((chunk, i) => `[${i + 1}] ${chunk}`).join('\n\n')}

${toolCalls.length > 0 ? `Available tools used: ${toolCalls.map(t => t.name).join(', ')}` : ''}

Based on the above context, please answer the following question:
${content}`;
      }

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          stream: true,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        tools: toolCalls,
        enhancedQueries: queries,
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              assistantContent += data.response;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure Ollama is running on localhost:11434 and the model is available.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  return {
    messages,
    isLoading,
    sendMessage,
    retrievedContext,
    enhancedQueries,
  };
};