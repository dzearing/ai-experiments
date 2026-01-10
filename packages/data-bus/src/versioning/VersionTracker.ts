import type { Delta } from '../delta/types.js';

/**
 * Version tracking store for multiple resources.
 */
export class VersionTracker {
  private versions: Map<string, number> = new Map();

  /**
   * Gets the current version for a resource path.
   */
  getVersion(pathKey: string): number {
    return this.versions.get(pathKey) ?? 0;
  }

  /**
   * Sets the version for a resource path.
   */
  setVersion(pathKey: string, version: number): void {
    this.versions.set(pathKey, version);
  }

  /**
   * Checks if a delta should be applied based on version.
   * Returns true if delta is newer than current version.
   */
  shouldApplyDelta(pathKey: string, delta: Delta): boolean {
    const currentVersion = this.getVersion(pathKey);

    return delta.version > currentVersion;
  }

  /**
   * Checks if a version gap exists that requires a snapshot.
   * Returns true if there's a gap between current and delta base version.
   */
  hasVersionGap(pathKey: string, delta: Delta): boolean {
    const currentVersion = this.getVersion(pathKey);

    return delta.baseVersion !== currentVersion;
  }

  /**
   * Clears version tracking for a resource.
   */
  clear(pathKey: string): void {
    this.versions.delete(pathKey);
  }

  /**
   * Clears all version tracking.
   */
  clearAll(): void {
    this.versions.clear();
  }

  /**
   * Gets all tracked resource paths.
   */
  getTrackedPaths(): string[] {
    return Array.from(this.versions.keys());
  }
}
