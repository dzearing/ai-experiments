/**
 * Types for Claude Code configuration and plugin discovery
 */

export interface ClaudeCodeSettings {
  $schema?: string;
  model?: string;
  hooks?: Record<string, unknown>;
  statusLine?: unknown;
  enabledPlugins?: Record<string, boolean>;
}

export interface InstalledPlugin {
  scope: 'user' | 'project' | 'local' | 'managed';
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

export interface InstalledPluginsFile {
  version: number;
  plugins: Record<string, InstalledPlugin[]>;
}

export interface PluginManifest {
  name: string;
  version?: string;
  description?: string;
  author?: {
    name?: string;
    email?: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  commands?: string | string[];
  agents?: string | string[];
  skills?: string | string[];
  hooks?: string | Record<string, unknown>;
  mcpServers?: string | Record<string, unknown>;
}

export interface CommandFrontmatter {
  description?: string;
  'allowed-tools'?: string;
  model?: string;
  'argument-hint'?: string;
}

export interface DiscoveredCommand {
  /** Command name without "/" prefix (e.g., "brainstorm") */
  name: string;
  /** Human-readable description */
  description: string;
  /** Source of the command */
  source: 'builtin' | 'user' | 'project' | 'plugin';
  /** Plugin name if source is 'plugin' */
  pluginName?: string;
  /** Full path to the command markdown file */
  filePath: string;
  /** Optional usage hint with argument placeholders */
  usage?: string;
  /** Whether this is a skill (has SKILL.md) vs simple command */
  isSkill: boolean;
}

export interface ClaudeCodePaths {
  home: string;
  settings: string;
  installedPlugins: string;
  userCommands: string;
  pluginCache: string;
}
