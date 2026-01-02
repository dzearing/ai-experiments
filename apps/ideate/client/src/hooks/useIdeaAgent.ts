import { useState, useEffect, useRef, useCallback } from 'react';
import { IDEA_AGENT_WS_URL } from '../config';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';

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
  /** Optional Thing context when creating an idea linked to a Thing */
  thingContext?: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
}

/**
 * Message in the idea agent chat
 */
export interface IdeaAgentMessage {
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
 * Server message types for the idea agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'document_edit_start' | 'document_edit_end' | 'token_usage' | 'open_questions';
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
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Whether the agent is enabled (controls WebSocket connection) */
  enabled?: boolean;
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
  /** Whether the questions resolver overlay should be shown */
  showQuestionsResolver: boolean;
  /** Set whether the questions resolver overlay should be shown */
  setShowQuestionsResolver: (show: boolean) => void;
  /** Resolve questions and send summary to agent */
  resolveQuestions: (result: OpenQuestionsResult) => void;
  /** Send a message to the agent */
  sendMessage: (content: string) => void;
  /** Add a local message (for system messages like help) */
  addLocalMessage: (message: IdeaAgentMessage) => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Update the idea context */
  updateIdeaContext: (context: IdeaContext) => void;
  /** Cancel the current request */
  cancelRequest: () => void;
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
  onError,
  enabled = true,
}: UseIdeaAgentOptions): UseIdeaAgentReturn {
  const [messages, setMessages] = useState<IdeaAgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[] | null>(null);
  const [showQuestionsResolver, setShowQuestionsResolver] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const ideaContextRef = useRef<IdeaContext | null>(ideaContext);
  const documentRoomNameRef = useRef<string | undefined>(documentRoomName);
  const enabledRef = useRef(enabled);

  // Keep refs updated
  useEffect(() => {
    ideaContextRef.current = ideaContext;
  }, [ideaContext]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Track previous values to detect actual changes
  const prevIdeaIdRef = useRef<string | null>(null);
  const prevDocumentRoomNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    documentRoomNameRef.current = documentRoomName;
  }, [documentRoomName]);

  // Disconnect and clear state when disabled
  useEffect(() => {
    if (!enabled) {
      console.log('[IdeaAgent] Disabled, disconnecting');
      setMessages([]);
      setError(null);
      setIsLoading(false);
      setIsEditingDocument(false);
      setTokenUsage(null);
      setOpenQuestions(null);
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
      console.log('[IdeaAgent] Session changed, resetting state');
      setMessages([]);
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

  // Update a message (for streaming)
  const updateMessage = useCallback((id: string, updates: Partial<IdeaAgentMessage> | ((prev: string) => string)) => {
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
    if (!userId) return;

    // Use 'new' for new ideas that don't have an ID yet
    const effectiveIdeaId = ideaId || 'new';
    let wsUrl = `${IDEA_AGENT_WS_URL}?ideaId=${encodeURIComponent(effectiveIdeaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

    // Include document room name for Yjs coauthoring
    if (documentRoomNameRef.current) {
      wsUrl += `&documentRoomName=${encodeURIComponent(documentRoomNameRef.current)}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('[IdeaAgent] WebSocket connected');

      // Send initial idea context if available
      if (ideaContextRef.current) {
        ws.send(JSON.stringify({
          type: 'idea_update',
          idea: ideaContextRef.current,
          documentRoomName: documentRoomNameRef.current,
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[IdeaAgent] WebSocket disconnected');

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
      console.error('[IdeaAgent] WebSocket error:', event);
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

          case 'error':
            // Error from server
            if (data.error) {
              setError(data.error);
              onError?.(data.error);
              setIsLoading(false);
              setIsEditingDocument(false);
            }
            break;

          case 'document_edit_start':
            // Agent started editing the document
            setIsEditingDocument(true);
            console.log('[IdeaAgent] Document editing started');
            break;

          case 'document_edit_end':
            // Agent finished editing the document
            setIsEditingDocument(false);
            console.log('[IdeaAgent] Document editing finished');
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
        }
      } catch (err) {
        console.error('[IdeaAgent] Failed to parse message:', err);
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

      // Reset token usage for new request
      setTokenUsage(null);

      // Send to server with document room name for coauthoring
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
        documentRoomName: documentRoomNameRef.current,
      }));
    } else {
      console.warn('[IdeaAgent] Cannot send message: WebSocket not connected');
      setError('Not connected to idea agent service');
    }
  }, [addMessage]);

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

      // Mark any streaming message as complete
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, { isStreaming: false });
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
    showQuestionsResolver,
    setShowQuestionsResolver,
    resolveQuestions,
    sendMessage,
    addLocalMessage: addMessage,
    clearHistory,
    updateIdeaContext,
    cancelRequest,
  };
}

export default useIdeaAgent;
