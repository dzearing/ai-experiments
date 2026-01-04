import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the plan agent prompt template from markdown file
const PLAN_AGENT_PROMPT = fs.readFileSync(
  path.join(__dirname, 'planAgent.md'),
  'utf-8'
);

/**
 * Build a document view with character positions for precise editing.
 * Format: [position] line content
 */
function buildDocumentWithPositions(content: string): string {
  const lines = content.split('\n');
  let charPos = 0;
  const result: string[] = [];

  for (const line of lines) {
    result.push(`[${charPos}] ${line}`);
    charPos += line.length + 1; // +1 for the newline character
  }

  return result.join('\n');
}

/**
 * Thing context for plan agent
 */
export interface ThingContext {
  id: string;
  name: string;
  type: string;
  description?: string;
}

/**
 * Idea context provided to the plan agent
 */
export interface PlanIdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
  tags: string[];
  status: string;
  thingContext?: ThingContext;
}

/**
 * Build the system prompt for the Plan Agent.
 *
 * @param ideaContext - The idea being planned
 * @param documentContent - Current implementation plan document content (for edits)
 */
export function buildPlanAgentSystemPrompt(
  ideaContext: PlanIdeaContext,
  documentContent?: string | null
): string {
  let prompt = PLAN_AGENT_PROMPT;

  // Replace idea context placeholders
  prompt = prompt.replace('{{IDEA_TITLE}}', ideaContext.title || 'Untitled Idea');

  prompt = prompt.replace(
    '{{IDEA_SUMMARY}}',
    ideaContext.summary
      ? `## Summary\n${ideaContext.summary}`
      : ''
  );

  prompt = prompt.replace(
    '{{IDEA_DESCRIPTION}}',
    ideaContext.description
      ? `## Description\n${ideaContext.description}`
      : ''
  );

  // Build Thing context section if available
  let thingContextSection = '';
  if (ideaContext.thingContext) {
    const { name, type, description } = ideaContext.thingContext;
    thingContextSection = `## Thing Context\nThis idea is linked to **${name}** (${type})`;
    if (description) {
      thingContextSection += `\n\n${description}`;
    }
  }
  prompt = prompt.replace('{{THING_CONTEXT}}', thingContextSection);

  // Add current document content with positions for accurate edits
  if (documentContent && documentContent.trim().length > 0) {
    const docWithPositions = buildDocumentWithPositions(documentContent);
    prompt = prompt.replace(
      '{{CURRENT_DOCUMENT}}',
      `## Current Implementation Plan Document (with character positions)

The following is the current content of the Implementation Plan document. Each line is prefixed with its character position [pos].
When making edits, use these positions and the exact text to reliably target your changes.

Document length: ${documentContent.length} characters

\`\`\`
${docWithPositions}
\`\`\``
    );
  } else {
    prompt = prompt.replace(
      '{{CURRENT_DOCUMENT}}',
      '## Current Implementation Plan Document\n\n(No document content yet - use <impl_plan_update> to create the initial document)'
    );
  }

  return prompt;
}
