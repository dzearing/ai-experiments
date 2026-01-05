/**
 * ItemProvider Types
 *
 * Defines interfaces for file/folder providers that can be used with
 * picker components. Supports various data sources (disk, GitHub, S3, etc.)
 * with async resolution and pagination.
 */

/** Item type - file or folder */
export type ItemType = 'file' | 'folder';

/**
 * Base item interface representing a file or folder.
 * Can be extended via generics for custom metadata.
 */
export interface Item {
  /** Unique identifier (typically the full path) */
  id: string;
  /** Display name */
  name: string;
  /** Full path to the item */
  path: string;
  /** Whether this is a file or folder */
  type: ItemType;
  /** For folders: whether it has children (enables lazy loading) */
  hasChildren?: boolean;
  /** File size in bytes (optional) */
  size?: number;
  /** Last modified timestamp (optional) */
  modifiedAt?: Date | string;
  /** Custom metadata (extensible) */
  metadata?: Record<string, unknown>;
}

/**
 * Filter criteria for listing items
 */
export interface ItemFilter {
  /** Filter by item types (file, folder, or both) */
  types?: ItemType[];
  /** Filter by file extensions (e.g., ['.ts', '.tsx']) */
  extensions?: string[];
  /** Include hidden files/folders (default: false) */
  hidden?: boolean;
}

/**
 * Options for listing items with pagination
 */
export interface ListOptions {
  /** Pagination cursor for fetching next page */
  cursor?: string;
  /** Maximum items to return (default: 100) */
  limit?: number;
  /** Filter criteria */
  filter?: ItemFilter;
}

/**
 * Result of listing items with pagination info
 */
export interface ListResult<T extends Item = Item> {
  /** Array of items */
  items: T[];
  /** Cursor for next page (undefined if no more items) */
  nextCursor?: string;
  /** Whether there are more items to fetch */
  hasMore: boolean;
  /** Optional total count of items */
  totalCount?: number;
}

/**
 * Provider interface for file/folder data sources.
 *
 * Implementations can connect to various backends:
 * - DiskItemProvider: Local file system via server API
 * - MockItemProvider: Mock data for testing
 * - GitHubItemProvider: GitHub repository contents
 * - S3ItemProvider: AWS S3 buckets
 *
 * @example
 * ```tsx
 * const diskProvider = new DiskItemProvider('/api/fs');
 * <FolderPickerDialog provider={diskProvider} />
 * ```
 */
export interface ItemProvider<T extends Item = Item> {
  /** Provider name for display/debugging */
  readonly name: string;

  /**
   * List items at a given path with optional pagination.
   * @param path - Directory path to list (empty string for root)
   * @param options - Pagination and filter options
   * @returns Promise resolving to list result with items and pagination info
   */
  listItems(path: string, options?: ListOptions): Promise<ListResult<T>>;

  /**
   * Create a new folder at the specified location.
   * Optional - only available if provider supports folder creation.
   * @param parentPath - Path of parent directory
   * @param name - Name of the new folder
   * @returns Promise resolving to created item or null on failure
   */
  createFolder?(parentPath: string, name: string): Promise<T | null>;

  /**
   * Get root paths (e.g., home directory, drives, favorites).
   * Optional - used to show quick access locations.
   * @returns Promise resolving to array of root items
   */
  getRoots?(): Promise<T[]>;

  /**
   * Resolve a single item by its path.
   * Optional - used for path validation and metadata fetching.
   * @param path - Full path to resolve
   * @returns Promise resolving to item or null if not found
   */
  resolveItem?(path: string): Promise<T | null>;

  /**
   * Search for items matching a query.
   * Optional - enables search functionality in pickers.
   * @param query - Search query string
   * @param path - Optional path to search within
   * @param options - Pagination and filter options
   * @returns Promise resolving to search results
   */
  search?(query: string, path?: string, options?: ListOptions): Promise<ListResult<T>>;

  /**
   * Validate if a path exists and is accessible.
   * Optional - used for path input validation.
   * @param path - Path to validate
   * @returns Promise resolving to true if path exists
   */
  validatePath?(path: string): Promise<boolean>;
}

/**
 * Configuration options for providers
 */
export interface ProviderConfig {
  /** Base URL for API requests */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
}
