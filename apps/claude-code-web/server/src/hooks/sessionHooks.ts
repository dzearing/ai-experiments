/**
 * Session lifecycle hooks.
 * Hooks for session start and end events.
 */

import type {
  HookCallback,
  SessionStartHookInput,
  SessionEndHookInput,
} from '../types/hooks.js';

/**
 * Log session start event.
 */
export const logSessionStart: HookCallback = async (input) => {
  if (input.hook_event_name !== 'SessionStart') return {};

  const sessionInput = input as SessionStartHookInput;
  console.log(`[SessionStart] Session ${sessionInput.session_id} started`, {
    source: sessionInput.source,
    cwd: sessionInput.cwd,
  });

  return {};
};

/**
 * Log session end event.
 */
export const logSessionEnd: HookCallback = async (input) => {
  if (input.hook_event_name !== 'SessionEnd') return {};

  const sessionInput = input as SessionEndHookInput;
  console.log(`[SessionEnd] Session ${sessionInput.session_id} ended`, {
    reason: sessionInput.reason,
  });

  return {};
};

/**
 * Inject context at session start.
 * Useful for providing initial instructions or environment info.
 */
export function createSessionContextHook(context: string): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'SessionStart') return {};

    return {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context,
      },
    };
  };
}

/**
 * Run cleanup logic at session end.
 */
export function createSessionCleanupHook(
  cleanup: (sessionId: string, reason: string) => void | Promise<void>
): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== 'SessionEnd') return {};

    const sessionInput = input as SessionEndHookInput;
    await cleanup(sessionInput.session_id, sessionInput.reason);

    return {};
  };
}

/**
 * Create a SessionStart hook from configuration options.
 */
export function createSessionStartHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  switch (action) {
    case 'log':
      return logSessionStart;
    case 'inject-context':
      return createSessionContextHook((options?.context as string) || '');
    default:
      return logSessionStart;
  }
}

/**
 * Create a SessionEnd hook from configuration options.
 */
export function createSessionEndHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  switch (action) {
    case 'log':
      return logSessionEnd;
    default:
      return logSessionEnd;
  }
}
