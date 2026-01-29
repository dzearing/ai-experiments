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

// Estimated token costs for different context components
const ESTIMATES = {
  systemPrompt: 2500,
  ideaDocument: 800,
  toolDefinition: 150,
  autocompactBuffer: 0.20,
};

/**
 * Category for context usage breakdown
 */
interface ContextCategory {
  name: string;
  tokens: number;
  percent: number;
  type: 'used' | 'free' | 'buffer';
}

/**
 * Tool/MCP server info
 */
interface ContextTool {
  name: string;
  tokens: number;
}

/**
 * Context display data structure - matches ContextDisplayData in react-chat
 */
interface ContextDisplayData {
  model: string;
  maxTokens: number;
  usedTokens: number;
  usedPercent: number;
  freeTokens: number;
  bufferTokens: number;
  bufferPercent: number;
  categories: ContextCategory[];
  session: {
    sessionId: string;
    model: string;
    messageCount: number;
    inputTokens: number;
    outputTokens: number;
    ideaId?: string;
  };
  tools?: ContextTool[];
  mcpServers?: ContextTool[];
}

export const contextCommand: SlashCommandHandler = {
  command: {
    name: 'context',
    description: 'Show context window usage and session info',
    argumentHint: '',
  },

  async execute(_args: string, context: CommandContext): Promise<SlashCommandResult> {
    const model = context.sessionInfo?.model || 'claude-sonnet-4';
    const maxTokens = MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS.default;

    // Calculate token usage by category
    const inputTokens = context.tokenUsage?.inputTokens || 0;
    const outputTokens = context.tokenUsage?.outputTokens || 0;

    const toolCount = context.sessionInfo?.tools?.length || 0;
    const mcpServerCount = context.sessionInfo?.mcpServers?.length || 0;

    // Estimated breakdown
    const systemPromptTokens = ESTIMATES.systemPrompt;
    const toolTokens = toolCount * ESTIMATES.toolDefinition;
    const mcpTokens = mcpServerCount * ESTIMATES.toolDefinition;
    const ideaContextTokens = context.ideaId ? ESTIMATES.ideaDocument : 0;
    const messageTokens = inputTokens + outputTokens;

    // Total used
    const usedTokens = systemPromptTokens + toolTokens + mcpTokens + ideaContextTokens + messageTokens;

    // Buffer (reserved for autocompact)
    const bufferTokens = Math.round(maxTokens * ESTIMATES.autocompactBuffer);

    // Free space
    const freeTokens = maxTokens - usedTokens - bufferTokens;

    // Percentages
    const usedPercent = (usedTokens / maxTokens) * 100;
    const bufferPercent = (bufferTokens / maxTokens) * 100;

    // Build categories array
    const categories: ContextCategory[] = [
      {
        name: 'System prompt',
        tokens: systemPromptTokens,
        percent: (systemPromptTokens / maxTokens) * 100,
        type: 'used',
      },
    ];

    if (toolCount > 0) {
      categories.push({
        name: `Tools (${toolCount})`,
        tokens: toolTokens,
        percent: (toolTokens / maxTokens) * 100,
        type: 'used',
      });
    }

    if (mcpServerCount > 0) {
      categories.push({
        name: `MCP servers (${mcpServerCount})`,
        tokens: mcpTokens,
        percent: (mcpTokens / maxTokens) * 100,
        type: 'used',
      });
    }

    if (ideaContextTokens > 0) {
      categories.push({
        name: 'Idea context',
        tokens: ideaContextTokens,
        percent: (ideaContextTokens / maxTokens) * 100,
        type: 'used',
      });
    }

    categories.push({
      name: 'Messages (conversation)',
      tokens: messageTokens,
      percent: (messageTokens / maxTokens) * 100,
      type: 'used',
    });

    categories.push({
      name: 'Free space',
      tokens: freeTokens,
      percent: (freeTokens / maxTokens) * 100,
      type: 'free',
    });

    categories.push({
      name: 'Autocompact buffer',
      tokens: bufferTokens,
      percent: bufferPercent,
      type: 'buffer',
    });

    // Build tools array if any
    const tools: ContextTool[] | undefined = context.sessionInfo?.tools?.map(name => ({
      name,
      tokens: ESTIMATES.toolDefinition,
    }));

    // Build MCP servers array if any
    const mcpServers: ContextTool[] | undefined = context.sessionInfo?.mcpServers?.map(name => ({
      name,
      tokens: ESTIMATES.toolDefinition,
    }));

    // Build the data structure
    const data: ContextDisplayData = {
      model,
      maxTokens,
      usedTokens,
      usedPercent,
      freeTokens,
      bufferTokens,
      bufferPercent,
      categories,
      session: {
        sessionId: context.sessionId || 'unknown',
        model,
        messageCount: context.messageCount,
        inputTokens,
        outputTokens,
        ideaId: context.ideaId,
      },
      tools,
      mcpServers,
    };

    return {
      format: 'component',
      componentType: 'context',
      data: data as unknown as Record<string, unknown>,
    };
  },
};
