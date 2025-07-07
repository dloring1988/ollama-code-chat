import { useState, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  filename: string;
  metadata: {
    fileType: string;
    chunkIndex: number;
    totalChunks: number;
    lineNumbers?: { start: number; end: number };
    functionNames?: string[];
    classNames?: string[];
    keywords?: string[];
  };
}

interface VectorDB extends DBSchema {
  documents: {
    key: string;
    value: VectorDocument;
  };
}

export const useVectorStore = () => {
  const [db, setDb] = useState<IDBPDatabase<VectorDB> | null>(null);

  const initDB = useCallback(async () => {
    if (db) return db;
    
    const database = await openDB<VectorDB>('vectorstore', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('documents')) {
            const store = db.createObjectStore('documents', { keyPath: 'id' });
            store.createIndex('filename', 'filename');
            store.createIndex('fileType', 'metadata.fileType');
          }
        }
        if (oldVersion < 2) {
          // Add new indexes for better search
          const store = db.transaction.objectStore('documents');
          if (!store.indexNames.contains('keywords')) {
            store.createIndex('keywords', 'metadata.keywords', { multiEntry: true });
          }
        }
      },
    });
    
    setDb(database);
    return database;
  }, [db]);

  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Embedding error:', error);
      // Fallback to dummy embedding for demo purposes
      return Array(384).fill(0).map(() => Math.random() - 0.5);
    }
  };

  const extractMetadata = (content: string, filename: string) => {
    const lines = content.split('\n');
    const functionNames: string[] = [];
    const classNames: string[] = [];
    const keywords: string[] = [];

    // Extract function names
    const functionRegex = /(?:function|def|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      functionNames.push(match[1]);
    }

    // Extract class names
    const classRegex = /(?:class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = classRegex.exec(content)) !== null) {
      classNames.push(match[1]);
    }

    // Extract keywords
    const keywordRegex = /\b(import|export|async|await|return|throw|catch|try|if|else|for|while|switch|case|break|continue)\b/g;
    while ((match = keywordRegex.exec(content)) !== null) {
      if (!keywords.includes(match[1])) {
        keywords.push(match[1]);
      }
    }

    return {
      functionNames,
      classNames,
      keywords,
    };
  };

  const chunkText = (text: string, filename: string, chunkSize: number = 1000, overlap: number = 200): Array<{content: string, metadata: any}> => {
    const lines = text.split('\n');
    const chunks: Array<{content: string, metadata: any}> = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunkContent = text.slice(start, end);
      
      // Calculate line numbers for this chunk
      const beforeChunk = text.slice(0, start);
      const startLine = beforeChunk.split('\n').length;
      const chunkLines = chunkContent.split('\n').length;
      const endLine = startLine + chunkLines - 1;

      const metadata = extractMetadata(chunkContent, filename);
      
      chunks.push({
        content: chunkContent,
        metadata: {
          ...metadata,
          lineNumbers: { start: startLine, end: endLine }
        }
      });
      
      if (end === text.length) break;
      start = end - overlap;
    }

    return chunks;
  };

  const processFiles = useCallback(async (files: File[]) => {
    const database = await initDB();
    
    for (const file of files) {
      try {
        const content = await file.text();
        const chunks = chunkText(content, file.name);
        
        for (let i = 0; i < chunks.length; i++) {
          const { content: chunkContent, metadata } = chunks[i];
          const embedding = await generateEmbedding(chunkContent);
          
          const doc: VectorDocument = {
            id: `${file.name}-${i}`,
            content: chunkContent,
            embedding,
            filename: file.name,
            metadata: {
              fileType: file.name.split('.').pop() || 'unknown',
              chunkIndex: i,
              totalChunks: chunks.length,
              ...metadata,
            },
          };
          
          await database.put('documents', doc);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
  }, [initDB]);

  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (magA * magB);
  };

  const searchSimilar = useCallback(async (query: string, topK: number = 5): Promise<string[]> => {
    const database = await initDB();
    
    try {
      const queryEmbedding = await generateEmbedding(query);
      const allDocs = await database.getAll('documents');
      
      const similarities = allDocs.map(doc => ({
        content: doc.content,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding),
        filename: doc.filename,
        metadata: doc.metadata,
      }));
      
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      return similarities
        .slice(0, topK)
        .map(item => `[${item.filename}:${item.metadata.lineNumbers?.start || 1}-${item.metadata.lineNumbers?.end || 1}]\n${item.content}`);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }, [initDB]);

  const searchWithEnhancedQueries = useCallback(async (queries: string[], topK: number = 10): Promise<string[]> => {
    const database = await initDB();
    
    try {
      const allDocs = await database.getAll('documents');
      const uniqueResults = new Map<string, { 
        content: string; 
        filename: string; 
        maxSimilarity: number;
        metadata: any;
        relevanceScore: number;
      }>();
      
      // Search with each enhanced query
      for (const query of queries) {
        const queryEmbedding = await generateEmbedding(query);
        
        const similarities = allDocs.map(doc => {
          const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
          
          // Boost score based on metadata matches
          let relevanceBoost = 0;
          const queryLower = query.toLowerCase();
          
          // Boost if query matches function names
          if (doc.metadata.functionNames?.some(fn => queryLower.includes(fn.toLowerCase()))) {
            relevanceBoost += 0.2;
          }
          
          // Boost if query matches class names
          if (doc.metadata.classNames?.some(cn => queryLower.includes(cn.toLowerCase()))) {
            relevanceBoost += 0.2;
          }
          
          // Boost if query matches keywords
          if (doc.metadata.keywords?.some(kw => queryLower.includes(kw.toLowerCase()))) {
            relevanceBoost += 0.1;
          }
          
          // Boost if filename is relevant
          if (doc.filename.toLowerCase().includes(queryLower) || queryLower.includes(doc.filename.toLowerCase().replace(/\.[^/.]+$/, ""))) {
            relevanceBoost += 0.15;
          }

          return {
            content: doc.content,
            similarity: similarity + relevanceBoost,
            filename: doc.filename,
            id: doc.id,
            metadata: doc.metadata,
            relevanceScore: relevanceBoost,
          };
        });
        
        // Add to unique results, keeping the highest similarity score
        similarities.forEach(item => {
          if (item.similarity > 0.1) { // Minimum relevance threshold
            const existing = uniqueResults.get(item.id);
            if (!existing || item.similarity > existing.maxSimilarity) {
              uniqueResults.set(item.id, {
                content: item.content,
                filename: item.filename,
                maxSimilarity: item.similarity,
                metadata: item.metadata,
                relevanceScore: item.relevanceScore,
              });
            }
          }
        });
      }
      
      // Sort by similarity and return top results
      const sortedResults = Array.from(uniqueResults.values())
        .sort((a, b) => b.maxSimilarity - a.maxSimilarity)
        .slice(0, topK);
      
      return sortedResults.map(item => 
        `[${item.filename}:${item.metadata.lineNumbers?.start || 1}-${item.metadata.lineNumbers?.end || 1}]\n${item.content}`
      );
    } catch (error) {
      console.error('Enhanced search error:', error);
      return [];
    }
  }, [initDB]);

  return {
    processFiles,
    searchSimilar,
    searchWithEnhancedQueries,
  };
};