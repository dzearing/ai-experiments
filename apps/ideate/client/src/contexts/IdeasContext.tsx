import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';
import type {
  Idea,
  IdeaMetadata,
  IdeaStatus,
  IdeaFilter,
  CreateIdeaInput,
  UpdateIdeaInput,
} from '../types/idea';

interface StartExecutionResult {
  success: boolean;
  idea?: Idea;
  firstPhaseId?: string;
  error?: string;
}

interface IdeasContextValue {
  // State
  ideas: IdeaMetadata[];
  isLoading: boolean;
  error: string | null;
  filter: IdeaFilter;
  selectedIdeaId: string | null;

  // Computed values
  ideasByStatus: Record<IdeaStatus, IdeaMetadata[]>;
  filteredIdeas: IdeaMetadata[];
  counts: { total: number; user: number; ai: number };

  // Actions
  fetchIdeas: (workspaceId?: string) => Promise<void>;
  fetchIdeasByLane: (workspaceId?: string) => Promise<void>;
  createIdea: (input: CreateIdeaInput) => Promise<Idea>;
  createIdeaFromText: (text: string, workspaceId?: string) => Promise<Idea>;
  getIdea: (id: string) => Promise<Idea | null>;
  updateIdea: (id: string, updates: UpdateIdeaInput) => Promise<Idea | null>;
  deleteIdea: (id: string) => Promise<boolean>;
  moveIdea: (id: string, newStatus: IdeaStatus) => Promise<Idea | null>;
  updateRating: (id: string, rating: 1 | 2 | 3 | 4) => Promise<Idea | null>;
  updateExecution: (id: string, updates: { progressPercent?: number; waitingForFeedback?: boolean }) => Promise<Idea | null>;
  startExecution: (id: string) => Promise<StartExecutionResult>;

  // Filter actions
  setFilter: (filter: IdeaFilter) => void;
  setSelectedIdeaId: (id: string | null) => void;

  // Direct setter for WebSocket updates
  setIdeas: React.Dispatch<React.SetStateAction<IdeaMetadata[]>>;
}

const IdeasContext = createContext<IdeasContextValue | null>(null);

interface IdeasProviderProps {
  children: ReactNode;
}

export function IdeasProvider({ children }: IdeasProviderProps) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<IdeaMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<IdeaFilter>({ source: 'all' });
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // Computed: group ideas by status with rating-based sorting
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

  // Computed: filtered ideas based on current filter
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (filter.source && filter.source !== 'all' && idea.source !== filter.source) {
        return false;
      }
      if (filter.status && filter.status !== 'all' && idea.status !== filter.status) {
        return false;
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(query);
        const matchesSummary = idea.summary.toLowerCase().includes(query);
        const matchesTags = idea.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSummary && !matchesTags) {
          return false;
        }
      }
      if (filter.tags?.length) {
        const hasAllTags = filter.tags.every(tag => idea.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      return true;
    });
  }, [ideas, filter]);

  // Computed: counts
  const counts = useMemo(() => ({
    total: ideas.length,
    user: ideas.filter(i => i.source === 'user').length,
    ai: ideas.filter(i => i.source === 'ai').length,
  }), [ideas]);

  // Fetch all ideas
  const fetchIdeas = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/ideas?workspaceId=${workspaceId}`
        : `${API_URL}/api/ideas`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }

      const data = await response.json();
      setIdeas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch ideas grouped by lane (optimized for kanban view)
  const fetchIdeasByLane = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/ideas/by-lane?workspaceId=${workspaceId}`
        : `${API_URL}/api/ideas/by-lane`;

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
      setIdeas(allIdeas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new idea
  const createIdea = useCallback(
    async (input: CreateIdeaInput): Promise<Idea> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create idea');
      }

      const idea = await response.json();
      setIdeas((prev) => [idea, ...prev]);
      return idea;
    },
    [user]
  );

  // Create a new idea from natural language (AI extracts structured data)
  const createIdeaFromText = useCallback(
    async (text: string, workspaceId?: string): Promise<Idea> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/ideas/from-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ text, workspaceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create idea');
      }

      const idea = await response.json();
      setIdeas((prev) => [idea, ...prev]);
      return idea;
    },
    [user]
  );

  // Get a single idea with full description
  const getIdea = useCallback(
    async (id: string): Promise<Idea | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}`, {
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch {
        return null;
      }
    },
    [user]
  );

  // Update an idea
  const updateIdea = useCallback(
    async (id: string, updates: UpdateIdeaInput): Promise<Idea | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          return null;
        }

        const idea = await response.json();
        setIdeas((prev) =>
          prev.map((i) => (i.id === id ? idea : i))
        );
        return idea;
      } catch {
        return null;
      }
    },
    [user]
  );

  // Delete an idea
  const deleteIdea = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return false;
        }

        setIdeas((prev) => prev.filter((i) => i.id !== id));
        return true;
      } catch {
        return false;
      }
    },
    [user]
  );

  // Move idea to a new status (lane)
  const moveIdea = useCallback(
    async (id: string, newStatus: IdeaStatus): Promise<Idea | null> => {
      if (!user) return null;

      // Optimistic update
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === id ? { ...idea, status: newStatus } : idea
        )
      );

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          // Revert on error - refetch to get correct state
          const currentIdea = ideas.find(i => i.id === id);
          if (currentIdea) {
            setIdeas((prev) =>
              prev.map((i) => (i.id === id ? currentIdea : i))
            );
          }
          return null;
        }

        const idea = await response.json();
        setIdeas((prev) =>
          prev.map((i) => (i.id === id ? idea : i))
        );
        return idea;
      } catch {
        // Revert on error
        const currentIdea = ideas.find(i => i.id === id);
        if (currentIdea) {
          setIdeas((prev) =>
            prev.map((i) => (i.id === id ? currentIdea : i))
          );
        }
        return null;
      }
    },
    [user, ideas]
  );

  // Update rating
  const updateRating = useCallback(
    async (id: string, rating: 1 | 2 | 3 | 4): Promise<Idea | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}/rating`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ rating }),
        });

        if (!response.ok) {
          return null;
        }

        const idea = await response.json();
        setIdeas((prev) =>
          prev.map((i) => (i.id === id ? idea : i))
        );
        return idea;
      } catch {
        return null;
      }
    },
    [user]
  );

  // Update execution state
  const updateExecution = useCallback(
    async (
      id: string,
      updates: { progressPercent?: number; waitingForFeedback?: boolean }
    ): Promise<Idea | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}/execution`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          return null;
        }

        const idea = await response.json();
        setIdeas((prev) =>
          prev.map((i) => (i.id === id ? idea : i))
        );
        return idea;
      } catch {
        return null;
      }
    },
    [user]
  );

  // Start execution - transitions idea to executing status and initializes execution state
  const startExecution = useCallback(
    async (id: string): Promise<StartExecutionResult> => {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      try {
        const response = await fetch(`${API_URL}/api/ideas/${id}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to start execution' };
        }

        // Update local state with the updated idea
        if (data.idea) {
          setIdeas((prev) =>
            prev.map((i) => (i.id === id ? data.idea : i))
          );
        }

        return {
          success: true,
          idea: data.idea,
          firstPhaseId: data.firstPhaseId,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to start execution',
        };
      }
    },
    [user]
  );

  const value: IdeasContextValue = {
    ideas,
    isLoading,
    error,
    filter,
    selectedIdeaId,
    ideasByStatus,
    filteredIdeas,
    counts,
    fetchIdeas,
    fetchIdeasByLane,
    createIdea,
    createIdeaFromText,
    getIdea,
    updateIdea,
    deleteIdea,
    moveIdea,
    updateRating,
    updateExecution,
    startExecution,
    setFilter,
    setSelectedIdeaId,
    setIdeas,
  };

  return (
    <IdeasContext.Provider value={value}>
      {children}
    </IdeasContext.Provider>
  );
}

export function useIdeas(): IdeasContextValue {
  const context = useContext(IdeasContext);
  if (!context) {
    throw new Error('useIdeas must be used within an IdeasProvider');
  }
  return context;
}
