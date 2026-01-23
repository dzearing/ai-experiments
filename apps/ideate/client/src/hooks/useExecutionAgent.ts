/**
 * Hook for managing the execution agent WebSocket connection.
 *
 * This is a wrapper around useAgentSocket that handles:
 * - Execution flow control (start/pause/resume/cancel)
 * - Execution state (isExecuting, isPaused, isBlocked)
 * - Execution events (task_complete, phase_complete, blocked, new_idea, task_update)
 * - Pending execution queue for handling race conditions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { EXECUTION_AGENT_WS_URL } from '../config';
import type { IdeaPlan } from '../types/idea';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';
import { useAgentSocket, type BaseServerMessage } from './useAgentSocket';
import type { AgentProgressState } from './useAgentProgress';
import { createLogger } from '../utils/clientLogger';

// Re-export types from agentTypes for backwards compatibility
export type {
  ExecutionAgentMessage as ExecutionMessage,
  AgentToolCall as ExecutionToolCall,
  AgentTextBlock as ExecutionTextBlock,
  AgentToolCallsBlock as ExecutionToolCallsBlock,
  AgentContentBlock as ExecutionContentBlock,
  TokenUsage,
  ExecutionSessionState,
  TaskUpdateEvent,
  TaskCompleteEvent,
  PhaseCompleteEvent,
  ExecutionBlockedEvent,
  NewIdeaEvent,
} from './agentTypes';

// Import for internal use
import type {
  ExecutionAgentMessage,
  TokenUsage,
  ExecutionSessionState,
  TaskUpdateEvent,
  TaskCompleteEvent,
  PhaseCompleteEvent,
  ExecutionBlockedEvent,
  NewIdeaEvent,
} from './agentTypes';

const log = createLogger('ExecutionAgent');

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
 * Extended server message for execution-specific types
 */
interface ExecutionServerMessage extends BaseServerMessage {
  /** Session state for reconnection */
  session?: ExecutionSessionState;
  /** Whether there's an active execution */
  hasActiveExecution?: boolean;
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
  messages: ExecutionAgentMessage[];
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the agent is currently responding (alias for isExecuting) */
  isLoading: boolean;
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
  /** Open questions from the agent (null if none) */
  openQuestions: OpenQuestion[] | null;
  /** Whether the questions resolver overlay should be shown */
  showQuestionsResolver: boolean;
  /** Set whether the questions resolver overlay should be shown */
  setShowQuestionsResolver: (show: boolean) => void;
  /** Resolve questions and send summary to agent */
  resolveQuestions: (result: OpenQuestionsResult) => void;
  /** Agent progress state for ThinkingIndicator */
  progress: AgentProgressState;
  /** Start executing a phase */
  startExecution: (ideaContext: ExecutionIdeaContext, plan: IdeaPlan, phaseId: string, pauseBetweenPhases?: boolean) => void;
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
  addLocalMessage: (message: ExecutionAgentMessage) => void;
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
  // Execution-specific state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedEvent, setBlockedEvent] = useState<ExecutionBlockedEvent | null>(null);
  const [sessionState, setSessionState] = useState<ExecutionSessionState | null>(null);

  // Refs for execution state
  const ideaContextRef = useRef<ExecutionIdeaContext | null>(initialIdeaContext || null);
  const planRef = useRef<IdeaPlan | null>(initialPlan || null);

  // Track pending execution to handle race condition when startExecution is called before WS connects
  const pendingExecutionRef = useRef<{
    ideaContext: ExecutionIdeaContext;
    plan: IdeaPlan;
    phaseId: string;
    pauseBetweenPhases: boolean;
  } | null>(null);

  // Refs for callbacks
  const onTaskCompleteRef = useRef(onTaskComplete);
  const onPhaseCompleteRef = useRef(onPhaseComplete);
  const onExecutionBlockedRef = useRef(onExecutionBlocked);
  const onNewIdeaRef = useRef(onNewIdea);
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const onExecutionCompleteRef = useRef(onExecutionComplete);

  // Keep refs updated
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

  useEffect(() => {
    onTaskCompleteRef.current = onTaskComplete;
  }, [onTaskComplete]);

  useEffect(() => {
    onPhaseCompleteRef.current = onPhaseComplete;
  }, [onPhaseComplete]);

  useEffect(() => {
    onExecutionBlockedRef.current = onExecutionBlocked;
  }, [onExecutionBlocked]);

  useEffect(() => {
    onNewIdeaRef.current = onNewIdea;
  }, [onNewIdea]);

  useEffect(() => {
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onTaskUpdate]);

  useEffect(() => {
    onExecutionCompleteRef.current = onExecutionComplete;
  }, [onExecutionComplete]);

  // Handle execution-specific message types
  const handleCustomMessage = useCallback((type: string, data: BaseServerMessage): boolean => {
    const execData = data as ExecutionServerMessage;

    switch (type) {
      case 'connected':
        // Connection acknowledgment with session state
        if (execData.session) {
          setSessionState(execData.session);
          setIsExecuting(execData.session.status === 'running');
          setIsBlocked(execData.session.status === 'blocked');
        }
        log.log('Connected', { hasActiveExecution: execData.hasActiveExecution });

        return true;

      case 'session_state':
        // Session state update
        if (execData.session) {
          setSessionState(execData.session);
          setIsExecuting(execData.session.status === 'running');
          setIsBlocked(execData.session.status === 'blocked');
        }

        return true;

      case 'task_complete':
        if (execData.taskComplete) {
          onTaskCompleteRef.current?.(execData.taskComplete);
        }

        return true;

      case 'phase_complete':
        if (execData.phaseComplete) {
          onPhaseCompleteRef.current?.(execData.phaseComplete);
        }

        return true;

      case 'execution_blocked':
        if (execData.executionBlocked) {
          setIsBlocked(true);
          setBlockedEvent(execData.executionBlocked);
          onExecutionBlockedRef.current?.(execData.executionBlocked);
        }

        return true;

      case 'new_idea':
        if (execData.newIdea) {
          onNewIdeaRef.current?.(execData.newIdea);
        }

        return true;

      case 'task_update':
        if (execData.taskUpdate) {
          onTaskUpdateRef.current?.(execData.taskUpdate);
        }

        return true;

      case 'execution_complete':
        setIsExecuting(false);
        setIsBlocked(false);
        setBlockedEvent(null);
        setSessionState(prev => prev ? { ...prev, status: 'completed' } : { status: 'completed' });
        onExecutionCompleteRef.current?.();

        return true;

      default:
        return false;
    }
  }, []);

  // Handle connection - check for pending execution
  const handleConnected = useCallback((ws: WebSocket) => {
    // Check for pending execution and send it
    if (pendingExecutionRef.current) {
      const { ideaContext, plan, phaseId, pauseBetweenPhases } = pendingExecutionRef.current;

      log.log('Sending pending execution', { phaseId, ideaId: ideaContext.id, pauseBetweenPhases });
      setIsExecuting(true);
      setIsPaused(false);
      setIsBlocked(false);
      setBlockedEvent(null);

      ws.send(JSON.stringify({
        type: 'start_execution',
        idea: ideaContext,
        plan,
        phaseId,
        pauseBetweenPhases,
      }));

      // Clear pending execution
      pendingExecutionRef.current = null;
    }
  }, []);

  // Use base hook
  const base = useAgentSocket({
    wsUrl: EXECUTION_AGENT_WS_URL,
    ideaId,
    userId,
    userName,
    enabled,
    onError,
    loggerTag: 'ExecutionAgent',
    onCustomMessage: handleCustomMessage,
    onConnected: handleConnected,
    // Execution agent doesn't use ideaContext the same way
    ideaContext: null,
  });

  // Clear execution state when disabled
  useEffect(() => {
    if (!enabled) {
      log.log('Disabled, clearing execution state');
      setIsExecuting(false);
      setIsPaused(false);
      setIsBlocked(false);
      setBlockedEvent(null);
      setSessionState(null);
      pendingExecutionRef.current = null;
    }
  }, [enabled]);

  // Start execution
  const startExecution = useCallback((ideaContext: ExecutionIdeaContext, plan: IdeaPlan, phaseId: string, pauseBetweenPhases: boolean = false) => {
    log.log('startExecution called', { ideaId: ideaContext.id, phaseId, pauseBetweenPhases });

    // Set optimistic UI state immediately (before server responds)
    setIsExecuting(true);
    setIsPaused(false);
    setIsBlocked(false);
    setBlockedEvent(null);
    setSessionState({ status: 'running', phaseId, startedAt: Date.now() });
    base.setError(null);

    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      log.log('Sending start_execution immediately');
      base.wsRef.current.send(JSON.stringify({
        type: 'start_execution',
        idea: ideaContext,
        plan,
        phaseId,
        pauseBetweenPhases,
      }));
    } else {
      // WebSocket not connected yet - queue the execution to be sent when connected
      log.log('Queueing execution (WebSocket not yet open)');
      pendingExecutionRef.current = { ideaContext, plan, phaseId, pauseBetweenPhases };
    }
  }, [base.wsRef, base.setError]);

  // Override sendMessage to clear blocked state
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    // Clear blocked state when sending a message
    if (isBlocked) {
      setIsBlocked(false);
      setBlockedEvent(null);
    }

    base.sendMessage(content);
  }, [base.sendMessage, isBlocked]);

  // Send feedback (alias for sendMessage)
  const sendFeedback = useCallback((feedback: string) => {
    sendMessage(feedback);
  }, [sendMessage]);

  // Request chat history from server
  const requestHistory = useCallback((limit?: number) => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({
        type: 'get_history',
        limit,
      }));
    }
  }, [base.wsRef]);

  // Pause execution
  const pauseExecution = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      setIsPaused(true);
      base.wsRef.current.send(JSON.stringify({ type: 'pause' }));
    }
  }, [base.wsRef]);

  // Resume execution
  const resumeExecution = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      setIsPaused(false);
      base.wsRef.current.send(JSON.stringify({ type: 'resume' }));
    }
  }, [base.wsRef]);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: 'cancel' }));
      base.cancelRequest();
      setIsExecuting(false);
      setIsPaused(false);
      setIsBlocked(false);
      setBlockedEvent(null);
    }
  }, [base.wsRef, base.cancelRequest]);

  return {
    messages: base.messages,
    isConnected: base.isConnected,
    isLoading: isExecuting || base.isLoading,
    isExecuting,
    isPaused,
    isBlocked,
    blockedEvent,
    sessionState,
    error: base.error,
    tokenUsage: base.tokenUsage,
    openQuestions: base.openQuestions,
    showQuestionsResolver: base.showQuestionsResolver,
    setShowQuestionsResolver: base.setShowQuestionsResolver,
    resolveQuestions: base.resolveQuestions,
    progress: base.progress,
    startExecution,
    sendMessage,
    sendFeedback,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    clearMessages: base.clearHistory,
    addLocalMessage: base.addMessage,
    requestHistory,
  };
}

export default useExecutionAgent;
