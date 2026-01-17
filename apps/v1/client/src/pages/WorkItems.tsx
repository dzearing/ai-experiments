import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLayout } from '../contexts/LayoutContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { useRealtimeSubscription } from '../contexts/SubscriptionContext';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { WorkItemDeleteDialog } from '../components/WorkItemDeleteDialog';
import { clientLogger } from '../utils/clientLogger';
import type { WorkItem } from '../types';

export function WorkItems() {
  const { workItems, projects, personas, deleteWorkItem } = useApp();
  const { isLoadingWorkspace, reloadWorkspace } = useWorkspace();
  const { setHeaderContent } = useLayout();
  const { currentStyles } = useTheme();
  const { subscribe } = useRealtimeSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const styles = currentStyles;
  const [filter, setFilter] = useState<'active' | 'discarded'>('active');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workItemToDelete, setWorkItemToDelete] = useState<WorkItem | null>(null);
  const hasReloadedRef = useRef(false);

  // Clear header content on mount
  useEffect(() => {
    setHeaderContent(null);
  }, [setHeaderContent]);

  // Force reload when coming back from edit
  useEffect(() => {
    // Check if we're coming back from an edit page
    const isReturningFromEdit = location.state?.fromEdit === true;

    if (isReturningFromEdit && !hasReloadedRef.current) {
      clientLogger.info('WorkItems', 'Returning from edit, forcing workspace reload');
      hasReloadedRef.current = true;

      // Clear the navigation state
      window.history.replaceState({}, document.title);

      // Force reload the workspace with a small delay to ensure file writes are complete
      setTimeout(async () => {
        const { invalidateCache } = await import('../utils/cache');
        invalidateCache(/^workspace-light:/);
        invalidateCache(/^project-details:/);
        invalidateCache(/^workspace:/);
        invalidateCache(/^work-items:/);
        await reloadWorkspace();
        clientLogger.info('WorkItems', 'Workspace reload completed after edit');
      }, 500); // 500ms delay to ensure file system operations are complete
    }
  }, [location, reloadWorkspace]);

  // Subscribe to workspace updates to refresh when work items change
  useEffect(() => {
    const unsubscribe = subscribe('workspace-update', '', (data) => {
      clientLogger.info('WorkItems', 'Received workspace update notification', {
        action: data.action,
        data
      });

      // Reload workspace data when we get a notification about work item changes
      if (data.action === 'work-item-discarded' || data.action === 'work-item-deleted' || data.action === 'work-item-updated') {
        clientLogger.info('WorkItems', 'Triggering workspace reload due to work item change', {
          action: data.action,
          workItemId: data.workItemId,
          markdownPath: data.markdownPath
        });

        // Add a small delay to ensure file system operations are complete on the server
        setTimeout(async () => {
          // First invalidate client-side cache to ensure fresh data
          const { invalidateCache } = await import('../utils/cache');
          invalidateCache(/^workspace-light:/);
          invalidateCache(/^project-details:/);
          invalidateCache(/^workspace:/);
          invalidateCache(/^work-items:/);
          invalidateCache(/^work-item:/);
          clientLogger.debug('WorkItems', 'Cache invalidated for workspace data');

          // Then reload workspace
          await reloadWorkspace();
          clientLogger.info('WorkItems', 'Workspace reload completed after SSE update');
        }, 300); // 300ms delay for SSE updates
      } else {
        clientLogger.debug('WorkItems', 'Ignoring workspace update - not a work item change', {
          action: data.action
        });
      }
    });

    return unsubscribe;
  }, [subscribe, reloadWorkspace]);

  const getStatusColor = (status: WorkItem['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50';
      case 'completed':
        return 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900/50';
      case 'blocked':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50';
      case 'in-review':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50';
    }
  };

  const getPriorityIcon = (priority: WorkItem['priority']) => {
    switch (priority) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const filteredItems = workItems.filter((item) => {
    if (filter === 'active') {
      // Show all non-discarded items
      return !item.markdownPath?.includes('/discarded/');
    } else {
      // Show only discarded items
      return item.markdownPath?.includes('/discarded/');
    }
  });

  // Sort by last modified date (most recent first)
  const sortedItems = [...filteredItems].sort((a, b) => {
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return (
    <div className="h-full overflow-auto p-8">
      {/* Command Bar */}
      <div
        className={`
        ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
        ${styles.cardShadow} p-4 mb-6
      `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button as={Link} to="/work-items/new" variant="primary">
              Create work item
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${styles.textColor}`}>Status:</span>
            <div className="flex gap-1">
              <Button
                onClick={() => setFilter('active')}
                variant={filter === 'active' ? 'primary' : 'secondary'}
                size="sm"
              >
                Active
              </Button>
              <Button
                onClick={() => setFilter('discarded')}
                variant={filter === 'discarded' ? 'primary' : 'secondary'}
                size="sm"
              >
                Discarded
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info */}
      {(() => {
        console.log('=== WorkItems Debug ===', {
          workItems: workItems,
          workItemsLength: workItems.length,
          workItemIds: workItems.map((w) => w.id),
          projects: projects,
          projectsLength: projects.length,
          filteredItemsLength: filteredItems.length,
          sortedItemsLength: sortedItems.length,
        });
        return null;
      })()}

      {/* Work Items List */}
      {isLoadingWorkspace ? (
        <div
          className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-12 text-center
        `}
        >
          <div className="animate-pulse mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4"></div>
            <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded w-32 mx-auto mb-2"></div>
            <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded w-24 mx-auto"></div>
          </div>
          <p className={`${styles.textColor} font-medium`}>Loading work items...</p>
          <p className={`${styles.mutedText} text-sm mt-2`}>Fetching your tasks and projects</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div
          className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-12 text-center
        `}
        >
          <svg
            className={`mx-auto h-12 w-12 ${styles.mutedText}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className={`mt-4 text-lg font-medium ${styles.headingColor}`}>No work items found</h3>
          <p className={`mt-2 ${styles.mutedText}`}>
            {filter === 'active'
              ? 'Get started by creating your first work item.'
              : `No ${filter} work items.`}
          </p>
          {filter === 'active' && (
            <div className="mt-6">
              <Button as={Link} to="/work-items/new" variant="primary">
                Create work item
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => {
            const project = projects.find((p) => p.id === item.projectId);
            const assignee =
              item.assignedPersonaIds.length > 0
                ? personas.find((p) => p.id === item.assignedPersonaIds[0])
                : undefined;

            // DETAILED LOGGING FOR DEBUGGING
            clientLogger.info('WorkItems', `Rendering work item ${item.id}`, {
              title: item.title,
              markdownPath: item.markdownPath,
              projectId: item.projectId,
              foundProject: !!project,
              projectName: project?.name,
              updatedAt: item.updatedAt
            });

            console.log(`WorkItem ${item.id}:`, {
              title: item.title,
              projectId: item.projectId,
              foundProject: project,
              projectName: project?.name,
            });

            return (
              <div
                key={item.id}
                className={`
                  ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
                  ${styles.cardShadow} p-6
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {project && (
                      <div className={`text-sm ${styles.mutedText} mb-1 flex items-center gap-3`}>
                        <span>{project.name}</span>
                        <span>•</span>
                        <span>Created: {item.createdAt.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Modified: {item.updatedAt.toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getPriorityIcon(item.priority)}</span>
                      <h3 className={`text-lg font-semibold ${styles.headingColor}`}>
                        {item.title}
                      </h3>
                      <span
                        className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${getStatusColor(item.status)}
                      `}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className={`${styles.textColor} mb-3`}>{item.description}</p>

                    {/* Checklist progress - not implemented yet */}

                    {/* Tags - not implemented yet */}

                    <div className="flex items-center gap-4 text-sm">
                      {assignee && (
                        <div className={`flex items-center gap-2 ${styles.mutedText}`}>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>{assignee.name}</span>
                        </div>
                      )}

                      {/* Due date - not implemented yet */}

                      {/* Estimated effort - not implemented yet */}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <IconButton
                      aria-label="Edit work item"
                      variant="secondary"
                      onClick={() => {
                        clientLogger.userClick('WorkItems', 'Edit button', {
                          workItemId: item.id,
                          workItemTitle: item.title
                        });
                        navigate(`/work-items/${item.id}/edit`);
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </IconButton>
                    <IconButton
                      aria-label="Chat about work item"
                      variant="secondary"
                      onClick={() => navigate(`/work-items/${item.id}/jam`)}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </IconButton>
                    {item.markdownPath && (
                      <IconButton
                        aria-label="Open in VS Code"
                        variant="secondary"
                        onClick={() => {
                          // Use vscode:// protocol to open file in VS Code
                          window.location.href = `vscode://file${item.markdownPath}`;
                        }}
                        title={`Open ${item.markdownPath.split('/').pop()} in VS Code`}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      </IconButton>
                    )}
                    <IconButton
                      aria-label="Delete work item"
                      variant="secondary"
                      onClick={() => {
                        console.log('Setting work item to delete:', item);
                        console.log('Work item markdownPath:', item.markdownPath);
                        setWorkItemToDelete(item);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WorkItemDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setWorkItemToDelete(null);
        }}
        workItem={workItemToDelete}
        onConfirm={async (permanentDelete) => {
          if (!workItemToDelete) return;
          
          console.log('Deleting work item:', workItemToDelete);
          console.log('Work item has markdownPath:', workItemToDelete.markdownPath);

          // Handle markdown file deletion/move if it exists
          if (workItemToDelete.markdownPath) {
            try {
              const response = await fetch('http://localhost:3000/api/work-items/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  markdownPath: workItemToDelete.markdownPath,
                  permanentDelete,
                }),
              });

              if (!response.ok) {
                console.error('Failed to delete/move markdown file');
              } else {
                // Invalidate client-side cache after successful deletion
                const { invalidateCache } = await import('../utils/cache');
                invalidateCache(/^workspace-light:/);
                invalidateCache(/^project-details:/);
                invalidateCache(/^workspace:/);
                invalidateCache(/^work-items:/);

                // The workspace will reload automatically via SSE notification
                console.log('Work item delete/move successful, waiting for SSE update');
              }
            } catch (error) {
              console.error('Error handling markdown file:', error);
            }
          } else {
            // Delete from app state only (no markdown file)
            deleteWorkItem(workItemToDelete.id);
          }
        }}
      />
    </div>
  );
}
