/**
 * Type definitions for slash commands and skills.
 *
 * Commands: Simple markdown files in .claude/commands/ with optional frontmatter
 * Skills: Richer format in .claude/skills/{name}/SKILL.md with supporting files
 *
 * Both create the same /name invocation - skills are "richer commands".
 */

/**
 * Where the command was discovered from.
 * Project scope takes precedence over user scope for same-named commands.
 */
export type CommandSource = 'builtin' | 'project' | 'user';

/**
 * Definition of a slash command or skill.
 * Parsed from .md files with YAML frontmatter.
 */
export interface CommandDefinition {
  /** Command name without the leading / (e.g., "review" for /review) */
  name: string;

  /** Brief description for autocomplete display */
  description: string;

  /** Hint for what arguments the command accepts (e.g., "[issue-number]") */
  argumentHint?: string;

  /** Model override for this command (e.g., "claude-sonnet-4-5-20250929") */
  model?: string;

  /** Tools this command is allowed to use (from frontmatter allowed-tools) */
  allowedTools?: string[];

  /** Full markdown content (after frontmatter extraction) */
  content: string;

  /** Where this command was loaded from */
  source: CommandSource;

  /** Whether this is a simple command or a full skill */
  type: 'command' | 'skill';

  /** Skill-only: Prevent Claude from auto-loading based on task relevance */
  disableModelInvocation?: boolean;

  /** Whether users can invoke with /name (default true) */
  userInvocable?: boolean;

  /** Skill-only: Run in subagent context */
  context?: 'fork';
}

/**
 * Simplified command definition for API responses.
 * Excludes full content to reduce payload size.
 */
export interface CommandSummary {
  name: string;
  description: string;
  argumentHint?: string;
  source: CommandSource;
  type: 'command' | 'skill';
}
