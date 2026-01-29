/**
 * Slash command types - compatible with Claude Code SDK
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
 * Context available to command handlers during execution
 */
export interface CommandContext {
  /** User executing the command */
  userId: string;
  /** Current session ID */
  sessionId: string;
  /** Idea ID if in idea context */
  ideaId?: string;
  /** Current token usage for the session */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /** SDK session info */
  sessionInfo?: {
    sessionId?: string;
    model?: string;
    tools?: string[];
    mcpServers?: string[];
  };
  /** Number of messages in current session */
  messageCount: number;
}

/**
 * Result returned by command handlers
 */
export interface SlashCommandResult {
  /** The result content to display (for markdown/text formats) */
  content?: string;
  /** Format of the content */
  format: 'markdown' | 'text' | 'json' | 'component';
  /** If true, show but don't persist to chat history */
  ephemeral?: boolean;
  /** Component type to render (when format is 'component') */
  componentType?: 'context' | string;
  /** Structured data for component rendering (when format is 'component') */
  data?: Record<string, unknown>;
}

/**
 * Handler interface for implementing slash commands
 */
export interface SlashCommandHandler {
  /** Command metadata */
  command: SlashCommand;
  /** Execute the command */
  execute(args: string, context: CommandContext): Promise<SlashCommandResult>;
}

// WebSocket message types

export interface SlashCommandRequest {
  type: 'slash_command';
  command: string;
  args: string;
}

export interface SlashCommandResponse {
  type: 'command_result';
  command: string;
  result: SlashCommandResult;
  error?: string;
}

export interface AvailableCommandsMessage {
  type: 'available_commands';
  commands: SlashCommand[];
}
