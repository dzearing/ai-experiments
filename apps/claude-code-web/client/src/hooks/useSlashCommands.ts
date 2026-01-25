import { useState, useEffect, useCallback, useMemo } from 'react';

import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { HelpIcon } from '@ui-kit/icons/HelpIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import type { SlashCommand, SlashCommandResult } from '@ui-kit/react-chat';

import type { CommandDefinition } from '../types/commands';

/**
 * Built-in commands available without server.
 */
const BUILTIN_COMMANDS: SlashCommand[] = [
  {
    name: 'clear',
    description: 'Clear conversation history',
    icon: TrashIcon({}),
    usage: '/clear',
  },
  {
    name: 'help',
    description: 'Show available commands',
    icon: HelpIcon({}),
    usage: '/help',
  },
  {
    name: 'status',
    description: 'Show context usage and permission mode',
    icon: GearIcon({}),
    usage: '/status',
  },
];

/**
 * Options for useSlashCommands hook.
 */
export interface UseSlashCommandsOptions {
  /** Callback to clear the conversation */
  clearConversation: () => void;

  /** Callback to add a system message to the chat */
  addSystemMessage: (content: string) => void;

  /** Current context usage statistics */
  contextUsage?: { input_tokens: number; output_tokens: number } | null;

  /** Current permission mode */
  permissionMode?: string;
}

/**
 * Return type for useSlashCommands hook.
 */
export interface UseSlashCommandsReturn {
  /** All available commands (built-in + custom) */
  commands: SlashCommand[];

  /** Handle command execution */
  handleCommand: (command: string, args: string) => SlashCommandResult;

  /** Whether commands are still loading */
  loading: boolean;

  /** Error message if command loading failed */
  error: string | null;
}

/**
 * Generates help text listing all available commands.
 */
function generateHelpText(commands: SlashCommand[]): string {
  const lines = ['## Available Commands', ''];

  for (const cmd of commands) {
    const usage = cmd.usage || `/${cmd.name}`;

    lines.push(`- **${usage}** - ${cmd.description}`);
  }

  lines.push('', 'Type a command to execute it.');

  return lines.join('\n');
}

/**
 * Hook for managing slash commands in Claude Code Web.
 * Loads custom commands from server and provides built-in commands.
 */
export function useSlashCommands({
  clearConversation,
  addSystemMessage,
  contextUsage,
  permissionMode,
}: UseSlashCommandsOptions): UseSlashCommandsReturn {
  const [customCommands, setCustomCommands] = useState<CommandDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch commands on mount
  useEffect(() => {
    const fetchCommands = async () => {
      try {
        // Use configured API URL or default to localhost
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
        const cwd = window.location.pathname || '/';

        const response = await fetch(`${apiUrl}/api/commands?cwd=${encodeURIComponent(cwd)}`);

        if (!response.ok) {
          throw new Error(`Failed to load commands: ${response.statusText}`);
        }

        const data = await response.json();

        setCustomCommands(data.commands || []);
        setError(null);
      } catch (err) {
        console.warn('Failed to load custom commands:', err);
        setError(err instanceof Error ? err.message : 'Failed to load commands');
        // Keep custom commands empty but don't block built-in commands
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  // Combine built-in and custom commands
  const commands = useMemo(() => {
    const customSlashCommands: SlashCommand[] = customCommands.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.argumentHint ? `/${cmd.name} ${cmd.argumentHint}` : `/${cmd.name}`,
    }));

    return [...BUILTIN_COMMANDS, ...customSlashCommands];
  }, [customCommands]);

  // Handle command execution
  const handleCommand = useCallback(
    (command: string, _args: string): SlashCommandResult => {
      switch (command) {
        case 'clear':
          clearConversation();

          return { handled: true, clearInput: true };

        case 'help':
          addSystemMessage(generateHelpText(commands));

          return { handled: true, clearInput: true };

        case 'status': {
          const lines = ['## Status', ''];

          // Context usage
          if (contextUsage) {
            const { input_tokens, output_tokens } = contextUsage;

            lines.push('### Context Usage');
            lines.push(`- Input tokens: ${input_tokens.toLocaleString()}`);
            lines.push(`- Output tokens: ${output_tokens.toLocaleString()}`);
            lines.push('');
          } else {
            lines.push('No context usage data available.');
            lines.push('');
          }

          // Permission mode
          lines.push('### Permission Mode');
          lines.push(`Current mode: **${permissionMode || 'default'}**`);

          addSystemMessage(lines.join('\n'));

          return { handled: true, clearInput: true };
        }

        default:
          // Check if it's a custom command
          const isCustomCommand = customCommands.some((cmd) => cmd.name === command);

          if (isCustomCommand) {
            // Custom command execution will be implemented in Plan 04
            addSystemMessage(
              `Custom command **/\`${command}\`** recognized. ` +
                `Full execution will be implemented in a future update.`
            );

            return { handled: true, clearInput: true };
          }

          // Unknown command
          addSystemMessage(`Unknown command: **/${command}**\n\nType **/help** to see available commands.`);

          return { handled: true, clearInput: true };
      }
    },
    [clearConversation, addSystemMessage, commands, contextUsage, permissionMode, customCommands]
  );

  return {
    commands,
    handleCommand,
    loading,
    error,
  };
}
