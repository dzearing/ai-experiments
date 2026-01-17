import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { createLogger } from '../utils/clientLogger';
import type {
  Idea,
  IdeaMetadata,
  IdeaStatus,
} from '../types/idea';

const log = createLogger('useIdeasQuery');

export interface UseIdeasQueryOptions {
  /** Filter to a specific workspace. If undefined, returns ideas from all workspaces the user can access. */
  workspaceId?: string;
  /** Filter to ideas linked to specific topics. If undefined or empty, no topic filtering. */
  topicIds?: string[];
  /** Whether to skip the initial fetch (useful if you want to trigger it manually). */
  skipInitialFetch?: boolean;
}

export interface UseIdeasQueryReturn {
  /** Raw list of ideas matching the filters. */
  ideas: IdeaMetadata[];
  /** Ideas grouped by status for kanban display. */
  ideasByStatus: Record<IdeaStatus, IdeaMetadata[]>;
  /** Total count of ideas. */
  totalCount: number;
  /** Counts by source type. */
  counts: { total: number; user: number; ai: number };
  /** Whether initial data is loading. */
  isLoading: boolean;
  /** Error message if fetch failed. */
  error: string | null;
  /** Re-fetch ideas from server. */
  refetch: () => Promise<void>;
  /** Add an idea to local state (for real-time created events). */
  addIdea: (idea: IdeaMetadata) => void;
  /** Update an idea in local state (for real-time updates like agentStatus). */
  updateIdea: (ideaId: string, updates: Partial<IdeaMetadata>) => void;
  /** Remove an idea from local state (for real-time deleted events). */
  removeIdea: (ideaId: string) => void;
  /** Direct setter for bulk updates. */
  setIdeas: React.Dispatch<React.SetStateAction<IdeaMetadata[]>>;
  /** Move idea to a new status (lane). */
  moveIdea: (ideaId: string, newStatus: IdeaStatus) => Promise<Idea | null>;
  /** Delete an idea. */
  deleteIdea: (ideaId: string) => Promise<boolean>;
}

/**
 * Unified hook for fetching and managing ideas with optional filters.
 *
 * This replaces the split between IdeasContext (workspace-scoped) and
 * useTopicIdeas (topic-scoped) with a single, flexible hook.
 *
 * @example
 * // All ideas in a workspace (top-level Ideas page)
 * const { ideasByStatus } = useIdeasQuery({ workspaceId: 'ws-123' });
 *
 * @example
 * // Ideas for a specific topic within a workspace
 * const { ideasByStatus } = useIdeasQuery({ workspaceId: 'ws-123', topicIds: ['topic-456'] });
 *
 * @example
 * // All ideas across all workspaces
 * const { ideasByStatus } = useIdeasQuery({});
 */
export function useIdeasQuery(options: UseIdeasQueryOptions = {}): UseIdeasQueryReturn {
  const { workspaceId, topicIds, skipInitialFetch = false } = options;
  const { user } = useAuth();

  // Stabilize topicIds to prevent infinite loops from array reference changes
  const topicIdsKey = topicIds?.join(',') ?? '';

  const [ideas, setIdeas] = useState<IdeaMetadata[]>([]);
  // Start with isLoading=true so consumers know initial fetch hasn't completed yet
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);

  // Group ideas by status with rating-based sorting
  const ideasByStatus = useMemo(() => {
    const grouped: Record<IdeaStatus, IdeaMetadata[]> = {
      new: [],
      exploring: [],
      executing: [],
      archived: [],
    };

    for (const idea of ideas) {
      grouped[idea.status].push(idea);
    }

    // Sort each lane by rating (highest first), then by date
    // For executing lane: waitingForFeedback cards bubble to top
    for (const status of Object.keys(grouped) as IdeaStatus[]) {
      grouped[status].sort((a, b) => {
        // For executing lane, prioritize waiting-for-feedback cards
        if (status === 'executing') {
          const aWaiting = a.execution?.waitingForFeedback ? 1 : 0;
          const bWaiting = b.execution?.waitingForFeedback ? 1 : 0;

          if (bWaiting !== aWaiting) return bWaiting - aWaiting;
        }

        // Then sort by rating
        if (b.rating !== a.rating) return b.rating - a.rating;

        // Then by date
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return grouped;
  }, [ideas]);

  // Computed counts
  const counts = useMemo(() => ({
    total: ideas.length,
    user: ideas.filter(i => i.source === 'user').length,
    ai: ideas.filter(i => i.source === 'ai').length,
  }), [ideas]);

  // Build API URL with query params
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();

    if (workspaceId) {
      params.set('workspaceId', workspaceId);
    }

    if (topicIdsKey) {
      params.set('topicIds', topicIdsKey);
    }

    const queryString = params.toString();

    return `${API_URL}/api/ideas/by-lane${queryString ? `?${queryString}` : ''}`;
  }, [workspaceId, topicIdsKey]);

  // Fetch ideas from server
  const fetchIdeas = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = buildUrl();

      log.log('Fetching ideas', { url, workspaceId, topicIdsKey });

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }

      const data: Record<IdeaStatus, IdeaMetadata[]> = await response.json();

      // Flatten the grouped data into a single array
      const allIdeas = [
        ...data.new,
        ...data.exploring,
        ...data.executing,
        ...data.archived,
      ];

      log.log('Fetched ideas', {
        workspaceId,
        topicIdsKey,
        count: allIdeas.length,
      });

      // Merge fetched data with existing ephemeral state (agentStatus, timestamps)
      // The server doesn't persist these fields, so preserve them from current state
      setIdeas(prevIdeas => {
        const agentStates = new Map<string, {
          agentStatus?: IdeaMetadata['agentStatus'];
          agentStartedAt?: string;
          agentFinishedAt?: string;
        }>();

        prevIdeas.forEach(idea => {
          if (idea.agentStatus || idea.agentStartedAt || idea.agentFinishedAt) {
            agentStates.set(idea.id, {
              agentStatus: idea.agentStatus,
              agentStartedAt: idea.agentStartedAt,
              agentFinishedAt: idea.agentFinishedAt,
            });
          }
        });

        return allIdeas.map(idea => {
          const agentState = agentStates.get(idea.id);

          return agentState ? { ...idea, ...agentState } : idea;
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ideas';

      setError(message);
      log.error('Fetch failed', { error: message, workspaceId, topicIdsKey });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, buildUrl, workspaceId, topicIdsKey]);

  // Fetch on mount and when filters change
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchIdeas();
    }
  }, [fetchIdeas, skipInitialFetch]);

  // Add an idea to local state
  const addIdea = useCallback((idea: IdeaMetadata) => {
    log.log('Adding idea to state', { ideaId: idea.id, title: idea.title });

    setIdeas(prev => {
      // Avoid duplicates
      if (prev.some(i => i.id === idea.id)) {
        log.log('Idea already exists, skipping', { ideaId: idea.id });

        return prev;
      }

      return [idea, ...prev];
    });
  }, []);

  // Update an idea in local state
  const updateIdea = useCallback((ideaId: string, updates: Partial<IdeaMetadata>) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === ideaId ? { ...idea, ...updates } : idea
    ));
  }, []);

  // Remove an idea from local state
  const removeIdea = useCallback((ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
  }, []);

  // Move idea to a new status
  const moveIdea = useCallback(async (ideaId: string, newStatus: IdeaStatus): Promise<Idea | null> => {
    if (!user?.id) return null;

    // Optimistic update
    const previousIdeas = ideas;

    setIdeas(prev => prev.map(idea =>
      idea.id === ideaId ? { ...idea, status: newStatus } : idea
    ));

    try {
      const response = await fetch(`${API_URL}/api/ideas/${ideaId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to move idea');
      }

      const updatedIdea = await response.json();

      // Update with server response
      setIdeas(prev => prev.map(idea =>
        idea.id === ideaId ? updatedIdea : idea
      ));

      return updatedIdea;
    } catch (err) {
      // Revert on error
      setIdeas(previousIdeas);
      setError(err instanceof Error ? err.message : 'Failed to move idea');

      return null;
    }
  }, [user?.id, ideas]);

  // Delete an idea
  const deleteIdea = useCallback(async (ideaId: string): Promise<boolean> => {
    if (!user?.id) return false;

    // Optimistic update
    const previousIdeas = ideas;

    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));

    try {
      const response = await fetch(`${API_URL}/api/ideas/${ideaId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete idea');
      }

      return true;
    } catch (err) {
      // Revert on error
      setIdeas(previousIdeas);
      setError(err instanceof Error ? err.message : 'Failed to delete idea');

      return false;
    }
  }, [user?.id, ideas]);

  return {
    ideas,
    ideasByStatus,
    totalCount: ideas.length,
    counts,
    isLoading,
    error,
    refetch: fetchIdeas,
    addIdea,
    updateIdea,
    removeIdea,
    setIdeas,
    moveIdea,
    deleteIdea,
  };
}
