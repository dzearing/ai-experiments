# Claude Code Plugin Commands Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable Ideate to discover and execute slash commands from Claude Code plugins installed on the user's system.

**Architecture:** Create a discovery service that reads Claude Code configuration files (`~/.claude/settings.json`, `~/.claude/plugins/installed_plugins.json`) to find enabled plugins and their commands. Parse command/skill markdown files to build a registry. Integrate with the existing `ChatInput` component's slash command system. Execute commands by either passing them to an active Claude Code session via the SDK or by reading the markdown content as a prompt template.

**Tech Stack:** TypeScript, Node.js file system APIs, Claude Agent SDK (`@anthropic-ai/claude-code`), React

---

## Task 1: Create Claude Code Config Types

**Files:**
- Create: `packages/ui-kit/react-chat/src/services/claudeCode/types.ts`

**Step 1: Write type definitions**

```typescript
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
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/services/claudeCode/types.ts
git commit -m "feat: add Claude Code plugin types"
```

---

## Task 2: Create Path Resolution Utilities

**Files:**
- Create: `packages/ui-kit/react-chat/src/services/claudeCode/paths.ts`

**Step 1: Write path utilities**

```typescript
import * as path from 'path';
import * as os from 'os';

import type { ClaudeCodePaths } from './types';

/**
 * Get Claude Code configuration paths
 */
export function getClaudeCodePaths(): ClaudeCodePaths {
  const home = path.join(os.homedir(), '.claude');

  return {
    home,
    settings: path.join(home, 'settings.json'),
    installedPlugins: path.join(home, 'plugins', 'installed_plugins.json'),
    userCommands: path.join(home, 'commands'),
    pluginCache: path.join(home, 'plugins', 'cache'),
  };
}

/**
 * Get project-level Claude paths for a given working directory
 */
export function getProjectClaudePaths(workingDir: string): {
  commands: string;
  settings: string;
} {
  const claudeDir = path.join(workingDir, '.claude');

  return {
    commands: path.join(claudeDir, 'commands'),
    settings: path.join(claudeDir, 'settings.json'),
  };
}
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/services/claudeCode/paths.ts
git commit -m "feat: add Claude Code path resolution utilities"
```

---

## Task 3: Create Settings Reader

**Files:**
- Create: `packages/ui-kit/react-chat/src/services/claudeCode/settings.ts`

**Step 1: Write settings reader**

```typescript
import * as fs from 'fs/promises';

import type { ClaudeCodeSettings, InstalledPluginsFile } from './types';
import { getClaudeCodePaths } from './paths';

/**
 * Read Claude Code user settings
 */
export async function readClaudeCodeSettings(): Promise<ClaudeCodeSettings | null> {
  const paths = getClaudeCodePaths();

  try {
    const content = await fs.readFile(paths.settings, 'utf-8');

    return JSON.parse(content) as ClaudeCodeSettings;
  } catch {
    return null;
  }
}

/**
 * Read installed plugins registry
 */
export async function readInstalledPlugins(): Promise<InstalledPluginsFile | null> {
  const paths = getClaudeCodePaths();

  try {
    const content = await fs.readFile(paths.installedPlugins, 'utf-8');

    return JSON.parse(content) as InstalledPluginsFile;
  } catch {
    return null;
  }
}

/**
 * Get list of enabled plugin identifiers
 */
export async function getEnabledPlugins(): Promise<string[]> {
  const settings = await readClaudeCodeSettings();

  if (!settings?.enabledPlugins) {
    return [];
  }

  return Object.entries(settings.enabledPlugins)
    .filter(([, enabled]) => enabled)
    .map(([pluginId]) => pluginId);
}

/**
 * Get install paths for enabled plugins
 */
export async function getEnabledPluginPaths(): Promise<Map<string, string>> {
  const enabledIds = await getEnabledPlugins();
  const installed = await readInstalledPlugins();

  if (!installed?.plugins) {
    return new Map();
  }

  const paths = new Map<string, string>();

  for (const pluginId of enabledIds) {
    const installations = installed.plugins[pluginId];

    if (installations && installations.length > 0) {
      // Use the first installation (typically user scope)
      paths.set(pluginId, installations[0].installPath);
    }
  }

  return paths;
}
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/services/claudeCode/settings.ts
git commit -m "feat: add Claude Code settings reader"
```

---

## Task 4: Create Command Parser

**Files:**
- Create: `packages/ui-kit/react-chat/src/services/claudeCode/commandParser.ts`

**Step 1: Write command file parser**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

import type { CommandFrontmatter, DiscoveredCommand } from './types';

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: CommandFrontmatter;
  body: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const [, yamlContent, body] = frontmatterMatch;
  const frontmatter: CommandFrontmatter = {};

  // Simple YAML parsing for common fields
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\S+):\s*(.*)$/);

    if (match) {
      const [, key, value] = match;

      (frontmatter as Record<string, string>)[key] = value.trim();
    }
  }

  return { frontmatter, body: body.trim() };
}

/**
 * Extract description from command content
 * Falls back to first line or paragraph if no frontmatter description
 */
function extractDescription(content: string, frontmatter: CommandFrontmatter): string {
  if (frontmatter.description) {
    return frontmatter.description;
  }

  // Remove frontmatter and get first meaningful line
  const { body } = parseFrontmatter(content);
  const firstLine = body.split('\n').find(line =>
    line.trim() && !line.startsWith('#') && !line.startsWith('!')
  );

  if (firstLine) {
    // Truncate to reasonable length
    return firstLine.length > 100 ? firstLine.slice(0, 97) + '...' : firstLine;
  }

  return 'No description available';
}

/**
 * Parse a command markdown file
 */
export async function parseCommandFile(
  filePath: string,
  source: DiscoveredCommand['source'],
  pluginName?: string
): Promise<DiscoveredCommand | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    const fileName = path.basename(filePath, '.md');
    const description = extractDescription(content, frontmatter);

    return {
      name: fileName,
      description,
      source,
      pluginName,
      filePath,
      usage: frontmatter['argument-hint']
        ? `/${fileName} ${frontmatter['argument-hint']}`
        : undefined,
      isSkill: false,
    };
  } catch {
    return null;
  }
}

/**
 * Parse a skill directory (contains SKILL.md)
 */
export async function parseSkillDirectory(
  skillDir: string,
  source: DiscoveredCommand['source'],
  pluginName?: string
): Promise<DiscoveredCommand | null> {
  const skillFile = path.join(skillDir, 'SKILL.md');

  try {
    const content = await fs.readFile(skillFile, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    const skillName = path.basename(skillDir);
    const description = extractDescription(content, frontmatter);

    return {
      name: skillName,
      description,
      source,
      pluginName,
      filePath: skillFile,
      usage: frontmatter['argument-hint']
        ? `/${skillName} ${frontmatter['argument-hint']}`
        : undefined,
      isSkill: true,
    };
  } catch {
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/services/claudeCode/commandParser.ts
git commit -m "feat: add Claude Code command file parser"
```

---

## Task 5: Create Command Discovery Service

**Files:**
- Create: `packages/ui-kit/react-chat/src/services/claudeCode/discovery.ts`

**Step 1: Write discovery service**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

import type { DiscoveredCommand, PluginManifest } from './types';
import { getClaudeCodePaths, getProjectClaudePaths } from './paths';
import { getEnabledPluginPaths } from './settings';
import { parseCommandFile, parseSkillDirectory } from './commandParser';

/**
 * Check if a path exists and is a directory
 */
async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);

    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path exists and is a file
 */
async function isFile(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);

    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Scan a commands directory for .md files
 */
async function scanCommandsDirectory(
  dirPath: string,
  source: DiscoveredCommand['source'],
  pluginName?: string
): Promise<DiscoveredCommand[]> {
  if (!(await isDirectory(dirPath))) {
    return [];
  }

  const commands: DiscoveredCommand[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(dirPath, entry.name);
        const command = await parseCommandFile(filePath, source, pluginName);

        if (command) {
          commands.push(command);
        }
      } else if (entry.isDirectory()) {
        // Check for nested commands in subdirectories
        const subDir = path.join(dirPath, entry.name);
        const subCommands = await scanCommandsDirectory(subDir, source, pluginName);

        commands.push(...subCommands);
      }
    }
  } catch {
    // Directory read failed, return empty
  }

  return commands;
}

/**
 * Scan a skills directory for skill subdirectories with SKILL.md
 */
async function scanSkillsDirectory(
  dirPath: string,
  source: DiscoveredCommand['source'],
  pluginName?: string
): Promise<DiscoveredCommand[]> {
  if (!(await isDirectory(dirPath))) {
    return [];
  }

  const skills: DiscoveredCommand[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = path.join(dirPath, entry.name);
        const skill = await parseSkillDirectory(skillDir, source, pluginName);

        if (skill) {
          skills.push(skill);
        }
      }
    }
  } catch {
    // Directory read failed, return empty
  }

  return skills;
}

/**
 * Read plugin manifest from .claude-plugin/plugin.json or plugin.json
 */
async function readPluginManifest(pluginPath: string): Promise<PluginManifest | null> {
  // Try .claude-plugin/plugin.json first
  const dotClaudePlugin = path.join(pluginPath, '.claude-plugin', 'plugin.json');

  if (await isFile(dotClaudePlugin)) {
    try {
      const content = await fs.readFile(dotClaudePlugin, 'utf-8');

      return JSON.parse(content) as PluginManifest;
    } catch {
      // Fall through to try root plugin.json
    }
  }

  // Try root plugin.json
  const rootPlugin = path.join(pluginPath, 'plugin.json');

  if (await isFile(rootPlugin)) {
    try {
      const content = await fs.readFile(rootPlugin, 'utf-8');

      return JSON.parse(content) as PluginManifest;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Discover commands from a single plugin
 */
async function discoverPluginCommands(
  pluginId: string,
  pluginPath: string
): Promise<DiscoveredCommand[]> {
  const manifest = await readPluginManifest(pluginPath);
  const pluginName = manifest?.name || pluginId.split('@')[0];
  const commands: DiscoveredCommand[] = [];

  // Scan default commands/ directory
  const commandsDir = path.join(pluginPath, 'commands');

  commands.push(...await scanCommandsDirectory(commandsDir, 'plugin', pluginName));

  // Scan default skills/ directory
  const skillsDir = path.join(pluginPath, 'skills');

  commands.push(...await scanSkillsDirectory(skillsDir, 'plugin', pluginName));

  // Handle custom command paths from manifest
  if (manifest?.commands) {
    const customPaths = Array.isArray(manifest.commands)
      ? manifest.commands
      : [manifest.commands];

    for (const customPath of customPaths) {
      const fullPath = path.join(pluginPath, customPath.replace(/^\.\//, ''));

      if (await isFile(fullPath)) {
        const cmd = await parseCommandFile(fullPath, 'plugin', pluginName);

        if (cmd) commands.push(cmd);
      } else if (await isDirectory(fullPath)) {
        commands.push(...await scanCommandsDirectory(fullPath, 'plugin', pluginName));
      }
    }
  }

  // Handle custom skill paths from manifest
  if (manifest?.skills) {
    const customPaths = Array.isArray(manifest.skills)
      ? manifest.skills
      : [manifest.skills];

    for (const customPath of customPaths) {
      const fullPath = path.join(pluginPath, customPath.replace(/^\.\//, ''));

      if (await isDirectory(fullPath)) {
        commands.push(...await scanSkillsDirectory(fullPath, 'plugin', pluginName));
      }
    }
  }

  return commands;
}

/**
 * Discover all available Claude Code commands
 */
export async function discoverAllCommands(
  workingDir?: string
): Promise<DiscoveredCommand[]> {
  const paths = getClaudeCodePaths();
  const allCommands: DiscoveredCommand[] = [];

  // 1. User-level commands (~/.claude/commands/)
  allCommands.push(...await scanCommandsDirectory(paths.userCommands, 'user'));

  // 2. Project-level commands (.claude/commands/)
  if (workingDir) {
    const projectPaths = getProjectClaudePaths(workingDir);

    allCommands.push(...await scanCommandsDirectory(projectPaths.commands, 'project'));
  }

  // 3. Plugin commands
  const enabledPlugins = await getEnabledPluginPaths();

  for (const [pluginId, pluginPath] of enabledPlugins) {
    const pluginCommands = await discoverPluginCommands(pluginId, pluginPath);

    allCommands.push(...pluginCommands);
  }

  // Deduplicate by name (project takes priority over user, user over plugin)
  const commandMap = new Map<string, DiscoveredCommand>();
  const priority: Record<DiscoveredCommand['source'], number> = {
    project: 3,
    user: 2,
    plugin: 1,
    builtin: 0,
  };

  for (const cmd of allCommands) {
    const existing = commandMap.get(cmd.name);

    if (!existing || priority[cmd.source] > priority[existing.source]) {
      commandMap.set(cmd.name, cmd);
    }
  }

  return Array.from(commandMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Read the content of a command file for execution
 */
export async function readCommandContent(command: DiscoveredCommand): Promise<string | null> {
  try {
    return await fs.readFile(command.filePath, 'utf-8');
  } catch {
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/services/claudeCode/discovery.ts
git commit -m "feat: add Claude Code command discovery service"
```

---

## Task 6: Create Service Index

**Files:**
- Create: `packages/ui-kit/react-chat/src/services/claudeCode/index.ts`

**Step 1: Write index file**

```typescript
export * from './types';
export * from './paths';
export * from './settings';
export * from './commandParser';
export * from './discovery';
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/services/claudeCode/index.ts
git commit -m "feat: add Claude Code service index"
```

---

## Task 7: Create React Hook for Command Discovery

**Files:**
- Create: `packages/ui-kit/react-chat/src/hooks/useClaudeCodeCommands.ts`

**Step 1: Write the hook**

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';

import type { DiscoveredCommand } from '../services/claudeCode/types';
import type { SlashCommand } from '../components/ChatInput/SlashCommand.types';
import { discoverAllCommands, readCommandContent } from '../services/claudeCode/discovery';

export interface UseClaudeCodeCommandsOptions {
  /** Working directory for project-level command discovery */
  workingDir?: string;
  /** Whether to enable discovery (can disable for browser-only environments) */
  enabled?: boolean;
  /** Callback when a Claude Code command is executed */
  onExecute?: (command: DiscoveredCommand, content: string, args: string) => void;
}

export interface UseClaudeCodeCommandsResult {
  /** Discovered commands as SlashCommand objects for ChatInput */
  commands: SlashCommand[];
  /** Raw discovered command data */
  discoveredCommands: DiscoveredCommand[];
  /** Loading state */
  isLoading: boolean;
  /** Error if discovery failed */
  error: Error | null;
  /** Refresh the command list */
  refresh: () => Promise<void>;
  /** Execute a discovered command by name */
  executeCommand: (name: string, args: string) => Promise<boolean>;
}

/**
 * Hook for discovering and using Claude Code plugin commands
 */
export function useClaudeCodeCommands(
  options: UseClaudeCodeCommandsOptions = {}
): UseClaudeCodeCommandsResult {
  const { workingDir, enabled = true, onExecute } = options;

  const [discoveredCommands, setDiscoveredCommands] = useState<DiscoveredCommand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const commands = await discoverAllCommands(workingDir);

      setDiscoveredCommands(commands);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to discover commands'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workingDir]);

  // Initial discovery
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Convert to SlashCommand format
  const commands = useMemo((): SlashCommand[] => {
    return discoveredCommands.map(cmd => ({
      name: cmd.pluginName ? `${cmd.pluginName}:${cmd.name}` : cmd.name,
      description: cmd.description,
      usage: cmd.usage,
      // Skills can also be invoked without the plugin prefix
      aliases: cmd.pluginName ? [cmd.name] : undefined,
    }));
  }, [discoveredCommands]);

  // Execute a command
  const executeCommand = useCallback(async (name: string, args: string): Promise<boolean> => {
    // Find the command (check both prefixed and unprefixed names)
    const command = discoveredCommands.find(cmd => {
      const prefixedName = cmd.pluginName ? `${cmd.pluginName}:${cmd.name}` : cmd.name;

      return prefixedName === name || cmd.name === name;
    });

    if (!command) {
      return false;
    }

    const content = await readCommandContent(command);

    if (!content) {
      return false;
    }

    if (onExecute) {
      onExecute(command, content, args);
    }

    return true;
  }, [discoveredCommands, onExecute]);

  return {
    commands,
    discoveredCommands,
    isLoading,
    error,
    refresh,
    executeCommand,
  };
}
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/hooks/useClaudeCodeCommands.ts
git commit -m "feat: add useClaudeCodeCommands hook"
```

---

## Task 8: Export Hook from Package

**Files:**
- Modify: `packages/ui-kit/react-chat/src/index.ts`

**Step 1: Add export**

Find the hooks exports section and add:

```typescript
export { useClaudeCodeCommands } from './hooks/useClaudeCodeCommands';
export type { UseClaudeCodeCommandsOptions, UseClaudeCodeCommandsResult } from './hooks/useClaudeCodeCommands';

// Also export the service types for advanced usage
export type {
  DiscoveredCommand,
  ClaudeCodeSettings,
  PluginManifest,
} from './services/claudeCode/types';
```

**Step 2: Commit**

```bash
git add packages/ui-kit/react-chat/src/index.ts
git commit -m "feat: export Claude Code commands hook and types"
```

---

## Task 9: Integrate with Ideate Chat

**Files:**
- Modify: `apps/v1/client/src/components/chat/ChatPanel.tsx` (or equivalent main chat component)

**Step 1: Import and use the hook**

```typescript
import { useClaudeCodeCommands } from '@claude-flow/react-chat';

// Inside the component:
const {
  commands: claudeCodeCommands,
  executeCommand: executeClaudeCodeCommand,
  isLoading: isLoadingCommands
} = useClaudeCodeCommands({
  workingDir: workspace?.path,
  enabled: true,
  onExecute: (command, content, args) => {
    // Inject the command content as a system message or context
    // This depends on how your chat system works
    console.log('Executing command:', command.name, 'with args:', args);
  }
});

// Merge with existing commands
const allCommands = useMemo(() => [
  ...builtInCommands,
  ...claudeCodeCommands,
], [builtInCommands, claudeCodeCommands]);

// Handle command execution
const handleCommand = useCallback((command: string, args: string) => {
  // Check if it's a Claude Code command
  if (executeClaudeCodeCommand(command, args)) {
    return { handled: true, clearInput: true };
  }

  // Fall back to built-in command handling
  // ... existing command handling logic
}, [executeClaudeCodeCommand]);
```

**Step 2: Pass commands to ChatInput**

```tsx
<ChatInput
  commands={allCommands}
  onCommand={handleCommand}
  // ... other props
/>
```

**Step 3: Commit**

```bash
git add apps/v1/client/src/components/chat/ChatPanel.tsx
git commit -m "feat: integrate Claude Code plugin commands in Ideate chat"
```

---

## Task 10: Add Server-Side Discovery Endpoint (Optional)

For browser environments that can't access the filesystem directly, create a server endpoint.

**Files:**
- Create: `apps/v1/server/src/routes/claude-code.ts`

**Step 1: Write the endpoint**

```typescript
import { Router } from 'express';
import { discoverAllCommands } from '@claude-flow/react-chat/services/claudeCode';

const router = Router();

/**
 * GET /api/claude-code/commands
 * Discover available Claude Code commands
 */
router.get('/commands', async (req, res) => {
  try {
    const workingDir = req.query.workingDir as string | undefined;
    const commands = await discoverAllCommands(workingDir);

    res.json({ commands });
  } catch (error) {
    console.error('Failed to discover Claude Code commands:', error);
    res.status(500).json({ error: 'Failed to discover commands' });
  }
});

/**
 * GET /api/claude-code/commands/:name/content
 * Get the content of a specific command
 */
router.get('/commands/:name/content', async (req, res) => {
  try {
    const { name } = req.params;
    const workingDir = req.query.workingDir as string | undefined;
    const commands = await discoverAllCommands(workingDir);

    const command = commands.find(cmd => cmd.name === name);

    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }

    const fs = await import('fs/promises');
    const content = await fs.readFile(command.filePath, 'utf-8');

    res.json({ command, content });
  } catch (error) {
    console.error('Failed to read command content:', error);
    res.status(500).json({ error: 'Failed to read command' });
  }
});

export default router;
```

**Step 2: Register the route**

In your main server file, add:

```typescript
import claudeCodeRoutes from './routes/claude-code';

app.use('/api/claude-code', claudeCodeRoutes);
```

**Step 3: Commit**

```bash
git add apps/v1/server/src/routes/claude-code.ts
git commit -m "feat: add server endpoint for Claude Code command discovery"
```

---

## Task 11: Build and Test

**Step 1: Build the packages**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 2: Start development server**

Run: `pnpm dev:v1`
Expected: Server starts successfully

**Step 3: Test command discovery**

1. Open Ideate in browser
2. Open a chat panel
3. Type "/" in the chat input
4. Expected: See Claude Code plugin commands in autocomplete (e.g., "superpowers:brainstorm", "superpowers:write-plan")

**Step 4: Test command execution**

1. Select a command from autocomplete
2. Press Enter/Tab
3. Expected: Command is recognized and handled

**Step 5: Commit final changes**

```bash
git add -A
git commit -m "feat: complete Claude Code plugin commands integration"
```

---

## Summary

This implementation provides:

1. **Type-safe interfaces** for Claude Code configuration and plugins
2. **Discovery service** that reads from `~/.claude/` configuration
3. **Command parser** that extracts metadata from markdown frontmatter
4. **React hook** for easy integration with chat components
5. **Server endpoint** for browser environments without direct filesystem access

The architecture follows the existing patterns in the codebase and integrates seamlessly with the `ChatInput` component's slash command system.

## Sources

- [Plugins reference - Claude Code Docs](https://code.claude.com/docs/en/plugins-reference)
- [Slash Commands in the SDK - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/slash-commands)
- [Customize Claude Code with plugins | Claude](https://claude.com/blog/claude-code-plugins)
