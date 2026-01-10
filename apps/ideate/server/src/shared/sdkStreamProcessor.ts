/**
 * Shared SDK stream processor for consistent handling of Claude Agent SDK messages.
 * All agent services should use this to ensure consistent tool event handling.
 */

import type {
  SDKAssistantMessage,
  SDKSystemMessage,
  SDKResultMessage,
  SDKPartialAssistantMessage,
  SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';

/**
 * Tool call tracking
 */
export interface ToolCall {
  id?: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * System init information
 */
export interface SystemInitInfo {
  sessionId?: string;
  model?: string;
  tools?: string[];
  mcpServers?: string[];
}

/**
 * Result of processing the SDK stream
 */
export interface SDKStreamResult {
  fullResponse: string;
  toolCalls: ToolCall[];
  tokenUsage: TokenUsage;
  costUsd?: number;
}

/**
 * Callbacks for SDK stream processing
 */
export interface SDKStreamCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;

  /** Called for thinking content (extended thinking) */
  onThinking?: (text: string, messageId: string) => void;

  /** Called when a tool is invoked */
  onToolUse?: (toolCall: { name: string; input: Record<string, unknown>; messageId: string }) => void;

  /** Called when a tool result is received */
  onToolResult?: (result: { name: string; output: string; messageId: string }) => void;

  /** Called with token usage updates */
  onTokenUsage?: (usage: TokenUsage) => void;

  /** Called on error */
  onError?: (error: string) => void;

  /** Called with system init info */
  onSystemInit?: (info: SystemInitInfo) => void;

  /** Called with raw SDK events (for diagnostics) */
  onRawEvent?: (event: SDKMessage) => void;
}

/**
 * Options for stream processing
 */
export interface SDKStreamOptions {
  /** Message ID for this response */
  messageId: string;

  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;

  /** Tags to buffer (won't stream until tag closes) */
  bufferTags?: string[];

  /** Callback to parse buffered content when a tag completes */
  onBufferedTagComplete?: (tagName: string, content: string) => string | null;

  /** Service name for logging */
  serviceName?: string;
}

/**
 * Process an SDK response stream with consistent handling across all services.
 *
 * @param response - The async iterable from sdk.query()
 * @param callbacks - Callbacks for various events
 * @param options - Processing options
 * @returns Result containing full response, tool calls, and usage
 */
export async function processSDKStream(
  response: AsyncIterable<SDKMessage>,
  callbacks: SDKStreamCallbacks,
  options: SDKStreamOptions
): Promise<SDKStreamResult> {
  const { messageId, abortSignal, bufferTags = [], onBufferedTagComplete, serviceName = 'SDK' } = options;

  // State
  let fullResponse = '';
  let streamedLength = 0;
  let pendingBuffer = '';
  const toolCalls: ToolCall[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd: number | undefined;

  // Build regex for buffer tags
  const bufferTagPatterns = bufferTags.map(tag => ({
    tag,
    openTag: `<${tag}>`,
    closeTag: `</${tag}>`,
  }));

  /**
   * Check if text contains a partial tag that shouldn't be streamed
   */
  function findSafeStreamEnd(text: string): number {
    const potentialTagStarts = [
      '<open_questions',
      '<suggested_responses',
      '<plan_update',
      '<impl_plan',
      '<idea_update',
      '<document_edit',
      ...bufferTags.map(t => `<${t}`),
    ];

    let safeEnd = text.length;
    for (const tagStart of potentialTagStarts) {
      for (let i = 1; i <= tagStart.length; i++) {
        const partial = tagStart.slice(0, i);
        if (text.endsWith(partial)) {
          safeEnd = Math.min(safeEnd, text.length - partial.length);
          break;
        }
      }
    }
    return safeEnd;
  }

  /**
   * Check if we're inside a buffered tag and process accordingly
   */
  function processBufferedContent(): string {
    for (const { tag, openTag, closeTag } of bufferTagPatterns) {
      const hasOpen = pendingBuffer.includes(openTag);
      const hasClose = pendingBuffer.includes(closeTag);

      if (hasOpen && hasClose) {
        // Complete tag - extract and process
        const startIdx = pendingBuffer.indexOf(openTag);
        const endIdx = pendingBuffer.indexOf(closeTag) + closeTag.length;
        const tagContent = pendingBuffer.slice(startIdx + openTag.length, endIdx - closeTag.length);

        // Call handler if provided
        const processedContent = onBufferedTagComplete?.(tag, tagContent);

        // Remove the tag from buffer, keep anything before/after
        const before = pendingBuffer.slice(0, startIdx);
        const after = pendingBuffer.slice(endIdx);
        pendingBuffer = after;

        // Return content to stream (before the tag + any processed content)
        return before + (processedContent || '');
      } else if (hasOpen && !hasClose) {
        // Inside unclosed tag - return content before the tag
        const startIdx = pendingBuffer.indexOf(openTag);
        const before = pendingBuffer.slice(0, startIdx);
        pendingBuffer = pendingBuffer.slice(startIdx);
        return before;
      }
    }

    // No buffered tags - return all content
    const content = pendingBuffer;
    pendingBuffer = '';
    return content;
  }

  /**
   * Extract text from tool result content (handles MCP format)
   */
  function extractToolResultContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      const textBlock = content.find((c: unknown) => (c as { type?: string }).type === 'text');
      if (textBlock && typeof (textBlock as { text?: string }).text === 'string') {
        return (textBlock as { text: string }).text;
      }
    }
    return 'completed';
  }

  // Process the stream
  for await (const message of response) {
    // Check abort signal
    if (abortSignal?.aborted) {
      console.log(`[${serviceName}] Operation aborted during streaming`);
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    // Call raw event callback
    callbacks.onRawEvent?.(message);

    // Handle message types
    if (message.type === 'system' && 'subtype' in message && message.subtype === 'init') {
      // System init message
      const systemMsg = message as SDKSystemMessage;
      console.log(`[${serviceName}] Session initialized: model=${systemMsg.model}, tools=${systemMsg.tools?.length || 0}`);
      callbacks.onSystemInit?.({
        sessionId: systemMsg.session_id,
        model: systemMsg.model,
        // Extract tool names (tools may be objects with name property or strings)
        tools: systemMsg.tools?.map((t: unknown) =>
          typeof t === 'string' ? t : (t as { name: string }).name
        ),
        // Extract MCP server names (may be objects with name property or strings)
        mcpServers: systemMsg.mcp_servers?.map((s: unknown) =>
          typeof s === 'string' ? s : (s as { name: string }).name
        ),
      });
    } else if (message.type === 'stream_event') {
      // Streaming content (text deltas, thinking)
      const partialMsg = message as SDKPartialAssistantMessage;
      const event = partialMsg.event;

      if (event.type === 'content_block_delta' && 'delta' in event) {
        const delta = event.delta as { type: string; thinking?: string; text?: string };

        if (delta.type === 'thinking_delta' && delta.thinking) {
          callbacks.onThinking?.(delta.thinking, messageId);
        } else if (delta.type === 'text_delta' && delta.text) {
          pendingBuffer += delta.text;

          // Process buffered content
          const contentToStream = processBufferedContent();
          if (contentToStream) {
            fullResponse += contentToStream;
            // Stream safely (avoid partial tags)
            const safeEnd = findSafeStreamEnd(fullResponse);
            if (safeEnd > streamedLength) {
              const chunk = fullResponse.slice(streamedLength, safeEnd);
              callbacks.onTextChunk(chunk, messageId);
              streamedLength = safeEnd;
            }
          }
        }
      }
    } else if (message.type === 'assistant') {
      // Assistant message - contains tool_use blocks and final text
      const assistantMsg = message as SDKAssistantMessage;
      const msgContent = assistantMsg.message.content;

      // Extract usage
      const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
      if (usage) {
        if (usage.input_tokens) totalInputTokens = usage.input_tokens;
        if (usage.output_tokens) {
          totalOutputTokens = usage.output_tokens;
          callbacks.onTokenUsage?.({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens });
        }
      }

      // Process content blocks
      if (Array.isArray(msgContent)) {
        for (const block of msgContent) {
          if (block.type === 'text') {
            // Text content (may already be streamed)
            const text = block.text;
            if (text && !fullResponse.endsWith(text)) {
              pendingBuffer += text;
              const contentToStream = processBufferedContent();
              if (contentToStream) {
                fullResponse += contentToStream;
                const safeEnd = findSafeStreamEnd(fullResponse);
                if (safeEnd > streamedLength) {
                  callbacks.onTextChunk(fullResponse.slice(streamedLength, safeEnd), messageId);
                  streamedLength = safeEnd;
                }
              }
            }
          } else if (block.type === 'thinking') {
            // Thinking block
            const thinkingBlock = block as { type: 'thinking'; thinking: string };
            callbacks.onThinking?.(thinkingBlock.thinking, messageId);
          } else if (block.type === 'tool_use') {
            // Tool use - emit event
            const toolUseBlock = block as { type: 'tool_use'; id?: string; name: string; input: Record<string, unknown> };
            console.log(`[${serviceName}] Tool use: ${toolUseBlock.name}`);

            const toolCall: ToolCall = {
              id: toolUseBlock.id,
              name: toolUseBlock.name,
              input: toolUseBlock.input || {},
            };
            toolCalls.push(toolCall);

            callbacks.onToolUse?.({
              name: toolUseBlock.name,
              input: toolUseBlock.input || {},
              messageId,
            });
          }
        }
      } else if (typeof msgContent === 'string') {
        if (msgContent && !fullResponse.endsWith(msgContent)) {
          pendingBuffer += msgContent;
          const contentToStream = processBufferedContent();
          if (contentToStream) {
            fullResponse += contentToStream;
            callbacks.onTextChunk(contentToStream, messageId);
            streamedLength = fullResponse.length;
          }
        }
      }
    } else if (message.type === 'user') {
      // User message - contains tool results
      const userMsg = message as { type: 'user'; message: { content: unknown[] } };
      if (Array.isArray(userMsg.message?.content)) {
        for (const block of userMsg.message.content) {
          if ((block as { type?: string }).type === 'tool_result') {
            const toolResult = block as { type: 'tool_result'; tool_use_id?: string; content?: unknown };

            // Find matching pending tool call
            const pendingTool = toolCalls.find(tc => !tc.output && (tc.id === toolResult.tool_use_id || !toolResult.tool_use_id));

            if (pendingTool) {
              pendingTool.output = extractToolResultContent(toolResult.content);
              console.log(`[${serviceName}] Tool result: ${pendingTool.name}`);

              callbacks.onToolResult?.({
                name: pendingTool.name,
                output: pendingTool.output,
                messageId,
              });
            }
          }
        }
      }
    } else if (message.type === 'result') {
      // Final result
      const resultMsg = message as SDKResultMessage;

      // Extract usage
      if (resultMsg.usage) {
        totalInputTokens = resultMsg.usage.input_tokens ?? totalInputTokens;
        totalOutputTokens = resultMsg.usage.output_tokens ?? totalOutputTokens;
        callbacks.onTokenUsage?.({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens });
      }

      // Extract cost
      if ('total_cost_usd' in resultMsg) {
        totalCostUsd = resultMsg.total_cost_usd;
      }

      // Handle final result text if we haven't received streaming content
      if (resultMsg.subtype === 'success' && 'result' in resultMsg && resultMsg.result) {
        if (!fullResponse) {
          fullResponse = resultMsg.result;
          callbacks.onTextChunk(fullResponse, messageId);
          streamedLength = fullResponse.length;
        }
      } else if (resultMsg.subtype === 'error_during_execution') {
        callbacks.onError?.('An error occurred during processing');
      }
    }
  }

  // Stream any remaining content
  if (pendingBuffer) {
    fullResponse += pendingBuffer;
    if (fullResponse.length > streamedLength) {
      callbacks.onTextChunk(fullResponse.slice(streamedLength), messageId);
    }
  }

  return {
    fullResponse,
    toolCalls,
    tokenUsage: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    },
    costUsd: totalCostUsd,
  };
}

/**
 * Create progress events from tool callbacks.
 * Utility to convert tool use/result to AgentProgressEvent.
 */
export function createToolStartEvent(name: string, input: Record<string, unknown>): import('./agentProgress.js').AgentProgressEvent {
  // Format display text based on tool name
  let displayText = name;
  if (input.path) {
    displayText = `${name}(${input.path})`;
  } else if (input.query) {
    displayText = `${name}: "${input.query}"`;
  } else if (input.command) {
    displayText = `${name}: ${input.command}`;
  }

  return {
    type: 'tool_start',
    timestamp: Date.now(),
    toolName: name,
    displayText,
    filePath: input.path as string | undefined,
    searchQuery: input.query as string | undefined,
    command: input.command as string | undefined,
  };
}

export function createToolCompleteEvent(name: string, _output: string, success = true): import('./agentProgress.js').AgentProgressEvent {
  // Note: _output is available for future use (e.g., displaying result summary)
  return {
    type: 'tool_complete',
    timestamp: Date.now(),
    toolName: name,
    displayText: `${name} completed`,
    success,
  };
}
