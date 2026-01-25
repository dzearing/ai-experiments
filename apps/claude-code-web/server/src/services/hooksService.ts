/**
 * HooksService builds SDK-compatible hook callbacks from configuration.
 *
 * This service transforms settings.json hook definitions into TypeScript
 * callbacks that the SDK's query() function accepts via options.hooks.
 *
 * Built-in actions:
 * - 'log': Log hook events to console
 * - 'notify': Send notification via callback
 * - 'block-pattern': Block tools matching a pattern
 * - 'allow': Auto-approve permission requests
 * - 'deny': Auto-deny permission requests with optional reason
 * - 'block-dangerous': Block dangerous bash commands (PreToolUse only)
 * - 'auto-approve-readonly': Auto-approve read-only tools (PreToolUse only)
 * - 'inject-message': Inject system message for Claude (PreToolUse only)
 * - 'add-context': Add context after tool execution (PostToolUse only)
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
import { createPreToolUseHook } from '../hooks/preToolUseHook.js';
import { createPostToolUseHook } from '../hooks/postToolUseHook.js';
import { createSessionStartHook, createSessionEndHook } from '../hooks/sessionHooks.js';
import { createSubagentStartHook, createSubagentStopHook } from '../hooks/subagentHooks.js';
import {
  createUserPromptSubmitHook,
  createPermissionRequestHook,
  createPreCompactHook,
} from '../hooks/lifecycleHooks.js';

/**
 * Notification callback shape for hook activity events.
 */
export interface HookNotification {
  hookEvent: string;
  toolName?: string;
  decision?: string;
  reason?: string;
}

export class HooksService {
  private notifyCallback?: (event: HookNotification) => void;

  /**
   * Set a callback to receive hook activity notifications.
   * Used for SSE notifications to client.
   */
  setNotifyCallback(callback: (event: HookNotification) => void): void {
    this.notifyCallback = callback;
  }

  /**
   * Clear the notification callback.
   */
  clearNotifyCallback(): void {
    this.notifyCallback = undefined;
  }

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
        hooks: [this.wrapWithNotification(this.createCallbackForAction(hookEvent, m.action, m.options), hookEvent)]
      }));
    }

    return hooks;
  }

  /**
   * Wrap a hook callback to send notifications.
   */
  private wrapWithNotification(callback: HookCallback, hookEvent: HookEvent): HookCallback {
    return async (input, toolUseID, options) => {
      const result = await callback(input, toolUseID, options);

      // Extract tool name if available
      let toolName: string | undefined;

      if (input.hook_event_name === 'PreToolUse' || input.hook_event_name === 'PostToolUse') {
        toolName = (input as PreToolUseHookInput).tool_name;
      }

      // Notify if callback is registered
      if (this.notifyCallback) {
        this.notifyCallback({
          hookEvent,
          toolName,
          decision: result.hookSpecificOutput?.permissionDecision,
          reason: result.hookSpecificOutput?.permissionDecisionReason
        });
      }

      return result;
    };
  }

  /**
   * Create a hook callback for a specific event and action.
   * Routes to specialized factories for each hook event type.
   */
  private createCallbackForAction(event: HookEvent, action: string, options?: Record<string, unknown>): HookCallback {
    const opts = { ...options, action };

    switch (event) {
      case 'PreToolUse':
        return createPreToolUseHook(opts);
      case 'PostToolUse':
        return createPostToolUseHook(opts);
      case 'SessionStart':
        return createSessionStartHook(opts);
      case 'SessionEnd':
        return createSessionEndHook(opts);
      case 'SubagentStart':
        return createSubagentStartHook(opts);
      case 'SubagentStop':
        return createSubagentStopHook(opts);
      case 'UserPromptSubmit':
        return createUserPromptSubmitHook(opts);
      case 'PermissionRequest':
        return createPermissionRequestHook(opts);
      case 'PreCompact':
        return createPreCompactHook(opts);
      default:
        // For remaining events (PostToolUseFailure, Stop, Notification), use generic handlers
        return this.createGenericHook(action, options);
    }
  }

  /**
   * Generic hook implementation for events not yet specialized.
   */
  private createGenericHook(action: string, options?: Record<string, unknown>): HookCallback {
    switch (action) {
      case 'log':
        return async (input: HookInput) => {
          console.log(`[Hook] ${input.hook_event_name}`, input);
          return {};
        };
      case 'allow':
        return async (input: HookInput) => ({
          hookSpecificOutput: {
            hookEventName: input.hook_event_name,
            permissionDecision: 'allow' as const
          }
        });
      case 'deny':
        return async (input: HookInput) => ({
          hookSpecificOutput: {
            hookEventName: input.hook_event_name,
            permissionDecision: 'deny' as const,
            permissionDecisionReason: (options?.reason as string) || 'Denied by hook'
          }
        });
      default:
        return async () => ({});
    }
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
