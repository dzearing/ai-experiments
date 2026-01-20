import { execSync } from 'child_process';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import type {
  SDKMessage,
  SDKSystemMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKErrorMessage,
  PermissionMode,
  PermissionRequestEvent,
  QuestionRequestEvent,
  QuestionItem,
} from '../types/index.js';
import { createPermissionRequest, type PermissionResult } from './permissionService.js';

// Attempt to import the Agent SDK
let query: typeof import('@anthropic-ai/claude-agent-sdk').query | undefined;

try {
  const sdk = await import('@anthropic-ai/claude-agent-sdk');

  query = sdk.query;
  console.log('[AgentService] Agent SDK loaded successfully');
} catch (error) {
  console.warn('[AgentService] Agent SDK not available, using mock mode:', error);
}

/**
 * Check if Claude CLI is available on the system.
 * Returns true if claude command is found, false otherwise.
 */
export function checkClaudeAvailable(): boolean {
  try {
    execSync('which claude', { encoding: 'utf8', stdio: 'pipe' });

    return true;
  } catch {
    return false;
  }
}

export interface StreamAgentOptions {
  prompt: string;
  sessionId?: string;
  cwd?: string;
  permissionMode?: PermissionMode;
}

/**
 * Active SSE connections by sessionId for sending permission events.
 */
const activeConnections = new Map<string, Response>();

/**
 * Register an SSE connection for a session.
 * Allows permission events to be sent to the correct client.
 */
export function registerConnection(sessionId: string, res: Response): void {
  activeConnections.set(sessionId, res);
}

/**
 * Unregister an SSE connection when it closes.
 */
export function unregisterConnection(sessionId: string): void {
  activeConnections.delete(sessionId);
}

/**
 * Send an SSE event to a connected client.
 */
function sendSSEEvent(sessionId: string, event: PermissionRequestEvent | QuestionRequestEvent): boolean {
  const res = activeConnections.get(sessionId);

  if (!res) {
    console.warn(`[AgentService] No connection for session ${sessionId}`);
    return false;
  }

  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    return true;
  } catch (error) {
    console.error(`[AgentService] Failed to send SSE event:`, error);
    return false;
  }
}

/**
 * Create a canUseTool callback that sends permission requests via SSE.
 */
function createCanUseToolCallback(currentSessionId: string) {
  return async (
    toolName: string,
    input: Record<string, unknown>,
    context: { signal?: AbortSignal }
  ): Promise<PermissionResult> => {
    // Special handling for AskUserQuestion - send as question_request
    if (toolName === 'AskUserQuestion') {
      const { requestId, promise } = createPermissionRequest(toolName, input, context.signal);
      const questions = (input as { questions?: QuestionItem[] }).questions || [];

      const event: QuestionRequestEvent = {
        type: 'question_request',
        requestId,
        questions,
        timestamp: Date.now(),
      };

      sendSSEEvent(currentSessionId, event);
      return promise;
    }

    // Regular permission request
    const { requestId, promise } = createPermissionRequest(toolName, input, context.signal);

    const event: PermissionRequestEvent = {
      type: 'permission_request',
      requestId,
      toolName,
      input,
      timestamp: Date.now(),
    };

    sendSSEEvent(currentSessionId, event);
    return promise;
  };
}

/**
 * Stream Agent SDK messages to the caller.
 * Uses real SDK when available, falls back to mock mode otherwise.
 */
export async function* streamAgentQuery(
  options: StreamAgentOptions
): AsyncGenerator<SDKMessage> {
  const { prompt, sessionId, cwd, permissionMode = 'default' } = options;

  // If SDK is available, use real implementation
  if (query) {
    try {
      // Build query options based on permission mode
      const queryOptions: Record<string, unknown> = {
        resume: sessionId || undefined,
        cwd: cwd || process.cwd(),
        includePartialMessages: true,
      };

      // Only use bypassPermissions mode or provide canUseTool callback
      if (permissionMode === 'bypassPermissions') {
        queryOptions.permissionMode = 'bypassPermissions';
      } else {
        // For non-bypass modes, use canUseTool callback
        queryOptions.permissionMode = permissionMode;

        if (sessionId) {
          queryOptions.canUseTool = createCanUseToolCallback(sessionId);
        } else {
          // Without a sessionId, we cannot send SSE events, so fall back to bypass
          console.warn('[AgentService] No sessionId provided, falling back to bypassPermissions');
          queryOptions.permissionMode = 'bypassPermissions';
        }
      }

      const queryIterator = query({
        prompt,
        options: queryOptions,
      });

      for await (const message of queryIterator) {
        // Forward SDK messages as-is - they already match our type structure
        yield message as SDKMessage;
      }
    } catch (error) {
      const errorMessage: SDKErrorMessage = {
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
        session_id: sessionId,
      };

      yield errorMessage;
    }
  } else {
    // Mock mode for testing without SDK
    yield* streamMockResponse(prompt);
  }
}

/**
 * Generate mock streaming response for testing.
 * Simulates the message types that the real SDK would produce.
 */
async function* streamMockResponse(prompt: string): AsyncGenerator<SDKMessage> {
  const mockSessionId = `mock-session-${uuidv4()}`;
  const mockMessageUuid = uuidv4();

  // System init message
  const initMessage: SDKSystemMessage = {
    type: 'system',
    subtype: 'init',
    session_id: mockSessionId,
    cwd: process.cwd(),
    tools: ['Read', 'Write', 'Bash', 'Glob', 'Grep'],
  };

  yield initMessage;
  await delay(100);

  // Simulate partial text streaming
  const responseText = `I received your message: "${prompt}"\n\nThis is a mock response because the Agent SDK is not available. In production, this would be a real Claude response with token-by-token streaming.`;

  const words = responseText.split(' ');

  for (let i = 0; i < words.length; i++) {
    const partialText = words.slice(0, i + 1).join(' ');

    const partialMessage = {
      type: 'partial_assistant' as const,
      uuid: mockMessageUuid,
      session_id: mockSessionId,
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: i === 0 ? words[i] : ' ' + words[i],
        },
      },
    };

    yield partialMessage;
    await delay(50);
  }

  // Final assistant message
  const assistantMessage: SDKAssistantMessage = {
    type: 'assistant',
    uuid: mockMessageUuid,
    session_id: mockSessionId,
    message: {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      model: 'claude-sonnet-4-20250514',
      stop_reason: 'end_turn',
    },
  };

  yield assistantMessage;
  await delay(50);

  // Result message
  const resultMessage: SDKResultMessage = {
    type: 'result',
    uuid: mockMessageUuid,
    session_id: mockSessionId,
    is_error: false,
    duration_ms: 1500,
    usage: {
      input_tokens: Math.floor(prompt.length / 4),
      output_tokens: Math.floor(responseText.length / 4),
    },
  };

  yield resultMessage;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
