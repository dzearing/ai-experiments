import { useMemo, useCallback } from 'react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { HelpIcon } from '@ui-kit/icons/HelpIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import type { SlashCommand, SlashCommandResult } from '@ui-kit/react-chat';
import { AVAILABLE_MODELS, resolveModelId, type ModelId } from './useModelPreference';

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
 * Model info for display
 */
export interface ModelInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
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
  /** Current model info for /model command */
  currentModelInfo?: ModelInfo;
  /** Callback to change the model */
  onModelChange?: (modelId: ModelId) => void;
}

/**
 * Default help text for chat interfaces
 */
const DEFAULT_HELP_TEXT = `## Available Commands

- **/clear** - Clear all chat history
- **/help** - Show this help message

Type a message to get started!`;

/**
 * Hook for common chat slash commands (clear, help, model)
 * Can be extended with additional commands per-context.
 */
export function useChatCommands({
  clearMessages,
  clearServerHistory,
  addMessage,
  helpText = DEFAULT_HELP_TEXT,
  additionalCommands = [],
  onCustomCommand,
  currentModelInfo,
  onModelChange,
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
      ...(onModelChange ? [{
        name: 'model',
        description: 'View or change the AI model',
        icon: <GearIcon />,
        usage: '/model [name]',
      }] : []),
      ...additionalCommands,
    ],
    [additionalCommands, onModelChange]
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

        case 'model':
          if (!onModelChange) {
            return { handled: false };
          }

          const modelArg = args.trim();

          if (!modelArg) {
            // Show current model and available options
            const currentName = currentModelInfo?.name || 'Unknown';
            const currentShortName = currentModelInfo?.shortName || '';
            const modelList = AVAILABLE_MODELS.map(m => {
              const isCurrent = m.id === currentModelInfo?.id;
              return `- **${m.shortName}** - ${m.name}: ${m.description}${isCurrent ? ' *(current)*' : ''}`;
            }).join('\n');

            addMessage({
              id: `model-info-${Date.now()}`,
              role: 'assistant',
              content: `## Current Model\n\n**${currentName}** (\`${currentShortName}\`)\n\n## Available Models\n\n${modelList}\n\nTo change, type: \`/model <name>\` (e.g., \`/model opus\`)`,
              timestamp: Date.now(),
            });
            return { handled: true, clearInput: true };
          }

          // Try to change the model
          const newModelId = resolveModelId(modelArg);
          if (!newModelId) {
            addMessage({
              id: `model-error-${Date.now()}`,
              role: 'assistant',
              content: `Unknown model: "${modelArg}"\n\nAvailable models: ${AVAILABLE_MODELS.map(m => `\`${m.shortName}\``).join(', ')}`,
              timestamp: Date.now(),
            });
            return { handled: true, clearInput: true };
          }

          onModelChange(newModelId);
          const newModelInfo = AVAILABLE_MODELS.find(m => m.id === newModelId);
          addMessage({
            id: `model-changed-${Date.now()}`,
            role: 'assistant',
            content: `Model changed to **${newModelInfo?.name}** (\`${newModelInfo?.shortName}\`)`,
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
    [clearMessages, clearServerHistory, addMessage, helpText, onCustomCommand, currentModelInfo, onModelChange]
  );

  return {
    commands,
    handleCommand,
  };
}

export default useChatCommands;
