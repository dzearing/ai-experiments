import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import type {
  IdeaMetadata,
  IdeaStatus,
  CreateIdeaInput,
  Idea,
} from '../types/idea';

interface UseThingIdeasReturn {
  ideas: IdeaMetadata[];
  ideasByStatus: Record<IdeaStatus, IdeaMetadata[]>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createIdea: (input: Omit<CreateIdeaInput, 'thingIds'>) => Promise<Idea | null>;
  moveIdea: (ideaId: string, newStatus: IdeaStatus) => Promise<Idea | null>;
  deleteIdea: (ideaId: string) => Promise<boolean>;
  /** Update an idea in place (for real-time updates like agentStatus) */
  updateIdea: (ideaId: string, updates: Partial<IdeaMetadata>) => void;
  /** Add an idea to the list (for real-time created events) */
  addIdea: (idea: IdeaMetadata) => void;
  /** Remove an idea from the list (for real-time deleted events) */
  removeIdea: (ideaId: string) => void;
}

/**
 * Hook for managing ideas scoped to a specific Thing.
 * Keeps Thing ideas separate from global IdeasContext.
 */
export function useThingIdeas(thingId: string, workspaceId?: string): UseThingIdeasReturn {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<IdeaMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    for (const status of Object.keys(grouped) as IdeaStatus[]) {
      grouped[status].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return grouped;
  }, [ideas]);

  // Fetch ideas for this Thing
  const fetchIdeas = useCallback(async () => {
    if (!user?.id || !thingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/ideas/by-thing/${thingId}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }

      const data = await response.json() as IdeaMetadata[];

      // Merge fetched data with existing ephemeral state (e.g., agentStatus, timestamps)
      // The server doesn't persist these fields, so we preserve them from current state
      setIdeas(prevIdeas => {
        // Build map of agent state from current state
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

        // Merge agent state into fetched data
        return data.map(idea => {
          const agentState = agentStates.get(idea.id);

          return agentState ? { ...idea, ...agentState } : idea;
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, thingId]);

  // Fetch on mount and when thingId changes
  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Create a new idea linked to this Thing
  const createIdea = useCallback(async (input: Omit<CreateIdeaInput, 'thingIds'>): Promise<Idea | null> => {
    if (!user?.id) return null;

    try {
      const response = await fetch(`${API_URL}/api/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          ...input,
          thingIds: [thingId],
          workspaceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create idea');
      }

      const newIdea = await response.json();

      // Add to local state
      setIdeas(prev => [...prev, newIdea]);

      return newIdea;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea');
      return null;
    }
  }, [user?.id, thingId, workspaceId]);

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

  // Update an idea in place (for real-time updates like agentStatus)
  const updateIdea = useCallback((ideaId: string, updates: Partial<IdeaMetadata>) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === ideaId ? { ...idea, ...updates } : idea
    ));
  }, []);

  // Add an idea to the list (for real-time created events)
  const addIdea = useCallback((idea: IdeaMetadata) => {
    setIdeas(prev => {
      // Avoid duplicates
      if (prev.some(i => i.id === idea.id)) return prev;
      return [idea, ...prev];
    });
  }, []);

  // Remove an idea from the list (for real-time deleted events)
  const removeIdea = useCallback((ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
  }, []);

  return {
    ideas,
    ideasByStatus,
    isLoading,
    error,
    refetch: fetchIdeas,
    createIdea,
    moveIdea,
    deleteIdea,
    updateIdea,
    addIdea,
    removeIdea,
  };
}
