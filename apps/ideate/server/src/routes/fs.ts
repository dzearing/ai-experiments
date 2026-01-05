import { Router, type Request, type Response } from 'express';
import { FileSystemService, type FsItemFilter } from '../services/FileSystemService.js';

export const fsRouter = Router();
const fileSystemService = new FileSystemService();

/**
 * Parse filter from query parameters
 */
function parseFilter(query: Request['query']): FsItemFilter {
  const filter: FsItemFilter = {};

  if (query.types) {
    const typesStr = query.types as string;
    filter.types = typesStr.split(',').filter(t => t === 'file' || t === 'folder') as ('file' | 'folder')[];
  }

  if (query.extensions) {
    const extStr = query.extensions as string;
    filter.extensions = extStr.split(',').map(e => e.startsWith('.') ? e : `.${e}`);
  }

  if (query.hidden !== undefined) {
    filter.hidden = query.hidden === 'true';
  }

  return filter;
}

/**
 * GET /api/fs/list
 * List directory contents
 *
 * Query params:
 * - path: Directory path (defaults to home)
 * - limit: Max items to return (default 100)
 * - cursor: Pagination cursor
 * - types: Comma-separated types (file,folder)
 * - extensions: Comma-separated extensions (.ts,.tsx)
 * - hidden: Include hidden files (true/false)
 */
fsRouter.get('/list', async (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || '';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const cursor = req.query.cursor as string | undefined;
    const filter = parseFilter(req.query);

    const result = await fileSystemService.listItems(dirPath, {
      limit,
      cursor,
      filter,
    });

    res.json(result);
  } catch (error) {
    console.error('List directory error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list directory';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/fs/mkdir
 * Create a new folder
 *
 * Body:
 * - parentPath: Parent directory path
 * - name: Folder name
 */
fsRouter.post('/mkdir', async (req: Request, res: Response) => {
  try {
    const { parentPath, name } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }

    const item = await fileSystemService.createFolder(parentPath || '', name);
    res.json(item);
  } catch (error) {
    console.error('Create folder error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create folder';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/fs/roots
 * Get root paths (home, desktop, documents, etc.)
 */
fsRouter.get('/roots', async (_req: Request, res: Response) => {
  try {
    const items = await fileSystemService.getRoots();
    res.json({ items });
  } catch (error) {
    console.error('Get roots error:', error);
    res.status(500).json({ error: 'Failed to get root paths' });
  }
});

/**
 * GET /api/fs/resolve
 * Resolve a single item by path
 *
 * Query params:
 * - path: Item path to resolve
 */
fsRouter.get('/resolve', async (req: Request, res: Response) => {
  try {
    const itemPath = req.query.path as string;

    if (!itemPath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const item = await fileSystemService.resolveItem(itemPath);

    if (!item) {
      res.status(404).json({ error: 'Path not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Resolve path error:', error);
    const message = error instanceof Error ? error.message : 'Failed to resolve path';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/fs/validate
 * Validate if a path exists
 *
 * Query params:
 * - path: Path to validate
 */
fsRouter.get('/validate', async (req: Request, res: Response) => {
  try {
    const itemPath = req.query.path as string;

    if (!itemPath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const exists = await fileSystemService.validatePath(itemPath);
    res.json({ valid: exists });
  } catch (error) {
    console.error('Validate path error:', error);
    res.status(500).json({ error: 'Failed to validate path' });
  }
});
