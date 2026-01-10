import type { Delta } from '../delta/types.js';
import type { VersionedState } from './types.js';
import { applyDelta } from '../delta/applyDelta.js';

/**
 * Applies a delta to versioned state, returning a new state.
 * Validates version continuity and skips stale deltas.
 *
 * @param state Current versioned state.
 * @param delta Delta to apply.
 * @returns New versioned state, or original if delta is stale/invalid.
 */
export function applyVersionedDelta<T>(state: VersionedState<T>, delta: Delta): VersionedState<T> {
  // Skip if delta is from before current version (stale)
  if (delta.version <= state.version) {
    return state;
  }

  // Warn if there's a version gap (missing deltas)
  if (delta.baseVersion !== state.version) {
    console.warn(
      `Version gap detected: expected baseVersion ${state.version}, got ${delta.baseVersion}`,
    );
  }

  const newData = applyDelta(state.data, delta);

  return {
    data: newData,
    version: delta.version,
    lastUpdated: delta.timestamp,
  };
}
