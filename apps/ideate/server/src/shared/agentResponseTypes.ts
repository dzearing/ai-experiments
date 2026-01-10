/**
 * Shared types for agent responses.
 * Used by IdeaAgentService, PlanAgentService, and other agent services.
 */

/**
 * Open question for the user to resolve.
 * Agents can emit these to gather structured input from users.
 */
export interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  selectionType: 'single' | 'multiple';
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  allowCustom: boolean;
}

/**
 * Suggested response for quick user replies.
 * Agents can emit these to provide common response options.
 */
export interface SuggestedResponse {
  label: string;
  message: string;
}

/**
 * Token usage information for tracking API costs.
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}
