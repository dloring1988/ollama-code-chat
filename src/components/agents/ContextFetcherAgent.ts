import { Agent, AgentTask, AgentResponse, ContextChunk } from './types';
import { useVectorStore } from '../store/useVectorStore';

export class ContextFetcherAgent implements Agent {
  name = 'ContextFetcher';
  description = 'Specialized agent for retrieving relevant code context using vector search';
  capabilities = [
    'vector_search',
    'context_ranking',
    'relevance_scoring',
    'multi_query_search',
    'context_deduplication'
  ];

  private embeddingModel: string;

  constructor(embeddingModel: string = 'nomic-embed-text') {
    this.embeddingModel = embeddingModel;
  }

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'fetch_context':
          return await this.fetchContext(task.data);
        case 'search_similar':
          return await this.searchSimilar(task.data);
        case 'rank_context':
          return await this.rankContext(task.data);
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

  private async fetchContext(data: { queries: string[], uploadedFiles: File[] }): Promise<AgentResponse> {
    const { queries, uploadedFiles } = data;
    
    if (uploadedFiles.length === 0) {
      return {
        success: true,
        data: [],
        metadata: {
          confidence: 0,
          sources: []
        }
      };
    }

    try {
      // Use the vector store to search for context with the configured embedding model
      const { searchWithEnhancedQueries } = useVectorStore();
      const contextChunks = await searchWithEnhancedQueries(queries, 12, this.embeddingModel);
      
      // Process and rank the context chunks
      const processedChunks = this.processContextChunks(contextChunks, queries);
      
      return {
        success: true,
        data: processedChunks,
        metadata: {
          confidence: this.calculateConfidence(processedChunks),
          sources: processedChunks.map(chunk => chunk.filename),
          executionTime: Date.now() - Date.now(),
          embeddingModel: this.embeddingModel
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: `Context fetching failed with embedding model ${this.embeddingModel}: ${error.message}`
      };
    }
  }

  private async searchSimilar(data: { query: string, topK?: number }): Promise<AgentResponse> {
    const { query, topK = 5 } = data;
    
    try {
      const { searchSimilar } = useVectorStore();
      const results = await searchSimilar(query, topK, this.embeddingModel);
      
      return {
        success: true,
        data: results,
        metadata: {
          confidence: results.length > 0 ? 0.8 : 0.2,
          embeddingModel: this.embeddingModel
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: `Search failed with embedding model ${this.embeddingModel}: ${error.message}`
      };
    }
  }

  private async rankContext(data: { chunks: ContextChunk[], query: string }): Promise<AgentResponse> {
    const { chunks, query } = data;
    
    // Advanced ranking algorithm
    const rankedChunks = chunks
      .map(chunk => ({
        ...chunk,
        relevanceScore: this.calculateRelevanceScore(chunk, query)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Keep top 8 most relevant

    return {
      success: true,
      data: rankedChunks,
      metadata: {
        confidence: rankedChunks.length > 0 ? 0.9 : 0.1
      }
    };
  }

  private processContextChunks(rawChunks: string[], queries: string[]): ContextChunk[] {
    return rawChunks.map((chunk, index) => {
      const lines = chunk.split('\n');
      const filenameMatch = lines[0].match(/\[(.*?):(\d+)-(\d+)\]/);
      
      let filename = 'unknown';
      let lineNumbers = { start: 1, end: 1 };
      let content = chunk;

      if (filenameMatch) {
        filename = filenameMatch[1];
        lineNumbers = {
          start: parseInt(filenameMatch[2]),
          end: parseInt(filenameMatch[3])
        };
        content = lines.slice(1).join('\n');
      }

      return {
        content,
        filename,
        lineNumbers,
        relevanceScore: this.calculateRelevanceScore({ content, filename } as ContextChunk, queries.join(' ')),
        metadata: {
          chunkIndex: index,
          originalRank: index,
          embeddingModel: this.embeddingModel
        }
      };
    });
  }

  private calculateRelevanceScore(chunk: ContextChunk, query: string): number {
    let score = 0.5; // Base score
    const queryLower = query.toLowerCase();
    const contentLower = chunk.content.toLowerCase();
    const filenameLower = chunk.filename.toLowerCase();

    // Keyword matching
    const queryWords = queryLower.split(/\s+/);
    const contentWords = contentLower.split(/\s+/);
    
    const matchingWords = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
    );
    
    score += (matchingWords.length / queryWords.length) * 0.3;

    // Filename relevance
    if (queryWords.some(word => filenameLower.includes(word))) {
      score += 0.2;
    }

    // Code structure indicators
    if (contentLower.includes('function') || contentLower.includes('class') || contentLower.includes('const')) {
      score += 0.1;
    }

    // Error/debug context
    if (queryLower.includes('error') || queryLower.includes('bug')) {
      if (contentLower.includes('try') || contentLower.includes('catch') || contentLower.includes('error')) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  private calculateConfidence(chunks: ContextChunk[]): number {
    if (chunks.length === 0) return 0;
    
    const avgRelevance = chunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0) / chunks.length;
    const diversityScore = new Set(chunks.map(c => c.filename)).size / chunks.length;
    
    return Math.min((avgRelevance * 0.7 + diversityScore * 0.3), 1.0);
  }

  // Method to update the embedding model
  updateEmbeddingModel(newModel: string) {
    this.embeddingModel = newModel;
  }
}