import type { Delta, DeltaBuffer } from './types.js';

/**
 * Gets all deltas since a given version.
 *
 * @param buffer The delta buffer.
 * @param sinceVersion The version to start from (exclusive).
 * @returns Array of deltas, or null if the version is too old.
 */
export function getDeltasSince(buffer: DeltaBuffer, sinceVersion: number): Delta[] | null {
  // Version too old - need full snapshot
  if (sinceVersion < buffer.oldestVersion) {
    return null;
  }

  return buffer.deltas.filter((delta) => delta.baseVersion >= sinceVersion);
}
