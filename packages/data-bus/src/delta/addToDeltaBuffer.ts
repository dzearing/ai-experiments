import type { Delta, DeltaBuffer } from './types.js';

/**
 * Adds a delta to the buffer, pruning old deltas if needed.
 *
 * @param buffer The buffer to add to.
 * @param delta The delta to add.
 */
export function addToDeltaBuffer(buffer: DeltaBuffer, delta: Delta): void {
  buffer.deltas.push(delta);

  // Prune if over limit
  while (buffer.deltas.length > buffer.maxRetained) {
    buffer.deltas.shift();
  }

  // Update oldest version
  if (buffer.deltas.length > 0) {
    buffer.oldestVersion = buffer.deltas[0].baseVersion;
  }
}
