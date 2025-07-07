import { Agent, AgentResponse, AgentTask } from './types';
import { ContextFetcherAgent } from './ContextFetcherAgent';
import { ManagerAgent } from './ManagerAgent';
import { QuestionAnsweringAgent } from './QuestionAnsweringAgent';
import { EnhancedQueriesMakerAgent } from './EnhancedQueriesMakerAgent';
import { EmbeddingAgent } from './EmbeddingAgent';
import { MetadataExtractionAgent } from './MetadataExtractionAgent';
import { VerifierAgent } from './VerifierAgent';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private selectedModel: string;
  private selectedEmbeddingModel: string;

  constructor(selectedModel: string, selectedEmbeddingModel: string) {
    this.selectedModel = selectedModel;
    this.selectedEmbeddingModel = selectedEmbeddingModel;
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize all agents with proper model configuration
    this.agents.set('embedding', new EmbeddingAgent(this.selectedEmbeddingModel));
    this.agents.set('metadata', new MetadataExtractionAgent());
    this.agents.set('queries', new EnhancedQueriesMakerAgent(this.selectedModel));
    this.agents.set('context', new ContextFetcherAgent(this.selectedEmbeddingModel));
    this.agents.set('manager', new ManagerAgent(this.selectedModel));
    this.agents.set('qa', new QuestionAnsweringAgent(this.selectedModel));
    this.agents.set('verifier', new VerifierAgent(this.selectedModel));
  }

  async processUserQuery(
    query: string, 
    uploadedFiles: File[], 
    conversationHistory: any[]
  ): Promise<{
    response: string;
    context: string[];
    tools: any[];
    enhancedQueries: string[];
    agentTrace: any[];
  }> {
    const agentTrace: any[] = [];
    
    try {
      // Step 1: Enhanced Queries Maker Agent
      agentTrace.push({ agent: 'queries', status: 'starting', timestamp: Date.now() });
      const queriesAgent = this.agents.get('queries') as EnhancedQueriesMakerAgent;
      const enhancedQueries = await queriesAgent.execute({
        type: 'generate_queries',
        data: { query, conversationHistory }
      });
      agentTrace.push({ agent: 'queries', status: 'completed', result: enhancedQueries, timestamp: Date.now() });

      // Step 2: Context Fetcher Agent
      agentTrace.push({ agent: 'context', status: 'starting', timestamp: Date.now() });
      const contextAgent = this.agents.get('context') as ContextFetcherAgent;
      const context = await contextAgent.execute({
        type: 'fetch_context',
        data: { queries: enhancedQueries.data, uploadedFiles }
      });
      agentTrace.push({ agent: 'context', status: 'completed', result: context, timestamp: Date.now() });

      // Step 3: Manager Agent (Tool Selection & Orchestration)
      agentTrace.push({ agent: 'manager', status: 'starting', timestamp: Date.now() });
      const managerAgent = this.agents.get('manager') as ManagerAgent;
      const managementPlan = await managerAgent.execute({
        type: 'analyze_and_plan',
        data: { query, context: context.data, conversationHistory }
      });
      agentTrace.push({ agent: 'manager', status: 'completed', result: managementPlan, timestamp: Date.now() });

      // Step 4: Question Answering Agent
      agentTrace.push({ agent: 'qa', status: 'starting', timestamp: Date.now() });
      const qaAgent = this.agents.get('qa') as QuestionAnsweringAgent;
      const answer = await qaAgent.execute({
        type: 'answer_question',
        data: {
          query,
          context: context.data,
          tools: managementPlan.data.tools,
          plan: managementPlan.data.plan,
          conversationHistory
        }
      });
      agentTrace.push({ agent: 'qa', status: 'completed', result: answer, timestamp: Date.now() });

      // Step 5: Verifier Agent
      agentTrace.push({ agent: 'verifier', status: 'starting', timestamp: Date.now() });
      const verifierAgent = this.agents.get('verifier') as VerifierAgent;
      const verification = await verifierAgent.execute({
        type: 'verify_response',
        data: {
          query,
          response: answer.data,
          context: context.data,
          agentTrace
        }
      });
      agentTrace.push({ agent: 'verifier', status: 'completed', result: verification, timestamp: Date.now() });

      return {
        response: verification.data.finalResponse || answer.data,
        context: context.data,
        tools: managementPlan.data.tools,
        enhancedQueries: enhancedQueries.data,
        agentTrace
      };

    } catch (error) {
      console.error('Agent system error:', error);
      agentTrace.push({ agent: 'system', status: 'error', error: error.message, timestamp: Date.now() });
      
      return {
        response: `I encountered an error while processing your request. The agent system failed at: ${agentTrace[agentTrace.length - 1]?.agent || 'unknown'}. Please ensure both your LLM model (${this.selectedModel}) and embedding model (${this.selectedEmbeddingModel}) are available in Ollama.`,
        context: [],
        tools: [],
        enhancedQueries: [query],
        agentTrace
      };
    }
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  updateModel(newModel: string) {
    this.selectedModel = newModel;
    // Reinitialize agents that depend on the LLM model
    this.agents.set('queries', new EnhancedQueriesMakerAgent(newModel));
    this.agents.set('manager', new ManagerAgent(newModel));
    this.agents.set('qa', new QuestionAnsweringAgent(newModel));
    this.agents.set('verifier', new VerifierAgent(newModel));
  }

  updateEmbeddingModel(newEmbeddingModel: string) {
    this.selectedEmbeddingModel = newEmbeddingModel;
    // Reinitialize agents that depend on the embedding model
    this.agents.set('embedding', new EmbeddingAgent(newEmbeddingModel));
    this.agents.set('context', new ContextFetcherAgent(newEmbeddingModel));
  }
}