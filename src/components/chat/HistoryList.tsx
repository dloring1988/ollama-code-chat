import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

export const HistoryList = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  useEffect(() => {
    // Load chat history from localStorage
    const loadSessions = () => {
      try {
        const saved = localStorage.getItem('chat-sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSessions(parsed.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp)
          })));
        }
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
      }
    };

    loadSessions();
  }, []);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date(),
      messageCount: 0,
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession.id);
    
    // Save to localStorage
    const updated = [newSession, ...sessions];
    localStorage.setItem('chat-sessions', JSON.stringify(updated));
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('chat-sessions', JSON.stringify(updated));
    
    if (currentSession === sessionId) {
      setCurrentSession(null);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-sidebar-foreground">Chat History</h3>
        <Button
          onClick={createNewChat}
          size="sm"
          className="h-7 px-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sidebar-foreground/50 text-sm">
              No chat history yet
            </div>
            <div className="text-xs text-sidebar-foreground/40 mt-1">
              Start a conversation to see it here
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group p-3 rounded-lg cursor-pointer transition-smooth ${
                  currentSession === session.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                }`}
                onClick={() => setCurrentSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {session.title}
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      {session.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-xs opacity-40">
                      {session.messageCount} messages
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};