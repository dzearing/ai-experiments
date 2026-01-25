import { useState, useEffect, useCallback, useMemo, createElement } from 'react';

import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { HelpIcon } from '@ui-kit/icons/HelpIcon';
import { InfoCircleIcon } from '@ui-kit/icons/InfoCircleIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import type { SlashCommand, SlashCommandResult } from '@ui-kit/react-chat';

import type { CommandDefinition } from '../types/commands';

/**
 * Built-in commands available without server.
 */
const BUILTIN_COMMANDS: SlashCommand[] = [
  {
    name: 'clear',
    description: 'Clear conversation history',
    icon: createElement(TrashIcon),
    usage: '/clear',
  },
  {
    name: 'help',
    description: 'Show available commands',
    icon: createElement(HelpIcon),
    usage: '/help',
  },
  {
    name: 'model',
    description: 'View or change the AI model',
    icon: createElement(GearIcon),
    usage: '/model [name]',
  },
  {
    name: 'status',
    description: 'Show session status and context usage',
    icon: createElement(InfoCircleIcon),
    usage: '/status',
  },
  {
    name: 'config',
    description: 'Show configuration info',
    icon: createElement(GearIcon),
    usage: '/config',
  },
  {
    name: 'cost',
    description: 'Show token usage and cost estimate',
    icon: createElement(ClockIcon),
    usage: '/cost',
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

  /** Callback to send a user message to the conversation */
  sendMessage?: (prompt: string) => void;

  /** Current context usage statistics */
  contextUsage?: { input_tokens: number; output_tokens: number; cache_read_tokens?: number } | null;

  /** Current permission mode */
  permissionMode?: string;

  /** Current session ID */
  sessionId?: string | null;

  /** Current model info */
  modelInfo?: { id: string; name: string };

  /** Current working directory */
  cwd?: string;
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
  sendMessage,
  contextUsage,
  permissionMode,
  sessionId,
  modelInfo,
  cwd: cwdOption,
}: UseSlashCommandsOptions): UseSlashCommandsReturn {
  const [customCommands, setCustomCommands] = useState<CommandDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Working directory for commands
  const cwd = cwdOption || window.location.pathname || '/';

  // Fetch commands on mount
  useEffect(() => {
    const fetchCommands = async () => {
      try {
        // Use configured API URL or default to localhost
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

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
  }, [cwd]);

  // Combine built-in and custom commands
  const commands = useMemo(() => {
    const customSlashCommands: SlashCommand[] = customCommands.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.argumentHint ? `/${cmd.name} ${cmd.argumentHint}` : `/${cmd.name}`,
    }));

    return [...BUILTIN_COMMANDS, ...customSlashCommands];
  }, [customCommands]);

  // Execute custom command by calling server API
  const executeCustomCommand = useCallback(
    async (commandName: string, args: string) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

        const response = await fetch(`${apiUrl}/api/commands/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: commandName, args, cwd }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

          addSystemMessage(`Error executing command: ${errorData.error || response.statusText}`);

          return;
        }

        const data = await response.json();

        // Send processed content as a user message
        if (sendMessage && data.content) {
          sendMessage(data.content);
        } else if (data.content) {
          addSystemMessage(`Command output:\n\n${data.content}`);
        }
      } catch (err) {
        console.error('Failed to execute custom command:', err);
        addSystemMessage(`Failed to execute command: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [cwd, addSystemMessage, sendMessage]
  );

  // Handle command execution
  const handleCommand = useCallback(
    (command: string, args: string): SlashCommandResult => {
      switch (command) {
        case 'clear':
          clearConversation();

          return { handled: true, clearInput: true };

        case 'help':
          addSystemMessage(generateHelpText(commands));

          return { handled: true, clearInput: true };

        case 'model': {
          if (args.trim()) {
            addSystemMessage('Model switching is not yet supported. Use the settings to change models.');
          } else if (modelInfo) {
            addSystemMessage(`## Current Model\n\n- **ID:** ${modelInfo.id}\n- **Name:** ${modelInfo.name}`);
          } else {
            addSystemMessage('## Current Model\n\nUsing default model (claude-sonnet-4-5-20250929)');
          }

          return { handled: true, clearInput: true };
        }

        case 'status': {
          const lines = ['## Session Status', ''];

          // Session ID
          if (sessionId) {
            lines.push(`**Session:** ${sessionId}`);
            lines.push('');
          }

          // Context usage
          lines.push('### Context Usage');

          if (contextUsage) {
            const { input_tokens, output_tokens, cache_read_tokens } = contextUsage;

            lines.push(`- Input tokens: ${input_tokens.toLocaleString()}`);
            lines.push(`- Output tokens: ${output_tokens.toLocaleString()}`);

            if (cache_read_tokens !== undefined) {
              lines.push(`- Cache read tokens: ${cache_read_tokens.toLocaleString()}`);
            }
          } else {
            lines.push('No context usage data available.');
          }

          lines.push('');

          // Permission mode
          lines.push('### Permission Mode');
          lines.push(`Current mode: **${permissionMode || 'default'}**`);

          addSystemMessage(lines.join('\n'));

          return { handled: true, clearInput: true };
        }

        case 'config': {
          const lines = ['## Configuration', ''];

          // Working directory
          lines.push('### Working Directory');
          lines.push(`\`${cwd || 'Not set'}\``);
          lines.push('');

          // Permission mode
          lines.push('### Permission Mode');
          lines.push(`**${permissionMode || 'default'}**`);
          lines.push('');

          // Custom commands count
          lines.push('### Custom Commands');
          lines.push(`${customCommands.length} command(s) loaded`);

          addSystemMessage(lines.join('\n'));

          return { handled: true, clearInput: true };
        }

        case 'cost': {
          const lines = ['## Token Usage & Cost Estimate', ''];

          if (contextUsage) {
            const { input_tokens, output_tokens, cache_read_tokens } = contextUsage;

            // Pricing for Claude 3.5 Sonnet (per million tokens)
            const inputPricePerMillion = 3;
            const outputPricePerMillion = 15;
            const cacheReadPricePerMillion = 0.3;

            const inputCost = (input_tokens / 1_000_000) * inputPricePerMillion;
            const outputCost = (output_tokens / 1_000_000) * outputPricePerMillion;
            const cacheReadCost = cache_read_tokens
              ? (cache_read_tokens / 1_000_000) * cacheReadPricePerMillion
              : 0;
            const totalCost = inputCost + outputCost + cacheReadCost;

            lines.push('### Token Breakdown');
            lines.push(`| Type | Tokens | Cost |`);
            lines.push(`|------|--------|------|`);
            lines.push(`| Input | ${input_tokens.toLocaleString()} | $${inputCost.toFixed(4)} |`);
            lines.push(`| Output | ${output_tokens.toLocaleString()} | $${outputCost.toFixed(4)} |`);

            if (cache_read_tokens !== undefined) {
              lines.push(`| Cache Read | ${cache_read_tokens.toLocaleString()} | $${cacheReadCost.toFixed(4)} |`);
            }

            lines.push(`| **Total** | | **$${totalCost.toFixed(4)}** |`);
            lines.push('');
            lines.push('*Prices based on Claude 3.5 Sonnet: $3/MTok input, $15/MTok output, $0.30/MTok cache read*');
          } else {
            lines.push('No token usage data available.');
          }

          addSystemMessage(lines.join('\n'));

          return { handled: true, clearInput: true };
        }

        default: {
          // Check if it's a custom command
          const isCustomCommand = customCommands.some((cmd) => cmd.name === command);

          if (isCustomCommand) {
            // Execute custom command asynchronously (fire and forget)
            executeCustomCommand(command, args);

            return { handled: true, clearInput: true };
          }

          // Unknown command
          addSystemMessage(`Unknown command: **/${command}**\n\nType **/help** to see available commands.`);

          return { handled: true, clearInput: true };
        }
      }
    },
    [
      clearConversation,
      addSystemMessage,
      commands,
      contextUsage,
      permissionMode,
      sessionId,
      modelInfo,
      cwd,
      customCommands,
      executeCustomCommand,
    ]
  );

  return {
    commands,
    handleCommand,
    loading,
    error,
  };
}
