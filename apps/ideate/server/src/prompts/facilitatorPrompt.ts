import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the prompt template from markdown file
const FACILITATOR_PROMPT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, 'facilitator.md'),
  'utf-8'
);

/**
 * Build the context section for the user's current location.
 */
export function buildContextSection(contextParts: string[]): string {
  if (contextParts.length === 0) {
    return '';
  }

  return `## User's Current Location

The user is currently viewing:
${contextParts.map(p => `- ${p}`).join('\n')}

When the user says "this document", "this workspace", "here", etc., they are referring to the items above. Use the IDs provided when calling tools.

`;
}

/**
 * Build the facilitator system prompt with all dynamic values.
 */
export function buildFacilitatorPrompt(params: {
  personaPrompt: string;
  userName: string;
  contextSection: string;
  factsSection: string;
  toolsDescription: string;
}): string {
  return FACILITATOR_PROMPT_TEMPLATE
    .replace('{{PERSONA_PROMPT}}', params.personaPrompt)
    .replace('{{USER_NAME}}', params.userName)
    .replace('{{CONTEXT_SECTION}}', params.contextSection)
    .replace('{{FACTS_SECTION}}', params.factsSection)
    .replace('{{TOOLS_DESCRIPTION}}', params.toolsDescription);
}
