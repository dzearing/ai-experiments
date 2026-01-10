import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { TopicContext } from '../services/IdeaAgentService.js';
import { TOPIC_TOOLS_PROMPT } from '../shared/topicToolsMcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the prompt templates from markdown files
const NEW_IDEA_PROMPT = fs.readFileSync(
  path.join(__dirname, 'ideaAgentNew.md'),
  'utf-8'
);

const EDIT_IDEA_PROMPT = fs.readFileSync(
  path.join(__dirname, 'ideaAgentEdit.md'),
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
 * Build topic context section for the prompt
 */
function buildTopicContextSection(topicContext?: TopicContext): string {
  if (!topicContext) return '';

  const { name, type, description } = topicContext;
  let section = `## Parent Context\nThis idea is being created for **${name}** (${type}).`;
  if (description) {
    section += `\n\n${description}`;
  }
  section += '\n\nConsider how this idea fits within and supports the parent context when generating content.';
  return section;
}

/**
 * Build the system prompt for the Idea Agent.
 *
 * @param isNewIdea - Whether this is a new idea (create mode) or existing (edit mode)
 * @param documentContent - Current document content (only used for existing ideas)
 * @param topicContext - Optional Topic context when creating an idea linked to a Topic
 * @param factsSection - Optional remembered facts about the user
 */
export function buildIdeaAgentSystemPrompt(
  isNewIdea: boolean,
  documentContent: string | null,
  topicContext?: TopicContext,
  factsSection?: string
): string {
  const topicContextSection = buildTopicContextSection(topicContext);

  if (isNewIdea) {
    let prompt = NEW_IDEA_PROMPT;
    // Add topic context after "## Current State" section
    if (topicContextSection) {
      prompt = prompt.replace(
        '## Current State\nThis is a NEW idea.',
        `## Current State\nThis is a NEW idea.\n\n${topicContextSection}`
      );
    }
    // Add facts section if available
    if (factsSection) {
      prompt += '\n\n' + factsSection;
    }
    // Add topic tools section at the end
    prompt += '\n\n' + TOPIC_TOOLS_PROMPT;
    return prompt;
  }

  // For existing ideas, insert the document content with positions
  const docWithPositions = documentContent
    ? buildDocumentWithPositions(documentContent)
    : '(empty)';

  let prompt = EDIT_IDEA_PROMPT
    .replace('{{DOCUMENT_WITH_POSITIONS}}', docWithPositions)
    .replace('{{DOCUMENT_LENGTH}}', String(documentContent?.length || 0));

  // Add topic context if available
  if (topicContextSection) {
    prompt = prompt.replace(
      '## Current State',
      `${topicContextSection}\n\n## Current State`
    );
  }

  // Add facts section if available
  if (factsSection) {
    prompt += '\n\n' + factsSection;
  }

  // Add topic tools section at the end
  prompt += '\n\n' + TOPIC_TOOLS_PROMPT;

  return prompt;
}
