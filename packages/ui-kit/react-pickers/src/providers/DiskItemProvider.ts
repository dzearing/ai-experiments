import type { Item, ItemProvider, ListOptions, ListResult, ProviderConfig } from './types';

/**
 * Configuration for DiskItemProvider
 */
export interface DiskItemProviderConfig extends ProviderConfig {
  /** Base URL for file system API (default: '/api/fs') */
  baseUrl?: string;
}

/**
 * Item provider for local file system access via server API.
 *
 * Requires a backend server with file system endpoints:
 * - GET /list?path=...&limit=...&cursor=...&types=...&extensions=...&hidden=...
 * - POST /mkdir { parentPath, name }
 * - GET /roots
 * - GET /resolve?path=...
 *
 * @example
 * ```tsx
 * // When using with ideate server
 * const diskProvider = new DiskItemProvider({ baseUrl: '/api/fs' });
 * <FolderPickerDialog provider={diskProvider} />
 * ```
 */
export class DiskItemProvider implements ItemProvider {
  readonly name = 'DiskItemProvider';
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: DiskItemProviderConfig = {}) {
    this.baseUrl = config.baseUrl ?? '/api/fs';
    this.timeout = config.timeout ?? 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Make a fetch request with error handling
   */
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * List items at a path with optional pagination
   */
  async listItems(path: string, options?: ListOptions): Promise<ListResult<Item>> {
    const params = new URLSearchParams();
    params.set('path', path);

    if (options?.limit) {
      params.set('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.filter?.types) {
      params.set('types', options.filter.types.join(','));
    }
    if (options?.filter?.extensions) {
      params.set('extensions', options.filter.extensions.join(','));
    }
    if (options?.filter?.hidden !== undefined) {
      params.set('hidden', String(options.filter.hidden));
    }

    return this.request<ListResult<Item>>(`${this.baseUrl}/list?${params}`);
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath: string, name: string): Promise<Item | null> {
    try {
      return await this.request<Item>(`${this.baseUrl}/mkdir`, {
        method: 'POST',
        body: JSON.stringify({ parentPath, name }),
      });
    } catch {
      return null;
    }
  }

  /**
   * Get root paths (home, desktop, documents, etc.)
   */
  async getRoots(): Promise<Item[]> {
    const result = await this.request<{ items: Item[] }>(`${this.baseUrl}/roots`);
    return result.items;
  }

  /**
   * Resolve a single item by path
   */
  async resolveItem(path: string): Promise<Item | null> {
    try {
      const params = new URLSearchParams({ path });
      return await this.request<Item>(`${this.baseUrl}/resolve?${params}`);
    } catch {
      return null;
    }
  }

  /**
   * Validate if a path exists
   */
  async validatePath(path: string): Promise<boolean> {
    const item = await this.resolveItem(path);
    return item !== null;
  }

  /**
   * Search items by query
   */
  async search(query: string, searchPath?: string, options?: ListOptions): Promise<ListResult<Item>> {
    const params = new URLSearchParams();
    params.set('q', query);

    if (searchPath) {
      params.set('path', searchPath);
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.filter?.types) {
      params.set('types', options.filter.types.join(','));
    }
    if (options?.filter?.extensions) {
      params.set('extensions', options.filter.extensions.join(','));
    }

    return this.request<ListResult<Item>>(`${this.baseUrl}/search?${params}`);
  }
}
