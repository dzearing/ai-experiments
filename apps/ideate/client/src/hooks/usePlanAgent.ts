import { useState, useEffect, useRef, useCallback } from 'react';
import { PLAN_AGENT_WS_URL } from '../config';
import type { IdeaPlan } from '../types/idea';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';
import { useAgentProgress, type AgentProgressEvent } from './useAgentProgress';
import type { ModelId } from './useModelPreference';

/**
 * Parent topic that provides execution context (e.g., a folder or git repo with localPath)
 */
export interface ParentTopicContext {
  id: string;
  name: string;
  type: string;
  /** Local file system path if this topic provides execution context */
  localPath?: string;
}

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
  /** Optional Topic context when creating a plan linked to a Topic */
  topicContext?: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
  /** Parent topics that provide execution context (folders, repos) with their localPath */
  parentTopics?: ParentTopicContext[];
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
 * Suggested response for quick user replies
 */
export interface SuggestedResponse {
  label: string;
  message: string;
}

/**
 * Server message types for the plan agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'plan_update' | 'token_usage' | 'document_edit_start' | 'document_edit_end' | 'open_questions' | 'suggested_responses' | 'processing_start' | 'agent_progress';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Agent progress event (for agent_progress) */
  event?: AgentProgressEvent;
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
  /** Open questions for user to resolve (for open_questions type) */
  questions?: OpenQuestion[];
  /** Suggested responses for quick user replies (for suggested_responses type) */
  suggestions?: SuggestedResponse[];
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
  /** Initial plan to display (loaded from server) */
  initialPlan?: IdeaPlan | null;
  /** Yjs document room name for Implementation Plan coauthoring */
  documentRoomName?: string;
  /** Called when a plan update is received */
  onPlanUpdate?: (plan: Partial<IdeaPlan>) => void;
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
 * Return value from usePlanAgent
 */
export interface UsePlanAgentReturn {
  /** Chat messages */
  messages: PlanAgentMessage[];
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the agent is currently responding */
  isLoading: boolean;
  /** Whether the agent is currently editing the Implementation Plan document */
  isEditingDocument: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Current token usage (updated during streaming) */
  tokenUsage: TokenUsage | null;
  /** Current plan data (updated when plan_update received) */
  plan: Partial<IdeaPlan> | null;
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
  /** Add a local message (for system messages like help) */
  addLocalMessage: (message: PlanAgentMessage) => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Update the idea context */
  updateIdeaContext: (context: PlanIdeaContext) => void;
  /** Cancel the current request */
  cancelRequest: () => void;
  /** Signal that the Yjs connection is ready */
  sendYjsReady: () => void;
  /** Progress tracking for showing agent activity */
  progress: {
    currentEvent: AgentProgressEvent | null;
    recentEvents: AgentProgressEvent[];
    isProcessing: boolean;
  };
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
  initialPlan,
  documentRoomName,
  onPlanUpdate,
  onError,
  enabled = true,
  modelId,
  workspaceId,
}: UsePlanAgentOptions): UsePlanAgentReturn {
  const [messages, setMessages] = useState<PlanAgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [plan, setPlan] = useState<Partial<IdeaPlan> | null>(initialPlan || null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[] | null>(null);
  const [suggestedResponses, setSuggestedResponses] = useState<SuggestedResponse[] | null>(null);
  const [showQuestionsResolver, setShowQuestionsResolver] = useState(false);

  // Shared progress tracking
  const progress = useAgentProgress();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const ideaContextRef = useRef<PlanIdeaContext | null>(ideaContext);
  const documentRoomNameRef = useRef<string | undefined>(documentRoomName);
  const enabledRef = useRef(enabled);
  const modelIdRef = useRef<ModelId | undefined>(modelId);
  const workspaceIdRef = useRef<string | undefined>(workspaceId);

  // Keep refs updated
  useEffect(() => {
    ideaContextRef.current = ideaContext;
  }, [ideaContext]);

  useEffect(() => {
    documentRoomNameRef.current = documentRoomName;
  }, [documentRoomName]);

  // Sync initialPlan to state when enabled or when initialPlan changes
  // This handles the case where the component is re-enabled with a saved plan
  useEffect(() => {
    if (enabled && initialPlan && initialPlan.phases && initialPlan.phases.length > 0) {
      console.log('[PlanAgent] Syncing initialPlan to state:', initialPlan.phases.length, 'phases');
      setPlan(initialPlan);
    }
  }, [enabled, initialPlan]);

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
      console.log('[PlanAgent] Disabled, disconnecting');
      setMessages([]);
      setError(null);
      setIsLoading(false);
      setIsEditingDocument(false);
      setPlan(null);
      setTokenUsage(null);
      setOpenQuestions(null);
      setShowQuestionsResolver(false);
      currentMessageIdRef.current = null;

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

  // Track previous values to detect actual changes
  const prevIdeaIdRef = useRef<string | null>(null);

  // Reset state when ideaId actually changes (new session)
  useEffect(() => {
    if (!enabled) return;

    const ideaIdChanged = prevIdeaIdRef.current !== null && prevIdeaIdRef.current !== ideaId;

    // Only reset if we had a previous value and it changed
    if (ideaIdChanged) {
      console.log('[PlanAgent] Session changed, resetting state');
      setMessages([]);
      setError(null);
      setIsLoading(false);
      setIsEditingDocument(false);
      // Use initialPlan for the new idea, or null if none
      setPlan(initialPlan || null);
      setTokenUsage(null);
      setOpenQuestions(null);
      setSuggestedResponses(null);
      setShowQuestionsResolver(false);
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
  }, [enabled, ideaId]);

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

    let wsUrl = `${PLAN_AGENT_WS_URL}?ideaId=${encodeURIComponent(ideaId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

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
      console.log('[PlanAgent] WebSocket connected');

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
      // Reset loading state on disconnect - prevents stuck indicators
      setIsLoading(false);
      setIsEditingDocument(false);
      progress.clearProgress();
      console.log('[PlanAgent] WebSocket disconnected');

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
              setIsEditingDocument(false);
              progress.clearProgress();
            }
            break;

          case 'token_usage':
            // Update token usage
            if (data.usage) {
              setTokenUsage(data.usage);
            }
            break;

          case 'document_edit_start':
            // Agent started editing the Implementation Plan document
            setIsEditingDocument(true);
            console.log('[PlanAgent] Document editing started');
            break;

          case 'document_edit_end':
            // Agent finished editing the Implementation Plan document
            setIsEditingDocument(false);
            console.log('[PlanAgent] Document editing finished');
            break;

          case 'open_questions':
            // Store open questions for user to resolve
            if (data.questions && data.questions.length > 0) {
              setOpenQuestions(data.questions);
            }
            break;

          case 'suggested_responses':
            // Store suggested responses for quick user replies
            if (data.suggestions && data.suggestions.length > 0) {
              setSuggestedResponses(data.suggestions);
            }
            break;

          case 'processing_start':
            // Server is starting to process (e.g., auto-start after greeting)
            // Set loading state so the UI shows the thinking indicator
            setIsLoading(true);
            progress.setProcessing(true);
            break;

          case 'agent_progress':
            // Progress event from agent (status updates, tool progress)
            if (data.event) {
              progress.handleProgressEvent(data.event);
            }
            break;
        }
      } catch (err) {
        console.error('[PlanAgent] Failed to parse message:', err);
      }
    };
  }, [ideaId, userId, userName, addMessage, updateMessage, onError, onPlanUpdate]);

  // Connect when enabled and userId and ideaId are available
  useEffect(() => {
    if (enabled && userId && ideaId && !isConnected) {
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

  // Send message to server
  const sendMessage = useCallback((content: string) => {
    console.log('[PlanAgent] sendMessage called:', {
      contentLength: content?.length,
      contentPreview: content?.slice(0, 100),
      wsReadyState: wsRef.current?.readyState,
      wsOpen: wsRef.current?.readyState === WebSocket.OPEN,
    });

    if (!content.trim()) {
      console.log('[PlanAgent] sendMessage aborted: empty content');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Add user message locally first
      const userMessage: PlanAgentMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      console.log('[PlanAgent] Adding user message locally:', userMessage.id);
      addMessage(userMessage);

      // Reset token usage and suggestions for new request
      setTokenUsage(null);
      setSuggestedResponses(null);

      // Send to server
      setIsLoading(true);
      console.log('[PlanAgent] Sending message to server');
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        idea: ideaContextRef.current,
        documentRoomName: documentRoomNameRef.current,
        modelId: modelIdRef.current,
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

  // Signal that the Yjs connection is ready
  const sendYjsReady = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[PlanAgent] Sending yjs_ready signal');
      wsRef.current.send(JSON.stringify({
        type: 'yjs_ready',
      }));
    }
  }, []);

  // Resolve open questions and send summary to agent
  const resolveQuestions = useCallback((result: OpenQuestionsResult) => {
    console.log('[PlanAgent] resolveQuestions called:', {
      completed: result.completed,
      dismissed: result.dismissed,
      answersCount: result.answers.length,
      openQuestionsAvailable: !!openQuestions,
      openQuestionsCount: openQuestions?.length,
      wsConnected: wsRef.current?.readyState === WebSocket.OPEN,
    });

    // Close the resolver overlay
    setShowQuestionsResolver(false);

    // Only send summary if completed (not dismissed)
    if (result.completed && openQuestions) {
      // Build human-readable summary
      const summaryLines = ['Here are my answers to the open questions:'];

      for (const answer of result.answers) {
        const question = openQuestions.find(q => q.id === answer.questionId);
        if (!question) {
          console.log('[PlanAgent] Question not found for answer:', answer.questionId);
          continue;
        }

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
      console.log('[PlanAgent] Sending resolved questions summary:', summary);

      // Send as user message
      sendMessage(summary);

      // Only clear questions after completing (not dismissing)
      setOpenQuestions(null);
    } else {
      console.log('[PlanAgent] Not sending summary - completed:', result.completed, 'openQuestions:', !!openQuestions);
    }
  }, [openQuestions, sendMessage]);

  return {
    messages,
    isConnected,
    isLoading,
    isEditingDocument,
    error,
    tokenUsage,
    plan,
    openQuestions,
    suggestedResponses,
    showQuestionsResolver,
    setShowQuestionsResolver,
    resolveQuestions,
    sendMessage,
    addLocalMessage: addMessage,
    clearHistory,
    updateIdeaContext,
    cancelRequest,
    sendYjsReady,
    progress: {
      currentEvent: progress.currentEvent,
      recentEvents: progress.recentEvents,
      isProcessing: progress.isProcessing,
    },
  };
}

export default usePlanAgent;
