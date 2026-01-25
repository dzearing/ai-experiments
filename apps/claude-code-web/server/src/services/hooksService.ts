/**
 * HooksService builds SDK-compatible hook callbacks from configuration.
 *
 * This service transforms settings.json hook definitions into TypeScript
 * callbacks that the SDK's query() function accepts via options.hooks.
 *
 * Built-in actions:
 * - 'log': Log hook events to console
 * - 'notify': Send notification (placeholder for SSE integration)
 * - 'block-pattern': Block tools matching a pattern
 * - 'allow': Auto-approve permission requests
 * - 'deny': Auto-deny permission requests with optional reason
 */

import { minimatch } from 'minimatch';

import type {
  HooksConfig,
  SDKHooksOptions,
  HookEvent,
  HookCallback,
  HookInput,
  PreToolUseHookInput,
} from '../types/hooks.js';

export class HooksService {
  /**
   * Build SDK-compatible hook callbacks from configuration.
   * Transforms settings.json hook definitions into TypeScript callbacks.
   */
  createHookCallbacks(config: HooksConfig): SDKHooksOptions {
    const hooks: SDKHooksOptions = {};

    for (const [event, matchers] of Object.entries(config)) {
      const hookEvent = event as HookEvent;

      if (!matchers || matchers.length === 0) {
        continue;
      }

      hooks[hookEvent] = matchers.map(m => ({
        matcher: m.matcher,
        hooks: [this.createCallbackForAction(m.action, m.options)]
      }));
    }

    return hooks;
  }

  /**
   * Create a hook callback for a built-in action type.
   * Supported actions: 'log', 'notify', 'block-pattern', 'allow', 'deny'
   */
  private createCallbackForAction(action: string, options?: Record<string, unknown>): HookCallback {
    switch (action) {
      case 'log':
        return this.createLogHook();
      case 'notify':
        return this.createNotifyHook(options);
      case 'block-pattern':
        return this.createBlockPatternHook(options);
      case 'allow':
        return this.createAllowHook();
      case 'deny':
        return this.createDenyHook(options);
      default:
        console.warn(`[HooksService] Unknown hook action: ${action}`);
        return this.createNoOpHook();
    }
  }

  /**
   * Create a logging hook that outputs hook events to console.
   */
  private createLogHook(): HookCallback {
    return async (input: HookInput) => {
      console.log(`[Hook] ${input.hook_event_name}`, JSON.stringify(input, null, 2));

      return {};
    };
  }

  /**
   * Create a notification hook (placeholder for SSE integration).
   * Will be implemented in subsequent plans to send events to the client.
   */
  private createNotifyHook(_options?: Record<string, unknown>): HookCallback {
    return async (input: HookInput) => {
      // Placeholder - will send SSE notification in future plans
      console.log(`[Hook Notify] ${input.hook_event_name}`);

      return {};
    };
  }

  /**
   * Create a hook that blocks tools matching specified patterns.
   * Options:
   * - patterns: string[] - Glob patterns to block
   * - reason: string - Denial reason message
   */
  private createBlockPatternHook(options?: Record<string, unknown>): HookCallback {
    const patterns = (options?.patterns as string[]) || [];
    const reason = (options?.reason as string) || 'Blocked by pattern';

    return async (input: HookInput) => {
      // Only applies to PreToolUse events
      if (input.hook_event_name !== 'PreToolUse') {
        return {};
      }

      const preInput = input as PreToolUseHookInput;
      const toolName = preInput.tool_name;

      // Check if tool matches any blocked pattern
      for (const pattern of patterns) {
        if (this.matchesTool(toolName, pattern)) {
          return {
            hookSpecificOutput: {
              hookEventName: input.hook_event_name,
              permissionDecision: 'deny' as const,
              permissionDecisionReason: `${reason}: ${pattern}`
            }
          };
        }
      }

      return {};
    };
  }

  /**
   * Create a hook that auto-approves permission requests.
   */
  private createAllowHook(): HookCallback {
    return async (input: HookInput) => ({
      hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        permissionDecision: 'allow' as const
      }
    });
  }

  /**
   * Create a hook that auto-denies permission requests.
   * Options:
   * - reason: string - Denial reason message
   */
  private createDenyHook(options?: Record<string, unknown>): HookCallback {
    const reason = (options?.reason as string) || 'Denied by hook';

    return async (input: HookInput) => ({
      hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        permissionDecision: 'deny' as const,
        permissionDecisionReason: reason
      }
    });
  }

  /**
   * Create a no-op hook that does nothing.
   * Used as fallback for unknown action types.
   */
  private createNoOpHook(): HookCallback {
    return async () => ({});
  }

  /**
   * Check if a tool name matches a pattern.
   * Supports glob patterns via minimatch.
   */
  matchesTool(toolName: string, pattern: string): boolean {
    return minimatch(toolName, pattern);
  }
}

/** Singleton instance of HooksService */
export const hooksService = new HooksService();
