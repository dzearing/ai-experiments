import { useState, useEffect, useRef, useCallback } from 'react';
import { IDEA_AGENT_WS_URL } from '../config';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';
import { useAgentProgress, type AgentProgressEvent, type AgentProgressState } from './useAgentProgress';
import type { ModelId } from './useModelPreference';
import { createLogger } from '../utils/clientLogger';

// Create logger for this hook
const log = createLogger('IdeaAgent');

/**
 * Idea context to send to the agent
 */
export interface IdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
  tags: string[];
  status: string;
  /** Optional Topic context when creating an idea linked to a Topic */
  topicContext?: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
}

/**
 * Tool call information for idea agent messages
 */
export interface IdeaAgentToolCall {
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
 * Message in the idea agent chat
 */
export interface IdeaAgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  /** Open questions associated with this message (for rehydration on dialog reopen) */
  openQuestions?: OpenQuestion[];
  /** Tool calls made during this message */
  toolCalls?: IdeaAgentToolCall[];
}

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Suggested response for the user to quickly reply
 */
export interface SuggestedResponse {
  label: string;
  message: string;
}

/**
 * Server message types for the idea agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'document_edit_start' | 'document_edit_end' | 'token_usage' | 'open_questions' | 'suggested_responses' | 'agent_progress';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Complete message object */
  message?: IdeaAgentMessage;
  /** Array of messages (for history) */
  messages?: IdeaAgentMessage[];
  /** Error message */
  error?: string;
  /** Token usage information */
  usage?: TokenUsage;
  /** Open questions for user to resolve (for open_questions type) */
  questions?: OpenQuestion[];
  /** Suggested responses for the user (for suggested_responses type) */
  suggestions?: SuggestedResponse[];
  /** Agent progress event */
  event?: AgentProgressEvent;
}

/**
 * Options for useIdeaAgent
 */
export interface UseIdeaAgentOptions {
  /** Idea ID to chat about (null if creating new idea) */
  ideaId: string | null;
  /** User ID for authentication */
  userId: string;
  /** User name for display */
  userName: string;
  /** Initial idea context */
  ideaContext: IdeaContext | null;
  /** Yjs document room name for coauthoring */
  documentRoomName?: string;
  /** Initial greeting to display instead of server-generated greeting */
  initialGreeting?: string;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Whether the agent is enabled (controls WebSocket connection) */
  enabled?: boolean;
  /** Model ID to use for the agent */
  modelId?: ModelId;
  /** Workspace ID for broadcasting agent status */
  workspaceId?: string;
}

/**
 * Return value from useIdeaAgent
 */
export interface UseIdeaAgentReturn {
  /** Chat messages */
  messages: IdeaAgentMessage[];
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the agent is currently responding */
  isLoading: boolean;
  /** Whether the agent is currently editing the document */
  isEditingDocument: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Current token usage (updated during streaming) */
  tokenUsage: TokenUsage | null;
  /** Open questions from the agent (null if none) */
  openQuestions: OpenQuestion[] | null;
  /** Suggested responses from the agent (null if none) */
  suggestedResponses: SuggestedResponse[] | null;
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
  /** Add a local message (for system messages like help) */
  addLocalMessage: (message: IdeaAgentMessage) => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Update the idea context */
  updateIdeaContext: (context: IdeaContext) => void;
  /** Cancel the current request */
  cancelRequest: () => void;
  /** Agent progress state */
  progress: AgentProgressState;
}

/**
 * Hook for managing the idea agent WebSocket connection.
 * Handles streaming responses and chat history.
 */
export function useIdeaAgent({
  ideaId,
  userId,
  userName,
  ideaContext,
  documentRoomName,
  initialGreeting,
  onError,
  enabled = true,
  modelId,
  workspaceId,
}: UseIdeaAgentOptions): UseIdeaAgentReturn {
  const [messages, setMessages] = useState<IdeaAgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[] | null>(null);
  const [suggestedResponses, setSuggestedResponses] = useState<SuggestedResponse[] | null>(null);
  const [showQuestionsResolver, setShowQuestionsResolver] = useState(false);

  // Agent progress tracking
  const progress = useAgentProgress();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const ideaContextRef = useRef<IdeaContext | null>(ideaContext);
  const documentRoomNameRef = useRef<string | undefined>(documentRoomName);
  const initialGreetingRef = useRef<string | undefined>(initialGreeting);
  const enabledRef = useRef(enabled);
  const modelIdRef = useRef<ModelId | undefined>(modelId);
  const workspaceIdRef = useRef<string | undefined>(workspaceId);

  // Keep refs updated
  useEffect(() => {
    ideaContextRef.current = ideaContext;
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

  // Track previous values to detect actual changes
  const prevIdeaIdRef = useRef<string | null>(null);
  const prevDocumentRoomNameRef = useRef<string | undefined>(undefined);
  // Store previous document room name for session transfer when reconnecting
  const transferFromRoomRef = useRef<string | undefined>(undefined);
  // Track if this is a session continuation (prevents history overwrite)
  const sessionContinuationRef = useRef<boolean>(false);

  useEffect(() => {
    documentRoomNameRef.current = documentRoomName;
  }, [documentRoomName]);

  // Disconnect and clear state when disabled
  useEffect(() => {
    if (!enabled) {
      log.log(' Disabled, disconnecting');
      setMessages([]);
      setError(null);
      setIsLoading(false);
      setIsEditingDocument(false);
      setTokenUsage(null);
      setOpenQuestions(null);
      setSuggestedResponses(null);
      currentMessageIdRef.current = null;

      // Reset tracking refs so next enable starts fresh
      prevIdeaIdRef.current = null;
      prevDocumentRoomNameRef.current = undefined;

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
  }, [enabled]);

  // Reset state when ideaId or documentRoomName actually changes (new session)
  useEffect(() => {
    if (!enabled) return;

    const ideaIdChanged = prevIdeaIdRef.current !== null && prevIdeaIdRef.current !== ideaId;
    const roomNameChanged = prevDocumentRoomNameRef.current !== undefined && prevDocumentRoomNameRef.current !== documentRoomName;

    // Only reset if we had a previous value and it changed
    if (ideaIdChanged || roomNameChanged) {
      // Detect if this is a session continuation (new idea room -> saved idea room)
      // In this case, we should NOT clear messages - it's the same conversation
      const wasNewIdeaRoom = prevDocumentRoomNameRef.current?.includes('idea-doc-new-');
      const isNowSavedIdeaRoom = documentRoomName && !documentRoomName.includes('idea-doc-new-');
      const isSessionContinuation = wasNewIdeaRoom && isNowSavedIdeaRoom;

      log.log(' Session changed:', {
        ideaIdChanged,
        roomNameChanged,
        prevRoom: prevDocumentRoomNameRef.current,
        newRoom: documentRoomName,
        isSessionContinuation,
      });

      // Store the previous document room name for session transfer
      // This allows the server to find the old session and transfer it
      if (prevDocumentRoomNameRef.current) {
        transferFromRoomRef.current = prevDocumentRoomNameRef.current;
        log.log(' Will transfer session from:', prevDocumentRoomNameRef.current);
      }

      // Only clear messages if switching to a DIFFERENT idea (not continuing same session)
      if (!isSessionContinuation) {
        log.log(' Clearing messages (switching to different idea)');
        setMessages([]);
        sessionContinuationRef.current = false;
      } else {
        log.log(' Preserving messages (continuing same session)');
        sessionContinuationRef.current = true;
      }

      setError(null);
      setIsLoading(false);
      setIsEditingDocument(false);
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
    prevDocumentRoomNameRef.current = documentRoomName;
  }, [enabled, ideaId, documentRoomName]);

  // Add a message
  const addMessage = useCallback((message: IdeaAgentMessage) => {
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
      toolCalls?: FunctionalUpdate<IdeaAgentToolCall[] | undefined>;
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
    // Guard: already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (!userId) return;

    // Use 'new' for new ideas that don't have an ID yet
    const effectiveIdeaId = ideaId || 'new';
    let wsUrl = `${IDEA_AGENT_WS_URL}?ideaId=${encodeURIComponent(effectiveIdeaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

    // Include document room name for Yjs coauthoring
    if (documentRoomNameRef.current) {
      wsUrl += `&documentRoomName=${encodeURIComponent(documentRoomNameRef.current)}`;
    }

    // Include previous document room name for session transfer
    // This allows the server to transfer an existing session from the temp room
    if (transferFromRoomRef.current) {
      wsUrl += `&transferFromRoom=${encodeURIComponent(transferFromRoomRef.current)}`;
      // Clear after including in URL - we only need to transfer once
      transferFromRoomRef.current = undefined;
    }

    // Include model preference
    if (modelIdRef.current) {
      wsUrl += `&modelId=${encodeURIComponent(modelIdRef.current)}`;
    }

    // Include workspace ID for broadcasting agent status
    if (workspaceIdRef.current) {
      wsUrl += `&workspaceId=${encodeURIComponent(workspaceIdRef.current)}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      log.log(' WebSocket connected');

      // Send initial idea context if available
      if (ideaContextRef.current) {
        ws.send(JSON.stringify({
          type: 'idea_update',
          idea: ideaContextRef.current,
          documentRoomName: documentRoomNameRef.current,
          initialGreeting: initialGreetingRef.current,
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reset loading state on disconnect - prevents stuck indicators
      setIsLoading(false);
      setIsEditingDocument(false);
      progress.clearProgress();
      log.log(' WebSocket disconnected');

      // Only attempt to reconnect if still enabled
      if (enabledRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (userId && enabledRef.current) {
            connect();
          }
        }, 3000);
      }
    };

    ws.onerror = (event) => {
      log.error(' WebSocket error:', event);
      setIsConnected(false);
      setError('Failed to connect to idea agent service');
      onError?.('Failed to connect to idea agent service');
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'history':
            // Load message history
            // Skip if this is a session continuation and server sends empty history
            // (the server may not have the chat history for the new chatId yet)
            if (data.messages) {
              const isEmpty = data.messages.length === 0;

              if (sessionContinuationRef.current && isEmpty) {
                log.log(' Skipping empty history (session continuation, preserving local messages)');
                // Reset the flag after handling
                sessionContinuationRef.current = false;
              } else {
                setMessages(data.messages);
                sessionContinuationRef.current = false;

                // Restore open questions from the last message that has them
                // This allows clicking "resolve N questions" link after dialog reopen
                const messageWithQuestions = [...data.messages].reverse().find(
                  (msg) => msg.openQuestions && msg.openQuestions.length > 0
                );
                if (messageWithQuestions?.openQuestions) {
                  log.log(' Restoring open questions from history:', messageWithQuestions.openQuestions.length);
                  setOpenQuestions(messageWithQuestions.openQuestions);
                }
              }
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
            // Message is complete - mark both the original message AND any continuation message as not streaming
            if (data.messageId) {
              // Mark the original message as not streaming
              updateMessage(data.messageId, { isStreaming: false });

              // Also mark any continuation message as not streaming
              // (continuation messages have IDs like "${originalId}-cont-${timestamp}")
              if (currentMessageIdRef.current && currentMessageIdRef.current !== data.messageId) {
                updateMessage(currentMessageIdRef.current, { isStreaming: false });
              }

              currentMessageIdRef.current = null;
              setIsLoading(false);
              progress.clearProgress();
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
            // Agent started editing the document
            setIsEditingDocument(true);
            log.log(' Document editing started');
            break;

          case 'document_edit_end':
            // Agent finished editing the document
            setIsEditingDocument(false);
            log.log(' Document editing finished');
            break;

          case 'token_usage':
            // Update token usage
            if (data.usage) {
              setTokenUsage(data.usage);
            }
            break;

          case 'open_questions':
            // Store open questions for user to resolve
            if (data.questions && data.questions.length > 0) {
              setOpenQuestions(data.questions);
            }
            break;

          case 'suggested_responses':
            // Store suggested responses for the user
            if (data.suggestions && data.suggestions.length > 0) {
              setSuggestedResponses(data.suggestions);
            }
            break;

          case 'agent_progress':
            // Handle agent progress event
            if (data.event) {
              progress.handleProgressEvent(data.event);

              // Also persist tool calls to the message for proper interleaving
              if (data.event.type === 'tool_start' && data.event.toolName) {
                const newToolCall: IdeaAgentToolCall = {
                  name: data.event.toolName,
                  input: {},
                  startTime: data.event.timestamp || Date.now(),
                };

                // Get or create current message
                const targetMessageId = currentMessageIdRef.current;

                if (!targetMessageId) {
                  // No current message - create one for the tool
                  const newMessageId = `msg-${Date.now()}`;
                  currentMessageIdRef.current = newMessageId;
                  addMessage({
                    id: newMessageId,
                    role: 'assistant',
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
              } else if (data.event.type === 'tool_complete' && data.event.toolName) {
                // Update the tool call with completion status
                const targetMessageId = currentMessageIdRef.current;
                if (targetMessageId) {
                  const duration = data.event.timestamp ? Date.now() - (data.event.timestamp - 1000) : undefined;
                  updateMessage(targetMessageId, {
                    toolCalls: (prev) => {
                      if (!prev) return prev;
                      // Find the matching tool and mark it complete
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
                            output: '__complete__', // Marker for completion without verbose output
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
        }
      } catch (err) {
        log.error(' Failed to parse message:', err);
      }
    };
  }, [ideaId, userId, userName, addMessage, updateMessage, onError]);

  // Connect when enabled and userId is available (ideaId can be null for new ideas)
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
      const userMessage: IdeaAgentMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      // Reset token usage and clear old suggestions for new request
      setTokenUsage(null);
      setSuggestedResponses(null);

      // Send to server with document room name for coauthoring
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
        documentRoomName: documentRoomNameRef.current,
        modelId: modelIdRef.current,
      }));
    } else {
      log.warn(' Cannot send message: WebSocket not connected');
      setError('Not connected to idea agent service');
    }
  }, [addMessage]);

  // Send message to server without displaying it in the chat (silent/background)
  // Used for initial prompts from the facilitator - we don't want to show the user's
  // prompt as a message since they already typed it in the facilitator chat
  const sendSilentMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Reset token usage and clear old suggestions for new request
      setTokenUsage(null);
      setSuggestedResponses(null);

      // Send to server without adding a local user message
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
        documentRoomName: documentRoomNameRef.current,
        modelId: modelIdRef.current,
      }));
    } else {
      log.warn(' Cannot send message: WebSocket not connected');
      setError('Not connected to idea agent service');
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setMessages([]);
      wsRef.current.send(JSON.stringify({
        type: 'clear_history',
      }));
    }
  }, []);

  // Update idea context
  const updateIdeaContext = useCallback((context: IdeaContext) => {
    ideaContextRef.current = context;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'idea_update',
        idea: context,
        documentRoomName: documentRoomNameRef.current,
      }));
    }
  }, []);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isLoading) {
      wsRef.current.send(JSON.stringify({
        type: 'cancel',
      }));

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

      setIsLoading(false);
      setIsEditingDocument(false);
    }
  }, [isLoading, updateMessage]);

  // Resolve open questions and send summary to agent
  const resolveQuestions = useCallback((result: OpenQuestionsResult) => {
    // Close the resolver overlay
    setShowQuestionsResolver(false);

    // Only send summary if completed (not dismissed)
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

      // Send as user message
      sendMessage(summary);

      // Only clear questions after completing (not dismissing)
      setOpenQuestions(null);
    }
  }, [openQuestions, sendMessage]);

  return {
    messages,
    isConnected,
    isLoading,
    isEditingDocument,
    error,
    tokenUsage,
    openQuestions,
    suggestedResponses,
    showQuestionsResolver,
    setShowQuestionsResolver,
    resolveQuestions,
    sendMessage,
    sendSilentMessage,
    addLocalMessage: addMessage,
    clearHistory,
    updateIdeaContext,
    cancelRequest,
    progress,
  };
}

export default useIdeaAgent;
