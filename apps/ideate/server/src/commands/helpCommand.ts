import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';
import { getCommandRegistry } from '../services/SlashCommandRegistry.js';

export const helpCommand: SlashCommandHandler = {
  command: {
    name: 'help',
    description: 'Show available commands',
    argumentHint: '',
  },

  async execute(_args: string, _context: CommandContext): Promise<SlashCommandResult> {
    const registry = getCommandRegistry();
    const commands = registry.getCommands();

    const lines = ['## Available Commands\n'];

    for (const cmd of commands.sort((a, b) => a.name.localeCompare(b.name))) {
      const usage = cmd.argumentHint ? ` ${cmd.argumentHint}` : '';
      lines.push(`- **/${cmd.name}**${usage} - ${cmd.description}`);
    }

    lines.push('\nType a command to execute it.');

    return {
      content: lines.join('\n'),
      format: 'markdown',
    };
  },
};
