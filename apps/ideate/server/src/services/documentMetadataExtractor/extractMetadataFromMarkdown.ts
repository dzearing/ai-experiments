import type { DocumentMetadata } from './types.js';

/**
 * Extracts structured metadata from a markdown document.
 *
 * Expected format:
 * ```
 * # Title
 *
 * ## Summary
 * Summary content here...
 *
 * Tags: tag1, tag2, tag3
 *
 * ---
 *
 * Description content here...
 * ```
 *
 * @param content The markdown content to parse.
 * @returns Extracted metadata.
 */
export function extractMetadataFromMarkdown(content: string): DocumentMetadata {
  const lines = content.split('\n');

  let title = '';
  let inSummary = false;
  let inDescription = false;

  const summaryLines: string[] = [];
  const descriptionLines: string[] = [];
  const tags: string[] = [];

  for (const line of lines) {
    // Extract title from H1
    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // Start of summary section
    if (line.startsWith('## Summary')) {
      inSummary = true;
      inDescription = false;
      continue;
    }

    // Extract tags
    if (line.startsWith('Tags:')) {
      inSummary = false;
      const tagStr = line.slice(5).trim();

      if (tagStr && tagStr !== '_none_') {
        const parsedTags = tagStr
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t && !t.startsWith('_'));

        tags.push(...parsedTags);
      }

      continue;
    }

    // Separator marks start of description
    if (line === '---') {
      inSummary = false;
      inDescription = true;
      continue;
    }

    // Collect summary lines
    if (inSummary) {
      summaryLines.push(line);
    }

    // Collect description lines
    if (inDescription) {
      descriptionLines.push(line);
    }
  }

  let summary = summaryLines.join('\n').trim();

  // Remove placeholder text
  if (summary.startsWith('_') && summary.endsWith('_')) {
    summary = '';
  }

  let description = descriptionLines.join('\n').trim();

  // Remove placeholder text
  if (description.startsWith('_') && description.endsWith('_')) {
    description = '';
  }

  return { title, summary, tags, description };
}
