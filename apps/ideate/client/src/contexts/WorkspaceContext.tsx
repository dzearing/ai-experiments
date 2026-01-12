import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL, WORKSPACE_WS_URL } from '../config';
import { initializeWorkspaceProvider } from '../dataBus';

export type WorkspaceType = 'personal' | 'team';
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Workspace extends WorkspaceMetadata {
  // Additional workspace data can be added here
}

export interface WorkspacePreview {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerName?: string;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceMetadata[];
  currentWorkspace: WorkspaceMetadata | null;
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: WorkspaceMetadata | null) => void;
  fetchWorkspaces: () => Promise<void>;
  getPersonalWorkspace: () => Promise<Workspace>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  getWorkspace: (id: string) => Promise<Workspace | null>;
  updateWorkspace: (
    id: string,
    updates: Partial<Pick<Workspace, 'name' | 'description'>>
  ) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  generateShareLink: (workspaceId: string, regenerate?: boolean) => Promise<string | null>;
  getWorkspacePreview: (token: string) => Promise<WorkspacePreview | null>;
  joinWorkspace: (token: string) => Promise<Workspace | null>;
}

// localStorage keys for workspace state persistence
const STORAGE_KEYS = {
  currentWorkspaceId: 'ideate:currentWorkspaceId',
  workspaceAccess: 'ideate:workspaceAccess',
} as const;

/**
 * Check if a workspace ID is a personal workspace ID.
 */
export function isPersonalWorkspaceId(workspaceId: string): boolean {
  return workspaceId.startsWith('personal-');
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceMetadata[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<WorkspaceMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  /**
   * Set the current workspace and persist to localStorage.
   * Pass null to clear the workspace filter (show all workspaces).
   */
  const setCurrentWorkspace = useCallback((workspace: WorkspaceMetadata | null) => {
    setCurrentWorkspaceState(workspace);

    if (workspace === null) {
      localStorage.removeItem(STORAGE_KEYS.currentWorkspaceId);

      return;
    }

    localStorage.setItem(STORAGE_KEYS.currentWorkspaceId, workspace.id);

    // Update last access timestamp for sorting
    const accessData = JSON.parse(localStorage.getItem(STORAGE_KEYS.workspaceAccess) || '{}');

    accessData[workspace.id] = Date.now();
    localStorage.setItem(STORAGE_KEYS.workspaceAccess, JSON.stringify(accessData));
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/workspaces`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const data = await response.json();
      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getPersonalWorkspace = useCallback(async (): Promise<Workspace> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_URL}/api/workspaces/personal`, {
      headers: {
        'x-user-id': user.id,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get personal workspace');
    }

    return await response.json();
  }, [user]);

  const createWorkspace = useCallback(
    async (name: string, description: string = ''): Promise<Workspace> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create workspace');
      }

      const workspace = await response.json();
      setWorkspaces((prev) => [workspace, ...prev]);
      return workspace;
    },
    [user]
  );

  const getWorkspace = useCallback(
    async (id: string): Promise<Workspace | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/workspaces/${id}`, {
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

  const updateWorkspace = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Workspace, 'name' | 'description'>>
    ): Promise<Workspace | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/workspaces/${id}`, {
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

        const workspace = await response.json();
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === id ? workspace : w))
        );
        return workspace;
      } catch {
        return null;
      }
    },
    [user]
  );

  const deleteWorkspace = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`${API_URL}/api/workspaces/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return false;
        }

        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        return true;
      } catch {
        return false;
      }
    },
    [user]
  );

  const generateShareLink = useCallback(
    async (workspaceId: string, regenerate: boolean = false): Promise<string | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ regenerate }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return data.token || null;
      } catch {
        return null;
      }
    },
    [user]
  );

  const getWorkspacePreview = useCallback(
    async (token: string): Promise<WorkspacePreview | null> => {
      // This endpoint doesn't require authentication
      try {
        const response = await fetch(`${API_URL}/api/workspaces/join/${token}`);

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch {
        return null;
      }
    },
    []
  );

  const joinWorkspace = useCallback(
    async (token: string): Promise<Workspace | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/workspaces/join/${token}`, {
          method: 'POST',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return null;
        }

        const workspace = await response.json();

        // Add to local workspaces list if not already present
        setWorkspaces((prev) => {
          const exists = prev.some((w) => w.id === workspace.id);
          if (exists) {
            return prev.map((w) => (w.id === workspace.id ? workspace : w));
          }
          return [workspace, ...prev];
        });

        return workspace;
      } catch {
        return null;
      }
    },
    [user]
  );

  // WebSocket for receiving workspace list change notifications
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isCleaningUpRef = useRef(false);
  const fetchWorkspacesRef = useRef(fetchWorkspaces);

  // Keep ref up to date
  useEffect(() => {
    fetchWorkspacesRef.current = fetchWorkspaces;
  }, [fetchWorkspaces]);

  // WebSocket connection for receiving workspace notifications
  useEffect(() => {
    if (!user) return;

    const connect = () => {
      if (isCleaningUpRef.current) return;
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      const params = new URLSearchParams({
        userId: user.id,
        userName: user.name,
        userColor: '#888888',
      });

      const ws = new WebSocket(`${WORKSPACE_WS_URL}?${params}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WorkspaceContext] WebSocket connected for workspace notifications');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle workspace list change notifications
          if (message.type === 'workspace_created' ||
              message.type === 'workspace_updated' ||
              message.type === 'workspace_deleted' ||
              message.type === 'workspaces_changed') {
            console.log('[WorkspaceContext] Received workspace change notification:', message.type);
            // Refresh the workspace list
            fetchWorkspacesRef.current();
          }
        } catch (err) {
          console.error('[WorkspaceContext] Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) return; // Stale WebSocket
        wsRef.current = null;

        // Reconnect if not cleaning up
        if (!isCleaningUpRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log('[WorkspaceContext] Reconnecting WebSocket...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('[WorkspaceContext] WebSocket error:', err);
      };
    };

    isCleaningUpRef.current = false;
    connect();

    return () => {
      isCleaningUpRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user]);

  // Initialize the data bus WorkspaceDataProvider for real-time updates
  // Pass empty workspaceId initially - we rely on owner-based broadcasts
  // The userId must match the actual user ID for owner broadcasts to work
  useEffect(() => {
    if (!user) return;

    const cleanup = initializeWorkspaceProvider('', user.id);

    return cleanup;
  }, [user]);

  // Fetch workspaces when user becomes available
  // Also ensure personal workspace exists by calling getPersonalWorkspace
  useEffect(() => {
    if (!user) return;

    const initWorkspaces = async () => {
      // Ensure personal workspace exists (auto-created by server if needed)
      await getPersonalWorkspace();
      // Then fetch all workspaces
      await fetchWorkspaces();
    };

    initWorkspaces();
  }, [user, fetchWorkspaces, getPersonalWorkspace]);

  // Initialize current workspace from localStorage or default to personal
  useEffect(() => {
    if (!user || workspaces.length === 0 || initializedRef.current) return;

    const savedWorkspaceId = localStorage.getItem(STORAGE_KEYS.currentWorkspaceId);

    if (savedWorkspaceId) {
      // Try to find the saved workspace in the list
      const savedWorkspace = workspaces.find((w) => w.id === savedWorkspaceId);

      if (savedWorkspace) {
        setCurrentWorkspaceState(savedWorkspace);
        initializedRef.current = true;

        return;
      }
    }

    // Default to personal workspace (first in list since it's sorted that way)
    const personalWorkspace = workspaces.find((w) => w.type === 'personal');

    if (personalWorkspace) {
      setCurrentWorkspace(personalWorkspace);
    } else if (workspaces.length > 0) {
      // Fallback to first workspace if no personal found
      setCurrentWorkspace(workspaces[0]);
    }

    initializedRef.current = true;
  }, [user, workspaces, setCurrentWorkspace]);

  // Keep current workspace in sync with workspaces list
  // (e.g., if workspace is deleted or updated)
  useEffect(() => {
    if (!currentWorkspace || workspaces.length === 0) return;

    const updatedWorkspace = workspaces.find((w) => w.id === currentWorkspace.id);

    if (updatedWorkspace) {
      // Update if workspace data changed
      if (JSON.stringify(updatedWorkspace) !== JSON.stringify(currentWorkspace)) {
        setCurrentWorkspaceState(updatedWorkspace);
      }
    } else {
      // Current workspace was deleted, switch to personal
      const personalWorkspace = workspaces.find((w) => w.type === 'personal');

      if (personalWorkspace) {
        setCurrentWorkspace(personalWorkspace);
      } else if (workspaces.length > 0) {
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.currentWorkspaceId && event.newValue) {
        const newWorkspaceId = event.newValue;
        const newWorkspace = workspaces.find((w) => w.id === newWorkspaceId);

        if (newWorkspace && newWorkspace.id !== currentWorkspace?.id) {
          // Another tab changed workspace - update state but don't re-persist
          setCurrentWorkspaceState(newWorkspace);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [workspaces, currentWorkspace]);

  const value: WorkspaceContextValue = {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    setCurrentWorkspace,
    fetchWorkspaces,
    getPersonalWorkspace,
    createWorkspace,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    generateShareLink,
    getWorkspacePreview,
    joinWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider');
  }
  return context;
}
