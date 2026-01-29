import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SlashCommand as UISlashCommand, SlashCommandResult, DiscoveredCommand } from '@ui-kit/react-chat';
import { API_URL } from '../config';

/**
 * Response from the Claude Code commands API
 */
interface DiscoverCommandsResponse {
  commands: DiscoveredCommand[];
}

/**
 * Response from the Claude Code command content API
 */
interface CommandContentResponse {
  command: DiscoveredCommand;
  content: string;
}

/**
 * Options for the useClaudeCodeCommands hook
 */
export interface UseClaudeCodeCommandsOptions {
  /** Whether to enable discovery */
  enabled?: boolean;
  /** Callback when a command is executed */
  onExecute?: (command: DiscoveredCommand, content: string, args: string) => void;
}

/**
 * Result from the useClaudeCodeCommands hook
 */
export interface UseClaudeCodeCommandsResult {
  /** Discovered commands as SlashCommand objects for ChatInput */
  commands: UISlashCommand[];
  /** Raw discovered command data */
  discoveredCommands: DiscoveredCommand[];
  /** Loading state */
  isLoading: boolean;
  /** Error if discovery failed */
  error: Error | null;
  /** Refresh the command list */
  refresh: () => Promise<void>;
  /** Handler function for command execution */
  handleCommand: (command: string, args: string) => Promise<SlashCommandResult>;
}

/**
 * Hook for discovering and using Claude Code plugin commands via server API
 *
 * This hook fetches Claude Code commands from the server (which has access
 * to the file system) and provides them in a format compatible with ChatInput.
 */
export function useClaudeCodeCommands(
  options: UseClaudeCodeCommandsOptions = {}
): UseClaudeCodeCommandsResult {
  const { enabled = true, onExecute } = options;

  const [discoveredCommands, setDiscoveredCommands] = useState<DiscoveredCommand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/claude-code/commands`);

      if (!response.ok) {
        throw new Error(`Failed to fetch commands: ${response.statusText}`);
      }

      const data: DiscoverCommandsResponse = await response.json();

      setDiscoveredCommands(data.commands);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to discover commands'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial discovery with cancellation
  useEffect(() => {
    let cancelled = false;

    const doRefresh = async () => {
      if (!enabled) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/claude-code/commands`);

        if (!response.ok) {
          throw new Error(`Failed to fetch commands: ${response.statusText}`);
        }

        const data: DiscoverCommandsResponse = await response.json();

        if (!cancelled) {
          setDiscoveredCommands(data.commands);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to discover commands'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    doRefresh();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Convert to SlashCommand format
  const commands = useMemo((): UISlashCommand[] => {
    return discoveredCommands.map(cmd => ({
      name: cmd.pluginName ? `${cmd.pluginName}:${cmd.name}` : cmd.name,
      description: cmd.description,
      usage: cmd.usage,
    }));
  }, [discoveredCommands]);

  // Handle command execution
  const handleCommand = useCallback(async (name: string, args: string): Promise<SlashCommandResult> => {
    // Find the command
    const command = discoveredCommands.find(cmd => {
      const prefixedName = cmd.pluginName ? `${cmd.pluginName}:${cmd.name}` : cmd.name;

      return prefixedName === name || cmd.name === name;
    });

    if (!command) {
      return { handled: false };
    }

    try {
      // Fetch the command content from the server
      const response = await fetch(`${API_URL}/api/claude-code/commands/${encodeURIComponent(name)}/content`);

      if (!response.ok) {
        console.error(`[useClaudeCodeCommands] Failed to fetch command content: ${response.statusText}`);

        return { handled: false };
      }

      const data: CommandContentResponse = await response.json();

      if (onExecute) {
        onExecute(data.command, data.content, args);
      }

      return { handled: true, clearInput: true };
    } catch (err) {
      console.error('[useClaudeCodeCommands] Error executing command:', err);

      return { handled: false };
    }
  }, [discoveredCommands, onExecute]);

  return {
    commands,
    discoveredCommands,
    isLoading,
    error,
    refresh,
    handleCommand,
  };
}
