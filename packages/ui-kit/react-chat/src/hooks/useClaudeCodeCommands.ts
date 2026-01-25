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
