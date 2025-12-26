import { useMemo, useCallback } from 'react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { HelpIcon } from '@ui-kit/icons/HelpIcon';
import type { SlashCommand, SlashCommandResult } from '@ui-kit/react-chat';

/**
 * Message type for adding help/system messages
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Options for useChatCommands hook
 */
export interface UseChatCommandsOptions {
  /** Function to clear all messages */
  clearMessages: () => void;
  /** Function to clear server-side history */
  clearServerHistory?: () => void;
  /** Function to add a message */
  addMessage: (message: ChatMessage) => void;
  /** Custom help text to display */
  helpText?: string;
  /** Additional custom commands */
  additionalCommands?: SlashCommand[];
  /** Additional command handler */
  onCustomCommand?: (command: string, args: string) => SlashCommandResult | undefined;
}

/**
 * Default help text for chat interfaces
 */
const DEFAULT_HELP_TEXT = `## Available Commands

- **/clear** - Clear all chat history
- **/help** - Show this help message

Type a message to get started!`;

/**
 * Hook for common chat slash commands (clear, help)
 * Can be extended with additional commands per-context.
 */
export function useChatCommands({
  clearMessages,
  clearServerHistory,
  addMessage,
  helpText = DEFAULT_HELP_TEXT,
  additionalCommands = [],
  onCustomCommand,
}: UseChatCommandsOptions) {
  // Base slash commands
  const commands: SlashCommand[] = useMemo(
    () => [
      {
        name: 'clear',
        description: 'Clear all chat history',
        icon: <TrashIcon />,
        usage: '/clear',
      },
      {
        name: 'help',
        description: 'Show available commands and features',
        icon: <HelpIcon />,
        usage: '/help',
      },
      ...additionalCommands,
    ],
    [additionalCommands]
  );

  // Command handler
  const handleCommand = useCallback(
    (command: string, args: string): SlashCommandResult => {
      switch (command) {
        case 'clear':
          clearMessages();
          clearServerHistory?.();
          return { handled: true, clearInput: true };

        case 'help':
          addMessage({
            id: `help-${Date.now()}`,
            role: 'assistant',
            content: helpText,
            timestamp: Date.now(),
          });
          return { handled: true, clearInput: true };

        default:
          // Check for custom command handler
          if (onCustomCommand) {
            const result = onCustomCommand(command, args);
            if (result) return result;
          }
          return { handled: false };
      }
    },
    [clearMessages, clearServerHistory, addMessage, helpText, onCustomCommand]
  );

  return {
    commands,
    handleCommand,
  };
}

export default useChatCommands;
