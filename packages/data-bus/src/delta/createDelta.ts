import type { Delta } from './types.js';
import { diffValues } from './diffValues.js';

/**
 * Creates a delta representing the changes from old state to new state.
 *
 * @param oldState The previous state.
 * @param newState The new state.
 * @param version The version number for the resulting delta.
 * @param baseVersion The base version this delta was computed from.
 * @returns A delta representing the changes.
 */
export function createDelta(
  oldState: unknown,
  newState: unknown,
  version: number,
  baseVersion: number,
): Delta {
  const operations = diffValues(oldState, newState, []);

  return {
    version,
    baseVersion,
    operations,
    timestamp: Date.now(),
  };
}
