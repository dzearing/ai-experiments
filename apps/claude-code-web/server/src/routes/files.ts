/**
 * File API routes for reading files and listing directories.
 * Provides secure access to files within the working directory.
 */

import { Router, type Request, type Response } from 'express';

import {
  readFile,
  listDirectory,
  PathSecurityError,
  FileNotFoundError,
} from '../services/fileService.js';

export const router = Router();

/**
 * GET /read - Read file contents with metadata.
 *
 * Query params:
 *   - path: File path (URL encoded)
 *
 * Returns:
 *   - 200: { path, content, size, lines }
 *   - 400: Missing path parameter
 *   - 403: Path outside working directory
 *   - 404: File not found
 *   - 500: Server error
 */
router.get('/read', async (req: Request, res: Response) => {
  const pathParam = req.query.path;

  if (!pathParam || typeof pathParam !== 'string') {
    res.status(400).json({
      error: 'Missing required parameter: path',
      code: 'MISSING_PATH',
    });

    return;
  }

  const filePath = decodeURIComponent(pathParam);
  const cwd = process.cwd();

  try {
    const result = await readFile(filePath, cwd);

    res.json(result);
  } catch (error) {
    if (error instanceof PathSecurityError) {
      res.status(403).json({
        error: 'Path outside working directory',
        code: 'PATH_SECURITY_ERROR',
      });

      return;
    }

    if (error instanceof FileNotFoundError) {
      res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
      });

      return;
    }

    console.error('[Files] Error reading file:', error);
    res.status(500).json({
      error: 'Failed to read file',
      code: 'SERVER_ERROR',
    });
  }
});

/**
 * GET /list - List directory contents.
 *
 * Query params:
 *   - path: Directory path (URL encoded, defaults to ".")
 *
 * Returns:
 *   - 200: Array of { name, type, size? }
 *   - 403: Path outside working directory
 *   - 404: Directory not found
 *   - 500: Server error
 */
router.get('/list', async (req: Request, res: Response) => {
  const pathParam = req.query.path;
  const dirPath = pathParam && typeof pathParam === 'string'
    ? decodeURIComponent(pathParam)
    : '.';
  const cwd = process.cwd();

  try {
    const entries = await listDirectory(dirPath, cwd);

    res.json(entries);
  } catch (error) {
    if (error instanceof PathSecurityError) {
      res.status(403).json({
        error: 'Path outside working directory',
        code: 'PATH_SECURITY_ERROR',
      });

      return;
    }

    if (error instanceof FileNotFoundError) {
      res.status(404).json({
        error: 'Directory not found',
        code: 'DIRECTORY_NOT_FOUND',
      });

      return;
    }

    console.error('[Files] Error listing directory:', error);
    res.status(500).json({
      error: 'Failed to list directory',
      code: 'SERVER_ERROR',
    });
  }
});
