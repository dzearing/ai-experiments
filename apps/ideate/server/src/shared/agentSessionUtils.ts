/**
 * Shared session utilities for agent services.
 * Common patterns for session management and message handling.
 */

/**
 * Message format for conversation history.
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Build conversation history string from messages.
 * Formats recent messages for inclusion in prompts.
 *
 * @param messages - Array of conversation messages
 * @param maxMessages - Maximum number of messages to include (default: 20)
 * @returns Formatted conversation history string
 */
export function buildConversationHistory(
  messages: ConversationMessage[],
  maxMessages = 20
): string {
  // Take last N messages to keep context manageable
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages
    .map((msg) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';

      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Base session state interface.
 * Can be extended by specific agent services.
 */
export interface BaseAgentSession {
  /** The entity ID this session is for (e.g., ideaId) */
  entityId: string;
  /** User who initiated the session */
  userId: string;
  /** Current session status */
  status: 'idle' | 'running' | 'error';
  /** When the session started running */
  startedAt?: number;
  /** Whether a client is currently connected */
  clientConnected: boolean;
  /** Abort controller for the current operation */
  currentAbortController?: AbortController;
  /** Workspace ID for broadcasting */
  workspaceId?: string;
}

/**
 * Base queued message interface.
 * Can be extended with specific message types.
 */
export interface BaseQueuedMessage {
  type: string;
  data: unknown;
  timestamp: number;
  messageId?: string;
}

/**
 * Generate a unique message ID.
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Maximum number of messages to queue when client is disconnected.
 */
export const MAX_QUEUED_MESSAGES = 500;
