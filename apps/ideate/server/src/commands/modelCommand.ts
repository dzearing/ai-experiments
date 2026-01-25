import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';

/**
 * Available models - matches client-side AVAILABLE_MODELS
 */
const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5', shortName: 'opus', description: 'Most capable, thoughtful (default)' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', shortName: 'sonnet', description: 'Fast and capable' },
  { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5', shortName: 'haiku', description: 'Fastest, most economical' },
];

/**
 * Get model info by ID or short name
 */
function findModel(input: string) {
  const normalized = input.toLowerCase().trim();

  return AVAILABLE_MODELS.find(m =>
    m.shortName === normalized ||
    m.id === normalized ||
    m.id.includes(normalized) ||
    m.name.toLowerCase().includes(normalized)
  );
}

export const modelCommand: SlashCommandHandler = {
  command: {
    name: 'model',
    description: 'View current model and available options',
    argumentHint: '',
  },

  async execute(args: string, context: CommandContext): Promise<SlashCommandResult> {
    const currentModelId = context.sessionInfo?.model || 'claude-opus-4-5-20251101';
    const currentModel = AVAILABLE_MODELS.find(m => m.id === currentModelId) || AVAILABLE_MODELS[0];

    const lines: string[] = [];

    // If args provided, show how to change model
    if (args.trim()) {
      const requestedModel = findModel(args);

      if (requestedModel) {
        lines.push(`## Model: ${requestedModel.name}`);
        lines.push('');
        lines.push(`To switch to **${requestedModel.name}**, use the model selector in the chat header.`);
        lines.push('');
        lines.push('*Note: Model switching via slash command is planned for a future update.*');
      } else {
        lines.push(`## Unknown Model: "${args}"`);
        lines.push('');
        lines.push('Available models:');

        for (const m of AVAILABLE_MODELS) {
          lines.push(`- **${m.shortName}** - ${m.name}: ${m.description}`);
        }
      }

      return {
        content: lines.join('\n'),
        format: 'markdown',
      };
    }

    // Show current model and available options
    lines.push('## Current Model');
    lines.push('');
    lines.push(`**${currentModel.name}** (\`${currentModel.shortName}\`)`);
    lines.push(`*${currentModel.description}*`);
    lines.push('');
    lines.push('## Available Models');
    lines.push('');

    for (const m of AVAILABLE_MODELS) {
      const isCurrent = m.id === currentModelId;
      const marker = isCurrent ? ' *(current)*' : '';
      lines.push(`- **${m.shortName}** - ${m.name}: ${m.description}${marker}`);
    }

    lines.push('');
    lines.push('*Use the model selector in the chat header to switch models.*');

    return {
      content: lines.join('\n'),
      format: 'markdown',
    };
  },
};
