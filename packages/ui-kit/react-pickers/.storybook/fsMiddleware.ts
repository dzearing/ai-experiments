import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { Plugin, Connect } from 'vite';

type ItemType = 'file' | 'folder';

interface FsItem {
  id: string;
  name: string;
  path: string;
  type: ItemType;
  hasChildren?: boolean;
  size?: number;
  modifiedAt?: string;
}

/**
 * Validate and normalize a path to prevent directory traversal attacks
 */
function normalizePath(inputPath: string): string {
  const resolved = path.resolve(inputPath || os.homedir());
  if (resolved.includes('..') || resolved.includes('\0')) {
    throw new Error('Invalid path');
  }
  return resolved;
}

/**
 * Check if a path is hidden (starts with dot)
 */
function isHidden(name: string): boolean {
  return name.startsWith('.');
}

/**
 * Get file extension
 */
function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.substring(idx) : '';
}

/**
 * List items in a directory
 */
async function listItems(
  dirPath: string,
  options: {
    limit?: number;
    cursor?: string;
    types?: string;
    extensions?: string;
    hidden?: string;
  } = {}
): Promise<{ items: FsItem[]; hasMore: boolean; nextCursor?: string; totalCount: number }> {
  const normalizedPath = normalizePath(dirPath);
  const limit = options.limit ?? 100;
  const offset = options.cursor ? parseInt(options.cursor, 10) : 0;
  const types = options.types?.split(',') || [];
  const extensions = options.extensions?.split(',').map(e => e.startsWith('.') ? e : `.${e}`) || [];
  const showHidden = options.hidden === 'true';

  const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
  const allItems: FsItem[] = [];

  for (const entry of entries) {
    const itemPath = path.join(normalizedPath, entry.name);
    const isFolder = entry.isDirectory();
    const type: ItemType = isFolder ? 'folder' : 'file';

    // Apply filters
    if (!showHidden && isHidden(entry.name)) continue;
    if (types.length > 0 && !types.includes(type)) continue;
    if (extensions.length > 0 && !isFolder) {
      const ext = getExtension(entry.name);
      if (!extensions.includes(ext)) continue;
    }

    let size: number | undefined;
    let modifiedAt: string | undefined;

    try {
      const stats = await fs.stat(itemPath);
      size = isFolder ? undefined : stats.size;
      modifiedAt = stats.mtime.toISOString();
    } catch {
      continue;
    }

    let hasChildren: boolean | undefined;
    if (isFolder) {
      try {
        const subEntries = await fs.readdir(itemPath, { withFileTypes: true });
        hasChildren = subEntries.some(e => e.isDirectory());
      } catch {
        hasChildren = false;
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
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

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
 * Get root paths (home, desktop, documents, etc.)
 */
async function getRoots(): Promise<FsItem[]> {
  const home = os.homedir();
  const roots: FsItem[] = [];

  roots.push({
    id: home,
    name: 'Home',
    path: home,
    type: 'folder',
    hasChildren: true,
  });

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
async function resolveItem(itemPath: string): Promise<FsItem | null> {
  try {
    const normalizedPath = normalizePath(itemPath);
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
 * Create a new folder
 */
async function createFolder(parentPath: string, name: string): Promise<FsItem> {
  const normalizedParent = normalizePath(parentPath);
  const folderPath = path.join(normalizedParent, name);

  if (!name || name.includes('/') || name.includes('\\') || name === '.' || name === '..') {
    throw new Error('Invalid folder name');
  }

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
 * Parse JSON body from request
 */
async function parseBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Vite plugin that adds file system API middleware for Storybook
 */
export function fsApiPlugin(): Plugin {
  return {
    name: 'fs-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/fs', async (req, res, next) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const pathname = url.pathname;

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (pathname === '/list' && req.method === 'GET') {
            const dirPath = url.searchParams.get('path') || '';
            const result = await listItems(dirPath, {
              limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined,
              cursor: url.searchParams.get('cursor') || undefined,
              types: url.searchParams.get('types') || undefined,
              extensions: url.searchParams.get('extensions') || undefined,
              hidden: url.searchParams.get('hidden') || undefined,
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } else if (pathname === '/roots' && req.method === 'GET') {
            const items = await getRoots();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ items }));
          } else if (pathname === '/resolve' && req.method === 'GET') {
            const itemPath = url.searchParams.get('path');
            if (!itemPath) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Path is required' }));
              return;
            }
            const item = await resolveItem(itemPath);
            if (!item) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Path not found' }));
              return;
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(item));
          } else if (pathname === '/validate' && req.method === 'GET') {
            const itemPath = url.searchParams.get('path');
            if (!itemPath) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Path is required' }));
              return;
            }
            const item = await resolveItem(itemPath);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: item !== null }));
          } else if (pathname === '/mkdir' && req.method === 'POST') {
            const body = await parseBody(req);
            const { parentPath, name } = body as { parentPath?: string; name?: string };
            if (!name || typeof name !== 'string') {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Folder name is required' }));
              return;
            }
            const item = await createFolder(parentPath || '', name);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(item));
          } else {
            next();
          }
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          const message = error instanceof Error ? error.message : 'Internal server error';
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}
