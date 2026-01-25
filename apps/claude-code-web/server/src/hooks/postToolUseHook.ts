/**
 * PostToolUse hook implementations.
 *
 * PostToolUse hooks fire after successful tool execution and can:
 * - Log tool results for debugging/auditing
 * - Inject additional context for Claude based on results
 * - Track metrics for tool execution
 */

import type { HookCallback, PostToolUseHookInput } from '../types/hooks.js';

/**
 * Log tool execution result.
 */
export const logToolResult: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PostToolUse') return {};

  const postInput = input as PostToolUseHookInput;
  console.log(`[PostToolUse] ${postInput.tool_name} completed`, {
    tool: postInput.tool_name,
    inputKeys: Object.keys(postInput.tool_input),
    responseType: typeof postInput.tool_response
  });

  return {};
};

/**
 * Add additional context to Claude based on tool result.
 */
export function createContextInjectionHook(
  contextFn: (input: PostToolUseHookInput) => string | undefined
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'PostToolUse') return {};

    const postInput = input as PostToolUseHookInput;
    const context = contextFn(postInput);

    if (context) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: context
        }
      };
    }

    return {};
  };
}

/**
 * Track tool execution metrics.
 * Records tool usage for analytics.
 */
export function createMetricsHook(
  recorder: (toolName: string, input: Record<string, unknown>, response: unknown) => void
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'PostToolUse') return {};

    const postInput = input as PostToolUseHookInput;
    recorder(postInput.tool_name, postInput.tool_input, postInput.tool_response);

    return {};
  };
}

/**
 * Create a PostToolUse hook from configuration options.
 * This is the main factory used by HooksService.
 */
export function createPostToolUseHook(options?: Record<string, unknown>): HookCallback {
  const action = options?.action as string || 'log';

  switch (action) {
    case 'log':
      return logToolResult;
    case 'add-context':
      // Simple context injection with static message
      return createContextInjectionHook(() => options?.context as string);
    default:
      return logToolResult;
  }
}
