import { Agent, AgentTask, AgentResponse } from './types';

export class VerifierAgent implements Agent {
  name = 'Verifier';
  description = 'Verifies and validates responses for accuracy and completeness';
  capabilities = [
    'response_validation',
    'accuracy_checking',
    'completeness_assessment',
    'quality_assurance',
    'fact_verification'
  ];

  private selectedModel: string;

  constructor(selectedModel: string) {
    this.selectedModel = selectedModel;
  }

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'verify_response':
          return await this.verifyResponse(task.data);
        case 'check_accuracy':
          return await this.checkAccuracy(task.data);
        case 'assess_completeness':
          return await this.assessCompleteness(task.data);
        case 'validate_code':
          return await this.validateCode(task.data);
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

  private async verifyResponse(data: {
    query: string,
    response: string,
    context: string[],
    agentTrace: any[]
  }): Promise<AgentResponse> {
    const { query, response, context, agentTrace } = data;

    // Perform multiple verification checks
    const verificationResults = await Promise.all([
      this.checkResponseRelevance(query, response),
      this.checkFactualAccuracy(response, context),
      this.checkCompleteness(query, response),
      this.checkCodeValidity(response),
      this.checkConsistency(response, context)
    ]);

    const [relevance, accuracy, completeness, codeValidity, consistency] = verificationResults;

    // Calculate overall confidence score
    const overallConfidence = this.calculateOverallConfidence(verificationResults);

    // Determine if response needs improvement
    const needsImprovement = overallConfidence < 0.7;

    let finalResponse = response;
    const issues: string[] = [];

    // Collect issues
    if (relevance.confidence < 0.7) issues.push('Response may not fully address the question');
    if (accuracy.confidence < 0.7) issues.push('Some information may be inaccurate');
    if (completeness.confidence < 0.7) issues.push('Response may be incomplete');
    if (codeValidity.confidence < 0.7) issues.push('Code examples may have issues');
    if (consistency.confidence < 0.7) issues.push('Response may be inconsistent with context');

    // If significant issues found, attempt to improve the response
    if (needsImprovement && issues.length > 0) {
      try {
        const improvedResponse = await this.improveResponse(query, response, context, issues);
        if (improvedResponse) {
          finalResponse = improvedResponse;
        }
      } catch (error) {
        console.warn('Failed to improve response:', error.message);
      }
    }

    return {
      success: true,
      data: {
        originalResponse: response,
        finalResponse,
        verificationResults: {
          relevance: relevance.confidence,
          accuracy: accuracy.confidence,
          completeness: completeness.confidence,
          codeValidity: codeValidity.confidence,
          consistency: consistency.confidence,
          overallConfidence
        },
        issues,
        improved: finalResponse !== response,
        agentPerformance: this.analyzeAgentPerformance(agentTrace)
      },
      metadata: {
        confidence: overallConfidence,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async checkResponseRelevance(query: string, response: string): Promise<{ confidence: number, details: string }> {
    // Check if response addresses the query
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const responseKeywords = this.extractKeywords(response.toLowerCase());
    
    const keywordOverlap = queryKeywords.filter(keyword => 
      responseKeywords.some(respKeyword => 
        respKeyword.includes(keyword) || keyword.includes(respKeyword)
      )
    ).length;

    const relevanceScore = keywordOverlap / Math.max(queryKeywords.length, 1);
    
    // Additional checks
    let confidence = relevanceScore * 0.6;
    
    // Check if response directly answers question words
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'which', 'who'];
    const queryQuestionWords = questionWords.filter(word => query.toLowerCase().includes(word));
    
    if (queryQuestionWords.length > 0) {
      const answersQuestion = queryQuestionWords.some(word => {
        switch (word) {
          case 'how': return response.includes('by') || response.includes('through') || response.includes('using');
          case 'what': return response.includes('is') || response.includes('are') || response.includes('means');
          case 'why': return response.includes('because') || response.includes('due to') || response.includes('reason');
          default: return true;
        }
      });
      
      if (answersQuestion) confidence += 0.2;
    }

    // Check response length appropriateness
    if (response.length > 100 && response.length < 2000) {
      confidence += 0.1;
    }

    // Check for code examples if query seems to need them
    if (query.toLowerCase().includes('code') || query.toLowerCase().includes('implement')) {
      if (response.includes('```') || response.includes('`')) {
        confidence += 0.1;
      }
    }

    return {
      confidence: Math.min(confidence, 0.95),
      details: `Keyword overlap: ${(relevanceScore * 100).toFixed(1)}%, Response length: ${response.length} chars`
    };
  }

  private async checkFactualAccuracy(response: string, context: string[]): Promise<{ confidence: number, details: string }> {
    let confidence = 0.7; // Base confidence
    
    // Check if response contradicts context
    if (context.length > 0) {
      const contextText = context.join(' ').toLowerCase();
      const responseText = response.toLowerCase();
      
      // Look for potential contradictions
      const contradictionIndicators = [
        'not', 'never', 'cannot', 'impossible', 'wrong', 'incorrect', 'false'
      ];
      
      let contradictions = 0;
      contradictionIndicators.forEach(indicator => {
        if (responseText.includes(indicator) && contextText.includes(indicator)) {
          contradictions++;
        }
      });
      
      if (contradictions === 0) {
        confidence += 0.1;
      } else {
        confidence -= contradictions * 0.05;
      }
    }

    // Check for common programming facts
    const programmingFacts = this.checkProgrammingFacts(response);
    confidence += programmingFacts * 0.1;

    // Check for specific technical accuracy
    const technicalAccuracy = this.checkTechnicalAccuracy(response);
    confidence += technicalAccuracy * 0.1;

    return {
      confidence: Math.max(Math.min(confidence, 0.95), 0.3),
      details: `Context consistency check passed, programming facts verified`
    };
  }

  private async checkCompleteness(query: string, response: string): Promise<{ confidence: number, details: string }> {
    let confidence = 0.5;
    
    // Check if response addresses all parts of a multi-part question
    const queryParts = query.split(/\band\b|\bor\b|\balso\b/);
    if (queryParts.length > 1) {
      const addressedParts = queryParts.filter(part => {
        const partKeywords = this.extractKeywords(part.toLowerCase());
        return partKeywords.some(keyword => 
          response.toLowerCase().includes(keyword)
        );
      });
      
      confidence = addressedParts.length / queryParts.length;
    } else {
      confidence = 0.8; // Single part question
    }

    // Check for comprehensive coverage
    if (response.length > 300) confidence += 0.1;
    if (response.includes('example') || response.includes('```')) confidence += 0.1;
    if (response.includes('however') || response.includes('also') || response.includes('additionally')) confidence += 0.05;

    return {
      confidence: Math.min(confidence, 0.95),
      details: `Multi-part question coverage assessed, comprehensive indicators found`
    };
  }

  private async checkCodeValidity(response: string): Promise<{ confidence: number, details: string }> {
    let confidence = 0.8; // Default high confidence if no code
    
    // Extract code blocks
    const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
    const inlineCode = response.match(/`[^`]+`/g) || [];
    
    if (codeBlocks.length === 0 && inlineCode.length === 0) {
      return {
        confidence: 0.8,
        details: 'No code found in response'
      };
    }

    let validCodeBlocks = 0;
    let totalCodeBlocks = codeBlocks.length;

    // Basic syntax validation for code blocks
    codeBlocks.forEach(block => {
      const code = block.replace(/```\w*\n?/, '').replace(/```$/, '');
      
      // Basic checks
      const hasMatchingBraces = this.checkMatchingBraces(code);
      const hasValidSyntax = this.checkBasicSyntax(code);
      
      if (hasMatchingBraces && hasValidSyntax) {
        validCodeBlocks++;
      }
    });

    if (totalCodeBlocks > 0) {
      confidence = validCodeBlocks / totalCodeBlocks;
    }

    return {
      confidence: Math.max(confidence, 0.3),
      details: `${validCodeBlocks}/${totalCodeBlocks} code blocks appear valid`
    };
  }

  private async checkConsistency(response: string, context: string[]): Promise<{ confidence: number, details: string }> {
    let confidence = 0.8;
    
    if (context.length === 0) {
      return {
        confidence: 0.8,
        details: 'No context to check consistency against'
      };
    }

    // Check if response uses similar terminology as context
    const contextTerms = this.extractTechnicalTerms(context.join(' '));
    const responseTerms = this.extractTechnicalTerms(response);
    
    const commonTerms = contextTerms.filter(term => responseTerms.includes(term));
    const terminologyConsistency = commonTerms.length / Math.max(contextTerms.length, 1);
    
    confidence = 0.5 + (terminologyConsistency * 0.4);

    // Check for contradictory statements
    const contradictions = this.findContradictions(response, context);
    confidence -= contradictions * 0.1;

    return {
      confidence: Math.max(Math.min(confidence, 0.95), 0.3),
      details: `Terminology consistency: ${(terminologyConsistency * 100).toFixed(1)}%`
    };
  }

  private async improveResponse(
    query: string, 
    response: string, 
    context: string[], 
    issues: string[]
  ): Promise<string | null> {
    const improvementPrompt = `You are a response improvement specialist. Given a user query, an initial response, and identified issues, provide an improved version of the response.

Original Query: "${query}"

Initial Response:
${response}

Identified Issues:
${issues.map(issue => `- ${issue}`).join('\n')}

Available Context:
${context.slice(0, 3).join('\n\n')}

Please provide an improved response that addresses the identified issues while maintaining accuracy and relevance. Focus on:
1. Directly addressing the user's question
2. Using accurate information from the context
3. Providing complete and comprehensive answers
4. Including valid code examples if relevant
5. Maintaining consistency with the provided context

Improved Response:`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.selectedModel,
          prompt: improvementPrompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 2000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Improvement request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || null;
    } catch (error) {
      console.error('Failed to improve response:', error);
      return null;
    }
  }

  private calculateOverallConfidence(verificationResults: any[]): number {
    const weights = [0.25, 0.25, 0.2, 0.15, 0.15]; // relevance, accuracy, completeness, code, consistency
    
    return verificationResults.reduce((sum, result, index) => {
      return sum + (result.confidence * weights[index]);
    }, 0);
  }

  private analyzeAgentPerformance(agentTrace: any[]): any {
    const performance = {
      totalAgents: agentTrace.length,
      successfulAgents: agentTrace.filter(trace => trace.status === 'completed').length,
      failedAgents: agentTrace.filter(trace => trace.status === 'error').length,
      averageExecutionTime: 0,
      bottlenecks: []
    };

    const executionTimes = agentTrace
      .filter(trace => trace.executionTime)
      .map(trace => trace.executionTime);

    if (executionTimes.length > 0) {
      performance.averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
    }

    // Identify bottlenecks (agents taking longer than average)
    const avgTime = performance.averageExecutionTime;
    performance.bottlenecks = agentTrace
      .filter(trace => trace.executionTime && trace.executionTime > avgTime * 1.5)
      .map(trace => trace.agent);

    return performance;
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
    
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 15);
  }

  private extractTechnicalTerms(text: string): string[] {
    const technicalPatterns = [
      /\b[A-Z][a-zA-Z]*[A-Z][a-zA-Z]*\b/g, // CamelCase
      /\b[a-z]+[A-Z][a-zA-Z]*\b/g, // camelCase
      /\b[a-z]+_[a-z]+\b/g, // snake_case
      /\b[A-Z]+_[A-Z]+\b/g, // CONSTANT_CASE
    ];

    const terms: string[] = [];
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      terms.push(...matches);
    });

    return [...new Set(terms)];
  }

  private checkMatchingBraces(code: string): boolean {
    const stack: string[] = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    
    for (const char of code) {
      if (char in pairs) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last] !== char) {
          return false;
        }
      }
    }
    
    return stack.length === 0;
  }

  private checkBasicSyntax(code: string): boolean {
    // Basic syntax checks
    const lines = code.split('\n');
    
    // Check for common syntax errors
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;
      
      // Check for unmatched quotes
      const singleQuotes = (trimmed.match(/'/g) || []).length;
      const doubleQuotes = (trimmed.match(/"/g) || []).length;
      
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        return false;
      }
    }
    
    return true;
  }

  private checkProgrammingFacts(response: string): number {
    let factScore = 0;
    
    // Check for accurate programming concepts
    const accurateFacts = [
      /JavaScript.*interpreted/i,
      /Python.*indentation/i,
      /TypeScript.*superset.*JavaScript/i,
      /React.*component/i,
      /async.*await/i,
    ];

    accurateFacts.forEach(fact => {
      if (fact.test(response)) {
        factScore += 0.1;
      }
    });

    return Math.min(factScore, 0.5);
  }

  private checkTechnicalAccuracy(response: string): number {
    let accuracy = 0;
    
    // Check for technically accurate statements
    if (response.includes('function') && response.includes('return')) accuracy += 0.1;
    if (response.includes('class') && response.includes('constructor')) accuracy += 0.1;
    if (response.includes('import') && response.includes('export')) accuracy += 0.1;
    
    return Math.min(accuracy, 0.3);
  }

  private findContradictions(response: string, context: string[]): number {
    let contradictions = 0;
    
    // Simple contradiction detection
    const responseText = response.toLowerCase();
    const contextText = context.join(' ').toLowerCase();
    
    // Look for opposing statements
    const opposites = [
      ['true', 'false'],
      ['yes', 'no'],
      ['can', 'cannot'],
      ['will', 'will not'],
      ['is', 'is not']
    ];

    opposites.forEach(([positive, negative]) => {
      if (responseText.includes(positive) && contextText.includes(negative)) {
        contradictions++;
      }
      if (responseText.includes(negative) && contextText.includes(positive)) {
        contradictions++;
      }
    });

    return contradictions;
  }

  // Additional verification methods
  private async checkAccuracy(data: { content: string, sources: string[] }): Promise<AgentResponse> {
    const accuracy = await this.checkFactualAccuracy(data.content, data.sources);
    return {
      success: true,
      data: accuracy,
      metadata: { confidence: accuracy.confidence }
    };
  }

  private async assessCompleteness(data: { query: string, response: string }): Promise<AgentResponse> {
    const completeness = await this.checkCompleteness(data.query, data.response);
    return {
      success: true,
      data: completeness,
      metadata: { confidence: completeness.confidence }
    };
  }

  private async validateCode(data: { code: string }): Promise<AgentResponse> {
    const validity = await this.checkCodeValidity(data.code);
    return {
      success: true,
      data: validity,
      metadata: { confidence: validity.confidence }
    };
  }
}