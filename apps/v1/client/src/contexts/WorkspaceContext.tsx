import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { WorkspaceConfig, WorkspaceState, WorkspaceProject } from '../types/workspace';
import { getCached, invalidateCache } from '../utils/cache';

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
    error: null,
  });
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);

  // Load workspace config from user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/user-profile');
      if (response.ok) {
        const profile = await response.json();
        if (profile.workspaceRoot) {
          const config: WorkspaceConfig = {
            path: profile.workspaceRoot,
            name: profile.workspaceRoot.split('/').pop() || 'Workspace',
          };
          setWorkspace((prev) => ({ ...prev, config }));
          loadWorkspaceData(profile.workspaceRoot);
        }
      } else {
        console.error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fall back to localStorage if server is not available
      const savedConfig = localStorage.getItem('workspaceConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig) as WorkspaceConfig;
        setWorkspace((prev) => ({ ...prev, config }));
        loadWorkspaceData(config.path);
      }
    }
  };

  const loadWorkspaceData = async (path: string) => {
    setWorkspace((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // First, load basic project info quickly with caching
      const lightData = await getCached(
        `workspace-light:${path}`,
        async () => {
          const lightResponse = await fetch('http://localhost:3000/api/workspace/read-light', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workspacePath: path }),
          });

          if (!lightResponse.ok) {
            const errorData = await lightResponse.json();
            throw new Error(errorData.error || 'Failed to read workspace');
          }

          return lightResponse.json();
        },
        {
          maxAge: 60 * 1000, // 1 minute
          staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
        }
      );

      setProjects(lightData.projects || []);
      setWorkspace((prev) => ({ ...prev, isLoading: false }));

      // Then load full details in the background
      if (lightData.projects && lightData.projects.length > 0) {
        // Load project details in parallel
        const detailPromises = lightData.projects.map(async (project: any) => {
          try {
            const details = await getCached(
              `project-details:${project.path}`,
              async () => {
                const detailResponse = await fetch(
                  'http://localhost:3000/api/workspace/project-details',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ projectPath: project.path }),
                  }
                );

                if (!detailResponse.ok) {
                  throw new Error('Failed to load project details');
                }

                return detailResponse.json();
              },
              {
                maxAge: 5 * 60 * 1000, // 5 minutes
                staleWhileRevalidate: 30 * 60 * 1000, // 30 minutes
              }
            );

            // Update the specific project with full details
            console.log('Updating project with details:', project.name, details);
            setProjects((prev) =>
              prev.map((p) =>
                p.path === project.path ? { ...p, ...details, isLoading: false } : p
              )
            );
          } catch (err) {
            console.error(`Failed to load details for project ${project.name}:`, err);
          }
        });

        // Don't wait for all details - they'll update as they come in
        Promise.all(detailPromises).catch(console.error);
      }
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
                branch: 'feature/workspace-support',
              },
            ],
            plans: {
              ideas: [],
              planned: [],
              active: [
                {
                  name: 'implement-workspace',
                  path: `${path}/projects/project-mgmt-ux/plans/active/implement-workspace.md`,
                  status: 'active',
                  content:
                    '# Implement Workspace Support\n\nAdd workspace management to Claude Flow.',
                },
              ],
              completed: [],
            },
          },
        ];
        setProjects(mockProjects);
        setWorkspace((prev) => ({ ...prev, isLoading: false }));
      } else {
        setWorkspace((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load workspace',
        }));
      }
    }
  };

  const setWorkspacePath = async (path: string) => {
    const config: WorkspaceConfig = {
      path,
      name: path.split('/').pop() || 'Workspace',
    };

    // First, try to create workspace structure if it doesn't exist
    try {
      const response = await fetch('http://localhost:3000/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspacePath: path }),
      });

      if (!response.ok) {
        console.warn('Failed to create workspace structure:', await response.text());
      }
    } catch (error) {
      console.warn('Could not create workspace structure:', error);
    }

    // Save to user profile
    try {
      const profileResponse = await fetch('http://localhost:3000/api/user-profile/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceRoot: path }),
      });

      if (!profileResponse.ok) {
        console.error('Failed to update user profile:', await profileResponse.text());
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }

    // Also save to localStorage as fallback
    localStorage.setItem('workspaceConfig', JSON.stringify(config));

    // Update state
    setWorkspace((prev) => ({ ...prev, config }));

    // Load workspace data
    await loadWorkspaceData(path);
  };

  const reloadWorkspace = async () => {
    if (workspace.config) {
      // Invalidate cache before reloading
      invalidateCache(`workspace-light:${workspace.config.path}`);
      invalidateCache(/^project-details:/);
      await loadWorkspaceData(workspace.config.path);
    }
  };

  const clearWorkspace = () => {
    localStorage.removeItem('workspaceConfig');
    setWorkspace({
      config: null,
      isLoading: false,
      error: null,
    });
    setProjects([]);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        projects,
        isLoadingWorkspace: workspace.isLoading,
        setWorkspacePath,
        reloadWorkspace,
        clearWorkspace,
      }}
    >
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
