/**
 * File service providing secure file operations.
 * All operations validate that paths stay within the working directory.
 */

import { readFile as fsReadFile, readdir, stat } from 'fs/promises';
import path from 'path';

// =============================================================================
// Types
// =============================================================================

/**
 * Result from reading a file.
 */
export interface FileReadResult {
  path: string;
  content: string;
  size: number;
  lines: number;
}

/**
 * Entry in a directory listing.
 */
export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
}

/**
 * Error thrown when a path is outside the allowed directory.
 */
export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathSecurityError';
  }
}

/**
 * Error thrown when a file or directory is not found.
 */
export class FileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileNotFoundError';
  }
}

// =============================================================================
// Security Validation
// =============================================================================

/**
 * Validates that a resolved path stays within the working directory.
 * Prevents path traversal attacks (e.g., ../../../etc/passwd).
 *
 * @param requestedPath - The path requested by the client
 * @param cwd - The working directory to constrain paths within
 * @returns True if the path is safe, false otherwise
 */
export function isPathSafe(requestedPath: string, cwd: string): boolean {
  // Resolve both paths to absolute form
  const resolvedCwd = path.resolve(cwd);
  const resolvedPath = path.resolve(cwd, requestedPath);

  // Ensure resolved path starts with cwd (plus path separator to prevent prefix attacks)
  // For example, /home/user and /home/username should not match
  return resolvedPath === resolvedCwd || resolvedPath.startsWith(resolvedCwd + path.sep);
}

// =============================================================================
// File Operations
// =============================================================================

/**
 * Reads a file's content with metadata.
 * Validates path security before reading.
 *
 * @param filePath - The file path relative to cwd
 * @param cwd - The working directory to constrain paths within
 * @returns File content with metadata
 * @throws PathSecurityError if path is outside cwd
 * @throws FileNotFoundError if file doesn't exist
 */
export async function readFile(filePath: string, cwd: string): Promise<FileReadResult> {
  if (!isPathSafe(filePath, cwd)) {
    throw new PathSecurityError(`Path "${filePath}" is outside working directory`);
  }

  const absolutePath = path.resolve(cwd, filePath);

  try {
    const content = await fsReadFile(absolutePath, 'utf-8');
    const lines = content.split('\n').length;

    return {
      path: filePath,
      content,
      size: Buffer.byteLength(content, 'utf-8'),
      lines,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileNotFoundError(`File not found: ${filePath}`);
    }

    throw error;
  }
}

/**
 * Lists directory contents.
 * Validates path security before listing.
 *
 * @param dirPath - The directory path relative to cwd
 * @param cwd - The working directory to constrain paths within
 * @returns Array of directory entries
 * @throws PathSecurityError if path is outside cwd
 * @throws FileNotFoundError if directory doesn't exist
 */
export async function listDirectory(dirPath: string, cwd: string): Promise<DirectoryEntry[]> {
  if (!isPathSafe(dirPath, cwd)) {
    throw new PathSecurityError(`Path "${dirPath}" is outside working directory`);
  }

  const absolutePath = path.resolve(cwd, dirPath);

  try {
    const entries = await readdir(absolutePath, { withFileTypes: true });
    const results: DirectoryEntry[] = [];

    for (const entry of entries) {
      const entryType = entry.isDirectory() ? 'directory' : 'file';
      const entryData: DirectoryEntry = {
        name: entry.name,
        type: entryType,
      };

      // Get file size for files (not directories)
      if (entryType === 'file') {
        try {
          const entryPath = path.join(absolutePath, entry.name);
          const stats = await stat(entryPath);

          entryData.size = stats.size;
        } catch {
          // If we can't stat the file, just skip the size
        }
      }

      results.push(entryData);
    }

    // Sort: directories first, then files, both alphabetically
    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

    return results;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileNotFoundError(`Directory not found: ${dirPath}`);
    }

    throw error;
  }
}
