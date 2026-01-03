/**
 * Shared types for agent progress events.
 * Used by all agent services (Facilitator, Ideas, Planning) for consistent progress feedback.
 */

/**
 * Progress event types
 */
export type AgentProgressType = 'tool_start' | 'tool_complete' | 'thinking' | 'status';

/**
 * Agent progress event - represents a single progress update.
 * This is sent from server to client via WebSocket.
 */
export interface AgentProgressEvent {
  /** Type of progress event */
  type: AgentProgressType;

  /** When this event occurred */
  timestamp: number;

  /** Tool name (for tool events) */
  toolName?: string;

  /** Human-readable display text (e.g., "Read(src/file.ts)") */
  displayText: string;

  // File operations
  filePath?: string;
  lineRange?: { start: number; end: number };
  linesAdded?: number;
  linesRemoved?: number;
  codePreview?: string;

  // Search operations
  searchQuery?: string;
  searchPath?: string;
  resultCount?: number;
  matchedFiles?: string[];

  // Command execution
  command?: string;
  exitCode?: number;
  stdout?: string;

  // Completion info (for tool_complete)
  success?: boolean;
}

/**
 * Callback interface that any agent service can use for progress reporting.
 * Extend your service's callback interface with this.
 */
export interface AgentProgressCallbacks {
  /** Called when a progress event occurs */
  onProgressEvent?: (event: AgentProgressEvent) => void;
}
