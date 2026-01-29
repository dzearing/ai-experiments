import { useMemo, useCallback } from 'react';
import type { SlashCommand as UISlashCommand, SlashCommandResult } from '@ui-kit/react-chat';
import type { SlashCommand as ServerSlashCommand } from '../types/slashCommandTypes';

/**
 * Default commands shown before server sends available_commands.
 * These are replaced when server commands arrive.
 */
const DEFAULT_COMMANDS: UISlashCommand[] = [
  {
    name: 'help',
    description: 'Show available commands',
    usage: '/help',
  },
  {
    name: 'clear',
    description: 'Clear chat history',
    usage: '/clear',
  },
  {
    name: 'context',
    description: 'Show context window usage',
    usage: '/context',
  },
  {
    name: 'model',
    description: 'View current model and available options',
    usage: '/model',
  },
];

/**
 * Client-only command definition
 */
export interface ClientOnlyCommand extends UISlashCommand {
  /** Handler for client-only execution */
  handler: (args: string) => SlashCommandResult;
}

/**
 * Options for useChatCommands hook
 */
export interface UseChatCommandsOptions {
  /** Available commands from server */
  availableCommands: ServerSlashCommand[];
  /** Execute command via server */
  executeCommand: (command: string, args: string) => void;
  /** Client-only commands (rarely needed) */
  clientOnlyCommands?: ClientOnlyCommand[];
}

/**
 * Convert server SlashCommand to UI SlashCommand format
 */
function convertToUICommand(serverCommand: ServerSlashCommand): UISlashCommand {
  const usage = serverCommand.argumentHint
    ? `/${serverCommand.name} ${serverCommand.argumentHint}`
    : `/${serverCommand.name}`;

  return {
    name: serverCommand.name,
    description: serverCommand.description,
    usage,
  };
}

/**
 * Hook for chat slash commands.
 *
 * Commands are fetched from the server and executed server-side.
 * This hook converts the server command format to UI format and
 * routes all command execution through the WebSocket.
 *
 * Shows default commands immediately for good UX, then updates
 * when server sends available_commands.
 */
export function useChatCommands({
  availableCommands,
  executeCommand,
  clientOnlyCommands = [],
}: UseChatCommandsOptions) {
  // Convert server commands to UI format, fall back to defaults if none received yet
  const commands: UISlashCommand[] = useMemo(() => {
    // Use server commands if available, otherwise show defaults
    const baseCommands = availableCommands.length > 0
      ? availableCommands.map(convertToUICommand)
      : DEFAULT_COMMANDS;

    // Create a map to deduplicate by name, preferring clientOnlyCommands (they may have custom handlers)
    const commandMap = new Map<string, UISlashCommand>();

    // Add base commands first
    for (const cmd of baseCommands) {
      commandMap.set(cmd.name, cmd);
    }

    // Override with clientOnlyCommands (these take precedence)
    for (const cmd of clientOnlyCommands) {
      commandMap.set(cmd.name, cmd);
    }

    return Array.from(commandMap.values());
  }, [availableCommands, clientOnlyCommands]);

  // Command handler - routes to server or client-only handler
  const handleCommand = useCallback(
    (command: string, args: string): SlashCommandResult => {
      // Check for client-only commands first
      const clientCmd = clientOnlyCommands.find(c => c.name === command);

      if (clientCmd?.handler) {
        return clientCmd.handler(args);
      }

      // Route to server
      executeCommand(command, args);

      return { handled: true, clearInput: true };
    },
    [executeCommand, clientOnlyCommands]
  );

  return {
    commands,
    handleCommand,
  };
}

export default useChatCommands;
