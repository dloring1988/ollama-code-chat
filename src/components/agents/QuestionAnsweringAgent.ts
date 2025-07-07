import { Agent, AgentTask, AgentResponse } from './types';

export class QuestionAnsweringAgent implements Agent {
  name = 'QuestionAnswering';
  description = 'Specialized agent for generating comprehensive answers based on context and tools';
  capabilities = [
    'natural_language_generation',
    'context_synthesis',
    'code_explanation',
    'technical_writing',
    'multi_modal_response'
  ];

  private selectedModel: string;

  constructor(selectedModel: string) {
    this.selectedModel = selectedModel;
  }

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'answer_question':
          return await this.answerQuestion(task.data);
        case 'explain_code':
          return await this.explainCode(task.data);
        case 'generate_summary':
          return await this.generateSummary(task.data);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      return {
        success: false,
        data: '',
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private async answerQuestion(data: {
    query: string,
    context: string[],
    tools: any[],
    plan: any,
    conversationHistory: any[]
  }): Promise<AgentResponse> {
    const { query, context, tools, plan, conversationHistory } = data;

    // Build comprehensive system prompt
    const systemPrompt = this.buildSystemPrompt(query, context, tools, plan);
    
    // Construct the full prompt
    const fullPrompt = this.constructPrompt(systemPrompt, query, context, tools, conversationHistory);

    try {
      const response = await this.callLanguageModel(fullPrompt);
      
      return {
        success: true,
        data: response,
        metadata: {
          confidence: this.assessResponseConfidence(response, context, tools),
          executionTime: Date.now() - Date.now(),
          sources: context.map(c => this.extractFilename(c))
        }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        error: `Failed to generate response: ${error.message}`
      };
    }
  }

  private buildSystemPrompt(query: string, context: string[], tools: any[], plan: any): string {
    const hasContext = context.length > 0;
    const hasTools = tools.length > 0;
    const complexity = plan?.complexity || 0.5;

    let systemPrompt = `You are an elite software engineering AI assistant with deep expertise across all programming languages, frameworks, and development practices. You excel at:

🎯 **Code Analysis & Understanding**: Deep comprehension of complex codebases and architectural patterns
🔧 **Problem Solving**: Identifying issues, debugging, and providing practical solutions
📚 **Technical Communication**: Explaining complex concepts clearly and providing actionable guidance
🚀 **Best Practices**: Recommending industry standards, design patterns, and optimization strategies
🔍 **Contextual Intelligence**: Leveraging available code context to provide precise, relevant answers

## Response Excellence Standards:
- **Precision**: Provide accurate, technically sound information
- **Clarity**: Use clear explanations with appropriate technical depth
- **Practicality**: Focus on actionable insights and real-world applicability
- **Context Awareness**: Leverage the specific codebase context provided
- **Completeness**: Address all aspects of the question comprehensively
- **Code Quality**: When showing code, follow best practices and include comments

`;

    if (hasContext) {
      systemPrompt += `## Available Code Context:
You have access to ${context.length} relevant code sections from the user's repository. These provide specific implementation details, patterns, and context about their codebase. Use this context to give precise, codebase-specific answers.

`;
    }

    if (hasTools) {
      systemPrompt += `## Active Analysis Tools:
${tools.map(tool => `- **${tool.name.replace(/_/g, ' ').toUpperCase()}**: ${this.getToolDescription(tool.name)}`).join('\n')}

These tools have been selected based on your query type and will inform the analysis approach.

`;
    }

    if (complexity > 0.7) {
      systemPrompt += `## Complex Query Handling:
This is a complex, multi-faceted question. Structure your response with:
1. **Overview**: Brief summary of what you'll address
2. **Detailed Analysis**: In-depth examination of each aspect
3. **Code Examples**: Relevant code snippets with explanations
4. **Recommendations**: Specific actionable advice
5. **Next Steps**: Suggested follow-up actions

`;
    }

    systemPrompt += `## Current Task:
Provide a comprehensive, expert-level response to the user's question using all available context and tools.`;

    return systemPrompt;
  }

  private constructPrompt(
    systemPrompt: string, 
    query: string, 
    context: string[], 
    tools: any[], 
    conversationHistory: any[]
  ): string {
    let fullPrompt = systemPrompt;

    // Add code context
    if (context.length > 0) {
      fullPrompt += `\n\n## Code Context:\n`;
      context.forEach((chunk, i) => {
        fullPrompt += `### Context ${i + 1}:\n${chunk}\n\n`;
      });
    }

    // Add tool information
    if (tools.length > 0) {
      fullPrompt += `\n\n## Tool Analysis Results:\n`;
      tools.forEach(tool => {
        fullPrompt += `**${tool.name}**: ${tool.result || 'Analysis completed'}\n`;
      });
    }

    // Add conversation history for continuity
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
      fullPrompt += `\n\n## Recent Conversation:\n`;
      recentHistory.forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n\n`;
      });
    }

    // Add the current question
    fullPrompt += `\n\n## Current Question:\n${query}\n\nProvide a comprehensive, expert response:`;

    return fullPrompt;
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
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 3000,
          stop: ['Human:', 'User:', '## Current Question:'],
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Language model request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  private async explainCode(data: { code: string, context?: string[] }): Promise<AgentResponse> {
    const { code, context = [] } = data;
    
    const prompt = `Explain the following code in detail, including its purpose, functionality, and any notable patterns or practices:

\`\`\`
${code}
\`\`\`

${context.length > 0 ? `\nAdditional context:\n${context.join('\n\n')}` : ''}

Provide a comprehensive explanation covering:
1. Overall purpose and functionality
2. Key components and their roles
3. Notable patterns or techniques used
4. Potential improvements or considerations`;

    try {
      const response = await this.callLanguageModel(prompt);
      return {
        success: true,
        data: response,
        metadata: { confidence: 0.8 }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        error: error.message
      };
    }
  }

  private async generateSummary(data: { content: string, type?: string }): Promise<AgentResponse> {
    const { content, type = 'general' } = data;
    
    const prompt = `Generate a concise summary of the following ${type} content:

${content}

Provide a clear, informative summary that captures the key points and main insights.`;

    try {
      const response = await this.callLanguageModel(prompt);
      return {
        success: true,
        data: response,
        metadata: { confidence: 0.7 }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        error: error.message
      };
    }
  }

  private getToolDescription(toolName: string): string {
    const descriptions = {
      'code_analyzer': 'Deep analysis of code structure, patterns, and functionality',
      'debug_assistant': 'Error detection, debugging guidance, and issue resolution',
      'pattern_search': 'Finding similar patterns, examples, and usage across the codebase',
      'refactoring_assistant': 'Code improvement suggestions and optimization recommendations',
      'documentation_helper': 'Documentation analysis and generation assistance',
      'implementation_assistant': 'Implementation guidance and code generation support',
      'testing_assistant': 'Test strategy and test code generation assistance'
    };
    
    return descriptions[toolName] || 'Specialized analysis tool';
  }

  private assessResponseConfidence(response: string, context: string[], tools: any[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on response length and detail
    if (response.length > 500) confidence += 0.1;
    if (response.length > 1000) confidence += 0.1;
    
    // Increase confidence based on available context
    confidence += Math.min(context.length * 0.05, 0.2);
    
    // Increase confidence based on tools used
    confidence += Math.min(tools.length * 0.05, 0.15);
    
    // Check for code examples in response
    if (response.includes('```') || response.includes('`')) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private extractFilename(contextChunk: string): string {
    const match = contextChunk.match(/\[(.*?):/);
    return match ? match[1] : 'unknown';
  }
}