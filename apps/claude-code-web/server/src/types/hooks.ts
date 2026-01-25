/**
 * Hook type definitions for the Claude Code Web server.
 * Matches the SDK hooks API with TypeScript callback-based hooks.
 *
 * SDK hooks fire at different lifecycle points:
 * - Tool execution: PreToolUse, PostToolUse, PostToolUseFailure
 * - Session lifecycle: SessionStart, SessionEnd
 * - User interaction: UserPromptSubmit, PermissionRequest
 * - Context management: PreCompact, Stop
 * - Subagent tracking: SubagentStart, SubagentStop
 * - Notifications: Notification
 */

/**
 * All 11 SDK hook event types.
 * TypeScript-only events: PostToolUseFailure, SessionStart, SessionEnd, SubagentStart, PermissionRequest, Notification
 */
export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'UserPromptSubmit'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Stop'
  | 'SubagentStart'
  | 'SubagentStop'
  | 'PreCompact'
  | 'PermissionRequest'
  | 'Notification';

/**
 * Base fields present in all hook inputs.
 */
export interface BaseHookInput {
  /** The hook event name */
  hook_event_name: string;

  /** SDK session identifier */
  session_id: string;

  /** Path to the transcript file */
  transcript_path: string;

  /** Current working directory */
  cwd: string;

  /** Permission mode (if applicable) */
  permission_mode?: string;
}

/**
 * PreToolUse hook input - fires before tool execution.
 * Can block, allow, or modify tool input.
 */
export interface PreToolUseHookInput extends BaseHookInput {
  hook_event_name: 'PreToolUse';

  /** Name of the tool being invoked */
  tool_name: string;

  /** Tool input parameters */
  tool_input: Record<string, unknown>;
}

/**
 * PostToolUse hook input - fires after successful tool execution.
 * Can log, notify, or inject system messages.
 */
export interface PostToolUseHookInput extends BaseHookInput {
  hook_event_name: 'PostToolUse';

  /** Name of the tool that was executed */
  tool_name: string;

  /** Tool input parameters */
  tool_input: Record<string, unknown>;

  /** Tool execution response/output */
  tool_response: unknown;
}

/**
 * PostToolUseFailure hook input - fires when tool execution fails (TypeScript SDK only).
 */
export interface PostToolUseFailureHookInput extends BaseHookInput {
  hook_event_name: 'PostToolUseFailure';

  /** Name of the tool that failed */
  tool_name: string;

  /** Tool input parameters */
  tool_input: Record<string, unknown>;

  /** Error information */
  error: unknown;
}

/**
 * SessionStart hook input - fires when session starts (TypeScript SDK only).
 */
export interface SessionStartHookInput extends BaseHookInput {
  hook_event_name: 'SessionStart';

  /** What triggered the session start */
  source: 'startup' | 'resume' | 'clear' | 'compact';
}

/**
 * SessionEnd hook input - fires when session ends (TypeScript SDK only).
 */
export interface SessionEndHookInput extends BaseHookInput {
  hook_event_name: 'SessionEnd';

  /** Reason the session ended */
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
}

/**
 * SubagentStart hook input - fires when a subagent is spawned (TypeScript SDK only).
 */
export interface SubagentStartHookInput extends BaseHookInput {
  hook_event_name: 'SubagentStart';

  /** Unique identifier for the subagent */
  agent_id: string;

  /** Type of subagent (e.g., 'task', 'search') */
  agent_type: string;
}

/**
 * SubagentStop hook input - fires when a subagent completes.
 */
export interface SubagentStopHookInput extends BaseHookInput {
  hook_event_name: 'SubagentStop';

  /** Whether the stop hook is actively preventing completion */
  stop_hook_active: boolean;

  /** Unique identifier for the subagent */
  agent_id: string;

  /** Path to the subagent's transcript */
  agent_transcript_path: string;
}

/**
 * UserPromptSubmit hook input - fires when user submits a prompt.
 * Can validate, block, or modify prompt content.
 */
export interface UserPromptSubmitHookInput extends BaseHookInput {
  hook_event_name: 'UserPromptSubmit';

  /** The user's prompt text */
  prompt: string;
}

/**
 * PreCompact hook input - fires before context compaction.
 */
export interface PreCompactHookInput extends BaseHookInput {
  hook_event_name: 'PreCompact';

  /** What triggered the compaction */
  trigger: 'manual' | 'auto';

  /** Custom instructions for compaction (if any) */
  custom_instructions?: string;
}

/**
 * PermissionRequest hook input - fires when permission is requested (TypeScript SDK only).
 */
export interface PermissionRequestHookInput extends BaseHookInput {
  hook_event_name: 'PermissionRequest';

  /** Name of the tool requesting permission */
  tool_name: string;

  /** Tool input parameters */
  tool_input: Record<string, unknown>;

  /** SDK-suggested permission updates */
  permission_suggestions?: PermissionUpdate[];
}

/**
 * Permission update suggestion from SDK.
 */
export interface PermissionUpdate {
  /** Tool name or pattern */
  tool: string;

  /** Suggested action */
  action: 'allow' | 'deny';
}

/**
 * Stop hook input - fires when agent is stopped.
 */
export interface StopHookInput extends BaseHookInput {
  hook_event_name: 'Stop';
}

/**
 * Notification hook input - fires for notifications (TypeScript SDK only).
 */
export interface NotificationHookInput extends BaseHookInput {
  hook_event_name: 'Notification';

  /** Notification message */
  message: string;

  /** Notification severity/type */
  level?: 'info' | 'warning' | 'error';
}

/**
 * Union of all hook input types.
 */
export type HookInput =
  | PreToolUseHookInput
  | PostToolUseHookInput
  | PostToolUseFailureHookInput
  | SessionStartHookInput
  | SessionEndHookInput
  | SubagentStartHookInput
  | SubagentStopHookInput
  | UserPromptSubmitHookInput
  | PreCompactHookInput
  | PermissionRequestHookInput
  | StopHookInput
  | NotificationHookInput;

/**
 * Hook-specific output fields within HookJSONOutput.
 */
export interface HookSpecificOutput {
  /** Must match the input's hook_event_name */
  hookEventName: string;

  /** Permission decision for tool-related hooks */
  permissionDecision?: 'allow' | 'deny' | 'ask';

  /** Reason for the permission decision */
  permissionDecisionReason?: string;

  /** Modified tool input (requires permissionDecision: 'allow') */
  updatedInput?: Record<string, unknown>;

  /** Additional context for Claude to see */
  additionalContext?: string;
}

/**
 * Hook output structure returned from callbacks.
 * Controls whether agent continues, injects messages, or modifies behavior.
 */
export interface HookJSONOutput {
  /** Should agent continue (default: true) */
  continue?: boolean;

  /** Message if continue: false */
  stopReason?: string;

  /** Hide output from transcript */
  suppressOutput?: boolean;

  /** Inject message for Claude to see */
  systemMessage?: string;

  /** Hook-specific output fields */
  hookSpecificOutput?: HookSpecificOutput;
}

/**
 * Hook callback function type.
 * Matches the SDK's expected callback signature.
 */
export type HookCallback = (
  input: HookInput,
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>;

/**
 * A single hook configuration entry from settings.json.
 */
export interface HookConfigEntry {
  /** Glob pattern to match tool names (for tool-related hooks) */
  matcher?: string;

  /** Built-in action type */
  action: string;

  /** Additional options for the action */
  options?: Record<string, unknown>;
}

/**
 * Hooks configuration schema for settings.json.
 * Maps hook events to arrays of configuration entries.
 */
export type HooksConfig = Partial<Record<HookEvent, HookConfigEntry[]>>;

/**
 * A hook matcher with associated callbacks.
 * Used in SDK hooks options.
 */
export interface HookMatcher {
  /** Glob pattern to match tool names (optional) */
  matcher?: string;

  /** Callback functions to execute */
  hooks: HookCallback[];
}

/**
 * SDK-compatible hooks options structure.
 * Passed to query() options.hooks.
 */
export type SDKHooksOptions = Partial<Record<HookEvent, HookMatcher[]>>;
