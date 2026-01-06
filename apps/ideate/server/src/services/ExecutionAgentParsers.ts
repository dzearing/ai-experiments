/**
 * ExecutionAgentParsers
 *
 * Parsing utilities for execution agent response events.
 * Extracted to keep ExecutionAgentService under 500 lines.
 */

import type {
  TaskCompleteEvent,
  PhaseCompleteEvent,
  ExecutionBlockedEvent,
  NewIdeaEvent,
  TaskUpdateEvent,
} from './ExecutionAgentTypes.js';

/**
 * Parse task_complete blocks from response - returns ALL matches
 */
export function parseTaskComplete(text: string): TaskCompleteEvent | null {
  const match = text.match(/<task_complete>\s*([\s\S]*?)\s*<\/task_complete>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as TaskCompleteEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse task_complete JSON');
    return null;
  }
}

/**
 * Parse ALL task_complete blocks from response
 */
export function parseAllTaskCompletes(text: string): TaskCompleteEvent[] {
  const results: TaskCompleteEvent[] = [];
  const regex = /<task_complete>\s*([\s\S]*?)\s*<\/task_complete>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      results.push(JSON.parse(match[1]) as TaskCompleteEvent);
    } catch {
      console.error('[ExecutionAgentService] Failed to parse task_complete JSON');
    }
  }
  return results;
}

/**
 * Parse phase_complete blocks from response
 */
export function parsePhaseComplete(text: string): PhaseCompleteEvent | null {
  const match = text.match(/<phase_complete>\s*([\s\S]*?)\s*<\/phase_complete>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as PhaseCompleteEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse phase_complete JSON');
    return null;
  }
}

/**
 * Parse execution_blocked blocks from response
 */
export function parseExecutionBlocked(text: string): ExecutionBlockedEvent | null {
  const match = text.match(/<execution_blocked>\s*([\s\S]*?)\s*<\/execution_blocked>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as ExecutionBlockedEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse execution_blocked JSON');
    return null;
  }
}

/**
 * Parse new_idea blocks from response
 */
export function parseNewIdea(text: string): NewIdeaEvent | null {
  const match = text.match(/<new_idea>\s*([\s\S]*?)\s*<\/new_idea>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as NewIdeaEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse new_idea JSON');
    return null;
  }
}

/**
 * Parse task_update blocks from response
 */
export function parseTaskUpdate(text: string): TaskUpdateEvent | null {
  const match = text.match(/<task_update>\s*([\s\S]*?)\s*<\/task_update>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as TaskUpdateEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse task_update JSON');
    return null;
  }
}

/**
 * Parse all structured events from text.
 * Returns an object containing all parsed events (null if not found).
 */
export interface ParsedEvents {
  taskComplete: TaskCompleteEvent | null;
  phaseComplete: PhaseCompleteEvent | null;
  executionBlocked: ExecutionBlockedEvent | null;
  newIdea: NewIdeaEvent | null;
  taskUpdate: TaskUpdateEvent | null;
}

export function parseAllEvents(text: string): ParsedEvents {
  return {
    taskComplete: parseTaskComplete(text),
    phaseComplete: parsePhaseComplete(text),
    executionBlocked: parseExecutionBlocked(text),
    newIdea: parseNewIdea(text),
    taskUpdate: parseTaskUpdate(text),
  };
}

/**
 * Strip all structured event XML blocks from text.
 * This removes the XML tags so they don't appear in the chat display.
 */
export function stripStructuredEvents(text: string): string {
  return text
    .replace(/<task_complete>\s*[\s\S]*?\s*<\/task_complete>/g, '')
    .replace(/<phase_complete>\s*[\s\S]*?\s*<\/phase_complete>/g, '')
    .replace(/<execution_blocked>\s*[\s\S]*?\s*<\/execution_blocked>/g, '')
    .replace(/<new_idea>\s*[\s\S]*?\s*<\/new_idea>/g, '')
    .replace(/<task_update>\s*[\s\S]*?\s*<\/task_update>/g, '')
    .replace(/```xml\s*```/g, '') // Clean up empty xml code blocks
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
}
