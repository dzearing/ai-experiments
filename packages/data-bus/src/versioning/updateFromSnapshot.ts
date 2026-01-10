import type { VersionedState } from './types.js';

/**
 * Updates versioned state with a full snapshot.
 * Used when deltas are unavailable (reconnection after long disconnect).
 *
 * @param snapshot The new data snapshot.
 * @param version Version number of the snapshot.
 */
export function updateFromSnapshot<T>(snapshot: T, version: number): VersionedState<T> {
  return {
    data: snapshot,
    version,
    lastUpdated: Date.now(),
  };
}
