import type {
  SlashCommand,
  SlashCommandHandler,
  SlashCommandResult,
  CommandContext,
} from '../shared/slashCommandTypes.js';

/**
 * Registry for slash commands.
 * Singleton that holds all registered command handlers.
 */
export class SlashCommandRegistry {
  private static instance: SlashCommandRegistry;
  private handlers: Map<string, SlashCommandHandler> = new Map();

  private constructor() {}

  static getInstance(): SlashCommandRegistry {
    if (!SlashCommandRegistry.instance) {
      SlashCommandRegistry.instance = new SlashCommandRegistry();
    }

    return SlashCommandRegistry.instance;
  }

  /**
   * Register a command handler
   */
  register(handler: SlashCommandHandler): void {
    const name = handler.command.name.toLowerCase();

    if (this.handlers.has(name)) {
      console.warn(`[SlashCommandRegistry] Overwriting existing handler for /${name}`);
    }

    this.handlers.set(name, handler);
    console.log(`[SlashCommandRegistry] Registered /${name}`);
  }

  /**
   * Unregister a command
   */
  unregister(name: string): boolean {
    return this.handlers.delete(name.toLowerCase());
  }

  /**
   * Get all available commands
   */
  getCommands(): SlashCommand[] {
    return Array.from(this.handlers.values()).map(h => h.command);
  }

  /**
   * Check if a command exists
   */
  hasCommand(name: string): boolean {
    return this.handlers.has(name.toLowerCase());
  }

  /**
   * Execute a command
   */
  async execute(
    name: string,
    args: string,
    context: CommandContext
  ): Promise<SlashCommandResult> {
    const handler = this.handlers.get(name.toLowerCase());

    if (!handler) {
      return {
        content: `Unknown command: /${name}\n\nType /help to see available commands.`,
        format: 'markdown',
      };
    }

    try {
      return await handler.execute(args, context);
    } catch (error) {
      console.error(`[SlashCommandRegistry] Error executing /${name}:`, error);

      return {
        content: `Error executing /${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        format: 'text',
      };
    }
  }
}

/**
 * Export singleton accessor
 */
export function getCommandRegistry(): SlashCommandRegistry {
  return SlashCommandRegistry.getInstance();
}
