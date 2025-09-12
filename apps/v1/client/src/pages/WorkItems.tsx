import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLayout } from '../contexts/LayoutContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { WorkItemDeleteDialog } from '../components/WorkItemDeleteDialog';
import type { WorkItem } from '../types';

export function WorkItems() {
  const { workItems, projects, personas, deleteWorkItem } = useApp();
  const { isLoadingWorkspace } = useWorkspace();
  const { setHeaderContent } = useLayout();
  const { currentStyles } = useTheme();
  const navigate = useNavigate();
  const styles = currentStyles;
  const [filter, setFilter] = useState<'all' | 'discarded' | WorkItem['status']>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workItemToDelete, setWorkItemToDelete] = useState<WorkItem | null>(null);

  // Clear header content on mount
  useEffect(() => {
    setHeaderContent(null);
  }, [setHeaderContent]);

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
    if (filter === 'all') {
      // Show all non-discarded items
      return !item.markdownPath?.includes('/discarded/');
    } else if (filter === 'discarded') {
      // Show only discarded items
      return item.markdownPath?.includes('/discarded/');
    } else {
      // Show items matching the status filter (excluding discarded)
      return item.status === filter && !item.markdownPath?.includes('/discarded/');
    }
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'dueDate':
        return 0; // dueDate not implemented yet
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Work items</h1>
          <p className={`mt-1 ${styles.mutedText}`}>
            Track and manage all your tasks across projects.
          </p>
        </div>
        <div className="flex gap-2">
          {workItems.length > 0 && (
            <Button as={Link} to="/work-items/new" variant="primary">
              Create work item
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Sorting */}
      <div
        className={`
        ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
        ${styles.cardShadow} p-4 mb-6
      `}
      >
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${styles.textColor}`}>Status:</span>
            <div className="flex gap-1">
              {(['all', 'planned', 'active', 'in-review', 'blocked', 'completed', 'discarded'] as const).map(
                (status) => (
                  <Button
                    key={status}
                    onClick={() => setFilter(status)}
                    variant={filter === status ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className={`text-sm font-medium ${styles.textColor}`}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`
                px-3 py-1 text-sm ${styles.buttonRadius}
                ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
              `}
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="created">Created</option>
            </select>
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
            {filter === 'all'
              ? 'Get started by creating your first work item.'
              : `No ${filter} work items.`}
          </p>
          {filter === 'all' && (
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
                      <div className={`text-sm ${styles.mutedText} mb-1`}>{project.name}</div>
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

                    {/* Show sub-tasks if they exist */}
                    {item.metadata?.tasks && item.metadata.tasks.length > 0 ? (
                      <div className="mb-3">
                        <p className={`${styles.textColor} mb-2`}>
                          Contains {item.metadata.tasks.length} sub-tasks:
                        </p>
                        <div className="space-y-1">
                          {item.metadata.tasks.map((task, index) => (
                            <div
                              key={task.id || `task-${index}`}
                              className={`flex items-center gap-2 ${styles.mutedText} text-sm`}
                            >
                              {/* Task status indicator */}
                              {task.status === 'in-progress' ? (
                                // Pulsating green circle for in-progress
                                <div className="relative w-4 h-4 flex items-center justify-center">
                                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                                  <div className="relative w-2 h-2 bg-green-500 rounded-full"></div>
                                </div>
                              ) : task.completed ? (
                                // Green checkmark for completed
                                <svg
                                  className="w-4 h-4 text-green-600 dark:text-green-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                // Simple bullet for pending
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60"></div>
                                </div>
                              )}
                              <span className={task.completed ? 'line-through opacity-60' : ''}>
                                {task.taskNumber || index + 1}. {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className={`${styles.textColor} mb-3`}>{item.description}</p>
                    )}

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
                      onClick={() => navigate(`/work-items/${item.id}/edit`)}
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

                // Reload the page to refresh the work items list
                window.location.reload();
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
