import type { Item, ItemProvider, ListOptions, ListResult, ItemFilter } from './types';

/**
 * Configuration for MockItemProvider
 */
export interface MockItemProviderConfig {
  /** Simulated network delay in milliseconds (default: 300) */
  delay?: number;
  /** Callback for folder creation (simulated) */
  onCreateFolder?: (parentPath: string, name: string) => Item | null;
}

/**
 * Mock item provider for testing and Storybook demos.
 *
 * Accepts a mock file system structure and simulates async operations
 * with configurable delays.
 *
 * @example
 * ```tsx
 * const mockData: Record<string, Item[]> = {
 *   '': [
 *     { id: '/Users', name: 'Users', path: '/Users', type: 'folder', hasChildren: true },
 *   ],
 *   '/Users': [
 *     { id: '/Users/alice', name: 'alice', path: '/Users/alice', type: 'folder', hasChildren: true },
 *   ],
 * };
 *
 * const provider = new MockItemProvider(mockData);
 * <FolderPickerDialog provider={provider} />
 * ```
 */
export class MockItemProvider implements ItemProvider {
  readonly name = 'MockItemProvider';
  private delay: number;
  private onCreateFolderCallback?: (parentPath: string, name: string) => Item | null;

  constructor(
    private mockData: Record<string, Item[]>,
    config: MockItemProviderConfig = {}
  ) {
    this.delay = config.delay ?? 300;
    this.onCreateFolderCallback = config.onCreateFolder;
  }

  /**
   * Simulate async delay
   */
  private async simulateDelay(): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
  }

  /**
   * Filter items based on filter criteria
   */
  private filterItems(items: Item[], filter?: ItemFilter): Item[] {
    if (!filter) return items;

    return items.filter(item => {
      // Filter by type
      if (filter.types && filter.types.length > 0) {
        if (!filter.types.includes(item.type)) {
          return false;
        }
      }

      // Filter by extension (for files only)
      if (filter.extensions && filter.extensions.length > 0 && item.type === 'file') {
        const ext = item.name.substring(item.name.lastIndexOf('.'));
        if (!filter.extensions.includes(ext)) {
          return false;
        }
      }

      // Filter hidden files (those starting with .)
      if (!filter.hidden && item.name.startsWith('.')) {
        return false;
      }

      return true;
    });
  }

  /**
   * List items at a path with optional pagination
   */
  async listItems(path: string, options?: ListOptions): Promise<ListResult<Item>> {
    await this.simulateDelay();

    // Normalize root path - treat '/' and '' as equivalent
    const normalizedPath = path === '/' ? '' : path;
    const allItems = this.mockData[normalizedPath] || [];
    const filteredItems = this.filterItems(allItems, options?.filter);

    // Simple pagination using cursor as offset
    const limit = options?.limit ?? 100;
    const offset = options?.cursor ? parseInt(options.cursor, 10) : 0;
    const items = filteredItems.slice(offset, offset + limit);
    const hasMore = offset + limit < filteredItems.length;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? String(offset + limit) : undefined,
      totalCount: filteredItems.length,
    };
  }

  /**
   * Create a new folder (simulated)
   */
  async createFolder(parentPath: string, name: string): Promise<Item | null> {
    await this.simulateDelay();

    if (this.onCreateFolderCallback) {
      return this.onCreateFolderCallback(parentPath, name);
    }

    // Default behavior: create a mock folder
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;
    const newFolder: Item = {
      id: path,
      name,
      path,
      type: 'folder',
      hasChildren: false,
    };

    // Add to mock data
    if (!this.mockData[parentPath]) {
      this.mockData[parentPath] = [];
    }
    this.mockData[parentPath].push(newFolder);
    this.mockData[path] = [];

    return newFolder;
  }

  /**
   * Get root paths (Home, Desktop, Documents, etc.)
   * Returns items marked with __roots__ key, or auto-detects home directory
   */
  async getRoots(): Promise<Item[]> {
    await this.simulateDelay();

    // Check for explicitly defined roots
    if (this.mockData['__roots__']) {
      return this.mockData['__roots__'];
    }

    // Auto-detect home directory from common patterns
    const homePaths = ['/Users/alice', '/home/user', '~'];
    for (const homePath of homePaths) {
      if (this.mockData[homePath]) {
        const roots: Item[] = [{
          id: homePath,
          name: 'Home',
          path: homePath,
          type: 'folder',
          hasChildren: true,
        }];

        // Add common subdirectories as shortcuts if they exist
        const shortcuts = ['Desktop', 'Documents', 'Downloads', 'Projects'];
        for (const name of shortcuts) {
          const subPath = `${homePath}/${name}`;
          if (this.mockData[subPath]) {
            roots.push({
              id: subPath,
              name,
              path: subPath,
              type: 'folder',
              hasChildren: true,
            });
          }
        }

        return roots;
      }
    }

    // Fall back to root items
    return this.mockData[''] || [];
  }

  /**
   * Resolve a single item by path
   */
  async resolveItem(path: string): Promise<Item | null> {
    await this.simulateDelay();

    // Search through all paths
    for (const items of Object.values(this.mockData)) {
      const found = items.find(item => item.path === path);
      if (found) return found;
    }

    return null;
  }

  /**
   * Validate if a path exists
   */
  async validatePath(path: string): Promise<boolean> {
    const item = await this.resolveItem(path);
    return item !== null;
  }

  /**
   * Search items by name (simple contains match)
   */
  async search(query: string, searchPath?: string, options?: ListOptions): Promise<ListResult<Item>> {
    await this.simulateDelay();

    const lowerQuery = query.toLowerCase();
    const allItems: Item[] = [];

    // Collect all items, optionally filtered by path prefix
    for (const [itemPath, items] of Object.entries(this.mockData)) {
      if (searchPath && !itemPath.startsWith(searchPath)) {
        continue;
      }
      allItems.push(...items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery)
      ));
    }

    const filteredItems = this.filterItems(allItems, options?.filter);

    // Pagination
    const limit = options?.limit ?? 100;
    const offset = options?.cursor ? parseInt(options.cursor, 10) : 0;
    const items = filteredItems.slice(offset, offset + limit);
    const hasMore = offset + limit < filteredItems.length;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? String(offset + limit) : undefined,
      totalCount: filteredItems.length,
    };
  }
}
