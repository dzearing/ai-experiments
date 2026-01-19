/**
 * Tool result transformation utilities.
 * Parses SDK tool output into display-friendly formats.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Parsed result from a Glob tool execution.
 */
export interface GlobResult {
  /** List of file paths matched by the glob pattern */
  files: string[];
  /** Whether results were truncated */
  truncated: boolean;
  /** Total count of matches (may be higher than files.length if truncated) */
  totalCount: number;
}

/**
 * Single match from a Grep tool execution.
 */
export interface GrepMatch {
  /** File path containing the match */
  file: string;
  /** Line number of the match */
  line: number;
  /** Content of the matching line */
  content: string;
}

/**
 * Parsed result from a Grep tool execution.
 */
export interface GrepResult {
  /** List of matches found */
  matches: GrepMatch[];
  /** Whether results were truncated */
  truncated: boolean;
  /** Total count of matches */
  totalMatches: number;
}

// =============================================================================
// Glob Output Parser
// =============================================================================

/**
 * Parses Glob tool output into a structured format.
 *
 * The Glob tool returns one file path per line. If results are truncated,
 * the last line will be in the format "... and N more files".
 *
 * @param output - Raw output string from Glob tool
 * @returns Parsed glob result with files array and truncation info
 */
export function parseGlobOutput(output: string): GlobResult {
  // Handle empty output
  if (!output || !output.trim()) {
    return {
      files: [],
      truncated: false,
      totalCount: 0,
    };
  }

  // Split into lines and filter empty ones
  const lines = output.trim().split('\n').filter(line => line.trim() !== '');

  // Handle case with no results
  if (lines.length === 0) {
    return {
      files: [],
      truncated: false,
      totalCount: 0,
    };
  }

  // Check for truncation message in last line
  const lastLine = lines[lines.length - 1];
  const truncationMatch = lastLine.match(/^\.\.\.\s*and\s+(\d+)\s+more\s+files?$/i);

  if (truncationMatch) {
    const additionalCount = parseInt(truncationMatch[1], 10);
    const files = lines.slice(0, -1);

    return {
      files,
      truncated: true,
      totalCount: files.length + additionalCount,
    };
  }

  // No truncation
  return {
    files: lines,
    truncated: false,
    totalCount: lines.length,
  };
}

// =============================================================================
// Grep Output Parser
// =============================================================================

/**
 * Parses Grep tool output into a structured format.
 *
 * The Grep tool returns matches in the format "file:line:content" or "file:line-content".
 * Some output modes may use different separators between line number and content.
 *
 * @param output - Raw output string from Grep tool
 * @returns Parsed grep result with matches array and truncation info
 */
export function parseGrepOutput(output: string): GrepResult {
  // Handle empty output
  if (!output || !output.trim()) {
    return {
      matches: [],
      truncated: false,
      totalMatches: 0,
    };
  }

  // Split into lines and filter empty ones
  const lines = output.trim().split('\n').filter(line => line.trim() !== '');
  const matches: GrepMatch[] = [];

  for (const line of lines) {
    // Match format: "file:line:content" or "file:line-content"
    // The file path can contain colons (Windows paths, timestamps in filenames)
    // so we need to be careful with parsing
    const match = parseGrepLine(line);

    if (match) {
      matches.push(match);
    }
  }

  // Consider truncated if we hit typical limits (100+ matches)
  const truncated = matches.length >= 100;

  return {
    matches,
    truncated,
    totalMatches: matches.length,
  };
}

/**
 * Parses a single grep output line.
 *
 * Handles various grep output formats:
 * - Standard: "file:line:content"
 * - Context: "file:line-content" (for context lines with -)
 * - Windows paths: "C:\path\file:line:content"
 *
 * @param line - Single line of grep output
 * @returns Parsed match or null if line doesn't match expected format
 */
function parseGrepLine(line: string): GrepMatch | null {
  // Try standard format: file:line:content or file:line-content
  // Account for Windows paths by checking if first colon is after drive letter
  let startIndex = 0;

  // Handle Windows drive letter (e.g., "C:")
  if (/^[a-zA-Z]:/.test(line)) {
    startIndex = 2;
  }

  // Find the line number portion
  // Look for pattern like ":123:" or ":123-"
  const lineNumberMatch = line.slice(startIndex).match(/:(\d+)([:|-])/);

  if (!lineNumberMatch) {
    // Line doesn't match expected format
    return null;
  }

  // Calculate positions
  const colonBeforeLineNum = startIndex + (lineNumberMatch.index ?? 0);
  const lineNumber = parseInt(lineNumberMatch[1], 10);
  // Separator (: or -) indicates match vs context line - not used currently
  const contentStartIndex = colonBeforeLineNum + 1 + lineNumberMatch[1].length + 1;

  // Extract parts
  const file = line.slice(0, colonBeforeLineNum);
  const content = line.slice(contentStartIndex);

  // Validate we got reasonable values
  if (!file || isNaN(lineNumber)) {
    return null;
  }

  return {
    file,
    line: lineNumber,
    content,
  };
}
