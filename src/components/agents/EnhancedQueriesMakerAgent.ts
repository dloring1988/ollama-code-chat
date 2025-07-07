import { Agent, AgentTask, AgentResponse } from './types';

export class EnhancedQueriesMakerAgent implements Agent {
  name = 'EnhancedQueriesMaker';
  description = 'Generates optimized search queries for better context retrieval';
  capabilities = [
    'query_expansion',
    'semantic_analysis',
    'keyword_extraction',
    'context_aware_generation',
    'multi_perspective_queries'
  ];

  private selectedModel: string;

  constructor(selectedModel: string) {
    this.selectedModel = selectedModel;
  }

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'generate_queries':
          return await this.generateQueries(task.data);
        case 'expand_query':
          return await this.expandQuery(task.data);
        case 'analyze_intent':
          return await this.analyzeIntent(task.data);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private async generateQueries(data: { 
    query: string, 
    conversationHistory: any[] 
  }): Promise<AgentResponse> {
    const { query, conversationHistory } = data;

    try {
      // Generate multiple types of enhanced queries
      const queries = await Promise.all([
        this.generateSemanticQueries(query, conversationHistory),
        this.generateTechnicalQueries(query),
        this.generateContextualQueries(query, conversationHistory),
        this.generateStructuralQueries(query)
      ]);

      // Flatten and deduplicate
      const allQueries = queries.flat();
      const uniqueQueries = [...new Set([query, ...allQueries])].slice(0, 8);

      return {
        success: true,
        data: uniqueQueries,
        metadata: {
          confidence: this.assessQueryQuality(uniqueQueries, query),
          executionTime: Date.now() - Date.now(),
          sources: ['semantic', 'technical', 'contextual', 'structural']
        }
      };
    } catch (error) {
      // Fallback to rule-based query generation
      const fallbackQueries = this.generateFallbackQueries(query);
      return {
        success: true,
        data: fallbackQueries,
        error: `AI generation failed, using fallback: ${error.message}`,
        metadata: {
          confidence: 0.6,
          executionTime: Date.now() - Date.now()
        }
      };
    }
  }

  private async generateSemanticQueries(query: string, conversationHistory: any[]): Promise<string[]> {
    const recentContext = conversationHistory.slice(-3).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    const prompt = `You are an expert at generating semantic search queries for code repositories. Given a user's question and conversation context, generate 3-4 semantically related search queries that would help find relevant code.

Recent conversation:
${recentContext}

Current question: "${query}"

Generate search queries that capture:
1. The core intent and meaning
2. Alternative phrasings and synonyms  
3. Related concepts and dependencies
4. Implementation-specific terms

Return only the search queries, one per line:`;

    try {
      const response = await this.callLanguageModel(prompt);
      return this.parseQueryResponse(response);
    } catch (error) {
      return this.generateFallbackSemanticQueries(query);
    }
  }

  private async generateTechnicalQueries(query: string): Promise<string[]> {
    const prompt = `Generate technical search queries for a code repository based on this question: "${query}"

Focus on:
1. Specific function/method names that might be relevant
2. Class names and interfaces
3. Technical keywords and programming concepts
4. Error messages and debugging terms
5. Configuration and setup terms

Return 3-4 technical search queries, one per line:`;

    try {
      const response = await this.callLanguageModel(prompt);
      return this.parseQueryResponse(response);
    } catch (error) {
      return this.generateFallbackTechnicalQueries(query);
    }
  }

  private async generateContextualQueries(query: string, conversationHistory: any[]): Promise<string[]> {
    if (conversationHistory.length === 0) {
      return this.generateStandaloneQueries(query);
    }

    const contextPrompt = `Based on this conversation history and current question, generate contextual search queries:

Previous conversation:
${conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current question: "${query}"

Generate 2-3 queries that consider the conversation context and build upon previous topics:`;

    try {
      const response = await this.callLanguageModel(contextPrompt);
      return this.parseQueryResponse(response);
    } catch (error) {
      return this.generateStandaloneQueries(query);
    }
  }

  private async generateStructuralQueries(query: string): Promise<string[]> {
    const queryLower = query.toLowerCase();
    const structuralQueries: string[] = [];

    // File structure queries
    if (queryLower.includes('file') || queryLower.includes('module')) {
      structuralQueries.push('file structure', 'module organization', 'import export');
    }

    // Architecture queries
    if (queryLower.includes('architecture') || queryLower.includes('structure')) {
      structuralQueries.push('component architecture', 'system design', 'folder structure');
    }

    // Configuration queries
    if (queryLower.includes('config') || queryLower.includes('setup')) {
      structuralQueries.push('configuration files', 'environment setup', 'build config');
    }

    // Testing queries
    if (queryLower.includes('test')) {
      structuralQueries.push('test files', 'spec files', 'testing framework');
    }

    return structuralQueries.slice(0, 3);
  }

  private generateFallbackQueries(query: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const queries = [query];

    // Add individual keywords
    const significantWords = queryWords.filter(word => 
      word.length > 3 && !this.isStopWord(word)
    );
    queries.push(...significantWords.slice(0, 3));

    // Add query without question words
    const cleanQuery = query.replace(/\b(how|what|why|when|where|which|who)\b/gi, '').trim();
    if (cleanQuery !== query) {
      queries.push(cleanQuery);
    }

    // Add technical variations
    if (query.toLowerCase().includes('error')) {
      queries.push('exception handling', 'try catch', 'error message');
    }

    if (query.toLowerCase().includes('function')) {
      queries.push('method definition', 'function implementation');
    }

    return [...new Set(queries)].slice(0, 6);
  }

  private generateFallbackSemanticQueries(query: string): string[] {
    const synonyms = {
      'function': ['method', 'procedure', 'routine'],
      'error': ['exception', 'bug', 'issue', 'problem'],
      'create': ['build', 'make', 'implement', 'generate'],
      'fix': ['repair', 'resolve', 'solve', 'debug'],
      'optimize': ['improve', 'enhance', 'refactor']
    };

    const queries: string[] = [];
    const queryLower = query.toLowerCase();

    Object.entries(synonyms).forEach(([word, syns]) => {
      if (queryLower.includes(word)) {
        syns.forEach(syn => {
          queries.push(query.replace(new RegExp(word, 'gi'), syn));
        });
      }
    });

    return queries.slice(0, 3);
  }

  private generateFallbackTechnicalQueries(query: string): string[] {
    const technicalTerms = {
      'react': ['component', 'jsx', 'props', 'state', 'hook'],
      'javascript': ['function', 'async', 'promise', 'callback'],
      'typescript': ['interface', 'type', 'generic', 'decorator'],
      'css': ['style', 'class', 'selector', 'property'],
      'api': ['endpoint', 'request', 'response', 'http'],
      'database': ['query', 'table', 'schema', 'migration']
    };

    const queries: string[] = [];
    const queryLower = query.toLowerCase();

    Object.entries(technicalTerms).forEach(([tech, terms]) => {
      if (queryLower.includes(tech)) {
        queries.push(...terms.slice(0, 2));
      }
    });

    return queries.slice(0, 3);
  }

  private generateStandaloneQueries(query: string): string[] {
    return [
      query.replace(/[?!.]/g, ''),
      ...query.split(' ').filter(word => word.length > 4).slice(0, 2)
    ];
  }

  private async expandQuery(data: { query: string }): Promise<AgentResponse> {
    const { query } = data;
    const expandedQueries = await this.generateSemanticQueries(query, []);
    
    return {
      success: true,
      data: expandedQueries,
      metadata: { confidence: 0.7 }
    };
  }

  private async analyzeIntent(data: { query: string }): Promise<AgentResponse> {
    const { query } = data;
    
    const intent = {
      type: this.detectQueryType(query),
      complexity: this.assessComplexity(query),
      keywords: this.extractKeywords(query),
      requiresCode: this.requiresCodeContext(query)
    };

    return {
      success: true,
      data: intent,
      metadata: { confidence: 0.8 }
    };
  }

  private async callLanguageModel(prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.selectedModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 300,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Language model request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  private parseQueryResponse(response: string): string[] {
    return response
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .slice(0, 4);
  }

  private assessQueryQuality(queries: string[], originalQuery: string): number {
    let quality = 0.5;
    
    // Diversity score
    const uniqueWords = new Set(queries.join(' ').toLowerCase().split(/\s+/));
    quality += Math.min(uniqueWords.size / 20, 0.3);
    
    // Coverage score
    const originalWords = originalQuery.toLowerCase().split(/\s+/);
    const coverage = originalWords.filter(word => 
      queries.some(q => q.toLowerCase().includes(word))
    ).length / originalWords.length;
    quality += coverage * 0.2;
    
    return Math.min(quality, 0.95);
  }

  private detectQueryType(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('how')) return 'how-to';
    if (queryLower.includes('what')) return 'definition';
    if (queryLower.includes('why')) return 'explanation';
    if (queryLower.includes('error') || queryLower.includes('bug')) return 'debugging';
    if (queryLower.includes('implement') || queryLower.includes('create')) return 'implementation';
    return 'general';
  }

  private assessComplexity(query: string): number {
    let complexity = 0.3;
    complexity += Math.min(query.length / 200, 0.3);
    complexity += (query.split(' ').length - 3) * 0.05;
    if (query.includes('and') || query.includes('also')) complexity += 0.1;
    return Math.min(complexity, 1.0);
  }

  private extractKeywords(query: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 8);
  }

  private requiresCodeContext(query: string): boolean {
    const codeKeywords = ['function', 'class', 'method', 'variable', 'code', 'implementation'];
    return codeKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
    return stopWords.has(word.toLowerCase());
  }
}