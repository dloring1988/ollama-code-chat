import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentTracePanelProps {
  agentTrace: any[];
}

export const AgentTracePanel = ({ agentTrace }: AgentTracePanelProps) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  if (agentTrace.length === 0) {
    return null;
  }

  const getAgentIcon = (agentName: string) => {
    const icons: Record<string, string> = {
      'queries': '🔍',
      'context': '📄',
      'manager': '🎯',
      'qa': '💬',
      'verifier': '✅',
      'embedding': '🧮',
      'metadata': '📊'
    };
    return icons[agentName] || '🤖';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'starting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatExecutionTime = (time: number) => {
    return time ? `${time}ms` : 'N/A';
  };

  return (
    <div className="p-4 bg-muted/20">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Agent Execution Trace
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {agentTrace.map((trace, index) => {
          const isExpanded = expandedAgent === `${trace.agent}-${index}`;
          
          return (
            <Card key={`${trace.agent}-${index}`} className="p-3 bg-card border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getAgentIcon(trace.agent)}</span>
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {trace.agent.replace(/([A-Z])/g, ' $1').trim()} Agent
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trace.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(trace.status)}`}>
                    {trace.status}
                  </Badge>
                  
                  {trace.executionTime && (
                    <span className="text-xs text-muted-foreground">
                      {formatExecutionTime(trace.executionTime)}
                    </span>
                  )}
                  
                  {(trace.result || trace.error) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAgent(isExpanded ? null : `${trace.agent}-${index}`)}
                      className="h-6 px-2 text-xs"
                    >
                      {isExpanded ? 'Collapse' : 'Details'}
                    </Button>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  {trace.error && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-red-600 mb-1">Error:</div>
                      <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                        {trace.error}
                      </div>
                    </div>
                  )}
                  
                  {trace.result && (
                    <div>
                      <div className="text-xs font-medium text-foreground mb-1">Result:</div>
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded max-h-32 overflow-y-auto">
                        {typeof trace.result === 'object' ? (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(trace.result, null, 2)}
                          </pre>
                        ) : (
                          trace.result
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {agentTrace.filter(t => t.status === 'completed').length} completed, 
            {agentTrace.filter(t => t.status === 'error').length} errors
          </span>
          <span>
            Total execution time: {agentTrace.reduce((sum, t) => sum + (t.executionTime || 0), 0)}ms
          </span>
        </div>
      </div>
    </div>
  );
};