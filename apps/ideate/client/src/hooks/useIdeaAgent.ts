/**
 * Hook for managing the idea agent WebSocket connection.
 *
 * This is a thin wrapper around useAgentSocket that handles:
 * - Session transfer logic (documentRoomName → ideaId transition)
 * - Initial greeting support for facilitator-driven prompts
 * - Idea agent-specific URL params
 */

import { useEffect, useRef, useCallback } from 'react';
import { IDEA_AGENT_WS_URL } from '../config';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';
import { useAgentSocket, type BaseServerMessage } from './useAgentSocket';
import type { AgentProgressState } from './useAgentProgress';
import type { ModelId } from './useModelPreference';
import { createLogger } from '../utils/clientLogger';
import type { SlashCommand } from '../types/slashCommandTypes';

// Re-export types from agentTypes for backwards compatibility
export type {
  AgentMessage as IdeaAgentMessage,
  AgentToolCall as IdeaAgentToolCall,
  AgentTextBlock as IdeaAgentTextBlock,
  AgentToolCallsBlock as IdeaAgentToolCallsBlock,
  AgentContentBlock as IdeaAgentContentBlock,
  TokenUsage,
  IdeaContext,
} from './agentTypes';

// Import for internal use
import type {
  AgentMessage,
  TokenUsage,
  IdeaContext,
} from './agentTypes';

const log = createLogger('IdeaAgent');

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
  messages: AgentMessage[];
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
  /** Send a message to the agent without displaying it in the chat (silent/background) */
  sendSilentMessage: (content: string) => void;
  /** Add a local message (for system messages like help) */
  addLocalMessage: (message: AgentMessage) => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Update the idea context */
  updateIdeaContext: (context: IdeaContext) => void;
  /** Cancel the current request */
  cancelRequest: () => void;
  /** Agent progress state */
  progress: AgentProgressState;
  /** Available slash commands from server */
  availableCommands: SlashCommand[];
  /** Execute a slash command */
  executeCommand: (command: string, args: string) => void;
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
  // Track document room name for URL params
  const documentRoomNameRef = useRef<string | undefined>(documentRoomName);
  const initialGreetingRef = useRef<string | undefined>(initialGreeting);

  // Session transfer tracking - when new idea becomes saved idea
  const prevIdeaIdRef = useRef<string | null>(null);
  const prevDocumentRoomNameRef = useRef<string | undefined>(undefined);
  const transferFromRoomRef = useRef<string | undefined>(undefined);
  const sessionContinuationRef = useRef<boolean>(false);

  // Keep refs updated
  useEffect(() => {
    documentRoomNameRef.current = documentRoomName;
  }, [documentRoomName]);

  // Handle session transfer detection (new idea room → saved idea room)
  useEffect(() => {
    if (!enabled) {
      prevIdeaIdRef.current = null;
      prevDocumentRoomNameRef.current = undefined;

      return;
    }

    const ideaIdChanged = prevIdeaIdRef.current !== null && prevIdeaIdRef.current !== ideaId;
    const roomNameChanged = prevDocumentRoomNameRef.current !== undefined && prevDocumentRoomNameRef.current !== documentRoomName;

    if (ideaIdChanged || roomNameChanged) {
      // Detect session continuation (new idea room -> saved idea room)
      const wasNewIdeaRoom = prevDocumentRoomNameRef.current?.includes('idea-doc-new-');
      const isNowSavedIdeaRoom = documentRoomName && !documentRoomName.includes('idea-doc-new-');
      const isSessionContinuation = wasNewIdeaRoom && isNowSavedIdeaRoom;

      log.log('Session changed:', {
        ideaIdChanged,
        roomNameChanged,
        prevRoom: prevDocumentRoomNameRef.current,
        newRoom: documentRoomName,
        isSessionContinuation,
      });

      // Store previous room for transfer
      if (prevDocumentRoomNameRef.current) {
        transferFromRoomRef.current = prevDocumentRoomNameRef.current;
        log.log('Will transfer session from:', prevDocumentRoomNameRef.current);
      }

      sessionContinuationRef.current = !!isSessionContinuation;
    }

    prevIdeaIdRef.current = ideaId;
    prevDocumentRoomNameRef.current = documentRoomName;
  }, [enabled, ideaId, documentRoomName]);

  // Build extra URL params including document room and transfer
  const extraUrlParams = {
    documentRoomName: documentRoomNameRef.current,
    transferFromRoom: transferFromRoomRef.current,
  };

  // Clear transfer after it's been used
  useEffect(() => {
    if (transferFromRoomRef.current) {
      // Give the URL a moment to be built, then clear
      const timeout = setTimeout(() => {
        transferFromRoomRef.current = undefined;
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [transferFromRoomRef.current]);

  // Handle custom message types
  const handleCustomMessage = useCallback((_type: string, _data: BaseServerMessage): boolean => {
    // Idea agent doesn't have custom message types beyond what base handles
    // But we keep this hook for extensibility
    return false;
  }, []);

  // Handle history loaded - check for session continuation
  const handleHistoryLoaded = useCallback((messages: AgentMessage[]): AgentMessage[] => {
    if (sessionContinuationRef.current && messages.length === 0) {
      log.log('Skipping empty history (session continuation, preserving local messages)');
      sessionContinuationRef.current = false;

      // Return empty to signal base hook should preserve existing messages
      return [];
    }

    sessionContinuationRef.current = false;

    return messages;
  }, []);

  // Handle connection - send idea_update with initial context
  const handleConnected = useCallback((ws: WebSocket) => {
    if (ideaContext) {
      ws.send(JSON.stringify({
        type: 'idea_update',
        idea: ideaContext,
        documentRoomName: documentRoomNameRef.current,
        initialGreeting: initialGreetingRef.current,
      }));
    }
  }, [ideaContext]);

  // Use base hook
  const base = useAgentSocket({
    wsUrl: IDEA_AGENT_WS_URL,
    ideaId,
    userId,
    userName,
    enabled,
    modelId,
    workspaceId,
    onError,
    loggerTag: 'IdeaAgent',
    extraUrlParams,
    onCustomMessage: handleCustomMessage,
    onHistoryLoaded: handleHistoryLoaded,
    onConnected: handleConnected,
    ideaContext,
  });

  // Override updateIdeaContext to include documentRoomName
  const updateIdeaContext = useCallback((context: IdeaContext) => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({
        type: 'idea_update',
        idea: context,
        documentRoomName: documentRoomNameRef.current,
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
    openQuestions: base.openQuestions,
    showQuestionsResolver: base.showQuestionsResolver,
    setShowQuestionsResolver: base.setShowQuestionsResolver,
    resolveQuestions: base.resolveQuestions,
    sendMessage: base.sendMessage,
    sendSilentMessage: base.sendSilentMessage,
    addLocalMessage: base.addMessage,
    clearHistory: base.clearHistory,
    updateIdeaContext,
    cancelRequest: base.cancelRequest,
    progress: base.progress,
    availableCommands: base.availableCommands,
    executeCommand: base.executeCommand,
  };
}

export default useIdeaAgent;
