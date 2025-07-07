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
    
    const database = await openDB<VectorDB>('vectorstore', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
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

  const chunkText = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      
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
        const chunks = chunkText(content);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await generateEmbedding(chunk);
          
          const doc: VectorDocument = {
            id: `${file.name}-${i}`,
            content: chunk,
            embedding,
            filename: file.name,
            metadata: {
              fileType: file.name.split('.').pop() || 'unknown',
              chunkIndex: i,
              totalChunks: chunks.length,
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
      }));
      
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      return similarities
        .slice(0, topK)
        .map(item => `[${item.filename}]\n${item.content}`);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }, [initDB]);

  return {
    processFiles,
    searchSimilar,
  };
};