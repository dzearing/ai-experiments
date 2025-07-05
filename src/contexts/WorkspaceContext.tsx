import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { WorkspaceConfig, WorkspaceState, WorkspaceProject } from '../types/workspace';

interface WorkspaceContextType {
  workspace: WorkspaceState;
  projects: WorkspaceProject[];
  isLoadingWorkspace: boolean;
  setWorkspacePath: (path: string) => Promise<void>;
  reloadWorkspace: () => Promise<void>;
  clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    config: null,
    isLoading: false,
    error: null
  });
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);

  // Load workspace config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('workspaceConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig) as WorkspaceConfig;
      setWorkspace(prev => ({ ...prev, config }));
      loadWorkspaceData(config.path);
    }
  }, []);

  const loadWorkspaceData = async (path: string) => {
    setWorkspace(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('http://localhost:3000/api/workspace/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspacePath: path })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to read workspace');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setWorkspace(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Failed to load workspace:', error);
      
      // If it's a connection error, try to create the workspace structure
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Server might not be running, use mock data
        console.log('Server not available, using mock data');
        const mockProjects: WorkspaceProject[] = [
          {
            name: 'project-mgmt-ux',
            path: `${path}/projects/project-mgmt-ux`,
            repos: [
              {
                name: 'project-mgmt-ux',
                number: 1,
                path: `${path}/projects/project-mgmt-ux/repos/project-mgmt-ux-1`,
                isAvailable: false,
                activeWorkItem: 'implement-workspace',
                branch: 'feature/workspace-support'
              }
            ],
            plans: {
              ideas: [],
              planned: [],
              active: [
                {
                  name: 'implement-workspace',
                  path: `${path}/projects/project-mgmt-ux/plans/active/implement-workspace.md`,
                  status: 'active',
                  content: '# Implement Workspace Support\n\nAdd workspace management to Claude Flow.'
                }
              ],
              completed: []
            }
          }
        ];
        setProjects(mockProjects);
        setWorkspace(prev => ({ ...prev, isLoading: false }));
      } else {
        setWorkspace(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load workspace' 
        }));
      }
    }
  };

  const setWorkspacePath = async (path: string) => {
    const config: WorkspaceConfig = {
      path,
      name: path.split('/').pop() || 'Workspace'
    };
    
    // First, try to create workspace structure if it doesn't exist
    try {
      const response = await fetch('http://localhost:3000/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspacePath: path })
      });

      if (!response.ok) {
        console.warn('Failed to create workspace structure:', await response.text());
      }
    } catch (error) {
      console.warn('Could not create workspace structure:', error);
    }
    
    // Save to localStorage
    localStorage.setItem('workspaceConfig', JSON.stringify(config));
    
    // Update state
    setWorkspace(prev => ({ ...prev, config }));
    
    // Load workspace data
    await loadWorkspaceData(path);
  };

  const reloadWorkspace = async () => {
    if (workspace.config) {
      await loadWorkspaceData(workspace.config.path);
    }
  };

  const clearWorkspace = () => {
    localStorage.removeItem('workspaceConfig');
    setWorkspace({
      config: null,
      isLoading: false,
      error: null
    });
    setProjects([]);
  };

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      projects,
      isLoadingWorkspace: workspace.isLoading,
      setWorkspacePath,
      reloadWorkspace,
      clearWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}