import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TOPIC_TOOLS_PROMPT } from '../shared/topicToolsMcp.js';

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
 * Topic context for plan agent
 */
export interface TopicContext {
  id: string;
  name: string;
  type: string;
  description?: string;
}

/**
 * Parent topic that provides execution context (e.g., a folder or git repo with localPath)
 */
export interface ParentTopicContext {
  id: string;
  name: string;
  type: string;
  /** Local file system path if this topic provides execution context */
  localPath?: string;
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
  topicContext?: TopicContext;
  /** Parent topics that provide execution context (folders, repos) with their localPath */
  parentTopics?: ParentTopicContext[];
}

/**
 * Build the system prompt for the Plan Agent.
 *
 * @param ideaContext - The idea being planned
 * @param documentContent - Current implementation plan document content (for edits)
 * @param factsSection - Optional remembered facts about the user
 */
export function buildPlanAgentSystemPrompt(
  ideaContext: PlanIdeaContext,
  documentContent?: string | null,
  factsSection?: string
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

  // Build Topic context section if available
  let topicContextSection = '';
  if (ideaContext.topicContext) {
    const { name, type, description } = ideaContext.topicContext;
    topicContextSection = `## Topic Context\nThis idea is linked to **${name}** (${type})`;
    if (description) {
      topicContextSection += `\n\n${description}`;
    }
  }

  // Add parent topics with execution context (folders, repos with localPath)
  // This helps the agent suggest appropriate working directories
  if (ideaContext.parentTopics && ideaContext.parentTopics.length > 0) {
    const parentsWithPath = ideaContext.parentTopics.filter(p => p.localPath);
    if (parentsWithPath.length > 0) {
      topicContextSection += '\n\n## Parent Folder Context\n';
      topicContextSection += 'This idea is associated with the following folders/repositories that can be used as a base for the working directory:\n\n';
      for (const parent of parentsWithPath) {
        topicContextSection += `- **${parent.name}** (${parent.type}): \`${parent.localPath}\`\n`;
      }
      topicContextSection += '\nWhen creating the implementation plan, consider using one of these paths as the base for the working directory (e.g., for a new project named "my-app" under a folder at ~/git, suggest ~/git/my-app).';
    }
  }
  prompt = prompt.replace('{{TOPIC_CONTEXT}}', topicContextSection);

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

  // Add facts section if available
  if (factsSection) {
    prompt += '\n\n' + factsSection;
  }

  // Add topic tools section at the end
  prompt += '\n\n' + TOPIC_TOOLS_PROMPT;

  return prompt;
}
