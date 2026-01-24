/**
 * Message transformation utilities for converting SDK messages to ChatPanelMessage format.
 */

import type {
  ChatPanelMessage,
  ChatMessagePart,
  ChatMessageToolCall,
} from '@ui-kit/react-chat';

import type {
  SDKAssistantMessage,
  SDKPartialAssistantMessage,
  ContentBlock,
  RawMessageStreamEvent,
  ToolResultBlock,
} from '../types/agent';

// =============================================================================
// Streaming State
// =============================================================================

/**
 * Internal state for accumulating partial messages during streaming.
 */
export interface StreamingState {
  currentMessageId: string | null;
  currentText: string;
  currentThinking: string;
  contentBlocks: ContentBlock[];
}

/**
 * Creates an initial streaming state.
 */
export function createInitialStreamingState(): StreamingState {
  return {
    currentMessageId: null,
    currentText: '',
    currentThinking: '',
    contentBlocks: [],
  };
}

// =============================================================================
// Content Block Transformation
// =============================================================================

/**
 * Transforms a content block to a ChatMessagePart.
 * ThinkingBlocks are skipped as they are tracked separately.
 *
 * @param block - The content block to transform
 * @returns ChatMessagePart or null for thinking blocks
 */
export function transformContentBlockToPart(block: ContentBlock): ChatMessagePart | null {
  switch (block.type) {
    case 'text':
      return {
        type: 'text',
        text: block.text,
      };

    case 'thinking':
      // Thinking blocks are tracked separately via ThinkingIndicator
      return null;

    case 'tool_use':
      return {
        type: 'tool_calls',
        calls: [{
          id: block.id,
          name: block.name,
          input: block.input,
          completed: false,
          startTime: Date.now(),
        }],
      };

    case 'tool_result':
      // Tool results are processed separately to mark tool calls as complete
      // Return null here as they don't create new message parts
      return null;

    default:
      return null;
  }
}

/**
 * Transforms content blocks array to ChatMessagePart array.
 * Merges consecutive tool_use blocks into single tool_calls part.
 *
 * @param blocks - Array of content blocks from SDK message
 * @returns Array of ChatMessagePart
 */
export function transformContentBlocksToParts(blocks: ContentBlock[]): ChatMessagePart[] {
  const parts: ChatMessagePart[] = [];

  for (const block of blocks) {
    const part = transformContentBlockToPart(block);

    if (!part) {
      continue;
    }

    // Merge consecutive tool_calls parts
    if (part.type === 'tool_calls') {
      const lastPart = parts[parts.length - 1];

      if (lastPart && lastPart.type === 'tool_calls') {
        // Append to existing tool_calls part
        lastPart.calls.push(...part.calls);
      } else {
        parts.push(part);
      }
    } else {
      parts.push(part);
    }
  }

  return parts;
}

// =============================================================================
// SDK Message Transformation
// =============================================================================

/**
 * Transforms a complete SDKAssistantMessage to a ChatPanelMessage.
 *
 * @param sdkMessage - The SDK assistant message to transform
 * @returns ChatPanelMessage for display in ChatPanel
 */
export function transformSDKMessage(sdkMessage: SDKAssistantMessage): ChatPanelMessage {
  const parts = transformContentBlocksToParts(sdkMessage.message.content);

  return {
    id: sdkMessage.uuid,
    content: '', // Use parts instead
    parts,
    timestamp: new Date(),
    senderName: 'Claude',
    isOwn: false,
    isStreaming: false,
    renderMarkdown: true,
  };
}

// =============================================================================
// Partial Message Accumulation
// =============================================================================

/**
 * Accumulates partial message events into streaming state.
 *
 * @param state - Current streaming state
 * @param partial - The partial message event from SDK
 * @returns Updated streaming state
 */
export function accumulatePartialMessage(
  state: StreamingState,
  partial: SDKPartialAssistantMessage
): StreamingState {
  const event: RawMessageStreamEvent = partial.event;

  // Always ensure we have a consistent message ID from the first event
  const messageId = state.currentMessageId || partial.uuid;

  switch (event.type) {
    case 'message_start':
      // Reset state for new message
      return {
        currentMessageId: partial.uuid,
        currentText: '',
        currentThinking: '',
        contentBlocks: [],
      };

    case 'content_block_delta':
      if (event.delta) {
        if (event.delta.type === 'text_delta') {
          return {
            ...state,
            currentMessageId: messageId,
            currentText: state.currentText + event.delta.text,
          };
        }

        if (event.delta.type === 'thinking_delta') {
          return {
            ...state,
            currentMessageId: messageId,
            currentThinking: state.currentThinking + event.delta.thinking,
          };
        }
      }

      return { ...state, currentMessageId: messageId };

    case 'content_block_start':
    case 'content_block_stop':
    case 'message_stop':
      // These events don't modify text content but should preserve the message ID
      return { ...state, currentMessageId: messageId };

    default:
      return { ...state, currentMessageId: messageId };
  }
}

// =============================================================================
// Streaming Message Creation
// =============================================================================

/**
 * Creates a ChatPanelMessage from streaming state for display during streaming.
 *
 * @param state - Current streaming state
 * @returns ChatPanelMessage with isStreaming: true
 */
export function createStreamingMessage(state: StreamingState): ChatPanelMessage {
  const parts: ChatMessagePart[] = [];

  // Add text part if there's content
  if (state.currentText) {
    parts.push({
      type: 'text',
      text: state.currentText,
    });
  }

  // Add any accumulated tool calls from content blocks
  const toolCalls: ChatMessageToolCall[] = [];

  for (const block of state.contentBlocks) {
    if (block.type === 'tool_use') {
      toolCalls.push({
        name: block.name,
        input: block.input,
        completed: false,
        startTime: Date.now(),
      });
    }
  }

  if (toolCalls.length > 0) {
    parts.push({
      type: 'tool_calls',
      calls: toolCalls,
    });
  }

  return {
    id: state.currentMessageId || `streaming-${Date.now()}`,
    content: '', // Use parts instead
    parts,
    timestamp: new Date(),
    senderName: 'Claude',
    isOwn: false,
    isStreaming: true,
    renderMarkdown: true,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extracts thinking content from content blocks.
 *
 * @param blocks - Array of content blocks
 * @returns Combined thinking text from all thinking blocks
 */
export function extractThinkingContent(blocks: ContentBlock[]): string {
  return blocks
    .filter((block): block is { type: 'thinking'; thinking: string } => block.type === 'thinking')
    .map(block => block.thinking)
    .join('\n\n');
}

/**
 * Checks if a partial message event contains a thinking delta.
 *
 * @param partial - The partial message to check
 * @returns True if the event contains a thinking delta
 */
export function isThinkingDelta(partial: SDKPartialAssistantMessage): boolean {
  return (
    partial.event.type === 'content_block_delta' &&
    partial.event.delta?.type === 'thinking_delta'
  );
}

/**
 * Extracts tool result blocks from content array.
 * Used to match results back to their tool_use calls.
 *
 * @param blocks - Array of content blocks
 * @returns Array of tool result data with tool_use_id and content
 */
export function extractToolResults(blocks: ContentBlock[]): Array<{
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}> {
  return blocks
    .filter((block): block is ToolResultBlock => block.type === 'tool_result')
    .map(block => ({
      tool_use_id: block.tool_use_id,
      content: block.content,
      is_error: block.is_error,
    }));
}

/**
 * Extracts tool_use IDs from content blocks in order.
 * Used to match tool results to their corresponding tool calls.
 *
 * @param blocks - Array of content blocks
 * @returns Array of tool_use IDs in order of appearance
 */
export function extractToolUseIds(blocks: ContentBlock[]): string[] {
  return blocks
    .filter((block): block is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
      block.type === 'tool_use'
    )
    .map(block => block.id);
}
