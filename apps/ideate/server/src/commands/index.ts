import { getCommandRegistry } from '../services/SlashCommandRegistry.js';
import { helpCommand } from './helpCommand.js';
import { clearCommand } from './clearCommand.js';
import { contextCommand } from './contextCommand.js';

/**
 * Register all built-in commands
 */
export function registerBuiltInCommands(): void {
  const registry = getCommandRegistry();

  registry.register(helpCommand);
  registry.register(clearCommand);
  registry.register(contextCommand);

  console.log('[Commands] Built-in commands registered');
}

export { helpCommand, clearCommand, contextCommand };
