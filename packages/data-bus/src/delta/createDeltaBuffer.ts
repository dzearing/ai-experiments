import type { DeltaBuffer } from './types.js';

/**
 * Creates a new delta buffer for retaining recent deltas.
 *
 * @param maxRetained Maximum number of deltas to retain (default 100).
 */
export function createDeltaBuffer(maxRetained = 100): DeltaBuffer {
  return {
    deltas: [],
    maxRetained,
    oldestVersion: 0,
  };
}
