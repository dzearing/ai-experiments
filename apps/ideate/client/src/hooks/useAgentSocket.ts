/**
 * Base hook for WebSocket-based agent communication.
 *
 * This hook handles all the common functionality shared across agents:
 * - WebSocket connection lifecycle (connect, reconnect, cleanup)
 * - Message state management (add, update, streaming)
 * - Tool call tracking
 * - Progress events
 * - Token usage tracking
 * - Open questions
 * - Document editing state
 * - Cancel functionality
 * - History management
 *
 * Agent-specific hooks (useIdeaAgent, usePlanAgent, useExecutionAgent) wrap
 * this base hook and add their unique functionality.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';
import { useAgentProgress, type AgentProgressEvent } from './useAgentProgress';
import type { ModelId } from './useModelPreference';
import { createLogger } from '../utils/clientLogger';
import type {
  AgentMessage,
  AgentToolCall,
  TokenUsage,
  IdeaContext,
} from './agentTypes';
import type { SlashCommand, SlashCommandResult } from '../types/slashCommandTypes';

/**
 * Server message types that all agents handle
 */
export interface BaseServerMessage {
  type: string;
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Complete message object */
  message?: AgentMessage;
  /** Array of messages (for history) */
  messages?: AgentMessage[];
  /** Error message */
  error?: string;
  /** Token usage information */
  usage?: TokenUsage;
  /** Open questions for user to resolve */
  questions?: OpenQuestion[];
  /** Agent progress event */
  event?: AgentProgressEvent;
  /** Session status (for reconnection sync) */
  status?: string;
  /** When the session started */
  startedAt?: string;
  /** Tool result content */
  toolResult?: string;
  /** Tool name */
  toolName?: string;
  /** Tool input */
  toolInput?: Record<string, unknown>;
  /** For available_commands message */
  commands?: SlashCommand[];
  /** For command_result message - command name */
  command?: string;
  /** For command_result message - result */
  result?: SlashCommandResult;
}

/**
 * Configuration for the base agent socket hook
 */
export interface UseAgentSocketConfig {
  /** WebSocket URL (without query params) */
  wsUrl: string;
  /** Idea ID - identifies the idea being worked on */
  ideaId: string | null;
  /** User ID for authentication */
  userId: string;
  /** User name for display */
  userName: string;
  /** Whether the agent is enabled (controls WebSocket connection) */
  enabled?: boolean;
  /** Model ID to use for the agent */
  modelId?: ModelId;
  /** Workspace ID for broadcasting agent status */
  workspaceId?: string;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Logger tag for this agent */
  loggerTag?: string;
  /** Additional URL params to include in WebSocket connection */
  extraUrlParams?: Record<string, string | undefined>;
  /** Handler for agent-specific message types */
  onCustomMessage?: (type: string, data: BaseServerMessage) => boolean;
  /** Called when history is loaded (allows wrapper to process/filter) */
  onHistoryLoaded?: (messages: AgentMessage[]) => AgentMessage[];
  /** Called when WebSocket connects (for sending initial data) */
  onConnected?: (ws: WebSocket) => void;
  /** Idea context to send with messages */
  ideaContext?: IdeaContext | null;
}

/**
 * Return value from useAgentSocket
 */
export interface UseAgentSocketReturn {
  /** Chat messages */
  messages: AgentMessage[];
  /** Set messages directly (for wrappers that need to modify) */
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the agent is currently responding */
  isLoading: boolean;
  /** Set loading state (for wrappers) */
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether the agent is currently editing the document */
  isEditingDocument: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Set error state (for wrappers) */
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  /** Current token usage (updated during streaming) */
  tokenUsage: TokenUsage | null;
  /** Open questions from the agent (null if none) */
  openQuestions: OpenQuestion[] | null;
  /** Set open questions (for wrappers) */
  setOpenQuestions: React.Dispatch<React.SetStateAction<OpenQuestion[] | null>>;
  /** Whether the questions resolver overlay should be shown */
  showQuestionsResolver: boolean;
  /** Set whether the questions resolver overlay should be shown */
  setShowQuestionsResolver: (show: boolean) => void;
  /** Resolve questions and send summary to agent */
  resolveQuestions: (result: OpenQuestionsResult) => void;
  /** Send a message to the agent */
  sendMessage: (content: string) => void;
  /** Send a message to the agent without displaying it in the chat (silent/background) */
  sendSilentMessage: (content: string) => void;
  /** Add a local message */
  addMessage: (message: AgentMessage) => void;
  /** Update a message (for streaming and tool calls) */
  updateMessage: (
    id: string,
    updates: MessageUpdate | ((prev: string) => string)
  ) => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Update the idea context */
  updateIdeaContext: (context: IdeaContext) => void;
  /** Cancel the current request */
  cancelRequest: () => void;
  /** Agent progress state and methods */
  progress: {
    currentEvent: AgentProgressEvent | null;
    recentEvents: AgentProgressEvent[];
    isProcessing: boolean;
    handleProgressEvent: (event: AgentProgressEvent) => void;
    clearProgress: () => void;
    setProcessing: (isProcessing: boolean) => void;
  };
  /** WebSocket ref for wrappers that need direct access */
  wsRef: React.RefObject<WebSocket | null>;
  /** Current message ID ref for wrappers */
  currentMessageIdRef: React.MutableRefObject<string | null>;
  /** Send raw message to WebSocket */
  sendRaw: (data: Record<string, unknown>) => void;
  /** Available slash commands from server */
  availableCommands: SlashCommand[];
  /** Execute a slash command */
  executeCommand: (command: string, args: string) => void;
}

/**
 * Type for message updates
 */
export interface MessageUpdate {
  content?: string | ((prev: string) => string);
  toolCalls?: AgentToolCall[] | ((prev: AgentToolCall[] | undefined) => AgentToolCall[] | undefined);
  isStreaming?: boolean;
}


/**
 * Base hook for WebSocket-based agent communication.
 */
export function useAgentSocket({
  wsUrl,
  ideaId,
  userId,
  userName,
  enabled = true,
  modelId,
  workspaceId,
  onError,
  loggerTag = 'AgentSocket',
  extraUrlParams,
  onCustomMessage,
  onHistoryLoaded,
  onConnected,
  ideaContext,
}: UseAgentSocketConfig): UseAgentSocketReturn {
  const log = useMemo(() => createLogger(loggerTag), [loggerTag]);

  // Core state
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[] | null>(null);
  const [showQuestionsResolver, setShowQuestionsResolver] = useState(false);
  const [availableCommands, setAvailableCommands] = useState<SlashCommand[]>([]);

  // Agent progress tracking
  const progress = useAgentProgress();

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const ideaContextRef = useRef<IdeaContext | null>(ideaContext || null);
  const enabledRef = useRef(enabled);
  const modelIdRef = useRef<ModelId | undefined>(modelId);
  const workspaceIdRef = useRef<string | undefined>(workspaceId);
  const prevIdeaIdRef = useRef<string | null>(ideaId);

  // Keep refs updated
  useEffect(() => {
    ideaContextRef.current = ideaContext || null;
  }, [ideaContext]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);

  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  // Disconnect and clear state when disabled
  useEffect(() => {
    if (!enabled) {
      log.log('Disabled, disconnecting');
      setMessages([]);
      setError(null);
      setIsLoading(false);
      setIsEditingDocument(false);
      setTokenUsage(null);
      setOpenQuestions(null);
      currentMessageIdRef.current = null;

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [enabled, log]);

  // Force reconnect when ideaId changes from null to a real value
  // This handles the case where an idea is created and we need to reconnect with the new ideaId
  useEffect(() => {
    const prevId = prevIdeaIdRef.current;
    const currentId = ideaId;

    // Update ref for next comparison
    prevIdeaIdRef.current = currentId;

    // If ideaId changed from null (new idea) to a real ID, force reconnect
    if (prevId === null && currentId !== null && wsRef.current) {
      log.log('ideaId changed from null to real ID, forcing reconnect', { prevId, currentId });

      // Close the existing connection - it will auto-reconnect with new ideaId
      wsRef.current.close();
    }
  }, [ideaId, log]);

  // Add a message
  const addMessage = useCallback((message: AgentMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update a message (for streaming and tool calls)
  const updateMessage = useCallback((
    id: string,
    updates: MessageUpdate | ((prev: string) => string)
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

  // Send raw data to WebSocket
  const sendRaw = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((data: BaseServerMessage) => {
    // Let wrapper handle custom messages first
    if (onCustomMessage?.(data.type, data)) {
      return; // Wrapper handled it
    }

    switch (data.type) {
      case 'history':
        // Load message history
        if (data.messages) {
          let processedMessages = data.messages;

          // Allow wrapper to process/filter history
          if (onHistoryLoaded) {
            processedMessages = onHistoryLoaded(processedMessages);
          }

          // Merge with any locally added messages not in server history
          setMessages((prev) => {
            const serverMessageIds = new Set(processedMessages.map((m) => m.id));
            const localOnlyUserMessages = prev.filter(
              (m) => m.role === 'user' && !serverMessageIds.has(m.id)
            );

            if (localOnlyUserMessages.length > 0) {
              log.log('Preserving local user messages not in server history:', localOnlyUserMessages.length);
            }

            return [...processedMessages, ...localOnlyUserMessages];
          });

          // Restore open questions from the last message that has them
          const messageWithQuestions = [...processedMessages].reverse().find(
            (msg) => msg.openQuestions && msg.openQuestions.length > 0
          );

          if (messageWithQuestions?.openQuestions) {
            log.log('Restoring open questions from history:', messageWithQuestions.openQuestions.length);
            setOpenQuestions(messageWithQuestions.openQuestions);
          }
        }
        break;

      case 'text_chunk':
        // Streaming text chunk
        if (data.messageId && data.text) {
          if (currentMessageIdRef.current !== data.messageId) {
            currentMessageIdRef.current = data.messageId;
            // Clear streaming on all existing messages before adding new streaming message
            setMessages((prev) => [
              ...prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m),
              {
                id: data.messageId!,
                role: 'assistant' as const,
                content: data.text!,
                timestamp: Date.now(),
                isStreaming: true,
              },
            ]);
          } else {
            // Check if current message has tool calls - if so, text arriving after
            // tools should be in a new message to render below the tools
            const textContent = data.text;
            setMessages((prev) => {
              const currentMsg = prev.find((m) => m.id === data.messageId);

              if (currentMsg?.toolCalls && currentMsg.toolCalls.length > 0) {
                // Text arriving after tools - create a new message
                // Clear streaming on ALL existing messages
                const newMessageId = `${data.messageId}-cont-${Date.now()}`;
                currentMessageIdRef.current = newMessageId;

                return [
                  ...prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m),
                  {
                    id: newMessageId,
                    role: 'assistant' as const,
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

      case 'message_complete':
        // Message is complete - mark all streaming messages as complete
        if (data.messageId) {
          setMessages((prev) =>
            prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
          );
          currentMessageIdRef.current = null;
          setIsLoading(false);
          progress.clearProgress();
        }
        break;

      case 'greeting':
        // Initial greeting message - only add if no messages yet
        if (data.messageId && data.text) {
          setMessages((prev) => {
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

      case 'error':
        // Error from server
        if (data.error) {
          setError(data.error);
          onError?.(data.error);
          setIsLoading(false);
          setIsEditingDocument(false);
          progress.clearProgress();
        }
        break;

      case 'document_edit_start':
        setIsEditingDocument(true);
        log.log('Document editing started');
        break;

      case 'document_edit_end':
        setIsEditingDocument(false);
        log.log('Document editing finished');
        break;

      case 'token_usage':
        if (data.usage) {
          setTokenUsage(data.usage);
        }
        break;

      case 'open_questions':
        if (data.questions && data.questions.length > 0) {
          setOpenQuestions(data.questions);
        }
        break;

      case 'agent_progress':
        // Handle agent progress event
        if (data.event) {
          progress.handleProgressEvent(data.event);

          // Persist tool calls to the message for proper interleaving
          if (data.event.type === 'tool_start' && data.event.toolName) {
            const toolInput: Record<string, unknown> = {};

            if (data.event.searchQuery) {
              toolInput.query = data.event.searchQuery;
            }

            if (data.event.filePath) {
              toolInput.path = data.event.filePath;
            }

            if (data.event.command) {
              toolInput.command = data.event.command;
            }

            const newToolCall: AgentToolCall = {
              name: data.event.toolName,
              input: toolInput,
              startTime: data.event.timestamp || Date.now(),
            };

            const targetMessageId = currentMessageIdRef.current;

            if (!targetMessageId) {
              // No current message - create one for the tool
              // Clear streaming on all existing messages before adding new streaming message
              const newMessageId = `msg-${Date.now()}`;
              currentMessageIdRef.current = newMessageId;
              setMessages((prev) => [
                ...prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m),
                {
                  id: newMessageId,
                  role: 'assistant' as const,
                  content: '',
                  timestamp: Date.now(),
                  isStreaming: true,
                  toolCalls: [newToolCall],
                },
              ]);
            } else {
              // Add to existing message's toolCalls
              updateMessage(targetMessageId, {
                toolCalls: (prev) => [...(prev || []), newToolCall],
              });
            }
          } else if (data.event.type === 'tool_complete' && data.event.toolName) {
            // Update the tool call with completion status
            const targetMessageId = currentMessageIdRef.current;

            if (targetMessageId) {
              const duration = data.event.timestamp ? Date.now() - (data.event.timestamp - 1000) : undefined;
              updateMessage(targetMessageId, {
                toolCalls: (prev) => {
                  if (!prev) return prev;

                  let updated = false;

                  return prev.map((tc) => {
                    if (updated) return tc;

                    if (tc.name === data.event!.toolName && !tc.completed) {
                      updated = true;

                      return {
                        ...tc,
                        completed: true,
                        endTime: Date.now(),
                        duration: tc.startTime ? Date.now() - tc.startTime : duration,
                        output: '__complete__',
                      };
                    }

                    return tc;
                  });
                },
              });
            }
          }
        }
        break;

      case 'session_status':
        // Session status sync on reconnect
        if (data.status === 'running') {
          log.log('Session is running, showing thinking indicator');
          setIsLoading(true);
        } else if (data.status === 'idle') {
          setIsLoading(false);
        }
        break;

      case 'available_commands':
        if (data.commands) {
          setAvailableCommands(data.commands);
          log.log('Received available commands', { count: data.commands.length });
        }
        break;

      case 'command_result':
        setIsLoading(false); // Clear thinking indicator
        if (data.result) {
          // Add result as assistant message (unless ephemeral)
          if (!data.result.ephemeral) {
            // Handle component format - use parts array for rich rendering
            if (data.result.format === 'component' && data.result.componentType && data.result.data) {
              addMessage({
                id: `cmd-${Date.now()}`,
                role: 'assistant',
                content: '', // Empty content since we use parts
                timestamp: Date.now(),
                parts: [{
                  type: 'component',
                  componentType: data.result.componentType,
                  data: data.result.data,
                }],
              });
            } else {
              // Standard text/markdown format
              addMessage({
                id: `cmd-${Date.now()}`,
                role: 'assistant',
                content: data.result.content || '',
                timestamp: Date.now(),
              });
            }
          }
          log.log('Command result received', { command: data.command, format: data.result.format, ephemeral: data.result.ephemeral });
        }
        break;
    }
  }, [addMessage, updateMessage, onCustomMessage, onHistoryLoaded, onError, progress, log]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Guard: already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (!userId) return;

    // Build URL with params - use 'new' for new ideas that don't have an ID yet
    const effectiveIdeaId = ideaId || 'new';
    let fullUrl = `${wsUrl}?ideaId=${encodeURIComponent(effectiveIdeaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

    // Add model preference
    if (modelIdRef.current) {
      fullUrl += `&modelId=${encodeURIComponent(modelIdRef.current)}`;
    }

    // Add workspace ID
    if (workspaceIdRef.current) {
      fullUrl += `&workspaceId=${encodeURIComponent(workspaceIdRef.current)}`;
    }

    // Add extra params from wrapper
    if (extraUrlParams) {
      for (const [key, value] of Object.entries(extraUrlParams)) {
        if (value !== undefined) {
          fullUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
      }
    }

    log.log('Connecting to', fullUrl);
    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      log.log('WebSocket connected');

      // Let wrapper handle initial connection (e.g., sending idea_update)
      onConnected?.(ws);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsLoading(false);
      setIsEditingDocument(false);
      progress.clearProgress();
      log.log('WebSocket disconnected');

      // Reconnect if still enabled
      if (enabledRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (userId && enabledRef.current) {
            connect();
          }
        }, 3000);
      }
    };

    ws.onerror = (event) => {
      log.error('WebSocket error:', event);
      setIsConnected(false);
      setError('Failed to connect to agent service');
      onError?.('Failed to connect to agent service');
    };

    ws.onmessage = (event) => {
      try {
        const data: BaseServerMessage = JSON.parse(event.data);
        handleMessage(data);
      } catch (err) {
        log.error('Failed to parse message:', err);
      }
    };
  }, [wsUrl, ideaId, userId, userName, extraUrlParams, handleMessage, onConnected, onError, progress, log]);

  // Connect when enabled and required params are available
  // Note: ideaId can be null for new ideas (will use 'new' as placeholder)
  useEffect(() => {
    if (enabled && userId && !isConnected) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, userId, isConnected, connect]);

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
      const userMessage: AgentMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      // Reset token usage
      setTokenUsage(null);

      // Send to server
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
        modelId: modelIdRef.current,
        ...extraUrlParams,
      }));
    } else {
      log.warn('Cannot send message: WebSocket not connected');
      setError('Not connected to agent service');
    }
  }, [addMessage, extraUrlParams, log]);

  // Send message without displaying it
  const sendSilentMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setTokenUsage(null);
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
        modelId: modelIdRef.current,
        ...extraUrlParams,
      }));
    } else {
      log.warn('Cannot send message: WebSocket not connected');
      setError('Not connected to agent service');
    }
  }, [extraUrlParams, log]);

  // Clear history
  const clearHistory = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setMessages([]);
      wsRef.current.send(JSON.stringify({ type: 'clear_history' }));
    }
  }, []);

  // Update idea context
  const updateIdeaContext = useCallback((context: IdeaContext) => {
    ideaContextRef.current = context;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'idea_update',
        idea: context,
        ...extraUrlParams,
      }));
    }
  }, [extraUrlParams]);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isLoading) {
      wsRef.current.send(JSON.stringify({ type: 'cancel' }));

      // Mark streaming message as complete and tool calls as cancelled
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, {
          isStreaming: false,
          toolCalls: (prev) => prev?.map((tc) => {
            if (!tc.completed && !tc.output) {
              return { ...tc, cancelled: true };
            }

            return tc;
          }),
        });
        currentMessageIdRef.current = null;
      }

      setIsLoading(false);
      setIsEditingDocument(false);
    }
  }, [isLoading, updateMessage]);

  // Execute a slash command
  const executeCommand = useCallback((command: string, args: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      log.log('Executing command', { command, args });
      setIsLoading(true); // Show thinking indicator while waiting for response
      wsRef.current.send(JSON.stringify({
        type: 'slash_command',
        command,
        args,
      }));
    } else {
      log.warn('Cannot execute command: WebSocket not connected');
    }
  }, [log]);

  // Resolve open questions
  const resolveQuestions = useCallback((result: OpenQuestionsResult) => {
    setShowQuestionsResolver(false);

    if (result.completed && openQuestions) {
      // Build human-readable summary
      const summaryLines = ['Here are my answers to the open questions:'];

      for (const answer of result.answers) {
        const question = openQuestions.find(q => q.id === answer.questionId);
        if (!question) continue;

        const selectedLabels = answer.selectedOptionIds
          .map(optId => {
            if (optId === 'custom') return answer.customText || 'Custom response';
            const opt = question.options.find(o => o.id === optId);

            return opt?.label || optId;
          })
          .filter(Boolean);

        if (selectedLabels.length > 0) {
          const shortQuestion = question.question.replace(/\?$/, '');
          summaryLines.push(`- **${shortQuestion}**: ${selectedLabels.join(', ')}`);
        }
      }

      const summary = summaryLines.join('\n');
      sendMessage(summary);
      setOpenQuestions(null);
    }
  }, [openQuestions, sendMessage]);

  return {
    messages,
    setMessages,
    isConnected,
    isLoading,
    setIsLoading,
    isEditingDocument,
    error,
    setError,
    tokenUsage,
    openQuestions,
    setOpenQuestions,
    showQuestionsResolver,
    setShowQuestionsResolver,
    resolveQuestions,
    sendMessage,
    sendSilentMessage,
    addMessage,
    updateMessage,
    clearHistory,
    updateIdeaContext,
    cancelRequest,
    progress,
    wsRef,
    currentMessageIdRef,
    sendRaw,
    availableCommands,
    executeCommand,
  };
}

export default useAgentSocket;
