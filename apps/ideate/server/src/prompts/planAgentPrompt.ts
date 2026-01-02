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
 */
export function buildPlanAgentSystemPrompt(ideaContext: PlanIdeaContext): string {
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

  return prompt;
}
