import { useState, useCallback, useMemo } from 'react';

import type { ChatPanelMessage } from '@ui-kit/react-chat';

import type {
  UsageStats,
  PermissionMode,
  PermissionRequestEvent,
  QuestionRequestEvent,
  DeniedPermission,
} from '../types/agent';
import { useAgentStream } from './useAgentStream';

/**
 * Return type for useConversation hook.
 */
export interface UseConversationReturn {
  /** All messages in the conversation (user + assistant), chronologically ordered */
  messages: ChatPanelMessage[];
  /** Whether the assistant is currently streaming a response */
  isStreaming: boolean;
  /** Whether the assistant is in extended thinking mode */
  isThinking: boolean;
  /** Current thinking content from extended reasoning */
  thinkingContent: string;
  /** Session ID for the current conversation (for multi-turn context) */
  sessionId: string | null;
  /** Token usage statistics from the last response */
  contextUsage: UsageStats | null;
  /** Error message if something went wrong */
  error: string | null;
  /** Current permission request awaiting user response */
  permissionRequest: PermissionRequestEvent | null;
  /** Current question request awaiting user response */
  questionRequest: QuestionRequestEvent | null;
  /** Current permission mode */
  permissionMode: PermissionMode;
  /** Denied permissions tracked for the session */
  deniedPermissions: DeniedPermission[];
  /** Send a new message to the assistant */
  sendMessage: (prompt: string) => void;
  /** Clear the conversation and start fresh */
  clearConversation: () => void;
  /** Interrupt the current streaming response */
  interrupt: () => void;
  /** Change the permission mode */
  changePermissionMode: (mode: PermissionMode) => Promise<void>;
  /** Respond to a permission request */
  respondToPermission: (requestId: string, behavior: 'allow' | 'deny', message?: string) => Promise<void>;
  /** Respond to a question request */
  respondToQuestion: (requestId: string, answers: Record<string, string>) => Promise<void>;
}

/**
 * React hook for managing a full conversation with Claude.
 * Wraps useAgentStream with user message handling and conversation-level state.
 */
export function useConversation(): UseConversationReturn {
  const stream = useAgentStream();

  // Track user messages separately
  const [userMessages, setUserMessages] = useState<ChatPanelMessage[]>([]);

  /**
   * Sends a message from the user and triggers assistant response.
   */
  const sendMessage = useCallback((prompt: string) => {
    // Create user message
    const userMsg: ChatPanelMessage = {
      id: `user-${Date.now()}`,
      content: '', // Use parts instead
      parts: [{ type: 'text', text: prompt }],
      timestamp: new Date(),
      senderName: 'You',
      isOwn: true,
      renderMarkdown: true,
    };

    // Add user message to local state
    setUserMessages(prev => [...prev, userMsg]);

    // Start streaming with current session ID for multi-turn
    stream.startStream(prompt, stream.sessionId || undefined);
  }, [stream]);

  /**
   * Clears the entire conversation and starts fresh.
   */
  const clearConversation = useCallback(() => {
    setUserMessages([]);
    stream.clearMessages();
  }, [stream]);

  /**
   * Interrupts the current streaming response.
   */
  const interrupt = useCallback(() => {
    stream.stopStream();
  }, [stream]);

  /**
   * Combines user and assistant messages in chronological order.
   */
  const messages = useMemo(() => {
    // Merge user messages and assistant messages
    const allMessages = [...userMessages, ...stream.messages];

    // Sort by timestamp
    allMessages.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();

      return timeA - timeB;
    });

    return allMessages;
  }, [userMessages, stream.messages]);

  return {
    messages,
    isStreaming: stream.isStreaming,
    isThinking: stream.isThinking,
    thinkingContent: stream.thinkingContent,
    sessionId: stream.sessionId,
    contextUsage: stream.contextUsage,
    error: stream.error,
    permissionRequest: stream.permissionRequest,
    questionRequest: stream.questionRequest,
    permissionMode: stream.permissionMode,
    deniedPermissions: stream.deniedPermissions,
    sendMessage,
    clearConversation,
    interrupt,
    changePermissionMode: stream.changePermissionMode,
    respondToPermission: stream.respondToPermission,
    respondToQuestion: stream.respondToQuestion,
  };
}
