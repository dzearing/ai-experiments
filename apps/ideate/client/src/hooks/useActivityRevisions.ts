/**
 * useActivityRevisions hook
 *
 * Fetches and manages git revision data for the Activity tab.
 * Provides revisions, files, and diffs for displaying execution history.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Revision, FileChange } from '../components/ActivityView/types';

const API_BASE = '/api/ideas';

interface UseActivityRevisionsOptions {
  /** Idea ID to fetch revisions for */
  ideaId: string;
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
}

interface UseActivityRevisionsReturn {
  /** List of revisions */
  revisions: Revision[];
  /** Whether revisions are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh revisions */
  refresh: () => Promise<void>;
  /** Fetch files for a specific commit */
  fetchFiles: (commitHash: string) => Promise<FileChange[]>;
  /** Fetch diff for a specific file in a commit */
  fetchDiff: (commitHash: string, filePath: string) => Promise<string | null>;
}

/**
 * Hook for fetching and managing git revision data
 */
export function useActivityRevisions({
  ideaId,
  enabled = true,
  refreshInterval = 0,
}: UseActivityRevisionsOptions): UseActivityRevisionsReturn {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user ID from localStorage
  const getUserId = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem('ideate_user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }, []);

  // Fetch revisions from API
  const fetchRevisions = useCallback(async () => {
    if (!ideaId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${ideaId}/revisions?limit=50`, {
        headers: {
          'x-user-id': getUserId(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch revisions: ${response.statusText}`);
      }

      const data = await response.json();
      setRevisions(data.revisions || []);
    } catch (err) {
      console.error('[useActivityRevisions] Error fetching revisions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revisions');
    } finally {
      setIsLoading(false);
    }
  }, [ideaId, enabled, getUserId]);

  // Fetch files for a specific commit
  const fetchFiles = useCallback(
    async (commitHash: string): Promise<FileChange[]> => {
      if (!ideaId) return [];

      try {
        const response = await fetch(
          `${API_BASE}/${ideaId}/revisions/${commitHash}/files`,
          {
            headers: {
              'x-user-id': getUserId(),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch files: ${response.statusText}`);
        }

        const data = await response.json();
        return data.files || [];
      } catch (err) {
        console.error('[useActivityRevisions] Error fetching files:', err);
        return [];
      }
    },
    [ideaId, getUserId]
  );

  // Fetch diff for a specific file
  const fetchDiff = useCallback(
    async (commitHash: string, filePath: string): Promise<string | null> => {
      if (!ideaId) return null;

      try {
        const response = await fetch(
          `${API_BASE}/${ideaId}/revisions/${commitHash}/diff?file=${encodeURIComponent(filePath)}`,
          {
            headers: {
              'x-user-id': getUserId(),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch diff: ${response.statusText}`);
        }

        const data = await response.json();
        return data.diff || null;
      } catch (err) {
        console.error('[useActivityRevisions] Error fetching diff:', err);
        return null;
      }
    },
    [ideaId, getUserId]
  );

  // Initial fetch
  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(fetchRevisions, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchRevisions]);

  return {
    revisions,
    isLoading,
    error,
    refresh: fetchRevisions,
    fetchFiles,
    fetchDiff,
  };
}

export default useActivityRevisions;
