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
 * @param dirPath - Directory path to scan
 * @param source - Source of the command (user, project, plugin, builtin)
 * @param pluginName - Optional plugin name for plugin-sourced commands
 * @param maxDepth - Maximum recursion depth to prevent symlink loops (default: 5)
 */
async function scanCommandsDirectory(
  dirPath: string,
  source: DiscoveredCommand['source'],
  pluginName?: string,
  maxDepth: number = 5
): Promise<DiscoveredCommand[]> {
  if (maxDepth <= 0 || !(await isDirectory(dirPath))) {
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
        const subCommands = await scanCommandsDirectory(subDir, source, pluginName, maxDepth - 1);

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
