import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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
 * Build the system prompt for the Idea Agent.
 *
 * @param isNewIdea - Whether this is a new idea (create mode) or existing (edit mode)
 * @param documentContent - Current document content (only used for existing ideas)
 */
export function buildIdeaAgentSystemPrompt(
  isNewIdea: boolean,
  documentContent: string | null
): string {
  if (isNewIdea) {
    return NEW_IDEA_PROMPT;
  }

  // For existing ideas, insert the document content with positions
  const docWithPositions = documentContent
    ? buildDocumentWithPositions(documentContent)
    : '(empty)';

  return EDIT_IDEA_PROMPT
    .replace('{{DOCUMENT_WITH_POSITIONS}}', docWithPositions)
    .replace('{{DOCUMENT_LENGTH}}', String(documentContent?.length || 0));
}
