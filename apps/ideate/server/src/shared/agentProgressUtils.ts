/**
 * Utilities for extracting and formatting agent progress events.
 * Used by all agent services for consistent progress reporting.
 */

import type { AgentProgressEvent } from './agentProgress.js';

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string | undefined | null, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Shorten a file path for display
 */
export function shortenPath(path: string | undefined | null): string {
  if (!path) return '';
  // Remove common prefixes and keep last 2-3 parts
  const parts = path.split('/');
  if (parts.length <= 3) return path;
  return '.../' + parts.slice(-3).join('/');
}

/**
 * Shorten a URL for display
 */
export function shortenUrl(url: string | undefined | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname + truncate(parsed.pathname, 30);
  } catch {
    return truncate(url, 50);
  }
}

/**
 * Extract progress info from a tool use event (start)
 */
export function extractToolProgressStart(
  toolName: string,
  input: Record<string, unknown> | unknown
): AgentProgressEvent {
  const inp = (input || {}) as Record<string, unknown>;
  const event: AgentProgressEvent = {
    type: 'tool_start',
    timestamp: Date.now(),
    toolName,
    displayText: formatToolDisplayStart(toolName, inp),
  };

  // Extract additional info based on tool type
  switch (toolName.toLowerCase()) {
    case 'read':
    case 'read_file':
      event.filePath = inp.file_path as string;
      if (inp.offset && inp.limit) {
        event.lineRange = {
          start: inp.offset as number,
          end: (inp.offset as number) + (inp.limit as number),
        };
      }
      break;

    case 'edit':
      event.filePath = inp.file_path as string;
      if (inp.old_string && inp.new_string) {
        const oldLines = String(inp.old_string).split('\n').length;
        const newLines = String(inp.new_string).split('\n').length;
        event.linesAdded = Math.max(0, newLines - oldLines);
        event.linesRemoved = Math.max(0, oldLines - newLines);
        event.codePreview = truncate(String(inp.new_string), 200);
      }
      break;

    case 'write':
      event.filePath = inp.file_path as string;
      if (inp.content) {
        event.linesAdded = String(inp.content).split('\n').length;
        event.codePreview = truncate(String(inp.content), 200);
      }
      break;

    case 'grep':
      event.searchQuery = inp.pattern as string;
      event.searchPath = (inp.path as string) || 'cwd';
      break;

    case 'glob':
      event.searchQuery = inp.pattern as string;
      event.searchPath = (inp.path as string) || 'cwd';
      break;

    case 'bash':
      event.command = truncate(inp.command as string, 100);
      break;

    case 'webfetch':
    case 'web_fetch':
      event.filePath = inp.url as string; // Reuse filePath for URL
      break;
  }

  return event;
}

/**
 * Extract progress info from a tool result (complete)
 */
export function extractToolProgressComplete(
  toolName: string,
  input: Record<string, unknown> | unknown,
  result: unknown,
  success: boolean
): AgentProgressEvent {
  const event: AgentProgressEvent = {
    type: 'tool_complete',
    timestamp: Date.now(),
    toolName,
    displayText: '', // Will be set below
    success,
  };

  // Copy relevant fields from input
  const startEvent = extractToolProgressStart(toolName, input);
  event.filePath = startEvent.filePath;
  event.lineRange = startEvent.lineRange;
  event.searchQuery = startEvent.searchQuery;
  event.searchPath = startEvent.searchPath;
  event.command = startEvent.command;
  event.linesAdded = startEvent.linesAdded;
  event.linesRemoved = startEvent.linesRemoved;
  event.codePreview = startEvent.codePreview;

  // Extract result-specific info
  switch (toolName.toLowerCase()) {
    case 'grep':
      if (typeof result === 'string') {
        const lines = result.split('\n').filter(Boolean);
        event.resultCount = lines.length;
        // Extract file names from grep output
        const files = new Set<string>();
        for (const line of lines.slice(0, 20)) {
          const match = line.match(/^([^:]+):/);
          if (match) files.add(match[1]);
        }
        event.matchedFiles = Array.from(files).slice(0, 10);
      }
      break;

    case 'glob':
      if (Array.isArray(result)) {
        event.resultCount = result.length;
        event.matchedFiles = result.slice(0, 10) as string[];
      } else if (typeof result === 'string') {
        const files = result.split('\n').filter(Boolean);
        event.resultCount = files.length;
        event.matchedFiles = files.slice(0, 10);
      }
      break;

    case 'bash':
      if (result && typeof result === 'object') {
        const bashResult = result as { exitCode?: number; stdout?: string; stderr?: string };
        event.exitCode = bashResult.exitCode;
        event.stdout = truncate(bashResult.stdout, 200);
      }
      break;
  }

  // Generate display text for completion
  event.displayText = formatToolDisplayComplete(event);

  return event;
}

/**
 * Format display text for tool start (Claude Code style)
 */
function formatToolDisplayStart(toolName: string, input: Record<string, unknown>): string {
  const name = toolName.toLowerCase();

  switch (name) {
    case 'read':
    case 'read_file': {
      const path = shortenPath(input.file_path as string);
      const range =
        input.offset && input.limit
          ? ` (lines ${input.offset}-${(input.offset as number) + (input.limit as number)})`
          : '';
      return `Read(${path})${range}`;
    }

    case 'edit':
      return `Update(${shortenPath(input.file_path as string)})`;

    case 'write':
      return `Write(${shortenPath(input.file_path as string)})`;

    case 'grep':
      return `Search("${truncate(input.pattern as string, 30)}") in ${shortenPath(input.path as string) || 'cwd'}`;

    case 'glob':
      return `Glob("${truncate(input.pattern as string, 30)}")`;

    case 'bash':
      return `Bash(${truncate(input.command as string, 40)})`;

    case 'webfetch':
    case 'web_fetch':
      return `Fetch(${shortenUrl(input.url as string)})`;

    case 'websearch':
    case 'web_search':
      return `WebSearch("${truncate(input.query as string, 40)}")`;

    case 'task':
      return `Task(${truncate(input.description as string, 40)})`;

    case 'lsp':
      return `LSP(${input.operation})`;

    default:
      return `${toolName}(...)`;
  }
}

/**
 * Format display text for tool completion
 */
function formatToolDisplayComplete(event: AgentProgressEvent): string {
  const parts: string[] = [];

  // Line changes
  if (event.linesAdded && event.linesAdded > 0) {
    parts.push(`Added ${event.linesAdded} lines`);
  }
  if (event.linesRemoved && event.linesRemoved > 0) {
    parts.push(`Removed ${event.linesRemoved} lines`);
  }

  // Search results
  if (event.resultCount !== undefined) {
    parts.push(`Found ${event.resultCount} matches`);
    if (event.matchedFiles && event.matchedFiles.length > 0) {
      const fileList = event.matchedFiles.slice(0, 3).map(shortenPath).join(', ');
      const more = event.matchedFiles.length > 3 ? ` (+${event.matchedFiles.length - 3} more)` : '';
      parts.push(`in ${fileList}${more}`);
    }
  }

  // Bash exit code
  if (event.exitCode !== undefined) {
    parts.push(event.exitCode === 0 ? 'Success' : `Exit: ${event.exitCode}`);
  }

  if (parts.length > 0) {
    return parts.join(' | ');
  }

  return event.success ? 'Done' : 'Failed';
}

/**
 * Create a thinking progress event
 */
export function createThinkingEvent(thinkingText: string): AgentProgressEvent {
  return {
    type: 'thinking',
    timestamp: Date.now(),
    displayText: truncate(thinkingText, 100),
  };
}

/**
 * Create a status progress event
 */
export function createStatusEvent(status: string): AgentProgressEvent {
  return {
    type: 'status',
    timestamp: Date.now(),
    displayText: status,
  };
}
