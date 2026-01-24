/**
 * Hook for managing the plan agent WebSocket connection.
 *
 * This is a thin wrapper around useAgentSocket that handles:
 * - Plan state and updates via plan_update messages
 * - Yjs coordination via sendYjsReady()
 * - Auto-start via processing_start message
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PLAN_AGENT_WS_URL } from '../config';
import type { IdeaPlan } from '../types/idea';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';
import { useAgentSocket, type BaseServerMessage } from './useAgentSocket';
import type { AgentProgressEvent } from './useAgentProgress';
import type { ModelId } from './useModelPreference';
import { createLogger } from '../utils/clientLogger';

// Re-export types from agentTypes for backwards compatibility
export type {
  AgentMessage as PlanAgentMessage,
  AgentToolCall as PlanAgentToolCall,
  AgentTextBlock as PlanAgentTextBlock,
  AgentToolCallsBlock as PlanAgentToolCallsBlock,
  AgentContentBlock as PlanAgentContentBlock,
  TokenUsage,
  ParentTopicContext,
} from './agentTypes';

// Import for internal use
import type {
  AgentMessage,
  TokenUsage,
  IdeaContext,
  ParentTopicContext,
} from './agentTypes';

const log = createLogger('PlanAgent');

/**
 * Idea context for plan agent (extends base with parentTopics)
 */
export interface PlanIdeaContext extends IdeaContext {
  /** Parent topics that provide execution context (folders, repos) with their localPath */
  parentTopics?: ParentTopicContext[];
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
  messages: AgentMessage[];
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
  /** Whether the questions resolver overlay should be shown */
  showQuestionsResolver: boolean;
  /** Set whether the questions resolver overlay should be shown */
  setShowQuestionsResolver: (show: boolean) => void;
  /** Resolve questions and send summary to agent */
  resolveQuestions: (result: OpenQuestionsResult) => void;
  /** Send a message to the agent */
  sendMessage: (content: string) => void;
  /** Add a local message (for system messages like help) */
  addLocalMessage: (message: AgentMessage) => void;
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

// Extended server message for plan-specific types
interface PlanServerMessage extends BaseServerMessage {
  plan?: Partial<IdeaPlan>;
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
  // Plan-specific state
  const [plan, setPlan] = useState<Partial<IdeaPlan> | null>(initialPlan || null);

  // Refs for URL params
  const documentRoomNameRef = useRef<string | undefined>(documentRoomName);
  const onPlanUpdateRef = useRef(onPlanUpdate);

  // Keep refs updated
  useEffect(() => {
    documentRoomNameRef.current = documentRoomName;
  }, [documentRoomName]);

  useEffect(() => {
    onPlanUpdateRef.current = onPlanUpdate;
  }, [onPlanUpdate]);

  // Sync initial plan when it changes
  useEffect(() => {
    if (enabled && initialPlan) {
      setPlan(initialPlan);
    }
  }, [enabled, initialPlan]);

  // Store setIsLoading ref to use in callback
  const setIsLoadingRef = useRef<React.Dispatch<React.SetStateAction<boolean>> | null>(null);
  const setProgressProcessingRef = useRef<((processing: boolean) => void) | null>(null);

  // Handle plan-specific message types
  const handleCustomMessage = useCallback((type: string, data: BaseServerMessage): boolean => {
    const planData = data as PlanServerMessage;

    switch (type) {
      case 'plan_update':
        // Plan update from the agent
        if (planData.plan) {
          setPlan(planData.plan);
          onPlanUpdateRef.current?.(planData.plan);
          log.log('Plan updated', { phaseCount: planData.plan.phases?.length || 0 });
        }

        return true;

      case 'processing_start':
        // Server is starting to process (auto-start after greeting)
        setIsLoadingRef.current?.(true);
        setProgressProcessingRef.current?.(true);

        return true;

      default:
        return false;
    }
  }, []);

  // Handle connection - send idea_update with context
  const handleConnected = useCallback((ws: WebSocket) => {
    if (ideaContext) {
      ws.send(JSON.stringify({
        type: 'idea_update',
        idea: ideaContext,
        documentRoomName: documentRoomNameRef.current,
      }));
    }
  }, [ideaContext]);

  // Use base hook
  const base = useAgentSocket({
    wsUrl: PLAN_AGENT_WS_URL,
    ideaId,
    userId,
    userName,
    enabled,
    modelId,
    workspaceId,
    onError,
    loggerTag: 'PlanAgent',
    extraUrlParams: {
      documentRoomName: documentRoomNameRef.current,
    },
    onCustomMessage: handleCustomMessage,
    onConnected: handleConnected,
    ideaContext: ideaContext as IdeaContext | null,
  });

  // Store refs for use in custom message handler
  useEffect(() => {
    setIsLoadingRef.current = base.setIsLoading;
    setProgressProcessingRef.current = base.progress.setProcessing;
  }, [base.setIsLoading, base.progress.setProcessing]);

  // Override updateIdeaContext to include documentRoomName
  const updateIdeaContext = useCallback((context: PlanIdeaContext) => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({
        type: 'idea_update',
        idea: context,
        documentRoomName: documentRoomNameRef.current,
      }));
    }
  }, [base.wsRef]);

  // Signal that Yjs connection is ready
  const sendYjsReady = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      log.log('Sending yjs_ready signal');
      base.wsRef.current.send(JSON.stringify({
        type: 'yjs_ready',
      }));
    }
  }, [base.wsRef]);

  return {
    messages: base.messages,
    isConnected: base.isConnected,
    isLoading: base.isLoading,
    isEditingDocument: base.isEditingDocument,
    error: base.error,
    tokenUsage: base.tokenUsage,
    plan,
    openQuestions: base.openQuestions,
    showQuestionsResolver: base.showQuestionsResolver,
    setShowQuestionsResolver: base.setShowQuestionsResolver,
    resolveQuestions: base.resolveQuestions,
    sendMessage: base.sendMessage,
    addLocalMessage: base.addMessage,
    clearHistory: base.clearHistory,
    updateIdeaContext,
    cancelRequest: base.cancelRequest,
    sendYjsReady,
    progress: {
      currentEvent: base.progress.currentEvent,
      recentEvents: base.progress.recentEvents,
      isProcessing: base.progress.isProcessing,
    },
  };
}

export default usePlanAgent;
