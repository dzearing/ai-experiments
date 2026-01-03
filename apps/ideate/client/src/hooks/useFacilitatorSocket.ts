import { useEffect, useRef, useCallback } from 'react';
import { FACILITATOR_WS_URL } from '../config';
import { useFacilitator, type FacilitatorMessage, type NavigationContext, type MessagePart, type ToolCall } from '../contexts/FacilitatorContext';
import type { OpenQuestion } from '@ui-kit/react-chat';
import { useAgentProgress, type AgentProgressEvent } from './useAgentProgress';

/**
 * Server-side message format (from FacilitatorChatService)
 */
interface ServerFacilitatorMessage {
  id: string;
  userId?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

/**
 * Migrate old message format (content/toolCalls) to new parts format.
 * Handles server-side messages that have content/toolCalls instead of parts.
 */
function migrateMessage(msg: ServerFacilitatorMessage | FacilitatorMessage): FacilitatorMessage {
  // Type guard: check if message already has valid parts array
  const hasValidParts = 'parts' in msg && Array.isArray(msg.parts) && msg.parts.length > 0;

  if (hasValidParts) {
    return msg as FacilitatorMessage;
  }

  // Convert old format (content/toolCalls) to new format (parts)
  const parts: MessagePart[] = [];

  // Get content from either format
  const content = 'content' in msg ? msg.content : undefined;
  const toolCalls = 'toolCalls' in msg ? msg.toolCalls : undefined;

  if (content && typeof content === 'string') {
    parts.push({ type: 'text', text: content });
  }

  if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
    parts.push({ type: 'tool_calls', calls: toolCalls });
  }

  // If no content and no tools, add empty text part
  if (parts.length === 0) {
    parts.push({ type: 'text', text: '' });
  }

  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    parts,
    timestamp: msg.timestamp,
    isStreaming: 'isStreaming' in msg ? msg.isStreaming : undefined,
  };
}

/**
 * Server message types for the facilitator WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'tool_use' | 'tool_result' | 'message_complete' | 'history' | 'error' | 'persona_changed' | 'greeting' | 'loading' | 'open_questions' | 'agent_progress';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Tool name (for tool_use/tool_result) */
  toolName?: string;
  /** Tool input (for tool_use) */
  toolInput?: Record<string, unknown>;
  /** Tool output (for tool_result) */
  toolOutput?: string;
  /** Timestamp when tool started (for tool_use timing display) */
  startTime?: number;
  /** Complete message object (for history/message_complete) */
  message?: ServerFacilitatorMessage | FacilitatorMessage;
  /** Array of messages (for history) - server sends old format with content/toolCalls */
  messages?: ServerFacilitatorMessage[];
  /** Error message */
  error?: string;
  /** Persona name (for persona_changed) */
  personaName?: string;
  /** Loading state (for loading) */
  isLoading?: boolean;
  /** Open questions for user to answer (for open_questions) */
  questions?: OpenQuestion[];
  /** Agent progress event */
  event?: AgentProgressEvent;
}

/**
 * Options for useFacilitatorSocket
 */
export interface UseFacilitatorSocketOptions {
  /** User ID for authentication */
  userId: string;
  /** User name for display */
  userName: string;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Return value from useFacilitatorSocket
 */
export interface UseFacilitatorSocketReturn {
  /** Send a message to the facilitator */
  sendMessage: (content: string, thingIds?: string[]) => void;
  /** Clear chat history on the server */
  clearHistory: () => void;
  /** Cancel the current AI operation */
  cancelOperation: () => void;
  /** Change the facilitator persona */
  changePersona: (presetId: string) => void;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Agent progress state */
  progress: ReturnType<typeof useAgentProgress>;
}

/**
 * Hook for managing the facilitator WebSocket connection.
 * Connects to the server when the facilitator overlay is open.
 * Handles streaming responses and tool calls.
 */
export function useFacilitatorSocket({
  userId,
  userName,
  onError,
}: UseFacilitatorSocketOptions): UseFacilitatorSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // Agent progress tracking
  const progress = useAgentProgress();

  const {
    isOpen,
    connectionState,
    setConnectionState,
    setIsLoading,
    setError,
    setMessages,
    addMessage,
    updateMessage,
    close,
    navigationContext,
    pendingPersonaChange,
    clearPendingPersonaChange,
    setOpenQuestions,
    setShowQuestionsResolver,
  } = useFacilitator();

  // Track navigation context changes to send updates to server
  const navigationContextRef = useRef<NavigationContext>(navigationContext);

  // Handle navigation actions from tool results
  const handleNavigationAction = useCallback((actionData: { __action: string; [key: string]: unknown }) => {
    switch (actionData.__action) {
      case 'navigate':
        if (actionData.target === 'thing' && actionData.thingId) {
          const currentPath = window.location.pathname;
          const thingId = actionData.thingId as string;

          // If we're already on the Things page and the Thing is already selected, skip
          if (currentPath.includes('/things') && currentPath.includes(thingId)) {
            console.log('[Facilitator] Already on Things page with this Thing selected, skipping navigate');
            return;
          }

          // If we're on the Things page (but different Thing), dispatch event to select it
          if (currentPath.includes('/things')) {
            console.log('[Facilitator] On Things page, dispatching event to select Thing');
            window.dispatchEvent(new CustomEvent('facilitator:navigateToThing', {
              detail: { thingId }
            }));
            return;
          }

          // Not on Things page - need to navigate there
          // Extract workspace ID from current path if present (e.g., /workspace/123/ideas)
          const workspaceMatch = currentPath.match(/\/workspace\/([^/]+)/);
          const workspaceId = workspaceMatch ? workspaceMatch[1] : null;

          // Build the target URL
          const targetUrl = workspaceId
            ? `/workspace/${workspaceId}/things/${thingId}`
            : `/things/${thingId}`;

          console.log('[Facilitator] Navigating to Things page:', targetUrl);

          // Use History API to navigate without full page reload
          // The facilitator:navigateToThing event will be picked up by Things page when it mounts
          window.history.pushState(null, '', targetUrl);
          // Dispatch popstate to trigger router update
          window.dispatchEvent(new PopStateEvent('popstate'));
          // Also dispatch the event for when Things page mounts
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('facilitator:navigateToThing', {
              detail: { thingId }
            }));
          }, 100);
        }
        break;

      case 'open_idea_workspace':
        // Dispatch event for Ideas page / ThingDetail to handle
        window.dispatchEvent(new CustomEvent('facilitator:openIdea', {
          detail: {
            ideaId: actionData.ideaId,
            thingId: actionData.thingId,
            initialPrompt: actionData.initialPrompt,
            initialGreeting: actionData.initialGreeting,
            focusInput: actionData.focusInput ?? true,
          }
        }));
        if (actionData.closeFacilitator !== false) {
          close();
        }
        break;

      case 'close_facilitator':
        close();
        break;
    }
  }, [close]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!userId) return;

    setConnectionState('connecting');

    const wsUrl = `${FACILITATOR_WS_URL}?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      setError(null);
      console.log('[Facilitator] WebSocket connected');
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      // Reset loading state on disconnect - prevents stuck indicators
      setIsLoading(false);
      progress.clearProgress();
      console.log('[Facilitator] WebSocket disconnected');

      // Attempt to reconnect after 3 seconds if overlay is still open
      if (isOpen) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (event) => {
      console.error('[Facilitator] WebSocket error:', event);
      setConnectionState('error');
      setError('Failed to connect to facilitator service');
      onError?.('Failed to connect to facilitator service');
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'history':
            // Load message history - migrate old format to new parts format
            if (data.messages) {
              setMessages(data.messages.map(migrateMessage));
            }
            break;

          case 'text_chunk':
            // Streaming text chunk
            if (data.messageId && data.text) {
              // If this is a new message, create it
              if (currentMessageIdRef.current !== data.messageId) {
                // Mark previous message as complete if exists
                if (currentMessageIdRef.current) {
                  updateMessage(currentMessageIdRef.current, {
                    isStreaming: false,
                  });
                }
                currentMessageIdRef.current = data.messageId;
                addMessage({
                  id: data.messageId,
                  role: 'assistant',
                  parts: [{ type: 'text', text: data.text }],
                  timestamp: Date.now(),
                  isStreaming: true,
                });
              } else {
                // Append to existing message - check if last part is text
                updateMessage(data.messageId, {
                  parts: (prev: MessagePart[]) => {
                    const lastPart = prev[prev.length - 1];
                    if (lastPart?.type === 'text') {
                      // Append to existing text part
                      return [
                        ...prev.slice(0, -1),
                        { type: 'text' as const, text: lastPart.text + data.text },
                      ];
                    } else {
                      // Add new text part (text after tools)
                      return [...prev, { type: 'text' as const, text: data.text! }];
                    }
                  },
                });
              }
            }
            break;

          case 'tool_use':
            // Tool is being invoked - use messageId from server
            if (data.messageId && data.toolName) {
              const newToolCall: ToolCall = {
                name: data.toolName,
                input: data.toolInput || {},
                startTime: data.startTime,
              };

              // If this message doesn't exist yet, create it (tool may arrive before text)
              if (currentMessageIdRef.current !== data.messageId) {
                if (currentMessageIdRef.current) {
                  updateMessage(currentMessageIdRef.current, { isStreaming: false });
                }
                currentMessageIdRef.current = data.messageId;
                addMessage({
                  id: data.messageId,
                  role: 'assistant',
                  parts: [{ type: 'tool_calls', calls: [newToolCall] }],
                  timestamp: Date.now(),
                  isStreaming: true,
                });
              } else {
                // Add to existing message - check if last part is tool_calls
                updateMessage(data.messageId, {
                  parts: (prev: MessagePart[]) => {
                    const lastPart = prev[prev.length - 1];
                    if (lastPart?.type === 'tool_calls') {
                      // Add to existing tool_calls part
                      return [
                        ...prev.slice(0, -1),
                        { type: 'tool_calls' as const, calls: [...lastPart.calls, newToolCall] },
                      ];
                    } else {
                      // Add new tool_calls part
                      return [...prev, { type: 'tool_calls' as const, calls: [newToolCall] }];
                    }
                  },
                });
              }
            }
            break;

          case 'tool_result':
            // Tool finished executing - find and update the tool call
            if (data.messageId && data.toolName) {
              updateMessage(data.messageId, {
                parts: (prev: MessagePart[]) =>
                  prev.map((part) => {
                    if (part.type !== 'tool_calls') return part;
                    return {
                      ...part,
                      calls: part.calls.map((tc) =>
                        tc.name === data.toolName && !tc.output
                          ? { ...tc, output: data.toolOutput }
                          : tc
                      ),
                    };
                  }),
              });

              // Check for navigation actions in tool output
              if (data.toolOutput) {
                try {
                  const outputData = JSON.parse(data.toolOutput);
                  if (outputData.__action) {
                    handleNavigationAction(outputData);
                  }

                  // When thing_create succeeds, dispatch event with the created Thing data
                  // This ensures the Thing appears in the UI immediately (confirmed update from server)
                  console.log('[Facilitator] Tool result parsed:', data.toolName, 'has thing:', !!outputData.thing, outputData);
                  if (data.toolName.includes('thing_create') && outputData.thing) {
                    console.log('[Facilitator] Dispatching facilitator:thingCreated event with:', outputData.thing);
                    window.dispatchEvent(new CustomEvent('facilitator:thingCreated', {
                      detail: { thing: outputData.thing }
                    }));
                  }
                } catch {
                  // Not JSON or no action - ignore
                }
              }
            }
            break;

          case 'message_complete':
            // Message is complete
            if (data.messageId) {
              updateMessage(data.messageId, {
                isStreaming: false,
              });
              currentMessageIdRef.current = null;
              setIsLoading(false);
              progress.clearProgress();
            }
            break;

          case 'error':
            // Error from server
            if (data.error) {
              setError(data.error);
              onError?.(data.error);
              setIsLoading(false);
              progress.clearProgress();
            }
            break;

          case 'persona_changed':
            // Persona has been changed - clear all messages to prepare for new greeting
            setMessages([]);
            console.log('[Facilitator] Persona changed to:', data.personaName);
            break;

          case 'greeting':
            // Greeting message from new persona
            if (data.messageId && data.text) {
              addMessage({
                id: data.messageId,
                role: 'assistant',
                parts: [{ type: 'text', text: data.text }],
                timestamp: Date.now(),
                isStreaming: false,
              });
              console.log('[Facilitator] Greeting received from:', data.personaName);
            }
            break;

          case 'loading':
            // Loading state update (e.g., generating greeting)
            setIsLoading(data.isLoading ?? false);
            console.log('[Facilitator] Loading state:', data.isLoading);
            break;

          case 'open_questions':
            // Open questions for user to resolve
            if (data.questions && data.questions.length > 0) {
              setOpenQuestions(data.questions);
              setShowQuestionsResolver(true);
              console.log('[Facilitator] Received open questions:', data.questions.length);
            }
            break;

          case 'agent_progress':
            // Handle agent progress event
            if (data.event) {
              progress.handleProgressEvent(data.event);
            }
            break;
        }
      } catch (error) {
        console.error('[Facilitator] Failed to parse message:', error);
      }
    };
  }, [userId, userName, isOpen, setConnectionState, setError, setMessages, addMessage, updateMessage, setIsLoading, onError, setOpenQuestions, setShowQuestionsResolver]);

  // Connect when overlay opens, disconnect when it closes
  useEffect(() => {
    if (isOpen && connectionState === 'disconnected') {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isOpen, connectionState, connect]);

  // Send context updates to server when navigation context changes
  useEffect(() => {
    navigationContextRef.current = navigationContext;

    // Send context update if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'context_update',
        context: navigationContext,
      }));
      console.log('[Facilitator] Sent context update:', navigationContext);
    }
  }, [navigationContext]);

  // Process pending persona changes when connected
  useEffect(() => {
    if (pendingPersonaChange && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Facilitator] Processing pending persona change:', pendingPersonaChange);
      wsRef.current.send(JSON.stringify({
        type: 'persona_change',
        presetId: pendingPersonaChange,
      }));
      clearPendingPersonaChange();
    }
  }, [pendingPersonaChange, clearPendingPersonaChange, connectionState]);

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
  const sendMessage = useCallback((content: string, thingIds?: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      // Include Thing IDs in context as referencedThingIds
      const contextWithThings = {
        ...navigationContextRef.current,
        ...(thingIds && thingIds.length > 0 ? { referencedThingIds: thingIds } : {}),
      };
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        context: contextWithThings,
      }));
    } else {
      console.warn('[Facilitator] Cannot send message: WebSocket not connected');
      setError('Not connected to facilitator service');
    }
  }, [setIsLoading, setError]);

  // Clear history on server
  const clearHistory = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'clear_history',
      }));
      console.log('[Facilitator] Sent clear_history request');
    } else {
      console.warn('[Facilitator] Cannot clear history: WebSocket not connected');
    }
  }, []);

  // Cancel the current AI operation
  const cancelOperation = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cancel',
      }));
      console.log('[Facilitator] Sent cancel request');

      // Mark the current message as complete (if streaming)
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, {
          isStreaming: false,
        });
        currentMessageIdRef.current = null;
      }

      setIsLoading(false);
    } else {
      console.warn('[Facilitator] Cannot cancel: WebSocket not connected');
    }
  }, [updateMessage, setIsLoading]);

  // Change the facilitator persona
  const changePersona = useCallback((presetId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Cancel any current operation
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, {
          isStreaming: false,
        });
        currentMessageIdRef.current = null;
      }

      wsRef.current.send(JSON.stringify({
        type: 'persona_change',
        presetId,
      }));
      console.log('[Facilitator] Sent persona_change request:', presetId);
    } else {
      console.warn('[Facilitator] Cannot change persona: WebSocket not connected');
    }
  }, [updateMessage]);

  return {
    sendMessage,
    clearHistory,
    cancelOperation,
    changePersona,
    isConnected: connectionState === 'connected',
    progress,
  };
}

export default useFacilitatorSocket;
