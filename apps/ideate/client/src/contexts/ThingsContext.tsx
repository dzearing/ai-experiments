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
  Thing,
  ThingMetadata,
  ThingFilter,
  ThingTreeNode,
  ThingReference,
  CreateThingInput,
  UpdateThingInput,
} from '../types/thing';

interface ThingsContextValue {
  // State
  things: ThingMetadata[];
  isLoading: boolean;
  error: string | null;
  filter: ThingFilter;
  selectedThingId: string | null;
  expandedIds: Set<string>;

  // Computed values
  rootThings: ThingMetadata[];
  treeNodes: ThingTreeNode[];
  filteredThings: ThingMetadata[];

  // Actions
  fetchThings: (workspaceId?: string) => Promise<void>;
  fetchThingsGraph: (workspaceId?: string) => Promise<void>;
  fetchRecentThings: (workspaceId?: string, limit?: number) => Promise<ThingMetadata[]>;
  searchThings: (query: string, workspaceId?: string) => Promise<ThingMetadata[]>;
  createThing: (input: CreateThingInput) => Promise<Thing>;
  getThing: (id: string) => Promise<Thing | null>;
  updateThing: (id: string, updates: UpdateThingInput) => Promise<Thing | null>;
  deleteThing: (id: string) => Promise<boolean>;
  createThingsBulk: (inputs: CreateThingInput[]) => Promise<Thing[]>;
  deleteThingsBulk: (ids: string[]) => Promise<number>;

  // Filter and selection actions
  setFilter: (filter: ThingFilter) => void;
  setSelectedThingId: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  setExpandedIds: (ids: Set<string>) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Graph helpers
  getChildren: (parentId: string) => ThingMetadata[];
  getParents: (thingId: string) => ThingMetadata[];
  getAncestors: (thingId: string) => ThingMetadata[];
  getBreadcrumb: (thingId: string) => ThingMetadata[];

  // References for chat autocomplete
  getThingReferences: () => ThingReference[];

  // Direct setter for WebSocket updates
  setThings: React.Dispatch<React.SetStateAction<ThingMetadata[]>>;
}

const ThingsContext = createContext<ThingsContextValue | null>(null);

interface ThingsProviderProps {
  children: ReactNode;
}

export function ThingsProvider({ children }: ThingsProviderProps) {
  const { user } = useAuth();
  const [things, setThings] = useState<ThingMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ThingFilter>({});
  const [selectedThingId, setSelectedThingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Computed: root things (no parents)
  const rootThings = useMemo(() => {
    return things.filter(t => t.parentIds.length === 0);
  }, [things]);

  // Helper to get children of a thing
  const getChildren = useCallback((parentId: string): ThingMetadata[] => {
    return things.filter(t => t.parentIds.includes(parentId));
  }, [things]);

  // Helper to get parents of a thing
  const getParents = useCallback((thingId: string): ThingMetadata[] => {
    const thing = things.find(t => t.id === thingId);
    if (!thing) return [];
    return things.filter(t => thing.parentIds.includes(t.id));
  }, [things]);

  // Helper to get all ancestors (recursive parents)
  const getAncestors = useCallback((thingId: string): ThingMetadata[] => {
    const ancestors: ThingMetadata[] = [];
    const visited = new Set<string>();

    const collectAncestors = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const parents = getParents(id);
      for (const parent of parents) {
        ancestors.push(parent);
        collectAncestors(parent.id);
      }
    };

    collectAncestors(thingId);
    return ancestors;
  }, [getParents]);

  // Helper to get breadcrumb path (first parent chain)
  const getBreadcrumb = useCallback((thingId: string): ThingMetadata[] => {
    const path: ThingMetadata[] = [];
    const thing = things.find(t => t.id === thingId);
    if (!thing) return path;

    path.push(thing);

    let current = thing;
    while (current.parentIds.length > 0) {
      const parent = things.find(t => t.id === current.parentIds[0]);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }

    return path;
  }, [things]);

  // Build tree nodes recursively
  const buildTreeNodes = useCallback((
    parentId: string | null,
    depth: number,
    visited: Set<string>
  ): ThingTreeNode[] => {
    const children = parentId === null
      ? rootThings
      : getChildren(parentId);

    return children
      .filter(thing => !visited.has(thing.id))
      .map(thing => {
        const newVisited = new Set(visited);
        newVisited.add(thing.id);

        return {
          thing,
          depth,
          isExpanded: expandedIds.has(thing.id),
          children: buildTreeNodes(thing.id, depth + 1, newVisited),
        };
      });
  }, [rootThings, getChildren, expandedIds]);

  // Computed: full tree structure
  const treeNodes = useMemo(() => {
    return buildTreeNodes(null, 0, new Set());
  }, [buildTreeNodes]);

  // Computed: filtered things based on current filter
  const filteredThings = useMemo(() => {
    return things.filter((thing) => {
      if (filter.type && filter.type !== 'all' && thing.type !== filter.type) {
        return false;
      }
      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          // Root things only
          if (thing.parentIds.length > 0) return false;
        } else {
          if (!thing.parentIds.includes(filter.parentId)) return false;
        }
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesName = thing.name.toLowerCase().includes(query);
        const matchesDescription = thing.description?.toLowerCase().includes(query);
        const matchesTags = thing.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }
      if (filter.tags?.length) {
        const hasAllTags = filter.tags.every(tag => thing.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      return true;
    });
  }, [things, filter]);

  // Fetch all things
  const fetchThings = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/things?workspaceId=${workspaceId}`
        : `${API_URL}/api/things`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch things');
      }

      const data = await response.json();
      setThings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch things');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch full graph for tree building
  const fetchThingsGraph = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/things/graph?workspaceId=${workspaceId}`
        : `${API_URL}/api/things/graph`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch things graph');
      }

      const data = await response.json();
      setThings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch things');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch recently accessed things
  const fetchRecentThings = useCallback(async (
    workspaceId?: string,
    limit = 10
  ): Promise<ThingMetadata[]> => {
    if (!user) return [];

    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (workspaceId) params.set('workspaceId', workspaceId);

      const response = await fetch(`${API_URL}/api/things/recent?${params}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent things');
      }

      return await response.json();
    } catch {
      return [];
    }
  }, [user]);

  // Search things
  const searchThings = useCallback(async (
    query: string,
    workspaceId?: string
  ): Promise<ThingMetadata[]> => {
    if (!user || !query) return [];

    try {
      const params = new URLSearchParams({ q: query });
      if (workspaceId) params.set('workspaceId', workspaceId);

      const response = await fetch(`${API_URL}/api/things/search?${params}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search things');
      }

      return await response.json();
    } catch {
      return [];
    }
  }, [user]);

  // Create a new thing
  const createThing = useCallback(
    async (input: CreateThingInput): Promise<Thing> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/things`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create thing');
      }

      const thing = await response.json();

      // Insert at correct position
      if (input.insertAfterId) {
        // Insert after a specific item
        setThings((prev) => {
          const insertIndex = prev.findIndex(t => t.id === input.insertAfterId);
          if (insertIndex !== -1) {
            // Insert right after the target item
            return [
              ...prev.slice(0, insertIndex + 1),
              thing,
              ...prev.slice(insertIndex + 1),
            ];
          }
          // Fallback: prepend if target not found
          return [thing, ...prev];
        });
      } else {
        // No specific position - PREPEND at beginning (matches UI where input shows at top)
        setThings((prev) => [thing, ...prev]);
      }

      return thing;
    },
    [user]
  );

  // Get a single thing with full content
  const getThing = useCallback(
    async (id: string): Promise<Thing | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/things/${id}`, {
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

  // Update a thing
  const updateThing = useCallback(
    async (id: string, updates: UpdateThingInput): Promise<Thing | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/things/${id}`, {
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

        const thing = await response.json();
        setThings((prev) =>
          prev.map((t) => (t.id === id ? thing : t))
        );
        return thing;
      } catch {
        return null;
      }
    },
    [user]
  );

  // Delete a thing (server cascade-deletes children, so remove them from local state too)
  const deleteThing = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`${API_URL}/api/things/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return false;
        }

        // Remove the deleted thing AND all its descendants from local state
        setThings((prev) => {
          // Collect all descendant IDs recursively
          const idsToRemove = new Set<string>([id]);
          const collectDescendants = (parentId: string) => {
            for (const thing of prev) {
              if (thing.parentIds.includes(parentId) && !idsToRemove.has(thing.id)) {
                idsToRemove.add(thing.id);
                collectDescendants(thing.id);
              }
            }
          };
          collectDescendants(id);

          return prev.filter((t) => !idsToRemove.has(t.id));
        });
        return true;
      } catch {
        return false;
      }
    },
    [user]
  );

  // Create multiple things at once
  const createThingsBulk = useCallback(
    async (inputs: CreateThingInput[]): Promise<Thing[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/things/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ things: inputs }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create things');
      }

      const createdThings = await response.json();
      setThings((prev) => [...prev, ...createdThings]);
      return createdThings;
    },
    [user]
  );

  // Delete multiple things at once
  const deleteThingsBulk = useCallback(
    async (ids: string[]): Promise<number> => {
      if (!user) return 0;

      try {
        const response = await fetch(`${API_URL}/api/things/bulk`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          return 0;
        }

        const { deleted } = await response.json();
        setThings((prev) => prev.filter((t) => !ids.includes(t.id)));
        return deleted;
      } catch {
        return 0;
      }
    },
    [user]
  );

  // Toggle expanded state for a thing
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all things
  const expandAll = useCallback(() => {
    setExpandedIds(new Set(things.map(t => t.id)));
  }, [things]);

  // Collapse all things
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Get thing references for autocomplete
  const getThingReferences = useCallback((): ThingReference[] => {
    return things.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      parentIds: t.parentIds,
    }));
  }, [things]);

  const value: ThingsContextValue = {
    things,
    isLoading,
    error,
    filter,
    selectedThingId,
    expandedIds,
    rootThings,
    treeNodes,
    filteredThings,
    fetchThings,
    fetchThingsGraph,
    fetchRecentThings,
    searchThings,
    createThing,
    getThing,
    updateThing,
    deleteThing,
    createThingsBulk,
    deleteThingsBulk,
    setFilter,
    setSelectedThingId,
    toggleExpanded,
    setExpandedIds,
    expandAll,
    collapseAll,
    getChildren,
    getParents,
    getAncestors,
    getBreadcrumb,
    getThingReferences,
    setThings,
  };

  return (
    <ThingsContext.Provider value={value}>
      {children}
    </ThingsContext.Provider>
  );
}

export function useThings(): ThingsContextValue {
  const context = useContext(ThingsContext);
  if (!context) {
    throw new Error('useThings must be used within a ThingsProvider');
  }
  return context;
}
