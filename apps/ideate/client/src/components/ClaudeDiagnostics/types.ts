/**
 * Types for Claude Diagnostics components
 */

/**
 * Session type enum
 */
export type SessionType = 'facilitator' | 'chatroom' | 'ideaagent' | 'importagent';

/**
 * Unified session representation
 */
export interface ClaudeSession {
  id: string;
  type: SessionType;
  name: string;
  messageCount: number;
  lastActivity: number;
  metadata?: {
    userId?: string;
    workspaceId?: string;
    workspaceName?: string;
    chatRoomId?: string;
    participantCount?: number;
    ideaId?: string;
    ideaTitle?: string;
    ownerId?: string;
  };
}

/**
 * Tool call information
 */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

/**
 * Raw SDK event for diagnostics
 */
export interface RawSDKEvent {
  timestamp: number;
  type: string;
  subtype?: string;
  data: unknown;
}

/**
 * Session info from SDK system init
 */
export interface SessionInfo {
  sessionId: string;
  tools: string[];
  mcpServers: { name: string; status: string }[];
}

/**
 * Unified message representation
 */
export interface SessionMessage {
  id: string;
  sessionId: string;
  sessionType: SessionType;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  senderName?: string;
  senderColor?: string;
  toolCalls?: ToolCall[];
  diagnostics?: {
    iterations?: number;
    durationMs?: number;
    responseLength?: number;
    error?: string;
    // Enhanced diagnostics (P0)
    systemPrompt?: string;
    model?: string;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
    // Full diagnostics with raw SDK events
    rawEvents?: RawSDKEvent[];
    sessionInfo?: SessionInfo;
    totalCostUsd?: number;
  };
}

/**
 * Role filter options
 */
export type RoleFilter = 'all' | 'user' | 'assistant';

/**
 * WebSocket message types from server
 */
export interface ServerSessionListMessage {
  type: 'session_list';
  sessions: ClaudeSession[];
}

export interface ServerSessionMessagesMessage {
  type: 'session_messages';
  sessionType: SessionType;
  sessionId: string;
  messages: SessionMessage[];
}

export interface ServerErrorMessage {
  type: 'error';
  error: string;
  sessionType?: SessionType;
  sessionId?: string;
}

export interface ServerPongMessage {
  type: 'pong';
}

export type ServerMessage =
  | ServerSessionListMessage
  | ServerSessionMessagesMessage
  | ServerErrorMessage
  | ServerPongMessage;

/**
 * WebSocket message types to server
 */
export interface ClientRefreshMessage {
  type: 'refresh';
}

export interface ClientSubscribeSessionMessage {
  type: 'subscribe_session';
  sessionType: SessionType;
  sessionId: string;
  limit?: number;
}

export interface ClientUnsubscribeSessionMessage {
  type: 'unsubscribe_session';
}

export interface ClientGetMessagesMessage {
  type: 'get_messages';
  sessionType: SessionType;
  sessionId: string;
  limit?: number;
}

export interface ClientPingMessage {
  type: 'ping';
}

export interface ClientClearSessionsMessage {
  type: 'clear_sessions';
  sessionType?: SessionType; // Optional: clear only specific type, or all if not specified
}

export type ClientMessage =
  | ClientRefreshMessage
  | ClientSubscribeSessionMessage
  | ClientUnsubscribeSessionMessage
  | ClientGetMessagesMessage
  | ClientPingMessage
  | ClientClearSessionsMessage;
