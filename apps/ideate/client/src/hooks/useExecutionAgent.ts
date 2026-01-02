import { useState, useEffect, useRef, useCallback } from 'react';
import { EXECUTION_AGENT_WS_URL } from '../config';
import type { IdeaPlan } from '../types/idea';

/**
 * Idea context to send to the execution agent
 */
export interface ExecutionIdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
}

/**
 * Task completion event
 */
export interface TaskCompleteEvent {
  taskId: string;
  phaseId: string;
  summary?: string;
}

/**
 * Phase completion event
 */
export interface PhaseCompleteEvent {
  phaseId: string;
  summary?: string;
}

/**
 * Execution blocked event
 */
export interface ExecutionBlockedEvent {
  taskId?: string;
  phaseId?: string;
  issue: string;
  attempted?: string[];
  needsUserInput: boolean;
}

/**
 * New idea discovered during execution
 */
export interface NewIdeaEvent {
  title: string;
  summary: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Execution message (for display in chat)
 */
export interface ExecutionMessage {
  id: string;
  type: 'text' | 'tool_use' | 'tool_result' | 'task_complete' | 'phase_complete' | 'blocked' | 'new_idea';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolName?: string;
  event?: TaskCompleteEvent | PhaseCompleteEvent | ExecutionBlockedEvent | NewIdeaEvent;
}

/**
 * Server message types for the execution agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'task_complete' | 'phase_complete' | 'execution_blocked' | 'new_idea' | 'tool_use_start' | 'tool_use_end' | 'execution_complete' | 'error' | 'token_usage';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Task completion event */
  taskComplete?: TaskCompleteEvent;
  /** Phase completion event */
  phaseComplete?: PhaseCompleteEvent;
  /** Execution blocked event */
  executionBlocked?: ExecutionBlockedEvent;
  /** New idea discovered */
  newIdea?: NewIdeaEvent;
  /** Tool name (for tool_use_start/end) */
  toolName?: string;
  /** Tool input (for tool_use_start) */
  toolInput?: unknown;
  /** Tool result (for tool_use_end) */
  toolResult?: string;
  /** Error message */
  error?: string;
  /** Token usage information */
  usage?: TokenUsage;
}

/**
 * Options for useExecutionAgent
 */
export interface UseExecutionAgentOptions {
  /** Idea ID to execute */
  ideaId: string;
  /** User ID for authentication */
  userId: string;
  /** User name for display */
  userName: string;
  /** Called when a task is completed */
  onTaskComplete?: (event: TaskCompleteEvent) => void;
  /** Called when a phase is completed */
  onPhaseComplete?: (event: PhaseCompleteEvent) => void;
  /** Called when execution is blocked */
  onExecutionBlocked?: (event: ExecutionBlockedEvent) => void;
  /** Called when a new idea is discovered */
  onNewIdea?: (event: NewIdeaEvent) => void;
  /** Called when execution completes */
  onExecutionComplete?: () => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Return value from useExecutionAgent
 */
export interface UseExecutionAgentReturn {
  /** Execution messages (for display) */
  messages: ExecutionMessage[];
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether execution is in progress */
  isExecuting: boolean;
  /** Whether execution is paused */
  isPaused: boolean;
  /** Whether execution is blocked waiting for feedback */
  isBlocked: boolean;
  /** Blocked event (if isBlocked is true) */
  blockedEvent: ExecutionBlockedEvent | null;
  /** Any error that occurred */
  error: string | null;
  /** Current token usage (updated during streaming) */
  tokenUsage: TokenUsage | null;
  /** Start executing a phase */
  startExecution: (ideaContext: ExecutionIdeaContext, plan: IdeaPlan, phaseId: string) => void;
  /** Send feedback during execution */
  sendFeedback: (feedback: string) => void;
  /** Pause execution */
  pauseExecution: () => void;
  /** Resume execution */
  resumeExecution: () => void;
  /** Cancel execution */
  cancelExecution: () => void;
  /** Clear all messages */
  clearMessages: () => void;
}

/**
 * Hook for managing the execution agent WebSocket connection.
 * Handles streaming responses, tool execution, and progress tracking.
 */
export function useExecutionAgent({
  ideaId,
  userId,
  userName,
  onTaskComplete,
  onPhaseComplete,
  onExecutionBlocked,
  onNewIdea,
  onExecutionComplete,
  onError,
}: UseExecutionAgentOptions): UseExecutionAgentReturn {
  const [messages, setMessages] = useState<ExecutionMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedEvent, setBlockedEvent] = useState<ExecutionBlockedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // Add a message
  const addMessage = useCallback((message: ExecutionMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update a message (for streaming)
  const updateMessage = useCallback((id: string, updates: Partial<ExecutionMessage> | ((prev: string) => string)) => {
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

    const wsUrl = `${EXECUTION_AGENT_WS_URL}?ideaId=${encodeURIComponent(ideaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('[ExecutionAgent] WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsExecuting(false);
      console.log('[ExecutionAgent] WebSocket disconnected');

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (userId && ideaId) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (event) => {
      console.error('[ExecutionAgent] WebSocket error:', event);
      setIsConnected(false);
      setError('Failed to connect to execution agent service');
      onError?.('Failed to connect to execution agent service');
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'text_chunk':
            // Streaming text chunk
            if (data.messageId && data.text) {
              if (currentMessageIdRef.current !== data.messageId) {
                currentMessageIdRef.current = data.messageId;
                addMessage({
                  id: data.messageId,
                  type: 'text',
                  content: data.text,
                  timestamp: Date.now(),
                  isStreaming: true,
                });
              } else {
                updateMessage(data.messageId, (prev) => prev + data.text);
              }
            }
            break;

          case 'task_complete':
            if (data.taskComplete) {
              // Mark streaming message as complete
              if (currentMessageIdRef.current) {
                updateMessage(currentMessageIdRef.current, { isStreaming: false });
                currentMessageIdRef.current = null;
              }

              // Add task complete message
              addMessage({
                id: `task-${data.taskComplete.taskId}-${Date.now()}`,
                type: 'task_complete',
                content: `Task completed: ${data.taskComplete.summary || data.taskComplete.taskId}`,
                timestamp: Date.now(),
                event: data.taskComplete,
              });

              onTaskComplete?.(data.taskComplete);
            }
            break;

          case 'phase_complete':
            if (data.phaseComplete) {
              // Mark streaming message as complete
              if (currentMessageIdRef.current) {
                updateMessage(currentMessageIdRef.current, { isStreaming: false });
                currentMessageIdRef.current = null;
              }

              addMessage({
                id: `phase-${data.phaseComplete.phaseId}-${Date.now()}`,
                type: 'phase_complete',
                content: `Phase completed: ${data.phaseComplete.summary || data.phaseComplete.phaseId}`,
                timestamp: Date.now(),
                event: data.phaseComplete,
              });

              onPhaseComplete?.(data.phaseComplete);
            }
            break;

          case 'execution_blocked':
            if (data.executionBlocked) {
              setIsBlocked(true);
              setBlockedEvent(data.executionBlocked);

              addMessage({
                id: `blocked-${Date.now()}`,
                type: 'blocked',
                content: data.executionBlocked.issue,
                timestamp: Date.now(),
                event: data.executionBlocked,
              });

              onExecutionBlocked?.(data.executionBlocked);
            }
            break;

          case 'new_idea':
            if (data.newIdea) {
              addMessage({
                id: `new-idea-${Date.now()}`,
                type: 'new_idea',
                content: `New idea discovered: ${data.newIdea.title}`,
                timestamp: Date.now(),
                event: data.newIdea,
              });

              onNewIdea?.(data.newIdea);
            }
            break;

          case 'tool_use_start':
            if (data.toolName) {
              addMessage({
                id: `tool-start-${Date.now()}`,
                type: 'tool_use',
                content: `Using tool: ${data.toolName}`,
                timestamp: Date.now(),
                toolName: data.toolName,
              });
            }
            break;

          case 'tool_use_end':
            if (data.toolResult) {
              addMessage({
                id: `tool-end-${Date.now()}`,
                type: 'tool_result',
                content: data.toolResult,
                timestamp: Date.now(),
                toolName: data.toolName,
              });
            }
            break;

          case 'execution_complete':
            // Mark streaming message as complete
            if (currentMessageIdRef.current) {
              updateMessage(currentMessageIdRef.current, { isStreaming: false });
              currentMessageIdRef.current = null;
            }

            setIsExecuting(false);
            setIsBlocked(false);
            setBlockedEvent(null);
            onExecutionComplete?.();
            break;

          case 'error':
            if (data.error) {
              setError(data.error);
              setIsExecuting(false);
              onError?.(data.error);
            }
            break;

          case 'token_usage':
            if (data.usage) {
              setTokenUsage(data.usage);
            }
            break;
        }
      } catch (err) {
        console.error('[ExecutionAgent] Failed to parse message:', err);
      }
    };
  }, [ideaId, userId, userName, addMessage, updateMessage, onTaskComplete, onPhaseComplete, onExecutionBlocked, onNewIdea, onExecutionComplete, onError]);

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

  // Start execution
  const startExecution = useCallback((ideaContext: ExecutionIdeaContext, plan: IdeaPlan, phaseId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsExecuting(true);
      setIsPaused(false);
      setIsBlocked(false);
      setBlockedEvent(null);
      setTokenUsage(null);
      setError(null);

      wsRef.current.send(JSON.stringify({
        type: 'start_execution',
        idea: ideaContext,
        plan,
        phaseId,
      }));
    } else {
      setError('Not connected to execution agent service');
    }
  }, []);

  // Send feedback
  const sendFeedback = useCallback((feedback: string) => {
    if (!feedback.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear blocked state when sending feedback
      setIsBlocked(false);
      setBlockedEvent(null);

      // Add user feedback message
      addMessage({
        id: `feedback-${Date.now()}`,
        type: 'text',
        content: feedback,
        timestamp: Date.now(),
      });

      wsRef.current.send(JSON.stringify({
        type: 'feedback',
        content: feedback,
      }));
    } else {
      setError('Not connected to execution agent service');
    }
  }, [addMessage]);

  // Pause execution
  const pauseExecution = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsPaused(true);
      wsRef.current.send(JSON.stringify({ type: 'pause' }));
    }
  }, []);

  // Resume execution
  const resumeExecution = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsPaused(false);
      wsRef.current.send(JSON.stringify({ type: 'resume' }));
    }
  }, []);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel' }));

      // Mark any streaming message as complete
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, { isStreaming: false });
        currentMessageIdRef.current = null;
      }

      setIsExecuting(false);
      setIsPaused(false);
      setIsBlocked(false);
      setBlockedEvent(null);
    }
  }, [updateMessage]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setTokenUsage(null);
  }, []);

  return {
    messages,
    isConnected,
    isExecuting,
    isPaused,
    isBlocked,
    blockedEvent,
    error,
    tokenUsage,
    startExecution,
    sendFeedback,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    clearMessages,
  };
}

export default useExecutionAgent;
