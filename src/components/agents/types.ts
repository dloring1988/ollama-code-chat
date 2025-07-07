export interface AgentTask {
  type: string;
  data: any;
  metadata?: {
    priority?: number;
    timeout?: number;
    retries?: number;
  };
}

export interface AgentResponse {
  success: boolean;
  data: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    confidence?: number;
    sources?: string[];
  };
}

export interface Agent {
  name: string;
  description: string;
  capabilities: string[];
  execute(task: AgentTask): Promise<AgentResponse>;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
  result?: string;
  confidence?: number;
}

export interface ContextChunk {
  content: string;
  filename: string;
  lineNumbers?: { start: number; end: number };
  relevanceScore: number;
  metadata?: any;
}

export interface AgentTrace {
  agent: string;
  status: 'starting' | 'completed' | 'error';
  timestamp: number;
  result?: any;
  error?: string;
  executionTime?: number;
}