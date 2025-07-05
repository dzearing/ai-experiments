import { useEffect, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useApp } from '../contexts/AppContext';

export function WorkspaceSync() {
  const { projects: workspaceProjects } = useWorkspace();
  const { syncWorkspaceProjects } = useApp();
  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    if (workspaceProjects && workspaceProjects.length > 0) {
      // Create a hash of the projects to check if they've changed
      const projectsHash = JSON.stringify(workspaceProjects.map(p => ({
        name: p.name,
        path: p.path,
        isLoading: p.isLoading,
        repositories: p.repositories,
        plans: p.plans
      })));
      
      // Only sync if projects have actually changed
      if (projectsHash !== lastSyncedRef.current) {
        console.log('WorkspaceSync: Syncing projects from workspace to app');
        syncWorkspaceProjects(workspaceProjects);
        lastSyncedRef.current = projectsHash;
      }
    }
  }, [workspaceProjects, syncWorkspaceProjects]);

  return null;
}