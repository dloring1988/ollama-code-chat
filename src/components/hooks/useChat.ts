import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tools?: ToolCall[];
  enhancedQueries?: string[];
  contextUsed?: string[];
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

  const generateEnhancedQueries = useCallback(async (originalQuery: string, conversationHistory: Message[]): Promise<string[]> => {
    try {
      // Build conversation context for better query enhancement
      const recentMessages = conversationHistory.slice(-4).map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      const enhancementPrompt = `You are an expert at generating search queries for code repositories. Given a user's question and recent conversation context, generate 4-6 diverse search queries that would help find the most relevant code snippets, documentation, and examples.

Recent conversation:
${recentMessages}

Current question: "${originalQuery}"

Generate queries that cover:
1. Direct implementation searches
2. Related function/class names
3. Error patterns and debugging
4. Usage examples and patterns
5. Documentation and comments
6. Configuration and setup code

Return only the search queries, one per line, without numbering:`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: enhancementPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 300,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate enhanced queries');
      }

      const data = await response.json();
      const queries = data.response
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 6);
      
      return [originalQuery, ...queries];
    } catch (error) {
      console.error('Query enhancement error:', error);
      return [originalQuery];
    }
  }, [selectedModel]);

  const executeTools = useCallback(async (query: string, context: string[]): Promise<ToolCall[]> => {
    const tools: ToolCall[] = [];
    const queryLower = query.toLowerCase();
    
    // Code analysis tool
    if (queryLower.includes('analyze') || queryLower.includes('explain') || queryLower.includes('how does')) {
      tools.push({
        name: 'code_analyzer',
        parameters: { 
          query, 
          type: 'deep_analysis',
          context_chunks: context.length 
        },
        result: `Performing deep code analysis across ${context.length} relevant code sections`
      });
    }
    
    // Pattern search tool
    if (queryLower.includes('pattern') || queryLower.includes('example') || queryLower.includes('similar')) {
      tools.push({
        name: 'pattern_search',
        parameters: { 
          query, 
          type: 'pattern_matching',
          scope: 'repository' 
        },
        result: 'Searching for similar patterns and usage examples across the codebase'
      });
    }

    // Debug assistance tool
    if (queryLower.includes('error') || queryLower.includes('bug') || queryLower.includes('fix') || queryLower.includes('debug')) {
      tools.push({
        name: 'debug_assistant',
        parameters: { 
          query, 
          type: 'error_analysis',
          context_available: context.length > 0 
        },
        result: 'Analyzing potential issues and suggesting debugging approaches'
      });
    }

    // Documentation tool
    if (queryLower.includes('document') || queryLower.includes('comment') || queryLower.includes('readme')) {
      tools.push({
        name: 'documentation_helper',
        parameters: { 
          query, 
          type: 'documentation_search' 
        },
        result: 'Searching documentation and comments for relevant information'
      });
    }

    // Refactoring tool
    if (queryLower.includes('refactor') || queryLower.includes('improve') || queryLower.includes('optimize')) {
      tools.push({
        name: 'refactoring_assistant',
        parameters: { 
          query, 
          type: 'code_improvement',
          suggestions_needed: true 
        },
        result: 'Analyzing code for improvement opportunities and best practices'
      });
    }
    
    return tools;
  }, []);

  const buildSystemPrompt = useCallback((context: string[], toolCalls: ToolCall[], userQuery: string) => {
    const hasContext = context.length > 0;
    const hasTools = toolCalls.length > 0;

    let systemPrompt = `You are an expert software engineer and code assistant with deep knowledge across multiple programming languages and frameworks. You excel at:

🔍 **Code Analysis**: Understanding complex codebases, identifying patterns, and explaining functionality
🛠️ **Problem Solving**: Debugging issues, suggesting improvements, and providing practical solutions
📚 **Best Practices**: Recommending industry standards, design patterns, and optimization techniques
🎯 **Contextual Help**: Providing relevant, actionable advice based on the specific codebase

## Response Guidelines:
- Be precise and technical while remaining clear
- Provide code examples when helpful
- Explain the reasoning behind your suggestions
- Consider the broader context of the codebase
- Highlight potential issues or improvements
- Use proper formatting for code snippets

`;

    if (hasContext) {
      systemPrompt += `## Available Context:
You have access to ${context.length} relevant code sections from the user's repository. Use this context to provide specific, accurate answers about their codebase.

`;
    }

    if (hasTools) {
      systemPrompt += `## Active Tools:
${toolCalls.map(tool => `- **${tool.name}**: ${tool.result}`).join('\n')}

`;
    }

    systemPrompt += `## Current Task:
${userQuery}

Provide a comprehensive, helpful response that directly addresses the user's question while leveraging the available context and tools.`;

    return systemPrompt;
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
      const queries = await generateEnhancedQueries(content, messages);
      setEnhancedQueries(queries);
      
      // Execute tools if applicable
      const toolCalls = await executeTools(content, context);
      
      // Build system prompt
      const systemPrompt = buildSystemPrompt(context, toolCalls, content);
      
      // Construct the full prompt with context
      let fullPrompt = systemPrompt;
      
      if (context.length > 0) {
        fullPrompt += `\n\n## Code Context:\n${context.map((chunk, i) => `### Context ${i + 1}:\n${chunk}`).join('\n\n')}`;
      }

      // Add conversation history for continuity
      const recentHistory = messages.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      if (recentHistory) {
        fullPrompt += `\n\n## Recent Conversation:\n${recentHistory}`;
      }

      fullPrompt += `\n\n## Current Question:\n${content}`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: fullPrompt,
          stream: true,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 2048,
            stop: ['Human:', 'User:'],
          }
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
        contextUsed: context,
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
        content: `I encountered an error while processing your request. Please ensure:

1. **Ollama is running**: Make sure Ollama is active on localhost:11434
2. **Model is available**: Verify that the "${selectedModel}" model is installed
3. **Network connectivity**: Check your connection to the Ollama service

You can test Ollama by running: \`ollama list\` to see available models.

Error details: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, messages, generateEnhancedQueries, executeTools, buildSystemPrompt]);

  return {
    messages,
    isLoading,
    sendMessage,
    retrievedContext,
    enhancedQueries,
  };
};