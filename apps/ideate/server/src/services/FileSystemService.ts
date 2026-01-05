import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Item type - file or folder
 */
export type ItemType = 'file' | 'folder';

/**
 * File system item
 */
export interface FsItem {
  id: string;
  name: string;
  path: string;
  type: ItemType;
  hasChildren?: boolean;
  size?: number;
  modifiedAt?: string;
}

/**
 * Filter options for listing items
 */
export interface FsItemFilter {
  types?: ItemType[];
  extensions?: string[];
  hidden?: boolean;
}

/**
 * List options
 */
export interface FsListOptions {
  limit?: number;
  cursor?: string;
  filter?: FsItemFilter;
}

/**
 * List result with pagination
 */
export interface FsListResult {
  items: FsItem[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

/**
 * Service for file system operations
 */
export class FileSystemService {
  /**
   * Validate and normalize a path to prevent directory traversal attacks
   */
  private normalizePath(inputPath: string): string {
    // Resolve to absolute path and normalize
    const resolved = path.resolve(inputPath || os.homedir());

    // Ensure path doesn't contain dangerous patterns
    if (resolved.includes('..') || resolved.includes('\0')) {
      throw new Error('Invalid path');
    }

    return resolved;
  }

  /**
   * Check if a path is hidden (starts with dot)
   */
  private isHidden(name: string): boolean {
    return name.startsWith('.');
  }

  /**
   * Get file extension
   */
  private getExtension(name: string): string {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.substring(idx) : '';
  }

  /**
   * List items in a directory
   */
  async listItems(dirPath: string, options: FsListOptions = {}): Promise<FsListResult> {
    const normalizedPath = this.normalizePath(dirPath);
    const limit = options.limit ?? 100;
    const offset = options.cursor ? parseInt(options.cursor, 10) : 0;
    const filter = options.filter || {};

    // Read directory entries
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

    // Convert to FsItems and filter
    const allItems: FsItem[] = [];

    for (const entry of entries) {
      const itemPath = path.join(normalizedPath, entry.name);
      const isFolder = entry.isDirectory();
      const type: ItemType = isFolder ? 'folder' : 'file';

      // Apply filters
      if (!filter.hidden && this.isHidden(entry.name)) {
        continue;
      }

      if (filter.types && filter.types.length > 0 && !filter.types.includes(type)) {
        continue;
      }

      if (filter.extensions && filter.extensions.length > 0 && !isFolder) {
        const ext = this.getExtension(entry.name);
        if (!filter.extensions.includes(ext)) {
          continue;
        }
      }

      // Get stats for additional info
      let size: number | undefined;
      let modifiedAt: string | undefined;

      try {
        const stats = await fs.stat(itemPath);
        size = isFolder ? undefined : stats.size;
        modifiedAt = stats.mtime.toISOString();
      } catch {
        // Skip items we can't stat
        continue;
      }

      // Check hasChildren for folders
      let hasChildren: boolean | undefined;
      if (isFolder) {
        try {
          const subEntries = await fs.readdir(itemPath, { withFileTypes: true });
          // Check if any subfolder exists (not just files)
          hasChildren = subEntries.some(e => e.isDirectory());
        } catch {
          hasChildren = false; // Can't read directory
        }
      }

      allItems.push({
        id: itemPath,
        name: entry.name,
        path: itemPath,
        type,
        hasChildren,
        size,
        modifiedAt,
      });
    }

    // Sort: folders first, then alphabetically
    allItems.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Apply pagination
    const items = allItems.slice(offset, offset + limit);
    const hasMore = offset + limit < allItems.length;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? String(offset + limit) : undefined,
      totalCount: allItems.length,
    };
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath: string, name: string): Promise<FsItem> {
    const normalizedParent = this.normalizePath(parentPath);
    const folderPath = path.join(normalizedParent, name);

    // Validate folder name
    if (!name || name.includes('/') || name.includes('\\') || name === '.' || name === '..') {
      throw new Error('Invalid folder name');
    }

    // Create the folder
    await fs.mkdir(folderPath);

    return {
      id: folderPath,
      name,
      path: folderPath,
      type: 'folder',
      hasChildren: false,
      modifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Get root paths (home, desktop, documents, etc.)
   */
  async getRoots(): Promise<FsItem[]> {
    const home = os.homedir();
    const roots: FsItem[] = [];

    // Add home directory
    roots.push({
      id: home,
      name: 'Home',
      path: home,
      type: 'folder',
      hasChildren: true,
    });

    // Add common directories if they exist
    const commonDirs = [
      { name: 'Desktop', subpath: 'Desktop' },
      { name: 'Documents', subpath: 'Documents' },
      { name: 'Downloads', subpath: 'Downloads' },
      { name: 'Projects', subpath: 'Projects' },
    ];

    for (const dir of commonDirs) {
      const dirPath = path.join(home, dir.subpath);
      try {
        await fs.access(dirPath);
        roots.push({
          id: dirPath,
          name: dir.name,
          path: dirPath,
          type: 'folder',
          hasChildren: true,
        });
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // On macOS/Linux, add root
    if (process.platform !== 'win32') {
      roots.push({
        id: '/',
        name: '/',
        path: '/',
        type: 'folder',
        hasChildren: true,
      });
    }

    return roots;
  }

  /**
   * Resolve a single item by path
   */
  async resolveItem(itemPath: string): Promise<FsItem | null> {
    try {
      const normalizedPath = this.normalizePath(itemPath);
      const stats = await fs.stat(normalizedPath);
      const isFolder = stats.isDirectory();

      let hasChildren: boolean | undefined;
      if (isFolder) {
        try {
          const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
          hasChildren = entries.some(e => e.isDirectory());
        } catch {
          hasChildren = false;
        }
      }

      return {
        id: normalizedPath,
        name: path.basename(normalizedPath),
        path: normalizedPath,
        type: isFolder ? 'folder' : 'file',
        hasChildren,
        size: isFolder ? undefined : stats.size,
        modifiedAt: stats.mtime.toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Validate if a path exists
   */
  async validatePath(itemPath: string): Promise<boolean> {
    try {
      const normalizedPath = this.normalizePath(itemPath);
      await fs.access(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }
}
