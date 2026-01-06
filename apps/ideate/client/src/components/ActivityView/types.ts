/**
 * Types for execution activity tracking (revisions, file changes, diffs)
 */

/** File change type */
export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed';

/** Individual file change within a revision */
export interface FileChange {
  /** Unique identifier */
  id: string;
  /** File path (relative to working directory) */
  path: string;
  /** Old path for renamed files */
  oldPath?: string;
  /** Type of change */
  type: FileChangeType;
  /** Number of lines added */
  additions: number;
  /** Number of lines deleted */
  deletions: number;
  /** Unified diff content (for display) */
  diff?: string;
}

/** A revision (commit or checkpoint) during execution */
export interface Revision {
  /** Unique identifier (commit hash or generated ID) */
  id: string;
  /** Short identifier (first 7 chars of hash) */
  shortId: string;
  /** Revision message/summary */
  message: string;
  /** Task ID this revision is associated with */
  taskId?: string;
  /** Phase ID this revision is associated with */
  phaseId?: string;
  /** Timestamp */
  timestamp: number;
  /** Author name */
  author: string;
  /** Files changed in this revision */
  files: FileChange[];
  /** Total lines added */
  totalAdditions: number;
  /** Total lines deleted */
  totalDeletions: number;
}

/** Activity state for the execution session */
export interface ExecutionActivity {
  /** All revisions in chronological order */
  revisions: Revision[];
  /** Currently selected revision ID */
  selectedRevisionId: string | null;
  /** Currently selected file path */
  selectedFilePath: string | null;
  /** Whether activity is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}
