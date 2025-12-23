import { useEffect, useRef, useCallback } from 'react';
import { FACILITATOR_WS_URL } from '../config';
import { useFacilitator, type FacilitatorMessage } from '../contexts/FacilitatorContext';

/**
 * Server message types for the facilitator WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'tool_use' | 'tool_result' | 'message_complete' | 'history' | 'error';
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
  /** Complete message object (for history/message_complete) */
  message?: FacilitatorMessage;
  /** Array of messages (for history) */
  messages?: FacilitatorMessage[];
  /** Error message */
  error?: string;
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
  sendMessage: (content: string) => void;
  /** Clear chat history on the server */
  clearHistory: () => void;
  /** Cancel the current AI operation */
  cancelOperation: () => void;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
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

  const {
    isOpen,
    connectionState,
    setConnectionState,
    setIsLoading,
    setError,
    setMessages,
    addMessage,
    updateMessage,
  } = useFacilitator();

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
                updateMessage(data.messageId, {
                  content: (prev: string) => prev + data.text,
                } as any); // Type hack for callback-based update
              }
            }
            break;

          case 'tool_use':
            // Tool is being invoked
            if (currentMessageIdRef.current && data.toolName) {
              updateMessage(currentMessageIdRef.current, {
                toolCalls: (prev: FacilitatorMessage['toolCalls']) => [
                  ...(prev || []),
                  { name: data.toolName!, input: data.toolInput || {} },
                ],
              } as any);
            }
            break;

          case 'tool_result':
            // Tool finished executing
            if (currentMessageIdRef.current && data.toolName) {
              updateMessage(currentMessageIdRef.current, {
                toolCalls: (prev: FacilitatorMessage['toolCalls']) =>
                  prev?.map((tc) =>
                    tc.name === data.toolName ? { ...tc, output: data.toolOutput } : tc
                  ),
              } as any);
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
        }
      } catch (error) {
        console.error('[Facilitator] Failed to parse message:', error);
      }
    };
  }, [userId, userName, isOpen, setConnectionState, setError, setMessages, addMessage, updateMessage, setIsLoading, onError]);

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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
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
          content: (prev: string) => prev + '\n\n*[Thinking stopped]*',
        } as any);
        currentMessageIdRef.current = null;
      }

      setIsLoading(false);
    } else {
      console.warn('[Facilitator] Cannot cancel: WebSocket not connected');
    }
  }, [updateMessage, setIsLoading]);

  return {
    sendMessage,
    clearHistory,
    cancelOperation,
    isConnected: connectionState === 'connected',
  };
}

export default useFacilitatorSocket;
