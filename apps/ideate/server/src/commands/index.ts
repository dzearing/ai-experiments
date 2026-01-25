import { getCommandRegistry } from '../services/SlashCommandRegistry.js';
import { helpCommand } from './helpCommand.js';
import { clearCommand } from './clearCommand.js';
import { contextCommand } from './contextCommand.js';
import { modelCommand } from './modelCommand.js';

/**
 * Register all built-in commands
 */
export function registerBuiltInCommands(): void {
  const registry = getCommandRegistry();

  registry.register(helpCommand);
  registry.register(clearCommand);
  registry.register(contextCommand);
  registry.register(modelCommand);

  console.log('[Commands] Built-in commands registered');
}

export { helpCommand, clearCommand, contextCommand, modelCommand };
