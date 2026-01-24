import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';

/**
 * Model context limits
 */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'claude-opus-4-5-20251101': 200000,
  'claude-sonnet-4-20250514': 200000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-opus-20240229': 200000,
  'claude-3-sonnet-20240229': 200000,
  'claude-3-haiku-20240307': 200000,
  'default': 200000,
};

const ESTIMATED_SYSTEM_OVERHEAD = 3000;
const ESTIMATED_TOOL_OVERHEAD = 30;

function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }

  return tokens.toString();
}

function generateProgressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  return '\u2593'.repeat(filled) + '\u2591'.repeat(empty);
}

function getUsageIndicator(percentage: number): string {
  if (percentage < 50) return '\u{1F7E2}'; // Green
  if (percentage < 80) return '\u{1F7E1}'; // Yellow

  return '\u{1F534}'; // Red
}

export const contextCommand: SlashCommandHandler = {
  command: {
    name: 'context',
    description: 'Show context window usage and session info',
    argumentHint: '',
  },

  async execute(_args: string, context: CommandContext): Promise<SlashCommandResult> {
    const model = context.sessionInfo?.model || 'unknown';
    const maxTokens = MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS.default;

    const inputTokens = context.tokenUsage?.inputTokens || 0;
    const outputTokens = context.tokenUsage?.outputTokens || 0;
    const messageTokens = inputTokens + outputTokens;

    const toolCount = context.sessionInfo?.tools?.length || 0;
    const systemOverhead = ESTIMATED_SYSTEM_OVERHEAD + (toolCount * ESTIMATED_TOOL_OVERHEAD);

    const totalTokens = messageTokens + systemOverhead;
    const usagePercent = Math.round((totalTokens / maxTokens) * 100 * 10) / 10;

    const lines: string[] = [];

    // Header
    lines.push('## Context Usage\n');

    const indicator = getUsageIndicator(usagePercent);
    const bar = generateProgressBar(usagePercent);

    lines.push(`${indicator} **${model}**`);
    lines.push(`\`${bar}\` ${formatTokenCount(totalTokens)}/${formatTokenCount(maxTokens)} tokens (${usagePercent.toFixed(1)}%)\n`);

    // Category breakdown
    lines.push('### Estimated Usage by Category\n');
    lines.push(`- **System Prompt**: ~${formatTokenCount(ESTIMATED_SYSTEM_OVERHEAD)} (${((ESTIMATED_SYSTEM_OVERHEAD / maxTokens) * 100).toFixed(1)}%)`);

    if (toolCount > 0) {
      const toolTokens = toolCount * ESTIMATED_TOOL_OVERHEAD;
      lines.push(`- **Tools** (${toolCount}): ~${formatTokenCount(toolTokens)} (${((toolTokens / maxTokens) * 100).toFixed(1)}%)`);
    }

    lines.push(`- **Messages (Input)**: ${formatTokenCount(inputTokens)} (${((inputTokens / maxTokens) * 100).toFixed(1)}%)`);
    lines.push(`- **Messages (Output)**: ${formatTokenCount(outputTokens)} (${((outputTokens / maxTokens) * 100).toFixed(1)}%)`);

    // MCP servers
    if (context.sessionInfo?.mcpServers && context.sessionInfo.mcpServers.length > 0) {
      lines.push(`- **MCP Servers** (${context.sessionInfo.mcpServers.length}): ~${formatTokenCount(context.sessionInfo.mcpServers.length * 50)}`);
    }

    // Session info
    lines.push('\n### Session Info\n');
    lines.push(`- **Session ID**: \`${(context.sessionId || 'unknown').slice(0, 8)}...\``);
    lines.push(`- **Messages**: ${context.messageCount}`);

    // Remaining capacity
    const remaining = maxTokens - totalTokens;
    const remainingPercent = (remaining / maxTokens) * 100;
    lines.push(`\n**Remaining capacity**: ${formatTokenCount(remaining)} tokens (${remainingPercent.toFixed(1)}%)`);

    return {
      content: lines.join('\n'),
      format: 'markdown',
    };
  },
};
