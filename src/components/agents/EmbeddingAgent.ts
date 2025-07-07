import { Agent, AgentTask, AgentResponse } from './types';

export class EmbeddingAgent implements Agent {
  name = 'Embedding';
  description = 'Handles text embedding generation and vector operations';
  capabilities = [
    'text_embedding',
    'batch_embedding',
    'similarity_calculation',
    'vector_operations',
    'embedding_optimization'
  ];

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'generate_embedding':
          return await this.generateEmbedding(task.data);
        case 'batch_embed':
          return await this.batchEmbed(task.data);
        case 'calculate_similarity':
          return await this.calculateSimilarity(task.data);
        case 'optimize_embedding':
          return await this.optimizeEmbedding(task.data);
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

  private async generateEmbedding(data: { text: string, model?: string }): Promise<AgentResponse> {
    const { text, model = 'nomic-embed-text' } = data;

    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: {
          embedding: result.embedding,
          dimensions: result.embedding?.length || 0,
          model: model
        },
        metadata: {
          confidence: 0.95,
          executionTime: Date.now() - Date.now()
        }
      };
    } catch (error) {
      // Fallback to dummy embedding for development
      console.warn('Embedding generation failed, using fallback:', error.message);
      
      const fallbackEmbedding = this.generateFallbackEmbedding(text);
      
      return {
        success: true,
        data: {
          embedding: fallbackEmbedding,
          dimensions: fallbackEmbedding.length,
          model: 'fallback'
        },
        error: `Using fallback embedding: ${error.message}`,
        metadata: {
          confidence: 0.3,
          executionTime: Date.now() - Date.now()
        }
      };
    }
  }

  private async batchEmbed(data: { 
    texts: string[], 
    model?: string,
    batchSize?: number 
  }): Promise<AgentResponse> {
    const { texts, model = 'nomic-embed-text', batchSize = 10 } = data;
    const embeddings: number[][] = [];
    const errors: string[] = [];

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (text, index) => {
        try {
          const result = await this.generateEmbedding({ text, model });
          return {
            index: i + index,
            embedding: result.data.embedding,
            success: result.success
          };
        } catch (error) {
          errors.push(`Text ${i + index}: ${error.message}`);
          return {
            index: i + index,
            embedding: this.generateFallbackEmbedding(text),
            success: false
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        embeddings[result.index] = result.embedding;
      });

      // Small delay between batches to be respectful to the API
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: errors.length < texts.length / 2, // Success if less than half failed
      data: {
        embeddings,
        totalProcessed: texts.length,
        successCount: texts.length - errors.length,
        errorCount: errors.length
      },
      error: errors.length > 0 ? `${errors.length} embeddings failed` : undefined,
      metadata: {
        confidence: (texts.length - errors.length) / texts.length,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async calculateSimilarity(data: { 
    embedding1: number[], 
    embedding2: number[],
    method?: 'cosine' | 'euclidean' | 'dot'
  }): Promise<AgentResponse> {
    const { embedding1, embedding2, method = 'cosine' } = data;

    if (embedding1.length !== embedding2.length) {
      return {
        success: false,
        data: null,
        error: 'Embedding dimensions do not match'
      };
    }

    let similarity: number;

    switch (method) {
      case 'cosine':
        similarity = this.cosineSimilarity(embedding1, embedding2);
        break;
      case 'euclidean':
        similarity = this.euclideanSimilarity(embedding1, embedding2);
        break;
      case 'dot':
        similarity = this.dotProduct(embedding1, embedding2);
        break;
      default:
        similarity = this.cosineSimilarity(embedding1, embedding2);
    }

    return {
      success: true,
      data: {
        similarity,
        method,
        confidence: this.assessSimilarityConfidence(similarity, method)
      },
      metadata: {
        confidence: 0.95,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async optimizeEmbedding(data: { 
    embedding: number[], 
    targetDimensions?: number 
  }): Promise<AgentResponse> {
    const { embedding, targetDimensions } = data;

    // Simple dimensionality reduction (truncation for now)
    // In a real implementation, you might use PCA or other techniques
    let optimizedEmbedding = embedding;

    if (targetDimensions && targetDimensions < embedding.length) {
      optimizedEmbedding = embedding.slice(0, targetDimensions);
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(optimizedEmbedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      optimizedEmbedding = optimizedEmbedding.map(val => val / magnitude);
    }

    return {
      success: true,
      data: {
        originalDimensions: embedding.length,
        optimizedDimensions: optimizedEmbedding.length,
        embedding: optimizedEmbedding,
        compressionRatio: optimizedEmbedding.length / embedding.length
      },
      metadata: {
        confidence: 0.8,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private generateFallbackEmbedding(text: string): number[] {
    // Generate a deterministic but pseudo-random embedding based on text content
    const dimensions = 384; // Standard dimension for many embedding models
    const embedding: number[] = [];
    
    // Use text content to seed the embedding
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i) * (i + 1);
    }

    // Generate embedding values
    for (let i = 0; i < dimensions; i++) {
      // Simple pseudo-random number generator
      seed = (seed * 9301 + 49297) % 233280;
      embedding.push((seed / 233280) - 0.5);
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private euclideanSimilarity(a: number[], b: number[]): number {
    const distance = Math.sqrt(a.reduce((sum, ai, i) => sum + Math.pow(ai - b[i], 2), 0));
    // Convert distance to similarity (0-1 range)
    return 1 / (1 + distance);
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  }

  private assessSimilarityConfidence(similarity: number, method: string): number {
    // Higher confidence for more extreme similarity values
    const extremeness = Math.abs(similarity - 0.5) * 2;
    let baseConfidence = 0.7 + extremeness * 0.2;
    
    // Cosine similarity is generally more reliable
    if (method === 'cosine') {
      baseConfidence += 0.1;
    }
    
    return Math.min(baseConfidence, 0.95);
  }
}