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
