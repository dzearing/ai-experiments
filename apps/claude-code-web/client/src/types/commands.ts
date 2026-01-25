/**
 * Source scope for commands/skills
 */
export type CommandSource = 'builtin' | 'project' | 'user';

/**
 * Client-side command definition.
 * Mirrors server CommandSummary for API responses.
 */
export interface CommandDefinition {
  /** Command name (without slash) */
  name: string;

  /** Description shown in autocomplete popover */
  description: string;

  /** Optional argument hint (e.g., "[issue-number]") */
  argumentHint?: string;

  /** Where the command originated */
  source: CommandSource;

  /** Type of entry - command (simple) or skill (full) */
  type: 'command' | 'skill';
}

/**
 * Built-in command definition with icon support.
 * Extends the base command with client-specific UI fields.
 */
export interface BuiltinCommand extends CommandDefinition {
  source: 'builtin';
}
