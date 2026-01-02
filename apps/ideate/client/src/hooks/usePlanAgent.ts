import { useState, useEffect, useRef, useCallback } from 'react';
import { PLAN_AGENT_WS_URL } from '../config';
import type { IdeaPlan } from '../types/idea';

/**
 * Idea context to send to the plan agent
 */
export interface PlanIdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
  tags: string[];
  status: string;
  /** Optional Thing context when creating a plan linked to a Thing */
  thingContext?: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
}

/**
 * Message in the plan agent chat
 */
export interface PlanAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Server message types for the plan agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'plan_update' | 'token_usage';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Complete message object */
  message?: PlanAgentMessage;
  /** Array of messages (for history) */
  messages?: PlanAgentMessage[];
  /** Error message */
  error?: string;
  /** Plan data (for plan_update type) */
  plan?: Partial<IdeaPlan>;
  /** Token usage information */
  usage?: TokenUsage;
}

/**
 * Options for usePlanAgent
 */
export interface UsePlanAgentOptions {
  /** Idea ID to create plan for */
  ideaId: string;
  /** User ID for authentication */
  userId: string;
  /** User name for display */
  userName: string;
  /** Initial idea context */
  ideaContext: PlanIdeaContext | null;
  /** Called when a plan update is received */
  onPlanUpdate?: (plan: Partial<IdeaPlan>) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Return value from usePlanAgent
 */
export interface UsePlanAgentReturn {
  /** Chat messages */
  messages: PlanAgentMessage[];
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the agent is currently responding */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Current token usage (updated during streaming) */
  tokenUsage: TokenUsage | null;
  /** Current plan data (updated when plan_update received) */
  plan: Partial<IdeaPlan> | null;
  /** Send a message to the agent */
  sendMessage: (content: string) => void;
  /** Add a local message (for system messages like help) */
  addLocalMessage: (message: PlanAgentMessage) => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Update the idea context */
  updateIdeaContext: (context: PlanIdeaContext) => void;
  /** Cancel the current request */
  cancelRequest: () => void;
}

/**
 * Hook for managing the plan agent WebSocket connection.
 * Handles streaming responses, chat history, and plan updates.
 */
export function usePlanAgent({
  ideaId,
  userId,
  userName,
  ideaContext,
  onPlanUpdate,
  onError,
}: UsePlanAgentOptions): UsePlanAgentReturn {
  const [messages, setMessages] = useState<PlanAgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [plan, setPlan] = useState<Partial<IdeaPlan> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const ideaContextRef = useRef<PlanIdeaContext | null>(ideaContext);

  // Keep refs updated
  useEffect(() => {
    ideaContextRef.current = ideaContext;
  }, [ideaContext]);

  // Track previous values to detect actual changes
  const prevIdeaIdRef = useRef<string | null>(null);

  // Reset state when ideaId actually changes (new session)
  useEffect(() => {
    const ideaIdChanged = prevIdeaIdRef.current !== null && prevIdeaIdRef.current !== ideaId;

    // Only reset if we had a previous value and it changed
    if (ideaIdChanged) {
      console.log('[PlanAgent] Session changed, resetting state');
      setMessages([]);
      setError(null);
      setIsLoading(false);
      setPlan(null);
      setTokenUsage(null);
      currentMessageIdRef.current = null;

      // Close existing connection to force reconnect with new params
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    }

    // Update refs for next comparison
    prevIdeaIdRef.current = ideaId;
  }, [ideaId]);

  // Add a message
  const addMessage = useCallback((message: PlanAgentMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update a message (for streaming)
  const updateMessage = useCallback((id: string, updates: Partial<PlanAgentMessage> | ((prev: string) => string)) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;
        if (typeof updates === 'function') {
          return { ...msg, content: updates(msg.content) };
        }
        return { ...msg, ...updates };
      })
    );
  }, []);

  const connect = useCallback(() => {
    // Guard: already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (!userId || !ideaId) return;

    const wsUrl = `${PLAN_AGENT_WS_URL}?ideaId=${encodeURIComponent(ideaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('[PlanAgent] WebSocket connected');

      // Send initial idea context if available
      if (ideaContextRef.current) {
        ws.send(JSON.stringify({
          type: 'idea_update',
          idea: ideaContextRef.current,
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[PlanAgent] WebSocket disconnected');

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (userId && ideaId) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (event) => {
      console.error('[PlanAgent] WebSocket error:', event);
      setIsConnected(false);
      setError('Failed to connect to plan agent service');
      onError?.('Failed to connect to plan agent service');
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'history':
            // Load message history
            if (data.messages) {
              setMessages(data.messages);
            }
            break;

          case 'text_chunk':
            // Streaming text chunk
            if (data.messageId && data.text) {
              // If this is a new message, create it
              if (currentMessageIdRef.current !== data.messageId) {
                currentMessageIdRef.current = data.messageId;
                addMessage({
                  id: data.messageId,
                  role: 'assistant',
                  content: data.text,
                  timestamp: Date.now(),
                  isStreaming: true,
                });
              } else {
                // Append to existing message
                updateMessage(data.messageId, (prev) => prev + data.text);
              }
            }
            break;

          case 'message_complete':
            // Message is complete
            if (data.messageId) {
              updateMessage(data.messageId, { isStreaming: false });
              currentMessageIdRef.current = null;
              setIsLoading(false);
            }
            break;

          case 'greeting':
            // Initial greeting message - only add if no messages yet
            // (prevents duplicates from React StrictMode double-mount)
            if (data.messageId && data.text) {
              setMessages((prev) => {
                // Skip if we already have messages (greeting already added)
                if (prev.length > 0) {
                  return prev;
                }
                return [{
                  id: data.messageId!,
                  role: 'assistant',
                  content: data.text!,
                  timestamp: Date.now(),
                  isStreaming: false,
                }];
              });
            }
            break;

          case 'plan_update':
            // Plan update from the agent
            if (data.plan) {
              setPlan(data.plan);
              onPlanUpdate?.(data.plan);
              console.log('[PlanAgent] Plan updated with', data.plan.phases?.length || 0, 'phases');
            }
            break;

          case 'error':
            // Error from server
            if (data.error) {
              setError(data.error);
              onError?.(data.error);
              setIsLoading(false);
            }
            break;

          case 'token_usage':
            // Update token usage
            if (data.usage) {
              setTokenUsage(data.usage);
            }
            break;
        }
      } catch (err) {
        console.error('[PlanAgent] Failed to parse message:', err);
      }
    };
  }, [ideaId, userId, userName, addMessage, updateMessage, onError, onPlanUpdate]);

  // Connect when userId and ideaId are available
  useEffect(() => {
    if (userId && ideaId && !isConnected) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId, ideaId, isConnected, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Send message to server
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Add user message locally first
      const userMessage: PlanAgentMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      // Reset token usage for new request
      setTokenUsage(null);

      // Send to server
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
      }));
    } else {
      console.warn('[PlanAgent] Cannot send message: WebSocket not connected');
      setError('Not connected to plan agent service');
    }
  }, [addMessage]);

  // Clear history
  const clearHistory = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setMessages([]);
      setPlan(null);
      wsRef.current.send(JSON.stringify({
        type: 'clear_history',
      }));
    }
  }, []);

  // Update idea context
  const updateIdeaContext = useCallback((context: PlanIdeaContext) => {
    ideaContextRef.current = context;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'idea_update',
        idea: context,
      }));
    }
  }, []);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isLoading) {
      wsRef.current.send(JSON.stringify({
        type: 'cancel',
      }));

      // Mark any streaming message as complete
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, { isStreaming: false });
        currentMessageIdRef.current = null;
      }

      setIsLoading(false);
    }
  }, [isLoading, updateMessage]);

  return {
    messages,
    isConnected,
    isLoading,
    error,
    tokenUsage,
    plan,
    sendMessage,
    addLocalMessage: addMessage,
    clearHistory,
    updateIdeaContext,
    cancelRequest,
  };
}

export default usePlanAgent;
