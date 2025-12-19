import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:3002';

export interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Workspace extends WorkspaceMetadata {
  // Additional workspace data can be added here
}

interface WorkspaceContextValue {
  workspaces: WorkspaceMetadata[];
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  getWorkspace: (id: string) => Promise<Workspace | null>;
  updateWorkspace: (
    id: string,
    updates: Partial<Pick<Workspace, 'name' | 'description'>>
  ) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const value: WorkspaceContextValue = {
    workspaces,
    isLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
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
