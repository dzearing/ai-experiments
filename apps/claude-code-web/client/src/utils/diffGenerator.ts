/**
 * Diff generation utilities for file editing visualization.
 *
 * Uses the `diff` library to generate unified diffs from content changes.
 */

import { createPatch } from 'diff';

/**
 * Generates a unified diff from old and new file content.
 * Suitable for displaying complete file changes.
 *
 * @param filePath - Path to the file (used in diff header)
 * @param oldContent - Original file content
 * @param newContent - Modified file content
 * @returns Unified diff format string
 */
export function generateUnifiedDiff(
  filePath: string,
  oldContent: string,
  newContent: string
): string {
  return createPatch(filePath, oldContent, newContent, '', '', { context: 3 });
}

/**
 * Generates an inline diff from old and new strings.
 * Suitable for Edit tool which replaces specific text fragments.
 *
 * @param oldString - Original text to be replaced
 * @param newString - New text to replace with
 * @returns Unified diff format string
 */
export function generateInlineDiff(
  oldString: string,
  newString: string
): string {
  return createPatch('changes', oldString, newString, '', '', { context: 3 });
}
