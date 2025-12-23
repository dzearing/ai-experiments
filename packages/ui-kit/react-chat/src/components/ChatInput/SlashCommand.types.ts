import type { ReactNode } from 'react';

/**
 * Definition of a slash command
 */
export interface SlashCommand {
  /** Command name (without the /) - e.g., "clear" for /clear */
  name: string;

  /** Short description shown in the autocomplete menu */
  description: string;

  /** Optional icon to display next to the command */
  icon?: ReactNode;

  /** Optional usage example - e.g., "/clear" or "/help [topic]" */
  usage?: string;

  /** Optional aliases that also trigger this command */
  aliases?: string[];

  /** Whether this command is hidden from autocomplete (still works if typed) */
  hidden?: boolean;
}

/**
 * Result of executing a slash command
 */
export interface SlashCommandResult {
  /** Whether to clear the input after command execution */
  clearInput?: boolean;

  /** Optional message to show after execution */
  message?: string;

  /** Whether the command was handled successfully */
  handled: boolean;
}

/**
 * Props for components that support slash commands
 */
export interface SlashCommandProps {
  /** Available slash commands */
  commands?: SlashCommand[];

  /**
   * Called when a slash command is executed.
   * Return true to indicate the command was handled.
   */
  onCommand?: (command: string, args: string) => SlashCommandResult | boolean | void;
}
