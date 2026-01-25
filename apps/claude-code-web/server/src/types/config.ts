/**
 * Configuration type definitions for the Claude Code Web server.
 * Mirrors Claude Code's hierarchical configuration system.
 */

import type { HooksConfig } from './hooks.js';

/**
 * Full configuration for a session.
 * Loaded from CLAUDE.md hierarchy, settings.json hierarchy, and .claude/rules/.
 */
export interface SessionConfig {
  /** Working directory for the session */
  cwd: string;

  /** Detected project root (contains .git, package.json, or CLAUDE.md) */
  projectRoot: string;

  /** Merged system prompt from all CLAUDE.md sources */
  systemPrompt: string;

  /** Merged settings from settings.json hierarchy */
  settings: Settings;

  /** Loaded rule files from .claude/rules/ */
  rules: RuleFile[];

  /** Environment variables for tool execution */
  env: Record<string, string>;
}

/**
 * Settings parsed from settings.json hierarchy.
 * User (~/.claude/settings.json) < Project (.claude/settings.json) < Local (.claude/settings.local.json)
 */
export interface Settings {
  /** Permission rules for tool approval */
  permissions?: PermissionRule[];

  /** Environment variables to pass to tools */
  env?: Record<string, string>;

  /** Model preference */
  model?: string;

  /** Hooks configuration for tool and session lifecycle events */
  hooks?: HooksConfig;
}

/**
 * Permission rule for tool approval.
 * Supports wildcard patterns for tool names (e.g., "mcp__*").
 */
export interface PermissionRule {
  /** Tool name or glob pattern (e.g., "Bash", "mcp__*") */
  tool: string;

  /** Allow this tool */
  allow?: boolean;

  /** Deny this tool */
  deny?: boolean;
}

/**
 * A single rule file loaded from .claude/rules/.
 * Supports YAML frontmatter with paths field for path-specific rules.
 */
export interface RuleFile {
  /** Absolute path to the rule file */
  path: string;

  /** Content of the rule (after frontmatter extraction) */
  content: string;

  /** Glob pattern for path-specific rules (from frontmatter) */
  paths?: string;
}

/**
 * Tracks where a CLAUDE.md content came from.
 * Used for debugging and transparency.
 */
export interface ClaudeMdSource {
  /** Absolute path to the CLAUDE.md file */
  path: string;

  /** Content of the file */
  content: string;

  /** Hierarchy level */
  level: 'global' | 'project' | 'local' | 'subdirectory';
}
