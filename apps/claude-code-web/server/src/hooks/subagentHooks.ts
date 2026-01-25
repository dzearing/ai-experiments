/**
 * Subagent lifecycle hooks.
 * Hooks for tracking subagent spawn and completion events.
 */

import type {
  HookCallback,
  SubagentStartHookInput,
  SubagentStopHookInput,
} from '../types/hooks.js';

/**
 * Log subagent spawn event.
 */
export const logSubagentStart: HookCallback = async (input) => {
  if (input.hook_event_name !== 'SubagentStart') return {};

  const agentInput = input as SubagentStartHookInput;
  console.log(`[SubagentStart] Agent ${agentInput.agent_id} spawned`, {
    type: agentInput.agent_type,
    parentSession: agentInput.session_id,
  });

  return {};
};

/**
 * Log subagent completion event.
 */
export const logSubagentStop: HookCallback = async (input) => {
  if (input.hook_event_name !== 'SubagentStop') return {};

  const agentInput = input as SubagentStopHookInput;
  console.log(`[SubagentStop] Agent ${agentInput.agent_id} completed`, {
    transcriptPath: agentInput.agent_transcript_path,
  });

  return {};
};

/**
 * Track subagent lifecycle for metrics or UI updates.
 */
export function createSubagentTrackerHook(
  onStart: (agentId: string, agentType: string) => void,
  onStop: (agentId: string, transcriptPath: string) => void
): { start: HookCallback; stop: HookCallback } {
  return {
    start: async (input) => {
      if (input.hook_event_name !== 'SubagentStart') return {};

      const agentInput = input as SubagentStartHookInput;
      onStart(agentInput.agent_id, agentInput.agent_type);

      return {};
    },
    stop: async (input) => {
      if (input.hook_event_name !== 'SubagentStop') return {};

      const agentInput = input as SubagentStopHookInput;
      onStop(agentInput.agent_id, agentInput.agent_transcript_path);

      return {};
    },
  };
}

/**
 * Create a SubagentStart hook from configuration options.
 */
export function createSubagentStartHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  return action === 'log' ? logSubagentStart : logSubagentStart;
}

/**
 * Create a SubagentStop hook from configuration options.
 */
export function createSubagentStopHook(options?: Record<string, unknown>): HookCallback {
  const action = (options?.action as string) || 'log';

  return action === 'log' ? logSubagentStop : logSubagentStop;
}
