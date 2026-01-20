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
import { configService } from './configService.js';

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
  sessionId?: string;  // SDK session ID for resume (from previous conversation)
  connectionId?: string;  // Connection tracking ID for permission SSE events
  cwd?: string;
  permissionMode?: PermissionMode;
  env?: Record<string, string>;  // Additional environment variables
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
 * Tools that modify files - auto-approved in acceptEdits mode.
 */
const FILE_EDIT_TOOLS = ['Write', 'Edit', 'NotebookEdit'];

/**
 * Create a canUseTool callback that sends permission requests via SSE.
 * Handles acceptEdits mode by auto-approving file modification tools.
 */
function createCanUseToolCallback(currentSessionId: string, mode: PermissionMode = 'default') {
  return async (
    toolName: string,
    input: Record<string, unknown>,
    context: { signal?: AbortSignal }
  ): Promise<PermissionResult> => {
    // Special handling for AskUserQuestion - always send as question_request
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

    // In acceptEdits mode, auto-approve file modification tools
    if (mode === 'acceptEdits' && FILE_EDIT_TOOLS.includes(toolName)) {
      return { behavior: 'allow' };
    }

    // Regular permission request - wait for user response
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
 * Check if a string is a valid UUID v4 format.
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return uuidRegex.test(str);
}

/**
 * Stream Agent SDK messages to the caller.
 * Uses real SDK when available, falls back to mock mode otherwise.
 */
export async function* streamAgentQuery(
  options: StreamAgentOptions
): AsyncGenerator<SDKMessage> {
  const { prompt, sessionId, connectionId, cwd, permissionMode = 'default', env } = options;

  // If SDK is available, use real implementation
  if (query) {
    try {
      // Load configuration from the working directory
      const workingDir = cwd || process.cwd();
      const config = await configService.loadConfig(workingDir, env);

      // Only use resume if sessionId is a valid UUID (from a previous SDK session)
      // Otherwise let the SDK create a fresh session
      const resumeId = sessionId && isValidUUID(sessionId) ? sessionId : undefined;

      // Use connectionId for permission events (SSE routing), sessionId for SDK resume
      const permissionEventId = connectionId || sessionId;

      // Build query options based on permission mode and configuration
      const queryOptions: Record<string, unknown> = {
        resume: resumeId,
        cwd: config.cwd,
        env: config.env,
        includePartialMessages: true,
        // Load settings from user/project/local to get authentication credentials
        // Without this, SDK runs in "isolation mode" and won't find API keys
        settingSources: ['user', 'project', 'local'],
      };

      // Add system prompt from configuration if available
      if (config.systemPrompt.length > 0) {
        queryOptions.systemPrompt = {
          type: 'preset' as const,
          preset: 'claude_code' as const,
          append: config.systemPrompt,
        };
      } else {
        queryOptions.systemPrompt = {
          type: 'preset' as const,
          preset: 'claude_code' as const,
        };
      }

      // Handle permission modes:
      // - bypassPermissions: auto-approve everything (SDK built-in)
      // - plan: restrict to read-only (SDK built-in)
      // - default/acceptEdits: use canUseTool callback for interactive approval
      if (permissionMode === 'bypassPermissions') {
        // Let SDK auto-approve all tools
        queryOptions.permissionMode = 'bypassPermissions';
      } else if (permissionMode === 'plan') {
        // SDK enforces read-only mode
        queryOptions.permissionMode = 'plan';
      } else if (permissionEventId) {
        // For default and acceptEdits modes, use canUseTool callback
        // acceptEdits mode auto-approves file edits in the callback
        queryOptions.canUseTool = createCanUseToolCallback(permissionEventId, permissionMode);
      } else {
        // Without a connection ID, we cannot send SSE events, so fall back to bypass
        console.warn('[AgentService] No connectionId provided, falling back to bypassPermissions');
        queryOptions.permissionMode = 'bypassPermissions';
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
