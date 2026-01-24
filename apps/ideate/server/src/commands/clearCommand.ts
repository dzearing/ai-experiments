import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';

export const clearCommand: SlashCommandHandler = {
  command: {
    name: 'clear',
    description: 'Clear chat history',
    argumentHint: '',
  },

  async execute(_args: string, _context: CommandContext): Promise<SlashCommandResult> {
    // The actual clearing is handled by the WebSocket handler
    // This just returns a confirmation
    return {
      content: 'Chat history cleared.',
      format: 'text',
      ephemeral: true,
    };
  },
};
