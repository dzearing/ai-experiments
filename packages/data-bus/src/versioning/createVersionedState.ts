import type { VersionedState } from './types.js';

/**
 * Creates a new versioned state.
 *
 * @param initial Initial data value.
 * @param version Initial version (default 0).
 */
export function createVersionedState<T>(initial: T, version = 0): VersionedState<T> {
  return {
    data: initial,
    version,
    lastUpdated: Date.now(),
  };
}
