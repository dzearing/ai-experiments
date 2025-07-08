import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateSuggestedResponses } from '../utils/suggestedResponses';

export type ClaudeMode = 'default' | 'plan' | 'auto-accept';

export interface ToolExecution {
  name: string;
  args: any;
  result: any;
  isSuccess: boolean;
  executionTime?: number;
  timestamp: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolExecutions?: ToolExecution[];
  startTime?: Date;
  tokenCount?: number;
  suggestedResponses?: string[];
  isGreeting?: boolean;
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
  isProcessing: boolean;
  currentMessageId: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: ClaudeMode) => void;
  initializeSession: (projectId: string, projectPath: string, repoName: string) => Promise<void>;
  clearMessages: () => void;
  cancelMessage: () => void;
}

const ClaudeCodeContext = createContext<ClaudeCodeContextType | undefined>(undefined);

const STORAGE_KEY = 'claudeCodeState';

export function ClaudeCodeProvider({ children }: { children: ReactNode }) {
  const mountCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  
  // Debug logging for mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    mountCountRef.current++;
    const mountTime = Date.now();
    console.log(`[ClaudeCodeProvider] MOUNTED #${mountCountRef.current} at ${new Date(mountTime).toISOString()}`);
    
    return () => {
      isMountedRef.current = false;
      const unmountTime = Date.now();
      const lifetimeMs = unmountTime - mountTime;
      console.log(`[ClaudeCodeProvider] UNMOUNTING #${mountCountRef.current} at ${new Date(unmountTime).toISOString()}, lifetime: ${lifetimeMs}ms`);
    };
  }, []);
  
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingMessageRef = useRef<string>('');
  const connectionIdRef = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionAttemptRef = useRef<number>(0);
  const sessionInitializationRef = useRef<Promise<void> | null>(null);
  
  // Persist mode changes
  useEffect(() => {
    localStorage.setItem('claudeCodeMode', mode);
  }, [mode]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log(`[ClaudeCodeProvider] Component cleanup running for sessionId: ${sessionId}`);
      if (eventSourceRef.current) {
        console.log(`[ClaudeCodeProvider] Closing SSE connection from cleanup`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId]);
  
  const setupSSEConnection = useCallback((sessionId: string, repoName?: string) => {
    console.log(`[ClaudeCodeProvider] setupSSEConnection called for sessionId: ${sessionId}`);
    // Prevent multiple connections
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
      console.log('[ClaudeCodeProvider] SSE connection already exists, skipping setup');
      return;
    }
    
    // Debounce rapid connection attempts (React StrictMode in dev)
    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < 100) {
      console.log('Debouncing rapid SSE connection attempt');
      return;
    }
    lastConnectionAttemptRef.current = now;
    
    // Store repo name for error handling
    if (repoName) {
      setReservedRepo(repoName);
    }
    
    // Clear any pending connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Generate a unique connection ID to track this connection
    const connectionId = `${sessionId}-${Date.now()}-${Math.random()}`;
    console.log('Setting up SSE connection:', connectionId);
    
    // Close any existing connection
    if (eventSourceRef.current) {
      console.log('Closing existing SSE connection:', connectionIdRef.current);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Store the new connection ID
    connectionIdRef.current = connectionId;
    
    const eventSource = new EventSource(`http://localhost:3000/api/claude/code/stream?sessionId=${sessionId}&connectionId=${encodeURIComponent(connectionId)}`);
    
    eventSource.onopen = () => {
      console.log('SSE connection opened:', connectionId);
      setIsConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      console.log('SSE default message received:', event.data);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', connectionId, error);
      console.error('Error event type:', error.type);
      console.error('EventSource readyState:', eventSource.readyState);
      
      // Only close on actual errors, not on connection establishment
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection was closed');
        setIsConnected(false);
        
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
      } else {
        console.log('SSE connection error but not closing, readyState:', eventSource.readyState);
      }
    };
    
    eventSource.addEventListener('message-start', (event) => {
      const data = JSON.parse(event.data);
      console.log('message-start event received:', data);
      console.log('Is greeting:', data.isGreeting);
      
      // Reset streaming content for new message
      streamingMessageRef.current = '';
      
      // Create the new message
      const newMessage: ClaudeMessage = {
        id: data.id,
        role: 'assistant',
        content: '',  // Start with empty content for streaming
        timestamp: new Date(),
        startTime: new Date(),
        isStreaming: true,
        isGreeting: data.isGreeting
      };
      
      // Check if message already exists or if we recently created a greeting
      setMessages(prev => {
        console.log('setMessages called in message-start, prev length:', prev.length);
        console.log('Previous messages:', prev.map(m => ({ id: m.id, role: m.role, content: m.content.substring(0, 50) })));
        
        const existingMessage = prev.find(msg => msg.id === data.id);
        if (existingMessage) {
          console.warn('Message already exists with ID:', data.id);
          return prev;
        }
        
        // Check for recent greeting messages (within 2 seconds)
        if (data.isGreeting) {
          const recentGreeting = prev.find(msg => 
            msg.isGreeting && 
            msg.timestamp && 
            (new Date().getTime() - msg.timestamp.getTime()) < 2000
          );
          if (recentGreeting) {
            console.warn('Recent greeting already exists, ignoring duplicate');
            return prev;
          }
        }
        
        console.log('Creating new message:', newMessage);
        const newMessages = [...prev, newMessage];
        console.log('New messages array:', newMessages.map(m => ({ id: m.id, role: m.role, content: m.content.substring(0, 50) })));
        return newMessages;
      });
      
      if (!data.isGreeting) {
        setIsProcessing(true);
      }
      setCurrentMessageId(data.id);
      streamingMessageRef.current = '';
    });
    
    eventSource.addEventListener('message-chunk', (event) => {
      console.log('message-chunk event received, data length:', event.data.length);
      const data = JSON.parse(event.data);
      console.log('Chunk for messageId:', data.messageId);
      console.log('Chunk content:', data.chunk);
      
      // Append chunk to streaming content
      streamingMessageRef.current += data.chunk;
      
      setMessages(prev => {
        console.log('setMessages in message-chunk, looking for messageId:', data.messageId);
        console.log('Current messages before update:', prev.map(m => ({ id: m.id, content: m.content.substring(0, 30) })));
        
        const messageExists = prev.some(msg => msg.id === data.messageId);
        if (!messageExists) {
          console.error('Message not found for chunk! MessageId:', data.messageId);
          console.log('Attempting to create message from chunk data');
          // Create the message if it doesn't exist (can happen due to race conditions)
          const newMessage: ClaudeMessage = {
            id: data.messageId,
            role: 'assistant',
            content: streamingMessageRef.current,
            timestamp: new Date(),
            startTime: new Date(),
            isStreaming: true,
            isGreeting: true // Assume greeting for now
          };
          return [...prev, newMessage];
        }
        
        const updated = prev.map(msg => 
          msg.id === data.messageId
            ? { ...msg, content: streamingMessageRef.current }
            : msg
        );
        console.log('Updated messages after chunk:', updated.map(m => ({ id: m.id, content: m.content.substring(0, 30) })));
        return updated;
      });
    });
    
    eventSource.addEventListener('message-end', (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          // Generate suggested responses based on the final content
          const suggestedResponses = generateSuggestedResponses(msg.content);
          return { ...msg, isStreaming: false, suggestedResponses };
        }
        return msg;
      }));
      streamingMessageRef.current = '';
      setIsProcessing(false);
      setCurrentMessageId(null);
    });
    
    eventSource.addEventListener('message-complete', (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          // Generate suggested responses based on the final content
          const suggestedResponses = generateSuggestedResponses(msg.content);
          return { ...msg, isStreaming: false, suggestedResponses };
        }
        return msg;
      }));
      streamingMessageRef.current = '';
      setCurrentMessageId(null);
    });
    
    eventSource.addEventListener('thinking', (event) => {
      const data = JSON.parse(event.data);
      // Show thinking status in the assistant message that's about to come
      console.log('Claude is thinking...', data.status);
    });
    
    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      // Update the streaming message with progress status and token count
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId && msg.isStreaming
          ? { ...msg, content: data.status, tokenCount: data.tokenCount }
          : msg
      ));
    });
    
    eventSource.addEventListener('tool-execution', (event) => {
      const data = JSON.parse(event.data);
      console.log('Tool execution event:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? {
              ...msg,
              toolExecutions: [
                ...(msg.toolExecutions || []),
                data.toolExecution
              ]
            }
          : msg
      ));
    });
    
    eventSource.addEventListener('tool-summary', (event) => {
      const data = JSON.parse(event.data);
      console.log('Tool summary event:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? {
              ...msg,
              toolExecutions: data.toolExecutions || []
            }
          : msg
      ));
    });
    
    eventSource.addEventListener('error', (event: MessageEvent) => {
      console.error('SSE custom error event:', event);
      try {
        const data = JSON.parse(event.data);
        if (data.error === 'Session not found') {
          // Session no longer exists, clear it
          console.log('Session not found, clearing local state');
          setSessionId(null);
          setIsConnected(false);
          setError('Session expired. Please start a new session.');
          // Clear localStorage for this repo
          if (reservedRepo) {
            localStorage.removeItem(`${STORAGE_KEY}-${reservedRepo}`);
          }
          // Close the EventSource to stop reconnection attempts
          eventSource.close();
          if (eventSourceRef.current === eventSource) {
            eventSourceRef.current = null;
          }
        }
      } catch (e) {
        console.error('Failed to parse error event data:', e);
      }
    });
    
    eventSource.addEventListener('claude-message', (event) => {
      const data = JSON.parse(event.data);
      console.log('Claude message event:', data.messageType, data.content);
      
      // Handle different message types from Claude
      if (data.messageType === 'thinking') {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId && msg.isStreaming
            ? { ...msg, content: 'Claude is thinking...' }
            : msg
        ));
      }
    });
    
    eventSource.addEventListener('token-update', (event) => {
      const data = JSON.parse(event.data);
      // Update the message with actual token count
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? { ...msg, tokenCount: data.outputTokens }
          : msg
      ));
      console.log(`Token usage - Input: ${data.inputTokens}, Output: ${data.outputTokens}, Total: ${data.totalTokens}, Session: ${data.sessionTotal}`);
    });
    
    eventSource.addEventListener('context-update', (event) => {
      const data = JSON.parse(event.data);
      setContextUsage(data.percentage);
    });
    
    eventSource.addEventListener('message-cancelled', (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId
          ? { ...msg, content: 'Cancelled', isStreaming: false }
          : msg
      ));
      setIsProcessing(false);
      setCurrentMessageId(null);
    });
    
    eventSource.addEventListener('session-end', (event) => {
      const data = JSON.parse(event.data);
      console.log('Session ended event:', data);
      // Session has ended, clean up everything
      setSessionId(null);
      setIsConnected(false);
      setMessages([]);
      setError(null);
      // Clear localStorage for this repo
      if (reservedRepo) {
        localStorage.removeItem(`${STORAGE_KEY}-${reservedRepo}`);
      }
      // Close the EventSource to stop reconnection attempts
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    });
    
    eventSourceRef.current = eventSource;
  }, [reservedRepo]);
  
  const initializeSession = useCallback(async (projectId: string, projectPath: string, repoName: string) => {
    // Prevent duplicate initialization requests
    if (sessionInitializationRef.current) {
      console.log('Session initialization already in progress, waiting for completion');
      return sessionInitializationRef.current;
    }
    
    const initPromise = (async () => {
      setIsInitializing(true);
      setError(null);
      
      try {
        // Get user info from auth state if available
        const authStateStr = localStorage.getItem('github_auth_state');
        let userName = '';
        let userEmail = '';
        
        if (authStateStr) {
          try {
            const authState = JSON.parse(authStateStr);
            const activeAccount = authState.accounts?.find((acc: any) => acc.id === authState.activeAccountId);
            if (activeAccount) {
              userName = activeAccount.username || '';
              userEmail = activeAccount.email || '';
            }
          } catch (e) {
            console.error('Failed to parse auth state:', e);
          }
        }
        
        const response = await fetch('http://localhost:3000/api/claude/code/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, projectPath, repoName, userName, userEmail })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to initialize session: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Session created, response data:', data);
        setSessionId(data.sessionId);
        setReservedRepo(data.reservedRepo || repoName); // Use repoName if reservedRepo not in response
        setContextUsage(data.contextUsage || 0);
        
        // Set up SSE connection with a delay to ensure component is stable
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          console.log('[ClaudeCodeProvider] Scheduling SSE connection setup with delay');
          const sessionIdToConnect = data.sessionId;
          const repoNameToConnect = repoName;
          setTimeout(() => {
            // Check if component is still mounted before setting up connection
            if (sessionIdToConnect && isMountedRef.current && !eventSourceRef.current) {
              console.log('[ClaudeCodeProvider] Setting up delayed SSE connection');
              setupSSEConnection(sessionIdToConnect, repoNameToConnect);
            } else if (!isMountedRef.current) {
              console.log('[ClaudeCodeProvider] Component unmounted, skipping SSE setup');
            } else if (eventSourceRef.current) {
              console.log('[ClaudeCodeProvider] SSE connection already exists, skipping delayed setup');
            } else {
              console.log('[ClaudeCodeProvider] No session ID, skipping SSE setup');
            }
          }, 500); // 500ms delay to allow component to stabilize
        }
        
        // Clear any old messages when starting a new session
        // This ensures we don't show stale messages from previous sessions
        setMessages([]);
        
        // Also clear localStorage for this repo to start fresh
        localStorage.removeItem(`${STORAGE_KEY}-${repoName}`);
        
        // Don't mark as initialized until SSE is connected
        // This prevents the component from rendering too early
        // The isConnected state will be set by the SSE onopen handler
        setIsInitializing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
        setIsInitializing(false);
      } finally {
        sessionInitializationRef.current = null;
      }
    })();
    
    sessionInitializationRef.current = initPromise;
    return initPromise;
  }, [setupSSEConnection]);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !content.trim()) return;
    
    console.log('Sending message:', content);
    
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
      
      console.log('Message sent successfully');
      // Response will come through SSE
    } catch (err) {
      console.error('Error sending message:', err);
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
    // Clear from localStorage too
    if (reservedRepo) {
      localStorage.removeItem(`${STORAGE_KEY}-${reservedRepo}`);
    }
  }, [reservedRepo]);
  
  const cancelMessage = useCallback(async () => {
    if (!sessionId || !currentMessageId) return;
    
    try {
      // Send cancel request to server
      await fetch('http://localhost:3000/api/claude/code/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messageId: currentMessageId })
      });
      
      // Update UI immediately
      setMessages(prev => prev.map(msg => 
        msg.id === currentMessageId
          ? { ...msg, content: 'Cancelled', isStreaming: false }
          : msg
      ));
      setIsProcessing(false);
      setCurrentMessageId(null);
    } catch (err) {
      console.error('Failed to cancel message:', err);
    }
  }, [sessionId, currentMessageId]);
  
  // Save messages periodically
  useEffect(() => {
    if (sessionId && messages.length > 0 && reservedRepo) {
      localStorage.setItem(
        `${STORAGE_KEY}-${reservedRepo}`,
        JSON.stringify({ messages })
      );
    }
  }, [messages, sessionId, reservedRepo]);
  
  // Cleanup SSE connection on unmount (but keep session alive)
  useEffect(() => {
    return () => {
      console.log('ClaudeCodeProvider cleanup effect running');
      // Close SSE connection
      if (eventSourceRef.current) {
        console.log('Closing SSE connection in cleanup');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // NOTE: We intentionally do NOT end the Claude Code session here
      // The session should persist even when navigating away from the page
      // Users can manually end sessions if needed through a UI action
    };
  }, []);
  
  const value: ClaudeCodeContextType = {
    messages,
    mode,
    contextUsage,
    isInitializing,
    isConnected,
    error,
    sessionId,
    reservedRepo,
    isProcessing,
    currentMessageId,
    sendMessage,
    setMode,
    initializeSession,
    clearMessages,
    cancelMessage
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