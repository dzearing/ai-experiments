/**
 * Message types from the Agent SDK SSE stream.
 * Full SDK message types for streaming conversation support.
 */

// =============================================================================
// Content Blocks
// =============================================================================

/**
 * Text content block from assistant message.
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Thinking content block from extended reasoning.
 */
export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

/**
 * Tool use content block indicating a tool call.
 */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Union of all content block types.
 */
export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock;

// =============================================================================
// Streaming Events
// =============================================================================

/**
 * Delta for text streaming.
 */
export interface TextDelta {
  type: 'text_delta';
  text: string;
}

/**
 * Delta for thinking content streaming.
 */
export interface ThinkingDelta {
  type: 'thinking_delta';
  thinking: string;
}

/**
 * Raw message stream event from SDK partial messages.
 */
export interface RawMessageStreamEvent {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_stop';
  delta?: TextDelta | ThinkingDelta;
  index?: number;
}

// =============================================================================
// SDK Message Types
// =============================================================================

/**
 * System message indicating session initialization.
 */
export interface SDKSystemMessage {
  type: 'system';
  subtype: 'init';
  session_id: string;
}

/**
 * Complete assistant message with all content blocks.
 */
export interface SDKAssistantMessage {
  type: 'assistant';
  uuid: string;
  message: {
    content: ContentBlock[];
  };
}

/**
 * Partial assistant message during streaming.
 */
export interface SDKPartialAssistantMessage {
  type: 'assistant';
  subtype: 'partial';
  uuid: string;
  event: RawMessageStreamEvent;
}

/**
 * Usage statistics for token consumption.
 */
export interface UsageStats {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Result message indicating query completion.
 */
export interface SDKResultMessage {
  type: 'result';
  uuid: string;
  is_error: boolean;
  usage?: UsageStats;
}

/**
 * Error message from SDK.
 */
export interface SDKErrorMessage {
  type: 'error';
  error: string;
}

/**
 * Union of all SDK message types.
 */
export type SDKMessage =
  | SDKSystemMessage
  | SDKAssistantMessage
  | SDKPartialAssistantMessage
  | SDKResultMessage
  | SDKErrorMessage;

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for useAgentStream hook with full streaming support.
 */
export interface UseAgentStreamReturn {
  messages: import('@ui-kit/react-chat').ChatPanelMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  isThinking: boolean;
  thinkingContent: string;
  sessionId: string | null;
  contextUsage: UsageStats | null;
  error: string | null;
  startStream: (prompt: string, sessionId?: string) => void;
  stopStream: () => void;
  clearMessages: () => void;
}
