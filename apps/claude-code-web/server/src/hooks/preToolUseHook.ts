/**
 * PreToolUse hook implementations.
 * These hooks intercept tool calls before execution, allowing:
 * - Blocking dangerous operations
 * - Auto-approving safe tools
 * - Modifying tool input
 * - Injecting system messages
 */

import type { HookCallback, PreToolUseHookInput } from '../types/hooks.js';

/**
 * Block dangerous bash commands.
 * Matches patterns like rm -rf /, mkfs., dd if=.*of=/dev
 */
export const blockDangerousCommands: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  if (preInput.tool_name !== 'Bash') return {};

  const command = preInput.tool_input.command as string;
  if (!command) return {};

  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    /rm\s+-fr\s+\//,
    /mkfs\./,
    /dd\s+if=.*of=\/dev/,
    /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/, // Fork bomb
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Blocked dangerous command matching: ${pattern.source}`,
        },
      };
    }
  }

  return {};
};

/**
 * Auto-approve read-only tools.
 */
export const autoApproveReadOnly: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  const readOnlyTools = ['Read', 'Glob', 'Grep'];

  if (readOnlyTools.includes(preInput.tool_name)) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'Read-only tool auto-approved',
      },
    };
  }

  return {};
};

/**
 * Inject a system message for Claude to see.
 */
export function createSystemMessageHook(message: string): HookCallback {
  return async () => ({
    systemMessage: message,
  });
}

/**
 * Modify tool input before execution.
 * Takes a transform function that receives and returns tool input.
 */
export function createInputModifierHook(
  transform: (input: Record<string, unknown>) => Record<string, unknown>
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'PreToolUse') return {};

    const preInput = input as PreToolUseHookInput;
    const updatedInput = transform(preInput.tool_input);

    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput,
      },
    };
  };
}

/**
 * Block tools matching specific patterns in their input.
 * Used for fine-grained blocking based on arguments.
 */
export function createBlockPatternHook(
  inputKey: string,
  pattern: RegExp,
  reason: string
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'PreToolUse') return {};

    const preInput = input as PreToolUseHookInput;
    const value = preInput.tool_input[inputKey];

    if (typeof value === 'string' && pattern.test(value)) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      };
    }

    return {};
  };
}

/**
 * Log PreToolUse event.
 */
export const logPreToolUse: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  console.log(`[PreToolUse] ${preInput.tool_name}`, {
    tool: preInput.tool_name,
    inputKeys: Object.keys(preInput.tool_input),
  });

  return {};
};

/**
 * Create a PreToolUse hook from configuration options.
 * This is the main factory used by HooksService.
 */
export function createPreToolUseHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  switch (action) {
    case 'block-dangerous':
      return blockDangerousCommands;
    case 'auto-approve-readonly':
      return autoApproveReadOnly;
    case 'inject-message':
      return createSystemMessageHook((options?.message as string) || '');
    case 'block-pattern':
      return createBlockPatternHook(
        (options?.inputKey as string) || 'command',
        new RegExp((options?.pattern as string) || ''),
        (options?.reason as string) || 'Blocked by pattern hook'
      );
    case 'log':
      return logPreToolUse;
    default:
      return logPreToolUse;
  }
}
