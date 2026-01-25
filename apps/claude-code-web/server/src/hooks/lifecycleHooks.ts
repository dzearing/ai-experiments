/**
 * General lifecycle hooks.
 * Hooks for user prompt submission, permission requests, and context compaction.
 */

import type {
  HookCallback,
  UserPromptSubmitHookInput,
  PermissionRequestHookInput,
  PreCompactHookInput,
} from '../types/hooks.js';

/**
 * Validate user prompt before submission.
 * Can block prompts containing sensitive patterns.
 */
export function createPromptValidatorHook(
  patterns: RegExp[],
  reason: string
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'UserPromptSubmit') return {};

    const promptInput = input as UserPromptSubmitHookInput;

    for (const pattern of patterns) {
      if (pattern.test(promptInput.prompt)) {
        return {
          continue: false,
          stopReason: reason,
        };
      }
    }

    return {};
  };
}

/**
 * Log prompt submission.
 */
export const logPromptSubmit: HookCallback = async (input) => {
  if (input.hook_event_name !== 'UserPromptSubmit') return {};

  const promptInput = input as UserPromptSubmitHookInput;
  console.log(`[UserPromptSubmit] Prompt submitted`, {
    length: promptInput.prompt.length,
    session: promptInput.session_id,
  });

  return {};
};

/**
 * Intercept permission request and apply custom logic.
 */
export function createPermissionInterceptHook(
  decide: (toolName: string, input: Record<string, unknown>) => 'allow' | 'deny' | 'ask' | null
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'PermissionRequest') return {};

    const permInput = input as PermissionRequestHookInput;
    const decision = decide(permInput.tool_name, permInput.tool_input);

    if (decision) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PermissionRequest',
          permissionDecision: decision,
        },
      };
    }

    return {};
  };
}

/**
 * Log permission request.
 */
export const logPermissionRequest: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PermissionRequest') return {};

  const permInput = input as PermissionRequestHookInput;
  console.log(`[PermissionRequest] Tool permission requested`, {
    tool: permInput.tool_name,
    session: permInput.session_id,
  });

  return {};
};

/**
 * Run logic before context compaction.
 */
export function createPreCompactCallback(
  onCompact: (trigger: string, customInstructions?: string) => void | Promise<void>
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'PreCompact') return {};

    const compactInput = input as PreCompactHookInput;
    await onCompact(compactInput.trigger, compactInput.custom_instructions);

    return {};
  };
}

/**
 * Log pre-compact event.
 */
export const logPreCompact: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PreCompact') return {};

  const compactInput = input as PreCompactHookInput;
  console.log(`[PreCompact] Context compaction triggered`, {
    trigger: compactInput.trigger,
    hasCustomInstructions: !!compactInput.custom_instructions,
  });

  return {};
};

/**
 * Create a UserPromptSubmit hook from configuration options.
 */
export function createUserPromptSubmitHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  switch (action) {
    case 'log':
      return logPromptSubmit;
    case 'validate': {
      const patterns = ((options?.patterns as string[]) || []).map((p) => new RegExp(p, 'i'));
      const reason = (options?.reason as string) || 'Prompt validation failed';

      return createPromptValidatorHook(patterns, reason);
    }
    default:
      return logPromptSubmit;
  }
}

/**
 * Create a PermissionRequest hook from configuration options.
 */
export function createPermissionRequestHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  return action === 'log' ? logPermissionRequest : logPermissionRequest;
}

/**
 * Create a PreCompact hook from configuration options.
 */
export function createPreCompactHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  return action === 'log' ? logPreCompact : logPreCompact;
}
