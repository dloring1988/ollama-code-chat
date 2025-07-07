import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContextPanelProps {
  context: string[];
}

export const ContextPanel = ({ context }: ContextPanelProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (context.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-muted/30">
      <h3 className="text-sm font-medium mb-3 text-foreground">Retrieved Context</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {context.map((chunk, index) => {
          const [filename, ...contentLines] = chunk.split('\n');
          const content = contentLines.join('\n');
          const isExpanded = expandedIndex === index;
          
          return (
            <Card key={index} className="p-3 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-primary">
                  {filename.replace(/^\[|\]$/g, '')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="h-6 px-2 text-xs"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
              
              <div className="text-xs font-mono text-muted-foreground">
                {isExpanded ? (
                  <pre className="whitespace-pre-wrap break-words">
                    {content}
                  </pre>
                ) : (
                  <div className="line-clamp-3">
                    {content.slice(0, 150)}
                    {content.length > 150 && '...'}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};