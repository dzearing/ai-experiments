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
