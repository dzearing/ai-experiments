/**
 * Shared parsing functions for agent responses.
 * Extracts structured data from XML-tagged blocks in agent output.
 */

import type { OpenQuestion, SuggestedResponse } from './agentResponseTypes.js';

/**
 * Parse open questions from agent response.
 * Extracts <open_questions> JSON block and returns parsed questions.
 *
 * @param response - The full agent response text
 * @param logPrefix - Optional prefix for error logging (e.g., 'IdeaAgentService')
 * @returns Parsed questions and the response with the questions block removed
 */
export function parseOpenQuestions(
  response: string,
  logPrefix = 'AgentService'
): { questions: OpenQuestion[] | null; responseWithoutQuestions: string } {
  const questionsMatch = response.match(/<open_questions>\s*([\s\S]*?)\s*<\/open_questions>/);

  if (!questionsMatch) {
    return { questions: null, responseWithoutQuestions: response };
  }

  try {
    const rawQuestions = JSON.parse(questionsMatch[1]) as OpenQuestion[];

    // Default allowCustom to true so users can always provide custom answers
    const questions = rawQuestions.map(q => ({
      ...q,
      allowCustom: q.allowCustom !== false,
    }));

    // Remove the questions block from the response
    const responseWithoutQuestions = response
      .replace(/<open_questions>[\s\S]*?<\/open_questions>/, '')
      .trim();

    return { questions, responseWithoutQuestions };
  } catch {
    console.error(`[${logPrefix}] Failed to parse open questions JSON`);

    return { questions: null, responseWithoutQuestions: response };
  }
}

/**
 * Parse suggested responses from agent response.
 * Extracts <suggested_responses> JSON block and returns parsed suggestions.
 *
 * @param response - The full agent response text
 * @param logPrefix - Optional prefix for error logging (e.g., 'IdeaAgentService')
 * @returns Parsed suggestions and the response with the suggestions block removed
 */
export function parseSuggestedResponses(
  response: string,
  logPrefix = 'AgentService'
): { suggestions: SuggestedResponse[] | null; responseWithoutSuggestions: string } {
  const suggestionsMatch = response.match(/<suggested_responses>\s*([\s\S]*?)\s*<\/suggested_responses>/);

  if (!suggestionsMatch) {
    return { suggestions: null, responseWithoutSuggestions: response };
  }

  try {
    const suggestions = JSON.parse(suggestionsMatch[1]) as SuggestedResponse[];

    // Remove the suggestions block from the response
    const responseWithoutSuggestions = response
      .replace(/<suggested_responses>[\s\S]*?<\/suggested_responses>/, '')
      .trim();

    return { suggestions, responseWithoutSuggestions };
  } catch {
    console.error(`[${logPrefix}] Failed to parse suggested responses JSON`);

    return { suggestions: null, responseWithoutSuggestions: response };
  }
}

/**
 * Find the start position of any special block tag in text.
 * Used to determine when to stop streaming and buffer content.
 *
 * @param text - The text to search
 * @param blockTags - Array of tag names to look for (without angle brackets)
 * @returns Index of first found tag, or -1 if none found
 */
export function findBlockStart(text: string, blockTags: string[]): number {
  const starts = blockTags
    .map(tag => text.indexOf(`<${tag}>`))
    .filter(s => s >= 0);

  return starts.length > 0 ? Math.min(...starts) : -1;
}

/**
 * Find a safe point to stream up to, avoiding partial XML tags.
 * This prevents streaming incomplete tags like "<open_que" to the client.
 *
 * @param text - The accumulated text
 * @param tagStarts - Array of potential tag prefixes to avoid (e.g., '<open_questions', '<suggested')
 * @returns Index up to which it's safe to stream
 */
export function findSafeStreamEnd(text: string, tagStarts: string[]): number {
  let safeEnd = text.length;

  for (const tagStart of tagStarts) {
    // Check if text ends with any prefix of this tag start
    for (let i = 1; i <= tagStart.length; i++) {
      const partial = tagStart.slice(0, i);

      if (text.endsWith(partial)) {
        safeEnd = Math.min(safeEnd, text.length - partial.length);
        break;
      }
    }
  }

  return safeEnd;
}

/**
 * Default tag prefixes to avoid when streaming.
 * Covers common agent response block types.
 */
export const DEFAULT_SAFE_STREAM_TAGS = [
  '<open_questions',
  '<suggested_responses',
  '<open',
  '<suggested',
];

/**
 * Tag prefixes for IdeaAgentService
 */
export const IDEA_AGENT_SAFE_STREAM_TAGS = [
  ...DEFAULT_SAFE_STREAM_TAGS,
  '<idea_update',
  '<document_edits',
  '<idea',
  '<doc',
];

/**
 * Tag prefixes for PlanAgentService
 */
export const PLAN_AGENT_SAFE_STREAM_TAGS = [
  ...DEFAULT_SAFE_STREAM_TAGS,
  '<plan_update',
  '<impl_plan_update',
  '<impl_plan_edits',
  '<plan',
  '<impl',
];

/**
 * Block tags for IdeaAgentService
 */
export const IDEA_AGENT_BLOCK_TAGS = [
  'idea_update',
  'document_edits',
  'open_questions',
  'suggested_responses',
];

/**
 * Block tags for PlanAgentService
 */
export const PLAN_AGENT_BLOCK_TAGS = [
  'plan_update',
  'impl_plan_update',
  'impl_plan_edits',
  'open_questions',
  'suggested_responses',
];
