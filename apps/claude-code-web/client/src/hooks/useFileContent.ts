/**
 * Hook for fetching file content from the server.
 * Provides loading states, error handling, and caching.
 */

import { useState, useCallback } from 'react';

/**
 * File content returned from the server.
 */
export interface FileContent {
  /** File path relative to workspace */
  path: string;
  /** File content as text */
  content: string;
  /** File size in bytes */
  size: number;
  /** Number of lines in the file */
  lines: number;
}

/**
 * Return type for the useFileContent hook.
 */
export interface UseFileContentReturn {
  /** Currently loaded file content, or null if none loaded */
  fileContent: FileContent | null;
  /** Whether a file is currently being loaded */
  isLoading: boolean;
  /** Error message if the last load failed */
  error: string | null;
  /** Load a file by path */
  loadFile: (path: string) => Promise<void>;
  /** Clear the current file content */
  clearFile: () => void;
}

/**
 * Hook for loading file content from the server.
 *
 * @returns Object with file content, loading state, error, and control functions
 *
 * @example
 * ```tsx
 * const { fileContent, isLoading, error, loadFile, clearFile } = useFileContent();
 *
 * // Load a file
 * await loadFile('src/App.tsx');
 *
 * // Access content
 * if (fileContent) {
 *   console.log(fileContent.content);
 * }
 *
 * // Clear when done
 * clearFile();
 * ```
 */
export function useFileContent(): UseFileContentReturn {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to load file: ${response.status}`;

        throw new Error(errorMessage);
      }

      const data: FileContent = await response.json();

      setFileContent(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load file';

      setError(message);
      setFileContent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFile = useCallback(() => {
    setFileContent(null);
    setError(null);
  }, []);

  return {
    fileContent,
    isLoading,
    error,
    loadFile,
    clearFile,
  };
}
