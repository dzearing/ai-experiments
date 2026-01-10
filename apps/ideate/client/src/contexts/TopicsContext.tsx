import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';
import type {
  Topic,
  TopicMetadata,
  TopicFilter,
  TopicTreeNode,
  TopicReference,
  CreateTopicInput,
  UpdateTopicInput,
} from '../types/topic';

interface TopicsContextValue {
  // State
  topics: TopicMetadata[];
  isLoading: boolean;
  error: string | null;
  filter: TopicFilter;
  selectedTopicId: string | null;
  expandedIds: Set<string>;

  // Computed values
  rootTopics: TopicMetadata[];
  treeNodes: TopicTreeNode[];
  filteredTopics: TopicMetadata[];

  // Actions
  fetchTopics: (workspaceId?: string) => Promise<void>;
  fetchTopicsGraph: (workspaceId?: string) => Promise<void>;
  fetchRecentTopics: (workspaceId?: string, limit?: number) => Promise<TopicMetadata[]>;
  searchTopics: (query: string, workspaceId?: string) => Promise<TopicMetadata[]>;
  createTopic: (input: CreateTopicInput) => Promise<Topic>;
  getTopic: (id: string) => Promise<Topic | null>;
  updateTopic: (id: string, updates: UpdateTopicInput) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;
  createTopicsBulk: (inputs: CreateTopicInput[]) => Promise<Topic[]>;
  deleteTopicsBulk: (ids: string[]) => Promise<number>;

  // Filter and selection actions
  setFilter: (filter: TopicFilter) => void;
  setSelectedTopicId: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  setExpandedIds: (ids: Set<string>) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Graph helpers
  getChildren: (parentId: string) => TopicMetadata[];
  getParents: (topicId: string) => TopicMetadata[];
  getAncestors: (topicId: string) => TopicMetadata[];
  getBreadcrumb: (topicId: string) => TopicMetadata[];

  // References for chat autocomplete
  getTopicReferences: () => TopicReference[];

  // Direct setter for WebSocket updates
  setTopics: React.Dispatch<React.SetStateAction<TopicMetadata[]>>;
}

const TopicsContext = createContext<TopicsContextValue | null>(null);

interface TopicsProviderProps {
  children: ReactNode;
}

export function TopicsProvider({ children }: TopicsProviderProps) {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TopicFilter>({});
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Computed: root topics (no parents)
  const rootTopics = useMemo(() => {
    return topics.filter(t => t.parentIds.length === 0);
  }, [topics]);

  // Helper to get children of a topic
  const getChildren = useCallback((parentId: string): TopicMetadata[] => {
    return topics.filter(t => t.parentIds.includes(parentId));
  }, [topics]);

  // Helper to get parents of a topic
  const getParents = useCallback((topicId: string): TopicMetadata[] => {
    const topic = topics.find(t => t.id === topicId);

    if (!topic) return [];

    return topics.filter(t => topic.parentIds.includes(t.id));
  }, [topics]);

  // Helper to get all ancestors (recursive parents)
  const getAncestors = useCallback((topicId: string): TopicMetadata[] => {
    const ancestors: TopicMetadata[] = [];
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

    collectAncestors(topicId);

    return ancestors;
  }, [getParents]);

  // Helper to get breadcrumb path (first parent chain)
  const getBreadcrumb = useCallback((topicId: string): TopicMetadata[] => {
    const path: TopicMetadata[] = [];
    const topic = topics.find(t => t.id === topicId);

    if (!topic) return path;

    path.push(topic);

    let current = topic;

    while (current.parentIds.length > 0) {
      const parent = topics.find(t => t.id === current.parentIds[0]);

      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }

    return path;
  }, [topics]);

  // Build tree nodes recursively
  const buildTreeNodes = useCallback((
    parentId: string | null,
    depth: number,
    visited: Set<string>
  ): TopicTreeNode[] => {
    const children = parentId === null
      ? rootTopics
      : getChildren(parentId);

    return children
      .filter(topic => !visited.has(topic.id))
      .map(topic => {
        const newVisited = new Set(visited);

        newVisited.add(topic.id);

        return {
          topic,
          depth,
          isExpanded: expandedIds.has(topic.id),
          children: buildTreeNodes(topic.id, depth + 1, newVisited),
        };
      });
  }, [rootTopics, getChildren, expandedIds]);

  // Computed: full tree structure
  const treeNodes = useMemo(() => {
    return buildTreeNodes(null, 0, new Set());
  }, [buildTreeNodes]);

  // Computed: filtered topics based on current filter
  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      if (filter.type && filter.type !== 'all' && topic.type !== filter.type) {
        return false;
      }

      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          // Root topics only
          if (topic.parentIds.length > 0) return false;
        } else {
          if (!topic.parentIds.includes(filter.parentId)) return false;
        }
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesName = topic.name.toLowerCase().includes(query);
        const matchesDescription = topic.description?.toLowerCase().includes(query);
        const matchesTags = topic.tags.some(tag => tag.toLowerCase().includes(query));

        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      if (filter.tags?.length) {
        const hasAllTags = filter.tags.every(tag => topic.tags.includes(tag));

        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [topics, filter]);

  // Fetch all topics
  const fetchTopics = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/topics?workspaceId=${workspaceId}`
        : `${API_URL}/api/topics`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();

      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch full graph for tree building
  const fetchTopicsGraph = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/topics/graph?workspaceId=${workspaceId}`
        : `${API_URL}/api/topics/graph`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topics graph');
      }

      const data = await response.json();

      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch recently accessed topics
  const fetchRecentTopics = useCallback(async (
    workspaceId?: string,
    limit = 10
  ): Promise<TopicMetadata[]> => {
    if (!user) return [];

    try {
      const params = new URLSearchParams({ limit: String(limit) });

      if (workspaceId) params.set('workspaceId', workspaceId);

      const response = await fetch(`${API_URL}/api/topics/recent?${params}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent topics');
      }

      return await response.json();
    } catch {
      return [];
    }
  }, [user]);

  // Search topics
  const searchTopics = useCallback(async (
    query: string,
    workspaceId?: string
  ): Promise<TopicMetadata[]> => {
    if (!user || !query) return [];

    try {
      const params = new URLSearchParams({ q: query });

      if (workspaceId) params.set('workspaceId', workspaceId);

      const response = await fetch(`${API_URL}/api/topics/search?${params}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search topics');
      }

      return await response.json();
    } catch {
      return [];
    }
  }, [user]);

  // Create a new topic
  const createTopic = useCallback(
    async (input: CreateTopicInput): Promise<Topic> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error || 'Failed to create topic');
      }

      const topic = await response.json();

      // Insert at correct position
      if (input.insertAfterId) {
        // Insert after a specific item
        setTopics((prev) => {
          const insertIndex = prev.findIndex(t => t.id === input.insertAfterId);

          if (insertIndex !== -1) {
            // Insert right after the target item
            return [
              ...prev.slice(0, insertIndex + 1),
              topic,
              ...prev.slice(insertIndex + 1),
            ];
          }

          // Fallback: prepend if target not found
          return [topic, ...prev];
        });
      } else {
        // No specific position - PREPEND at beginning (matches UI where input shows at top)
        setTopics((prev) => [topic, ...prev]);
      }

      return topic;
    },
    [user]
  );

  // Get a single topic with full content
  const getTopic = useCallback(
    async (id: string): Promise<Topic | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/topics/${id}`, {
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

  // Update a topic
  const updateTopic = useCallback(
    async (id: string, updates: UpdateTopicInput): Promise<Topic | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/topics/${id}`, {
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

        const topic = await response.json();

        setTopics((prev) =>
          prev.map((t) => (t.id === id ? topic : t))
        );

        return topic;
      } catch {
        return null;
      }
    },
    [user]
  );

  // Delete a topic (server cascade-deletes children, so remove them from local state too)
  const deleteTopic = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`${API_URL}/api/topics/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return false;
        }

        // Remove the deleted topic AND all its descendants from local state
        setTopics((prev) => {
          // Collect all descendant IDs recursively
          const idsToRemove = new Set<string>([id]);
          const collectDescendants = (parentId: string) => {
            for (const topic of prev) {
              if (topic.parentIds.includes(parentId) && !idsToRemove.has(topic.id)) {
                idsToRemove.add(topic.id);
                collectDescendants(topic.id);
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

  // Create multiple topics at once
  const createTopicsBulk = useCallback(
    async (inputs: CreateTopicInput[]): Promise<Topic[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/topics/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ topics: inputs }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error || 'Failed to create topics');
      }

      const createdTopics = await response.json();

      setTopics((prev) => [...prev, ...createdTopics]);

      return createdTopics;
    },
    [user]
  );

  // Delete multiple topics at once
  const deleteTopicsBulk = useCallback(
    async (ids: string[]): Promise<number> => {
      if (!user) return 0;

      try {
        const response = await fetch(`${API_URL}/api/topics/bulk`, {
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

        setTopics((prev) => prev.filter((t) => !ids.includes(t.id)));

        return deleted;
      } catch {
        return 0;
      }
    },
    [user]
  );

  // Toggle expanded state for a topic
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

  // Expand all topics
  const expandAll = useCallback(() => {
    setExpandedIds(new Set(topics.map(t => t.id)));
  }, [topics]);

  // Collapse all topics
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Get topic references for autocomplete (with breadcrumb path)
  const getTopicReferences = useCallback((): TopicReference[] => {
    return topics.map(t => {
      // Build path from breadcrumb
      const breadcrumb = getBreadcrumb(t.id);
      const path = breadcrumb.length > 1
        ? breadcrumb.slice(0, -1).map(b => b.name).join(' > ')
        : undefined;

      return {
        id: t.id,
        name: t.name,
        type: t.type,
        parentIds: t.parentIds,
        icon: t.icon,
        color: t.color,
        tags: t.tags,
        path,
      };
    });
  }, [topics, getBreadcrumb]);

  // Listen for Topic created from Facilitator tool calls
  // This is a confirmed update - the server has created the Topic and returned its full data
  // We add it immediately AND auto-select it so it appears selected in the tree
  useEffect(() => {
    const handleTopicCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ topic: TopicMetadata; autoSelect?: boolean }>;
      const { topic, autoSelect = true } = customEvent.detail;

      console.log('[TopicsContext] Received facilitator:topicCreated event:', topic);

      if (topic) {
        setTopics(prev => {
          // Don't add duplicates (in case WebSocket also notifies)
          if (prev.some(t => t.id === topic.id)) {
            console.log('[TopicsContext] Topic already exists, skipping:', topic.id);

            return prev;
          }

          console.log('[TopicsContext] Adding new topic to state:', topic.name, topic.id);

          // Prepend at the beginning
          return [topic, ...prev];
        });

        // Auto-select the newly created Topic
        if (autoSelect) {
          console.log('[TopicsContext] Auto-selecting new topic:', topic.id);
          setSelectedTopicId(topic.id);
        }
      }
    };

    window.addEventListener('facilitator:topicCreated', handleTopicCreated);

    return () => window.removeEventListener('facilitator:topicCreated', handleTopicCreated);
  }, [setSelectedTopicId]);

  // Note: WebSocket notifications from useWorkspaceSocket also update state for multi-client sync

  // Note: This context is large. Consider splitting into separate contexts
  // (e.g., TopicsDataContext, TopicsSelectionContext) for better performance.
  const value: TopicsContextValue = {
    topics,
    isLoading,
    error,
    filter,
    selectedTopicId,
    expandedIds,
    rootTopics,
    treeNodes,
    filteredTopics,
    fetchTopics,
    fetchTopicsGraph,
    fetchRecentTopics,
    searchTopics,
    createTopic,
    getTopic,
    updateTopic,
    deleteTopic,
    createTopicsBulk,
    deleteTopicsBulk,
    setFilter,
    setSelectedTopicId,
    toggleExpanded,
    setExpandedIds,
    expandAll,
    collapseAll,
    getChildren,
    getParents,
    getAncestors,
    getBreadcrumb,
    getTopicReferences,
    setTopics,
  };

  return (
    <TopicsContext.Provider value={value}>
      {children}
    </TopicsContext.Provider>
  );
}

export function useTopics(): TopicsContextValue {
  const context = useContext(TopicsContext);

  if (!context) {
    throw new Error('useTopics must be used within a TopicsProvider');
  }

  return context;
}
