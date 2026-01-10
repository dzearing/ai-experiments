/**
 * State wrapper that tracks version information.
 */
export interface VersionedState<T> {
  /** The actual data. */
  data: T;

  /** Current version number. */
  version: number;

  /** Timestamp of last update. */
  lastUpdated: number;
}
