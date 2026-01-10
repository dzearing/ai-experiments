/**
 * Delta operation types for incremental state updates.
 */

/**
 * Set a value at a specific path.
 */
export interface SetOperation {
  op: 'set';
  path: string[];
  value: unknown;
}

/**
 * Delete a value at a specific path.
 */
export interface DeleteOperation {
  op: 'delete';
  path: string[];
}

/**
 * Shallow merge object properties at a path.
 */
export interface MergeOperation {
  op: 'merge';
  path: string[];
  value: Record<string, unknown>;
}

/**
 * Append a value to an array at a path.
 */
export interface AppendOperation {
  op: 'append';
  path: string[];
  value: unknown;
}

/**
 * Splice an array at a path (remove and/or insert items).
 */
export interface SpliceOperation {
  op: 'splice';
  path: string[];
  index: number;
  deleteCount: number;
  items?: unknown[];
}

/**
 * Union of all delta operation types.
 */
export type DeltaOperation =
  | SetOperation
  | DeleteOperation
  | MergeOperation
  | AppendOperation
  | SpliceOperation;

/**
 * A delta represents a set of changes from one version to another.
 */
export interface Delta {
  /** Target version after applying this delta. */
  version: number;

  /** Source version this delta was computed from. */
  baseVersion: number;

  /** Operations to apply. */
  operations: DeltaOperation[];

  /** Timestamp when this delta was created. */
  timestamp: number;
}

/**
 * A buffer of recent deltas for reconnection sync.
 */
export interface DeltaBuffer {
  /** Retained deltas. */
  deltas: Delta[];

  /** Maximum number of deltas to retain. */
  maxRetained: number;

  /** Oldest version available in the buffer. */
  oldestVersion: number;
}
