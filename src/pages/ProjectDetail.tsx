import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useLayout } from '../contexts/LayoutContext';
import { useRealtimeSubscription } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/ToastContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { apiUrl } from '../config/api';
import type { WorkspaceRepo, WorkspaceProject } from '../types/workspace';

interface RepoStatus {
  resourceId: string;
  repoPath: string;
  branch: string;
  isDirty: boolean;
  changes: {
    modified: number;
    added: number;
    deleted: number;
    untracked: number;
  };
  ahead: number;
  behind: number;
  lastCommit: {
    hash: string;
    subject: string;
    author: string;
    relativeTime: string;
  } | null;
  timestamp: string;
  error?: string;
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { setHeaderContent } = useLayout();
  const { subscribe, isConnected } = useRealtimeSubscription();
  const { showToast } = useToast();
  const { projects: workspaceProjects, reloadWorkspace } = useWorkspace();
  const { projects: appProjects } = useApp();
  const styles = currentStyles;
  
  // First try to find in App context projects
  const appProject = appProjects.find(p => p.id === projectId);
  
  // Then find the corresponding workspace project
  const project = workspaceProjects.find((p: WorkspaceProject) => 
    p.name === appProject?.name || p.path?.includes(projectId || '')
  );
  const [repoStatuses, setRepoStatuses] = useState<Map<string, RepoStatus>>(new Map());
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneMode, setCloneMode] = useState<'existing' | 'new'>('existing');
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<WorkspaceRepo | null>(null);

  // Set breadcrumb on mount
  useEffect(() => {
    if (project) {
      setHeaderContent([
        { label: 'Projects', path: '/projects' },
        { label: project.name }
      ]);
    }
    
    return () => {
      setHeaderContent(null);
    };
  }, [project, setHeaderContent]);

  // Subscribe to repository status updates
  useEffect(() => {
    if (!project?.repos) return;

    const unsubscribers = project.repos.map((repo: WorkspaceRepo) => {
      return subscribe('repo-status', `${project.path}/${repo.name}-${repo.number}`, (status: RepoStatus) => {
        setRepoStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(`${repo.name}-${repo.number}`, status);
          return newMap;
        });
      });
    });

    return () => {
      unsubscribers.forEach((unsub: () => void) => unsub());
    };
  }, [project, subscribe]);

  if (!project) {
    return (
      <div className={`text-center py-12 ${styles.textColor}`}>
        <p>Project not found</p>
        <Link to="/projects" className={`${styles.linkText || 'text-blue-600 dark:text-blue-400'} hover:underline mt-4 inline-block`}>
          Back to projects
        </Link>
      </div>
    );
  }

  const handleRebase = async (repo: WorkspaceRepo) => {
    const key = `rebase-${repo.name}-${repo.number}`;
    setLoadingActions(prev => new Set(prev).add(key));
    
    try {
      const response = await fetch(apiUrl(`/api/repos/${encodeURIComponent(project.path || '')}/${repo.name}-${repo.number}/rebase`), {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to rebase');
      }
      
      showToast(`Successfully rebased ${repo.name}-${repo.number} on main`, 'success');
    } catch (error) {
      showToast(`Failed to rebase: ${(error as Error).message}`, 'error');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleReset = async (repo: WorkspaceRepo, stashChanges: boolean) => {
    const key = `reset-${repo.name}-${repo.number}`;
    setLoadingActions(prev => new Set(prev).add(key));
    
    try {
      const response = await fetch(apiUrl(`/api/repos/${encodeURIComponent(project.path || '')}/${repo.name}-${repo.number}/reset`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stashChanges })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset');
      }
      
      showToast(`Successfully reset ${repo.name}-${repo.number} to main`, 'success');
    } catch (error) {
      showToast(`Failed to reset: ${(error as Error).message}`, 'error');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleDelete = (repo: WorkspaceRepo) => {
    setRepoToDelete(repo);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!repoToDelete || !project) return;

    const key = `delete-${repoToDelete.name}-${repoToDelete.number}`;
    setLoadingActions(prev => new Set(prev).add(key));
    setShowDeleteDialog(false);
    
    try {
      const response = await fetch(apiUrl(`/api/repos/${encodeURIComponent(project.path || '')}/${repoToDelete.name}-${repoToDelete.number}`), {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete');
      }
      
      showToast(`Successfully deleted ${repoToDelete.name}-${repoToDelete.number}`, 'success');
      // Refresh project data
      await reloadWorkspace();
    } catch (error) {
      showToast(`Failed to delete: ${(error as Error).message}`, 'error');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setRepoToDelete(null);
    }
  };

  const getStatusBadge = (status: RepoStatus | undefined) => {
    if (!status) {
      return (
        <span className={`px-2 py-1 text-xs rounded ${styles.contentBg} ${styles.mutedText}`}>
          Loading...
        </span>
      );
    }

    if (status.error) {
      return (
        <span className={`px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400`}>
          Error
        </span>
      );
    }

    const bgClass = status.isDirty 
      ? 'bg-yellow-100 dark:bg-yellow-900/20' 
      : 'bg-green-100 dark:bg-green-900/20';
    const textClass = status.isDirty 
      ? styles.warningText 
      : styles.successText;

    return (
      <span className={`px-2 py-1 text-xs rounded ${bgClass} ${textClass}`}>
        {status.isDirty ? 'Uncommitted changes' : 'Clean'}
      </span>
    );
  };

  const handleClone = async () => {
    if (!project) return;
    
    setIsCloning(true);
    try {
      let repoUrl: string;
      
      if (cloneMode === 'new') {
        // Adding new repository to project
        if (!cloneUrl.trim()) return;
        
        repoUrl = cloneUrl.trim();
        
        // First, add the repository to the project
        const addRepoResponse = await fetch(apiUrl('/api/workspace/add-repository'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectPath: project.path,
            repositoryUrl: repoUrl
          })
        });
        
        if (!addRepoResponse.ok) {
          const error = await addRepoResponse.json();
          throw new Error(error.message || 'Failed to add repository to project');
        }
        
        showToast('Repository added to project', 'success');
      } else {
        // Cloning existing repository
        repoUrl = selectedRepoUrl;
      }
      
      // Clone the repository
      const response = await fetch(apiUrl(`/api/repos/${encodeURIComponent(project.path || '')}/clone`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clone repository');
      }
      
      const result = await response.json();
      showToast(`Successfully cloned repository as ${result.repoName}`, 'success');
      
      // Wait a bit before reloading to ensure filesystem operations complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh project data
      await reloadWorkspace();
      
      // Only close dialog after everything is successful
      setShowCloneDialog(false);
      setCloneUrl('');
      setCloneMode('existing');
      setSelectedRepoUrl('');
      
    } catch (error) {
      showToast(`Failed: ${(error as Error).message}`, 'error');
      setIsCloning(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  return (
    <div>
      {/* Connection status */}
      {!isConnected && (
        <div className={`mb-4 p-3 rounded ${styles.warningBg || 'bg-yellow-100 dark:bg-yellow-900/20'} ${styles.warningText}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Real-time updates disconnected. Status may be outdated.</span>
          </div>
        </div>
      )}

      {/* Project info */}
      <div className={`mb-6 p-6 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${styles.headingColor} mb-2`}>{project.name}</h1>
            {project.readme && (
              <p className={`${styles.textColor} mb-4`}>
                {project.readme.split('\n').find((line: string) => line.trim() && !line.startsWith('#')) || ''}
              </p>
            )}
            {project.purpose && (
              <p className={`text-sm ${styles.mutedText}`}>
                <span className="font-medium">Purpose:</span> {project.purpose}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/claude-code`)}
            className="ml-4"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              Claude Code
            </span>
          </Button>
        </div>
      </div>

      {/* Repository clones */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${styles.headingColor}`}>Repository clones</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCloneDialog(true);
              setCloneMode('existing');
              setCloneUrl('');
              // Set default selected repo for single repo projects
              if (appProject?.repositories && appProject.repositories.length === 1) {
                setSelectedRepoUrl(appProject.repositories[0].url);
              } else {
                setSelectedRepoUrl('');
              }
            }}
          >
            Add clone
          </Button>
        </div>
        
        {(!project.repos || project.repos.length === 0) ? (
          <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} p-8 text-center`}>
            <p className={styles.mutedText}>No repository clones found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {project.repos.map((repo: WorkspaceRepo) => {
              const status = repoStatuses.get(`${repo.name}-${repo.number}`);
              const rebaseKey = `rebase-${repo.name}-${repo.number}`;
              const resetKey = `reset-${repo.name}-${repo.number}`;
              const deleteKey = `delete-${repo.name}-${repo.number}`;
              
              return (
                <div 
                  key={`${repo.name}-${repo.number}`} 
                  className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} p-6`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${styles.headingColor}`}>
                          {repo.name}-{repo.number}
                        </h3>
                        {getStatusBadge(status)}
                        {status && !status.error && (
                          <span className={`text-sm ${styles.mutedText}`}>
                            Branch: <span className={styles.textColor}>{status.branch}</span>
                          </span>
                        )}
                      </div>
                      
                      {status && !status.error && (
                        <>
                          {/* Changes summary */}
                          {status.isDirty && (
                            <div className={`text-sm ${styles.mutedText} mb-2`}>
                              Changes: 
                              {status.changes.modified > 0 && ` ${status.changes.modified} modified`}
                              {status.changes.added > 0 && ` ${status.changes.added} added`}
                              {status.changes.deleted > 0 && ` ${status.changes.deleted} deleted`}
                              {status.changes.untracked > 0 && ` ${status.changes.untracked} untracked`}
                            </div>
                          )}
                          
                          {/* Ahead/behind */}
                          {(status.ahead > 0 || status.behind > 0) && (
                            <div className={`text-sm ${styles.mutedText} mb-2`}>
                              {status.ahead > 0 && (
                                <span className={styles.successText}>↑ {status.ahead} ahead</span>
                              )}
                              {status.ahead > 0 && status.behind > 0 && ' • '}
                              {status.behind > 0 && (
                                <span className={styles.warningText}>↓ {status.behind} behind</span>
                              )}
                            </div>
                          )}
                          
                          {/* Last commit */}
                          {status.lastCommit && (
                            <div className={`text-sm ${styles.mutedText}`}>
                              Last commit: {status.lastCommit.subject} 
                              <span className="ml-2">by {status.lastCommit.author}</span>
                              <span className="ml-2">({status.lastCommit.relativeTime})</span>
                            </div>
                          )}
                          
                          {/* Last updated */}
                          <div className={`text-xs ${styles.mutedText} mt-2`}>
                            Updated {formatTimestamp(status.timestamp)}
                          </div>
                        </>
                      )}
                      
                      {/* Active work item */}
                      {repo.activeWorkItem && (
                        <div className={`mt-3 text-sm ${styles.mutedText}`}>
                          Working on: <span className={styles.textColor}>{repo.activeWorkItem}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {status && status.behind > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRebase(repo)}
                          disabled={loadingActions.has(rebaseKey)}
                        >
                          {loadingActions.has(rebaseKey) ? 'Rebasing...' : 'Rebase on main'}
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReset(repo, status?.isDirty || false)}
                        disabled={loadingActions.has(resetKey)}
                      >
                        {loadingActions.has(resetKey) ? 'Resetting...' : 'Reset to main'}
                      </Button>
                      
                      <IconButton
                        variant="secondary"
                        aria-label="Delete clone"
                        onClick={() => handleDelete(repo)}
                        disabled={loadingActions.has(deleteKey)}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </IconButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clone dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6 max-w-lg w-full`}>
            <h3 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Add repository clone</h3>
            
            {/* Repository selection */}
            <div className="mb-6 space-y-4">
              {appProject?.repositories && appProject.repositories.length === 1 ? (
                // Single repository - show radio options
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 cursor-pointer`}>
                    <input
                      type="radio"
                      name="cloneMode"
                      value="existing"
                      checked={cloneMode === 'existing'}
                      onChange={() => {
                        setCloneMode('existing');
                        setSelectedRepoUrl(appProject.repositories![0].url);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${styles.textColor}`}>
                        Clone existing repository
                      </div>
                      <div className={`text-sm ${styles.mutedText} mt-1`}>
                        {appProject.repositories[0].url.split('/').slice(-1)[0].replace('.git', '')}
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-start gap-3 cursor-pointer`}>
                    <input
                      type="radio"
                      name="cloneMode"
                      value="new"
                      checked={cloneMode === 'new'}
                      onChange={() => setCloneMode('new')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${styles.textColor}`}>
                        Add new repository to project
                      </div>
                      <div className={`text-sm ${styles.mutedText} mt-1`}>
                        Clone a different repository and add it to this project
                      </div>
                    </div>
                  </label>
                </div>
              ) : appProject?.repositories && appProject.repositories.length > 1 ? (
                // Multiple repositories - show dropdown
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                    Select repository to clone
                  </label>
                  <select
                    value={selectedRepoUrl}
                    onChange={(e) => {
                      setSelectedRepoUrl(e.target.value);
                      setCloneMode(e.target.value === 'new' ? 'new' : 'existing');
                    }}
                    className={`w-full px-3 py-2 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} ${styles.textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isCloning}
                  >
                    <option value="">Select a repository...</option>
                    {appProject.repositories.map((repo, index) => (
                      <option key={index} value={repo.url}>
                        {repo.url.split('/').slice(-1)[0].replace('.git', '')}
                      </option>
                    ))}
                    <option value="new">Add new repository to project...</option>
                  </select>
                </div>
              ) : null}

              {/* New repository URL input */}
              {cloneMode === 'new' && (
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                    New repository URL
                  </label>
                  <input
                    type="text"
                    value={cloneUrl}
                    onChange={(e) => setCloneUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo.git"
                    className={`w-full px-3 py-2 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} ${styles.textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isCloning}
                  />
                  <p className={`mt-2 text-sm ${styles.mutedText}`}>
                    Enter the repository URL to add to this project
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCloneDialog(false);
                  setCloneUrl('');
                  setCloneMode('existing');
                  setSelectedRepoUrl('');
                }}
                disabled={isCloning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleClone}
                disabled={isCloning || (cloneMode === 'new' ? !cloneUrl.trim() : !selectedRepoUrl)}
              >
                {isCloning ? 'Cloning...' : 'Clone'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete repository clone"
        message={`Are you sure you want to delete ${repoToDelete?.name}-${repoToDelete?.number}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setRepoToDelete(null);
        }}
        variant="danger"
      />
    </div>
  );
}