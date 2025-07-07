import { Message } from '../hooks/useChat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to analyze your code</h3>
          <p className="text-muted-foreground">
            Upload your codebase and start asking questions. I'll help you understand, debug, and improve your code with intelligent context search and analysis tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
            <Card className={`p-4 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground ml-12' 
                : 'bg-card mr-12'
            }`}>
              {/* Tools and Context Info */}
              {message.role === 'assistant' && (message.tools?.length > 0 || message.contextUsed?.length > 0) && (
                <div className="mb-3 pb-3 border-b border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {message.tools?.map((tool, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        🛠️ {tool.name.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {message.contextUsed?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📄 {message.contextUsed.length} context chunks
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {message.content}
              </div>

              {/* Message Footer */}
              <div className={`flex items-center justify-between mt-3 pt-2 border-t border-border/30 ${
                message.role === 'user' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                <div className="text-xs">
                  {message.timestamp.toLocaleTimeString()}
                </div>
                
                {message.role === 'assistant' && message.enhancedQueries?.length > 0 && (
                  <div className="text-xs opacity-60">
                    🔍 {message.enhancedQueries.length} search queries used
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.role === 'user' 
              ? 'bg-primary text-primary-foreground order-1 ml-3' 
              : 'bg-accent text-accent-foreground mr-3'
          }`}>
            {message.role === 'user' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center mr-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <Card className="p-4 bg-card mr-12">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">Analyzing your code...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};