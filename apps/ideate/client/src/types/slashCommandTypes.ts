/**
 * Slash command types for client-side use.
 * These mirror the server-side types for WebSocket communication.
 */

/**
 * Slash command definition (matches SDK SlashCommand type)
 */
export interface SlashCommand {
  /** Command name without leading slash */
  name: string;
  /** Human-readable description */
  description: string;
  /** Usage hint for arguments, e.g. "<file>" or "" for no args */
  argumentHint: string;
}

/**
 * Result returned by command execution
 */
export interface SlashCommandResult {
  /** The result content to display */
  content: string;
  /** Format of the content */
  format: 'markdown' | 'text' | 'json';
  /** If true, show but don't persist to chat history */
  ephemeral?: boolean;
}
