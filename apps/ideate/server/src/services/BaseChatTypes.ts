/**
 * BaseChatTypes.ts
 *
 * Unified types and utilities for all chat services.
 * Ensures consistent message format with proper content block ordering.
 *
 * IMPORTANT: All chat services should use these types to prevent
 * message ordering bugs where tool calls get moved to the end on reload.
 */

/**
 * A tool call within a message
 */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

/**
 * A text content block within a message
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * A tool calls content block within a message (groups consecutive tool calls)
 */
export interface ToolCallsBlock {
  type: 'tool_calls';
  calls: ToolCall[];
}

/**
 * A content block - either text or tool calls.
 * Messages are stored as an ordered array of these blocks to preserve
 * the correct sequence of: text -> tool_use -> tool_result -> text -> etc.
 */
export type ContentBlock = TextBlock | ToolCallsBlock;

/**
 * Base message interface that all chat message types should extend.
 * The `parts` array maintains the correct ordering of content blocks.
 */
export interface BaseChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  /**
   * Content blocks in order - maintains text/tool interleaving.
   * This is the PRIMARY way to store message content.
   */
  parts: ContentBlock[];
}

/**
 * Helper class for building message parts during streaming.
 * Ensures proper grouping and ordering of text and tool calls.
 *
 * Usage:
 * ```typescript
 * const builder = new ChatPartsBuilder();
 *
 * // During streaming:
 * builder.appendText("Let me help you with that.");
 * builder.addToolCall({ name: "search", input: { query: "..." } });
 * builder.updateToolOutput("search", "Found 5 results...");
 * builder.appendText("I found some results!");
 *
 * // When saving:
 * const parts = builder.getParts();
 * const fullText = builder.getFullText();
 * ```
 */
export class ChatPartsBuilder {
  private parts: ContentBlock[] = [];
  private fullText = '';

  /**
   * Append text to the message.
   * If the last block is text, appends to it. Otherwise creates a new text block.
   */
  appendText(text: string): void {
    if (!text) return;

    this.fullText += text;
    const lastPart = this.parts[this.parts.length - 1];

    if (lastPart?.type === 'text') {
      lastPart.text += text;
    } else {
      this.parts.push({ type: 'text', text });
    }
  }

  /**
   * Add a tool call to the message.
   * If the last block is tool_calls, adds to it. Otherwise creates a new tool_calls block.
   */
  addToolCall(toolCall: ToolCall): void {
    const lastPart = this.parts[this.parts.length - 1];

    if (lastPart?.type === 'tool_calls') {
      lastPart.calls.push(toolCall);
    } else {
      this.parts.push({ type: 'tool_calls', calls: [toolCall] });
    }
  }

  /**
   * Update the output of a pending tool call (one without output).
   * Searches from the end for efficiency.
   */
  updateToolOutput(toolName: string, output: string): void {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i];
      if (part.type === 'tool_calls') {
        for (const tc of part.calls) {
          if (tc.name === toolName && !tc.output) {
            tc.output = output;
            return;
          }
        }
      }
    }
  }

  /**
   * Get all tool calls (flattened from all tool_calls blocks).
   * Useful for diagnostics and legacy compatibility.
   */
  getAllToolCalls(): ToolCall[] {
    const allCalls: ToolCall[] = [];
    for (const part of this.parts) {
      if (part.type === 'tool_calls') {
        allCalls.push(...part.calls);
      }
    }
    return allCalls;
  }

  /**
   * Get the ordered parts array for persistence.
   */
  getParts(): ContentBlock[] {
    return this.parts;
  }

  /**
   * Get the full concatenated text (for legacy compatibility and display).
   */
  getFullText(): string {
    return this.fullText;
  }

  /**
   * Check if there are any parts.
   */
  hasParts(): boolean {
    return this.parts.length > 0;
  }

  /**
   * Reset the builder for reuse.
   */
  reset(): void {
    this.parts = [];
    this.fullText = '';
  }
}

/**
 * Migrate a legacy message format (content + toolCalls) to parts format.
 * Used for backward compatibility with existing stored messages.
 *
 * NOTE: This loses the original ordering if text and tools were interleaved,
 * as legacy format stores all text first, then all tools.
 * New messages should always use parts directly.
 */
export function migrateToPartsFormat(
  content?: string,
  toolCalls?: ToolCall[]
): ContentBlock[] {
  const parts: ContentBlock[] = [];

  if (content) {
    parts.push({ type: 'text', text: content });
  }

  if (toolCalls && toolCalls.length > 0) {
    parts.push({ type: 'tool_calls', calls: toolCalls });
  }

  return parts;
}

/**
 * Extract full text from parts (for display or legacy compatibility).
 */
export function getTextFromParts(parts: ContentBlock[]): string {
  return parts
    .filter((p): p is TextBlock => p.type === 'text')
    .map(p => p.text)
    .join('');
}

/**
 * Extract all tool calls from parts (for diagnostics or legacy compatibility).
 */
export function getToolCallsFromParts(parts: ContentBlock[]): ToolCall[] {
  return parts
    .filter((p): p is ToolCallsBlock => p.type === 'tool_calls')
    .flatMap(p => p.calls);
}
