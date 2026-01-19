import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

import type {
  SDKMessage,
  SDKSystemMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKErrorMessage,
} from '../types/index.js';

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
}

/**
 * Stream Agent SDK messages to the caller.
 * Uses real SDK when available, falls back to mock mode otherwise.
 */
export async function* streamAgentQuery(
  options: StreamAgentOptions
): AsyncGenerator<SDKMessage> {
  const { prompt, sessionId, cwd } = options;

  // If SDK is available, use real implementation
  if (query) {
    try {
      const queryIterator = query({
        prompt,
        options: {
          resume: sessionId || undefined,
          cwd: cwd || process.cwd(),
          includePartialMessages: true,
          permissionMode: 'bypassPermissions',
        },
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
