import { Agent, AgentTask, AgentResponse, ToolCall } from './types';

export class ManagerAgent implements Agent {
  name = 'Manager';
  description = 'Orchestrates other agents and selects appropriate tools for each query';
  capabilities = [
    'task_planning',
    'tool_selection',
    'agent_coordination',
    'priority_management',
    'resource_allocation'
  ];

  private selectedModel: string;

  constructor(selectedModel: string) {
    this.selectedModel = selectedModel;
  }

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'analyze_and_plan':
          return await this.analyzeAndPlan(task.data);
        case 'select_tools':
          return await this.selectTools(task.data);
        case 'coordinate_agents':
          return await this.coordinateAgents(task.data);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private async analyzeAndPlan(data: { 
    query: string, 
    context: string[], 
    conversationHistory: any[] 
  }): Promise<AgentResponse> {
    const { query, context, conversationHistory } = data;
    
    // Analyze query intent and complexity
    const queryAnalysis = await this.analyzeQuery(query);
    
    // Select appropriate tools
    const tools = await this.selectToolsForQuery(query, context, queryAnalysis);
    
    // Create execution plan
    const plan = this.createExecutionPlan(queryAnalysis, tools, context);
    
    return {
      success: true,
      data: {
        queryAnalysis,
        tools,
        plan,
        priority: this.calculatePriority(queryAnalysis),
        estimatedComplexity: queryAnalysis.complexity
      },
      metadata: {
        confidence: queryAnalysis.confidence,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async analyzeQuery(query: string): Promise<any> {
    const queryLower = query.toLowerCase();
    
    // Determine query type and intent
    const queryTypes = {
      explanation: /explain|how does|what is|describe|tell me about/i.test(query),
      debugging: /error|bug|fix|debug|issue|problem|wrong|fail/i.test(query),
      implementation: /implement|create|build|make|write|code/i.test(query),
      optimization: /optimize|improve|better|performance|refactor/i.test(query),
      search: /find|search|look for|show me|where is/i.test(query),
      analysis: /analyze|review|check|examine|assess/i.test(query),
      documentation: /document|comment|readme|docs/i.test(query),
      testing: /test|spec|unit test|integration/i.test(query)
    };

    const detectedTypes = Object.entries(queryTypes)
      .filter(([_, matches]) => matches)
      .map(([type, _]) => type);

    // Calculate complexity
    const complexity = this.calculateQueryComplexity(query, detectedTypes);
    
    // Determine confidence
    const confidence = detectedTypes.length > 0 ? 0.8 : 0.5;

    return {
      types: detectedTypes,
      primaryType: detectedTypes[0] || 'general',
      complexity,
      confidence,
      keywords: this.extractKeywords(query),
      requiresContext: this.requiresCodeContext(query),
      requiresMultiStep: complexity > 0.7
    };
  }

  private async selectToolsForQuery(query: string, context: string[], analysis: any): Promise<ToolCall[]> {
    const tools: ToolCall[] = [];
    const queryLower = query.toLowerCase();

    // Code Analyzer Tool
    if (analysis.types.includes('explanation') || analysis.types.includes('analysis')) {
      tools.push({
        name: 'code_analyzer',
        parameters: {
          query,
          analysisType: 'deep_analysis',
          contextChunks: context.length,
          focusAreas: analysis.keywords
        },
        confidence: 0.9
      });
    }

    // Debug Assistant Tool
    if (analysis.types.includes('debugging')) {
      tools.push({
        name: 'debug_assistant',
        parameters: {
          query,
          errorType: this.detectErrorType(query),
          contextAvailable: context.length > 0,
          severity: this.assessErrorSeverity(query)
        },
        confidence: 0.95
      });
    }

    // Pattern Search Tool
    if (analysis.types.includes('search') || queryLower.includes('similar') || queryLower.includes('example')) {
      tools.push({
        name: 'pattern_search',
        parameters: {
          query,
          searchScope: 'repository',
          patternType: this.detectPatternType(query),
          includeExamples: true
        },
        confidence: 0.85
      });
    }

    // Refactoring Assistant Tool
    if (analysis.types.includes('optimization') || queryLower.includes('refactor')) {
      tools.push({
        name: 'refactoring_assistant',
        parameters: {
          query,
          optimizationType: this.detectOptimizationType(query),
          codeQualityFocus: true,
          performanceFocus: queryLower.includes('performance')
        },
        confidence: 0.8
      });
    }

    // Documentation Helper Tool
    if (analysis.types.includes('documentation') || queryLower.includes('comment')) {
      tools.push({
        name: 'documentation_helper',
        parameters: {
          query,
          documentationType: 'inline_comments',
          generateExamples: true
        },
        confidence: 0.75
      });
    }

    // Implementation Assistant Tool
    if (analysis.types.includes('implementation')) {
      tools.push({
        name: 'implementation_assistant',
        parameters: {
          query,
          implementationType: this.detectImplementationType(query),
          includeTests: queryLower.includes('test'),
          followBestPractices: true
        },
        confidence: 0.85
      });
    }

    // Testing Assistant Tool
    if (analysis.types.includes('testing')) {
      tools.push({
        name: 'testing_assistant',
        parameters: {
          query,
          testType: this.detectTestType(query),
          coverageGoal: 'comprehensive',
          includeEdgeCases: true
        },
        confidence: 0.8
      });
    }

    return tools;
  }

  private createExecutionPlan(analysis: any, tools: ToolCall[], context: string[]): any {
    return {
      steps: [
        {
          phase: 'analysis',
          description: 'Analyze query and available context',
          tools: tools.filter(t => t.name.includes('analyzer')),
          estimatedTime: '2-3 seconds'
        },
        {
          phase: 'processing',
          description: 'Execute specialized tools based on query type',
          tools: tools.filter(t => !t.name.includes('analyzer')),
          estimatedTime: '3-5 seconds'
        },
        {
          phase: 'synthesis',
          description: 'Combine results and generate comprehensive response',
          tools: [],
          estimatedTime: '2-3 seconds'
        }
      ],
      totalEstimatedTime: '7-11 seconds',
      complexity: analysis.complexity,
      requiresVerification: analysis.complexity > 0.8
    };
  }

  private selectTools(data: { query: string, context: string[] }): Promise<AgentResponse> {
    // Implementation for standalone tool selection
    return this.selectToolsForQuery(data.query, data.context, { types: ['general'] })
      .then(tools => ({
        success: true,
        data: tools,
        metadata: { confidence: 0.7 }
      }));
  }

  private coordinateAgents(data: any): Promise<AgentResponse> {
    // Implementation for agent coordination
    return Promise.resolve({
      success: true,
      data: { coordination: 'completed' },
      metadata: { confidence: 0.8 }
    });
  }

  // Helper methods
  private calculateQueryComplexity(query: string, types: string[]): number {
    let complexity = 0.3; // Base complexity
    
    // Add complexity based on query length
    complexity += Math.min(query.length / 500, 0.2);
    
    // Add complexity based on number of detected types
    complexity += types.length * 0.1;
    
    // Add complexity for specific patterns
    if (query.includes('and') || query.includes('also')) complexity += 0.1;
    if (query.split('?').length > 2) complexity += 0.1;
    if (query.length > 200) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }

  private calculatePriority(analysis: any): 'low' | 'medium' | 'high' | 'urgent' {
    if (analysis.types.includes('debugging')) return 'high';
    if (analysis.complexity > 0.8) return 'high';
    if (analysis.types.includes('implementation')) return 'medium';
    return 'low';
  }

  private extractKeywords(query: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  private requiresCodeContext(query: string): boolean {
    const contextKeywords = ['function', 'class', 'method', 'variable', 'code', 'implementation', 'file', 'module'];
    return contextKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private detectErrorType(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('syntax')) return 'syntax';
    if (queryLower.includes('runtime')) return 'runtime';
    if (queryLower.includes('logic')) return 'logic';
    if (queryLower.includes('type')) return 'type';
    return 'general';
  }

  private assessErrorSeverity(query: string): 'low' | 'medium' | 'high' {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('crash') || queryLower.includes('fail')) return 'high';
    if (queryLower.includes('error') || queryLower.includes('exception')) return 'medium';
    return 'low';
  }

  private detectPatternType(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('design pattern')) return 'design_pattern';
    if (queryLower.includes('algorithm')) return 'algorithm';
    if (queryLower.includes('structure')) return 'data_structure';
    return 'general';
  }

  private detectOptimizationType(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('performance')) return 'performance';
    if (queryLower.includes('memory')) return 'memory';
    if (queryLower.includes('readability')) return 'readability';
    return 'general';
  }

  private detectImplementationType(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('api')) return 'api';
    if (queryLower.includes('component')) return 'component';
    if (queryLower.includes('function')) return 'function';
    if (queryLower.includes('class')) return 'class';
    return 'general';
  }

  private detectTestType(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('unit')) return 'unit';
    if (queryLower.includes('integration')) return 'integration';
    if (queryLower.includes('e2e') || queryLower.includes('end-to-end')) return 'e2e';
    return 'general';
  }
}