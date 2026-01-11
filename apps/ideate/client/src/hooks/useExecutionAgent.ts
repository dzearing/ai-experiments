import { useState, useEffect, useRef, useCallback } from 'react';
import { EXECUTION_AGENT_WS_URL } from '../config';
import type { IdeaPlan } from '../types/idea';
import { useAgentProgress, type AgentProgressState } from './useAgentProgress';

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
 * Session state from the server
 */
export interface ExecutionSessionState {
  status: 'running' | 'paused' | 'blocked' | 'completed' | 'error' | 'idle';
  phaseId?: string;
  startedAt?: number;
  errorMessage?: string;
}

/**
 * Task update event (add/remove/modify tasks during execution)
 */
export interface TaskUpdateEvent {
  action: 'add' | 'remove' | 'update';
  taskId: string;
  phaseId: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
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
 * Tool call information for execution messages
 */
export interface ExecutionToolCall {
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  /** When the tool call started (epoch ms) */
  startTime?: number;
  /** When the tool call completed (epoch ms) */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Whether the tool execution is complete */
  completed?: boolean;
  /** Whether the tool execution was cancelled */
  cancelled?: boolean;
}

/**
 * Execution message (for display in chat)
 */
export interface ExecutionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  /** Message type - defaults to 'text' if not specified */
  type?: 'text' | 'tool_use' | 'tool_result' | 'task_complete' | 'phase_complete' | 'blocked' | 'new_idea' | 'task_update';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolName?: string;
  /** Tool calls made during this message */
  toolCalls?: ExecutionToolCall[];
  event?: TaskCompleteEvent | PhaseCompleteEvent | ExecutionBlockedEvent | NewIdeaEvent | TaskUpdateEvent;
}

/**
 * Server message types for the execution agent WebSocket protocol
 */
interface ServerMessage {
  type: 'connected' | 'session_state' | 'history' | 'text_chunk' | 'task_complete' | 'phase_complete' | 'execution_blocked' | 'new_idea' | 'task_update' | 'tool_use_start' | 'tool_use_end' | 'execution_complete' | 'error' | 'token_usage';
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
  /** Task update event */
  taskUpdate?: TaskUpdateEvent;
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
  /** Session state for reconnection */
  session?: ExecutionSessionState;
  /** Chat history messages */
  messages?: ExecutionMessage[];
  /** Whether there's an active execution */
  hasActiveExecution?: boolean;
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
  /** Initial idea context */
  ideaContext?: ExecutionIdeaContext | null;
  /** Initial plan for execution */
  plan?: IdeaPlan | null;
  /** Called when a task is completed */
  onTaskComplete?: (event: TaskCompleteEvent) => void;
  /** Called when a phase is completed */
  onPhaseComplete?: (event: PhaseCompleteEvent) => void;
  /** Called when execution is blocked */
  onExecutionBlocked?: (event: ExecutionBlockedEvent) => void;
  /** Called when a new idea is discovered */
  onNewIdea?: (event: NewIdeaEvent) => void;
  /** Called when a task is updated (add/remove/modify) */
  onTaskUpdate?: (event: TaskUpdateEvent) => void;
  /** Called when execution completes */
  onExecutionComplete?: () => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Whether the hook is enabled (controls WebSocket connection) */
  enabled?: boolean;
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
  /** Current session state from server */
  sessionState: ExecutionSessionState | null;
  /** Any error that occurred */
  error: string | null;
  /** Current token usage (updated during streaming) */
  tokenUsage: TokenUsage | null;
  /** Agent progress state for ThinkingIndicator */
  progress: AgentProgressState;
  /** Start executing a phase */
  startExecution: (ideaContext: ExecutionIdeaContext, plan: IdeaPlan, phaseId: string) => void;
  /** Send a message during execution (for chat) */
  sendMessage: (content: string) => void;
  /** Send feedback during execution (alias for sendMessage) */
  sendFeedback: (feedback: string) => void;
  /** Pause execution */
  pauseExecution: () => void;
  /** Resume execution */
  resumeExecution: () => void;
  /** Cancel execution */
  cancelExecution: () => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Add a local message (for system messages) */
  addLocalMessage: (message: ExecutionMessage) => void;
  /** Request chat history from server */
  requestHistory: (limit?: number) => void;
}

/**
 * Hook for managing the execution agent WebSocket connection.
 * Handles streaming responses, tool execution, and progress tracking.
 */
export function useExecutionAgent({
  ideaId,
  userId,
  userName,
  ideaContext: initialIdeaContext,
  plan: initialPlan,
  onTaskComplete,
  onPhaseComplete,
  onExecutionBlocked,
  onNewIdea,
  onTaskUpdate,
  onExecutionComplete,
  onError,
  enabled = true,
}: UseExecutionAgentOptions): UseExecutionAgentReturn {
  const [messages, setMessages] = useState<ExecutionMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedEvent, setBlockedEvent] = useState<ExecutionBlockedEvent | null>(null);
  const [sessionState, setSessionState] = useState<ExecutionSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  // Agent progress tracking for ThinkingIndicator
  const progress = useAgentProgress();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);
  const ideaContextRef = useRef<ExecutionIdeaContext | null>(initialIdeaContext || null);
  const planRef = useRef<IdeaPlan | null>(initialPlan || null);
  // Track pending execution to handle race condition when startExecution is called before WS connects
  const pendingExecutionRef = useRef<{
    ideaContext: ExecutionIdeaContext;
    plan: IdeaPlan;
    phaseId: string;
  } | null>(null);

  // Keep refs updated
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (initialIdeaContext) {
      ideaContextRef.current = initialIdeaContext;
    }
  }, [initialIdeaContext]);

  useEffect(() => {
    if (initialPlan) {
      planRef.current = initialPlan;
    }
  }, [initialPlan]);

  // Disconnect and clear state when disabled
  useEffect(() => {
    console.log('[ExecutionAgent] Disabled effect running, enabled =', enabled, 'pendingExecution =', !!pendingExecutionRef.current);
    if (!enabled) {
      console.log('[ExecutionAgent] Disabled, disconnecting and clearing state');
      setMessages([]);
      setError(null);
      setIsExecuting(false);
      setIsBlocked(false);
      setBlockedEvent(null);
      setSessionState(null);
      setTokenUsage(null);
      currentMessageIdRef.current = null;
      pendingExecutionRef.current = null;

      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }

      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [enabled]);

  // Add a message
  const addMessage = useCallback((message: ExecutionMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Type for functional updates in message fields
  type FunctionalUpdate<T> = T | ((prev: T) => T);

  // Update a message (for streaming and tool calls)
  // Supports functional updates for content and toolCalls
  const updateMessage = useCallback((
    id: string,
    updates: {
      content?: FunctionalUpdate<string>;
      toolCalls?: FunctionalUpdate<ExecutionToolCall[] | undefined>;
      isStreaming?: boolean;
    } | ((prev: string) => string)
  ) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;

        // Handle legacy string function update (for content append)
        if (typeof updates === 'function') {
          return { ...msg, content: updates(msg.content) };
        }

        // Handle object updates with potential functional values
        const newMsg = { ...msg };

        if (updates.content !== undefined) {
          newMsg.content = typeof updates.content === 'function'
            ? updates.content(msg.content)
            : updates.content;
        }

        if (updates.toolCalls !== undefined) {
          newMsg.toolCalls = typeof updates.toolCalls === 'function'
            ? updates.toolCalls(msg.toolCalls)
            : updates.toolCalls;
        }

        if (updates.isStreaming !== undefined) {
          newMsg.isStreaming = updates.isStreaming;
        }

        return newMsg;
      })
    );
  }, []);

  const connect = useCallback(() => {
    console.log('[ExecutionAgent] connect() called, pendingExecution =', !!pendingExecutionRef.current);
    // Guard: already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[ExecutionAgent] connect() early return: already connected/connecting');
      return;
    }
    if (!userId || !ideaId) {
      console.log('[ExecutionAgent] connect() early return: missing userId or ideaId', { userId: !!userId, ideaId: !!ideaId });
      return;
    }

    const wsUrl = `${EXECUTION_AGENT_WS_URL}?ideaId=${encodeURIComponent(ideaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('[ExecutionAgent] WebSocket connected, pendingExecution =', !!pendingExecutionRef.current);

      // Check for pending execution and send it
      if (pendingExecutionRef.current) {
        const { ideaContext, plan, phaseId } = pendingExecutionRef.current;
        console.log('[ExecutionAgent] Sending pending execution for phase:', phaseId, 'ideaContext:', ideaContext.id);
        setIsExecuting(true);
        setIsPaused(false);
        setIsBlocked(false);
        setBlockedEvent(null);
        setTokenUsage(null);

        ws.send(JSON.stringify({
          type: 'start_execution',
          idea: ideaContext,
          plan,
          phaseId,
        }));

        // Clear pending execution
        pendingExecutionRef.current = null;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsExecuting(false);
      console.log('[ExecutionAgent] WebSocket disconnected');

      // Only attempt to reconnect if still enabled
      if (enabledRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (userId && ideaId && enabledRef.current) {
            connect();
          }
        }, 3000);
      }
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
          case 'connected':
            // Connection acknowledgment with session state
            if (data.session) {
              setSessionState(data.session);
              setIsExecuting(data.session.status === 'running');
              setIsBlocked(data.session.status === 'blocked');

              // If session has an error, set the error state and add message
              if (data.session.status === 'error' && data.session.errorMessage) {
                setError(data.session.errorMessage);
                // Note: Don't add error message here - it will come from history
              }
            }
            console.log('[ExecutionAgent] Connected, active execution:', data.hasActiveExecution);

            // Automatically request chat history on connection
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'get_history' }));
            }
            break;

          case 'session_state':
            // Session state update
            if (data.session) {
              setSessionState(data.session);
              setIsExecuting(data.session.status === 'running');
              setIsBlocked(data.session.status === 'blocked');
            }
            break;

          case 'history':
            // Load message history
            if (data.messages) {
              setMessages(data.messages);
            }
            break;

          case 'text_chunk':
            // Streaming text chunk
            if (data.messageId && data.text) {
              if (currentMessageIdRef.current !== data.messageId) {
                currentMessageIdRef.current = data.messageId;
                addMessage({
                  id: data.messageId,
                  role: 'assistant',
                  type: 'text',
                  content: data.text,
                  timestamp: Date.now(),
                  isStreaming: true,
                });
              } else {
                // Check if current message has tool calls - if so, text arriving after
                // tools should be in a new message to render below the tools
                const textContent = data.text; // Capture for closure
                setMessages((prev) => {
                  const currentMsg = prev.find((m) => m.id === data.messageId);
                  if (currentMsg?.toolCalls && currentMsg.toolCalls.length > 0) {
                    // Text arriving after tools - create a new message
                    const newMessageId = `${data.messageId}-cont-${Date.now()}`;
                    currentMessageIdRef.current = newMessageId;
                    return [
                      ...prev.map((m) =>
                        m.id === data.messageId ? { ...m, isStreaming: false } : m
                      ),
                      {
                        id: newMessageId,
                        role: 'assistant' as const,
                        type: 'text' as const,
                        content: textContent,
                        timestamp: Date.now(),
                        isStreaming: true,
                      },
                    ];
                  }
                  // No tools yet - append to existing message
                  return prev.map((m) =>
                    m.id === data.messageId ? { ...m, content: m.content + textContent } : m
                  );
                });
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
                role: 'system',
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
                role: 'system',
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
                role: 'system',
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
                role: 'system',
                type: 'new_idea',
                content: `New idea discovered: ${data.newIdea.title}`,
                timestamp: Date.now(),
                event: data.newIdea,
              });

              onNewIdea?.(data.newIdea);
            }
            break;

          case 'task_update':
            if (data.taskUpdate) {
              addMessage({
                id: `task-update-${Date.now()}`,
                role: 'system',
                type: 'task_update',
                content: `Task ${data.taskUpdate.action}: ${data.taskUpdate.title || data.taskUpdate.taskId}`,
                timestamp: Date.now(),
                event: data.taskUpdate,
              });

              onTaskUpdate?.(data.taskUpdate);
            }
            break;

          case 'tool_use_start':
            // Add tool call to current message (like facilitator does)
            if (data.toolName) {
              // Update progress indicator
              progress.handleProgressEvent({
                type: 'tool_start',
                toolName: data.toolName,
                displayText: `Using ${data.toolName}...`,
                timestamp: Date.now(),
              });

              const newToolCall: ExecutionToolCall = {
                name: data.toolName,
                input: data.toolInput as Record<string, unknown> || {},
                startTime: Date.now(),
              };

              // Use messageId from server if available, otherwise use current message
              const targetMessageId = data.messageId || currentMessageIdRef.current;

              // If this message doesn't exist yet, create it (tool may arrive before text)
              if (!targetMessageId || currentMessageIdRef.current !== targetMessageId) {
                if (currentMessageIdRef.current) {
                  updateMessage(currentMessageIdRef.current, { isStreaming: false });
                }
                const newMessageId = targetMessageId || `msg-${Date.now()}`;
                currentMessageIdRef.current = newMessageId;
                addMessage({
                  id: newMessageId,
                  role: 'assistant',
                  type: 'text',
                  content: '',
                  timestamp: Date.now(),
                  isStreaming: true,
                  toolCalls: [newToolCall],
                });
              } else {
                // Add to existing message's toolCalls
                updateMessage(targetMessageId, {
                  toolCalls: (prev) => [...(prev || []), newToolCall],
                });
              }
            }
            break;

          case 'tool_use_end':
            // Update the tool call with its output
            // Note: Server may send name='unknown' when tool_result doesn't include name
            {
              // Update progress indicator
              progress.handleProgressEvent({
                type: 'tool_complete',
                toolName: data.toolName || 'unknown',
                displayText: `Completed ${data.toolName || 'tool'}`,
                timestamp: Date.now(),
              });

              const targetMessageId = data.messageId || currentMessageIdRef.current;
              if (targetMessageId) {
                updateMessage(targetMessageId, {
                  toolCalls: (prev) => {
                    if (!prev) return prev;
                    // If tool name is known and matches, update that tool
                    // Otherwise, update the first pending tool (no output yet)
                    const toolName = data.toolName;
                    let updated = false;
                    return prev.map((tc) => {
                      if (updated) return tc;
                      // Match by name if known, or match first pending if name is 'unknown'
                      const isMatch = toolName && toolName !== 'unknown'
                        ? tc.name === toolName && !tc.output
                        : !tc.output;
                      if (isMatch) {
                        updated = true;
                        // Use special marker for "complete with no output" - empty results shouldn't show a box
                        return { ...tc, output: data.toolResult || '__complete__' };
                      }
                      return tc;
                    });
                  },
                });
              }
            }
            break;

          case 'execution_complete':
            // Mark streaming message as complete
            if (currentMessageIdRef.current) {
              updateMessage(currentMessageIdRef.current, { isStreaming: false });
              currentMessageIdRef.current = null;
            }

            // Clear progress indicator
            progress.clearProgress();

            setIsExecuting(false);
            setIsBlocked(false);
            setBlockedEvent(null);
            setSessionState(prev => prev ? { ...prev, status: 'completed' } : { status: 'completed' });
            onExecutionComplete?.();
            break;

          case 'error':
            if (data.error) {
              setError(data.error);
              setIsExecuting(false);

              // Add error message to chat so it's visible in the UI
              addMessage({
                id: `error-${Date.now()}`,
                role: 'system',
                type: 'text',
                content: `**Error:** ${data.error}`,
                timestamp: Date.now(),
              });

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
  }, [ideaId, userId, userName, addMessage, updateMessage, onTaskComplete, onPhaseComplete, onExecutionBlocked, onNewIdea, onTaskUpdate, onExecutionComplete, onError, progress]);

  // Connect when enabled and userId and ideaId are available
  useEffect(() => {
    console.log('[ExecutionAgent] Connect effect running:', { enabled, userId: !!userId, ideaId: !!ideaId, isConnected, pendingExecution: !!pendingExecutionRef.current });
    if (enabled && userId && ideaId && !isConnected) {
      console.log('[ExecutionAgent] Connect effect: conditions met, calling connect()');
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, userId, ideaId, isConnected, connect]);

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
    console.log('[ExecutionAgent] startExecution called:', { ideaId: ideaContext.id, phaseId, wsReadyState: wsRef.current?.readyState });
    // Set optimistic UI state immediately (before server responds)
    setIsExecuting(true);
    setIsPaused(false);
    setIsBlocked(false);
    setBlockedEvent(null);
    setTokenUsage(null);
    setError(null);
    setSessionState({ status: 'running', phaseId, startedAt: Date.now() });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[ExecutionAgent] WebSocket already open, sending start_execution immediately');
      wsRef.current.send(JSON.stringify({
        type: 'start_execution',
        idea: ideaContext,
        plan,
        phaseId,
      }));
    } else {
      // WebSocket not connected yet - queue the execution to be sent when connected
      console.log('[ExecutionAgent] Queueing execution (WebSocket not yet open, readyState:', wsRef.current?.readyState, ')');
      pendingExecutionRef.current = { ideaContext, plan, phaseId };
    }
  }, []);

  // Send a message (for chat during execution)
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear blocked state when sending a message
      if (isBlocked) {
        setIsBlocked(false);
        setBlockedEvent(null);
      }

      // Add user message
      addMessage({
        id: `msg-user-${Date.now()}`,
        role: 'user',
        type: 'text',
        content: content.trim(),
        timestamp: Date.now(),
      });

      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        content: content.trim(),
      }));
    } else {
      setError('Not connected to execution agent service');
    }
  }, [addMessage, isBlocked]);

  // Send feedback (alias for sendMessage - for backwards compatibility)
  const sendFeedback = useCallback((feedback: string) => {
    sendMessage(feedback);
  }, [sendMessage]);

  // Request chat history from server
  const requestHistory = useCallback((limit?: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_history',
        limit,
      }));
    }
  }, []);

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

      // Mark any streaming message as complete and mark pending tool calls as cancelled
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, {
          isStreaming: false,
          toolCalls: (prev) => prev?.map((tc) => {
            // Mark incomplete tool calls as cancelled
            if (!tc.completed && !tc.output) {
              return { ...tc, cancelled: true };
            }

            return tc;
          }),
        });
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
    sessionState,
    error,
    tokenUsage,
    progress,
    startExecution,
    sendMessage,
    sendFeedback,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    clearMessages,
    addLocalMessage: addMessage,
    requestHistory,
  };
}

export default useExecutionAgent;
