import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ClaudeMode = 'default' | 'plan' | 'auto-accept';

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUse?: {
    name: string;
    status: 'pending' | 'complete' | 'error';
    result?: any;
  }[];
}

interface ClaudeCodeContextType {
  // State
  messages: ClaudeMessage[];
  mode: ClaudeMode;
  contextUsage: number; // Percentage 0-100
  isInitializing: boolean;
  isConnected: boolean;
  error: string | null;
  sessionId: string | null;
  reservedRepo: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: ClaudeMode) => void;
  initializeSession: (projectId: string, projectPath: string) => Promise<void>;
  clearMessages: () => void;
}

const ClaudeCodeContext = createContext<ClaudeCodeContextType | undefined>(undefined);

const STORAGE_KEY = 'claudeCodeState';

export function ClaudeCodeProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [mode, setMode] = useState<ClaudeMode>(() => {
    const saved = localStorage.getItem('claudeCodeMode');
    return (saved as ClaudeMode) || 'default';
  });
  const [contextUsage, setContextUsage] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reservedRepo, setReservedRepo] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingMessageRef = useRef<string>('');
  
  // Persist mode changes
  useEffect(() => {
    localStorage.setItem('claudeCodeMode', mode);
  }, [mode]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  const initializeSession = useCallback(async (projectId: string, projectPath: string) => {
    setIsInitializing(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/claude/code/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectPath })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize session: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setReservedRepo(data.reservedRepo);
      setContextUsage(data.contextUsage || 0);
      
      // Set up SSE connection
      setupSSEConnection(data.sessionId);
      
      // Load any saved messages for this project
      const savedState = localStorage.getItem(`${STORAGE_KEY}-${projectId}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setMessages(parsed.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        } catch (e) {
          console.error('Failed to load saved messages:', e);
        }
      }
      
      setIsInitializing(false);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize session');
      setIsInitializing(false);
    }
  }, []);
  
  const setupSSEConnection = useCallback((sessionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const eventSource = new EventSource(`http://localhost:3000/api/claude/code/stream?sessionId=${sessionId}`);
    
    eventSource.onopen = () => {
      setIsConnected(true);
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
    };
    
    eventSource.addEventListener('message-start', (event) => {
      const data = JSON.parse(event.data);
      const newMessage: ClaudeMessage = {
        id: data.id,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      setMessages(prev => [...prev, newMessage]);
      streamingMessageRef.current = '';
    });
    
    eventSource.addEventListener('message-chunk', (event) => {
      const data = JSON.parse(event.data);
      streamingMessageRef.current += data.chunk;
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? { ...msg, content: streamingMessageRef.current }
          : msg
      ));
    });
    
    eventSource.addEventListener('message-end', (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? { ...msg, isStreaming: false }
          : msg
      ));
      streamingMessageRef.current = '';
    });
    
    eventSource.addEventListener('tool-use', (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? {
              ...msg,
              toolUse: [
                ...(msg.toolUse || []),
                {
                  name: data.toolName,
                  status: data.status,
                  result: data.result
                }
              ]
            }
          : msg
      ));
    });
    
    eventSource.addEventListener('context-update', (event) => {
      const data = JSON.parse(event.data);
      setContextUsage(data.percentage);
    });
    
    eventSourceRef.current = eventSource;
  }, []);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !content.trim()) return;
    
    // Add user message immediately
    const userMessage: ClaudeMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('http://localhost:3000/api/claude/code/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content,
          mode
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      
      // Response will come through SSE
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Add error message
      const errorMessage: ClaudeMessage = {
        id: uuidv4(),
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [sessionId, mode]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Save messages periodically
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const projectId = sessionId.split('-')[0]; // Extract project ID from session
      localStorage.setItem(
        `${STORAGE_KEY}-${projectId}`,
        JSON.stringify({ messages })
      );
    }
  }, [messages, sessionId]);
  
  const value: ClaudeCodeContextType = {
    messages,
    mode,
    contextUsage,
    isInitializing,
    isConnected,
    error,
    sessionId,
    reservedRepo,
    sendMessage,
    setMode,
    initializeSession,
    clearMessages
  };
  
  return (
    <ClaudeCodeContext.Provider value={value}>
      {children}
    </ClaudeCodeContext.Provider>
  );
}

export function useClaudeCode() {
  const context = useContext(ClaudeCodeContext);
  if (!context) {
    throw new Error('useClaudeCode must be used within ClaudeCodeProvider');
  }
  return context;
}