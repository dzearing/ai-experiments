import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useApp } from '../contexts/AppContext';
import { useLayout } from '../contexts/LayoutContext';
import { useToast } from '../contexts/ToastContext';
import { BackgroundPattern } from './BackgroundPatternOptimized';
import { AnimatedTransition } from './AnimatedTransition';
import { AnimatedOutletWrapper } from './AnimatedOutletWrapper';
import { useNavigationDirection } from '../hooks/useNavigationDirection';
import { SettingsMenu } from './SettingsMenu';
import { AuthAvatar } from './AuthAvatar';
import { Breadcrumb } from './ui/Breadcrumb';
import { IconButton } from './ui/IconButton';

export function ThemedLayoutV2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStyles, backgroundEffectEnabled } = useTheme();
  const { workspace, reloadWorkspace } = useWorkspace();
  const { projects, workItems } = useApp();
  const { headerTitle, headerSubtitle, headerContent } = useLayout();
  const { showToast } = useToast();
  const styles = currentStyles;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks
    
    setIsRefreshing(true);
    showToast('Refreshing workspace data...', 'info');
    
    try {
      // Clear all cached data
      if (workspace.config?.path) {
        // Clear the cache utility's storage
        const { invalidateCache } = await import('../utils/cache');
        // Clear all cached data patterns
        invalidateCache(/./); // This clears everything
        
        // Clear localStorage to remove any stale state
        localStorage.removeItem('workspace-cache');
        localStorage.removeItem('project-cache');
        
        // Clear sessionStorage as well
        sessionStorage.clear();
        
        // Call server endpoint to clear server-side cache
        try {
          await fetch('http://localhost:3000/api/cache/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              workspacePath: workspace.config.path 
            })
          });
        } catch (err) {
          console.error('Failed to clear server cache:', err);
        }
        
        // Now reload workspace data
        await reloadWorkspace();
        
        showToast('Workspace refreshed!', 'success');
        
        // Wait a moment for the toast to show, then reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error refreshing workspace:', error);
      showToast('Failed to refresh workspace', 'error');
      setIsRefreshing(false);
    }
  };
  const direction = useNavigationDirection();

  // Extract projectId from various routes
  const getProjectIdFromPath = () => {
    // Match /projects/:projectId (project detail page)
    const projectDetailMatch = location.pathname.match(/^\/projects\/([^\/]+)$/);
    if (projectDetailMatch) return projectDetailMatch[1];

    // Match /projects/:projectId/workitems/new
    const projectMatch = location.pathname.match(/^\/projects\/([^\/]+)\/workitems\/new$/);
    if (projectMatch) return projectMatch[1];

    // Match /work-items/:workItemId/edit
    const editMatch = location.pathname.match(/^\/work-items\/([^\/]+)\/edit$/);
    if (editMatch) {
      const workItem = workItems.find((w) => w.id === editMatch[1]);
      return workItem?.projectId;
    }

    return null;
  };

  const projectId = getProjectIdFromPath();
  const project = projectId ? projects.find((p) => p.id === projectId) : null;

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/work-items', label: 'Work items' },
    { path: '/agents', label: 'Agents' },
    { path: '/jam-sessions', label: 'Jam sessions' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Determine if we should show a back button
  const shouldShowBackButton = () => {
    // Show back button for detail pages and forms that were navigated to from lists
    const backButtonRoutes = [
      /^\/projects\/[^\/]+$/, // Project detail
      /^\/work-items\/[^\/]+\/edit$/, // Work item edit
      /^\/work-items\/[^\/]+\/jam$/, // Work item review session
      /^\/jam-sessions\/[^\/]+$/, // Jam session detail
      /^\/projects\/new$/, // New project
      /^\/work-items\/new$/, // New work item
      /^\/agents\/new$/, // New agent
    ];

    return backButtonRoutes.some(pattern => pattern.test(location.pathname));
  };

  // Get default subtitle for pages
  const getDefaultSubtitle = () => {
    // If a page has explicitly set a subtitle, use it
    if (headerSubtitle) {
      return headerSubtitle;
    }

    // Default subtitles for main pages
    const subtitles: Record<string, string> = {
      '/': 'Monitor your project status and activity',
      '/projects': 'Manage and track all your projects in one place',
      '/work-items': 'Track and manage all your tasks across projects',
      '/agents': 'Manage your AI agents and their assignments',
      '/jam-sessions': 'Collaborative sessions for brainstorming and planning',
      '/daily-report': 'Summary of today\'s progress and activities',
      '/debug-claude': 'Debug and test Claude integration',
      '/projects/new': 'Set up a new project with repositories and details',
      '/work-items/new': 'Create a new task for your project',
      '/agents/new': 'Configure a new AI agent with specific expertise',
    };

    // Check for exact match
    if (subtitles[location.pathname]) {
      return subtitles[location.pathname];
    }

    // Check for edit routes
    if (location.pathname.includes('/work-items/') && location.pathname.includes('/edit')) {
      return 'Modify task details and requirements';
    }

    // Check for project detail
    if (location.pathname.match(/^\/projects\/[^\/]+$/)) {
      return 'View project details and repositories';
    }

    // Check for review session
    if (location.pathname.match(/^\/work-items\/[^\/]+\/jam$/)) {
      return 'Setting up review session...';
    }

    return null;
  };

  // Determine what to show in the header
  const getHeaderContent = () => {
    // If headerContent is set by a page component, use it (for breadcrumbs)
    if (headerContent !== null) {
      return headerContent;
    }

    // If headerTitle is set by a page component, use it
    if (headerTitle) {
      return headerTitle;
    }

    // Map routes to their titles - these should appear in the header
    const routeTitles: Record<string, string> = {
      '/': 'Dashboard',
      '/projects': 'Projects',
      '/work-items': 'Work items',
      '/agents': 'Agents',
      '/jam-sessions': 'Jam sessions',
      '/daily-report': 'Daily report',
      '/debug-claude': 'Debug Claude',
      '/projects/new': 'Create project',
      '/work-items/new': 'Create work item',
      '/agents/new': 'Create agent',
    };

    // Check for exact match first
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname];
    }

    // Skip automatic title for edit routes - they set their own breadcrumbs
    if (location.pathname.includes('/work-items/') && location.pathname.includes('/edit')) {
      return null;
    }

    // Check for project work item creation
    if (
      project &&
      location.pathname.includes('/work-items/new')
    ) {
      return [{ label: 'Projects', path: '/projects' }, { label: project.name, path: `/projects/${project.id}` }, { label: 'New work item' }];
    }

    // Check for project detail pages
    if (location.pathname.startsWith('/projects/') && !location.pathname.includes('/new')) {
      const projectMatch = location.pathname.match(/^\/projects\/([^\/]+)$/);
      if (projectMatch) {
        // If we have the project data, show the project name
        if (project) {
          return [{ label: 'Projects', path: '/projects' }, { label: project.name }];
        }
        // Otherwise show the project ID as a placeholder until the project loads
        // This ensures we always have content for the animation
        return [{ label: 'Projects', path: '/projects' }, { label: projectMatch[1] }];
      }
    }

    // Check for jam session routes (work item review sessions)
    if (location.pathname.startsWith('/jam-sessions/') || location.pathname.startsWith('/work-items/') && location.pathname.includes('/jam')) {
      const workItemMatch = location.pathname.match(/^\/work-items\/([^\/]+)\/jam$/);
      if (workItemMatch) {
        const workItem = workItems.find((w) => w.id === workItemMatch[1]);
        if (workItem) {
          return `Review Session: ${workItem.title}`;
        }
      }
      // Regular jam sessions keep their name
      return location.pathname.startsWith('/jam-sessions/') ? 'Jam session' : 'Review session';
    }

    // Default: no header content
    return null;
  };

  return (
    <div
      className={`h-screen flex ${backgroundEffectEnabled ? '' : styles.mainBg} ${styles.fontFamily} relative overflow-hidden`}
    >
      {/* Background pattern when enabled */}
      {backgroundEffectEnabled && <BackgroundPattern />}
      {/* Sidebar */}
      <aside className={`w-64 ${styles.sidebarBg} ${styles.sidebarBorder} border-r relative flex flex-col`}>
        <div className="p-6">
          <h1 className={`text-2xl font-bold ${styles.sidebarText}`}>Claude Flow</h1>
        </div>

        <nav className="px-4 pb-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                block px-4 py-3 mb-1 ${styles.borderRadius} transition-all duration-200
                ${
                  isActive(item.path)
                    ? styles.sidebarActive
                    : `${styles.sidebarText} ${styles.sidebarHover}`
                }
              `}
            >
              {item.label}
            </Link>
          ))}

          <div className={`mt-6 pt-6 ${styles.sidebarBorder} border-t`}>
            <Link
              to="/daily-report"
              className={`
                block px-4 py-3 text-center font-medium
                ${styles.primaryButton} ${styles.primaryButtonText} 
                ${styles.primaryButtonHover} ${styles.buttonRadius}
                transition-colors duration-200
              `}
            >
              Daily report
            </Link>
          </div>

          <div className={`mt-4 pt-4 ${styles.sidebarBorder} border-t`}>
            <Link
              to="/debug-claude"
              className={`
                block px-4 py-3 ${styles.borderRadius} transition-all duration-200
                ${
                  isActive('/debug-claude')
                    ? styles.sidebarActive
                    : `${styles.sidebarText} ${styles.sidebarHover}`
                }
              `}
            >
              Debug Claude
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header
          className={`${styles.contentBg} ${styles.contentBorder} border-b px-4 py-4 relative flex-shrink-0 flex items-center justify-between z-10`}
        >
          <div className="flex-1 flex items-center gap-3">
            {/* Back button */}
            {shouldShowBackButton() && (
              <IconButton
                onClick={() => navigate(-1)}
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
                aria-label="Go back"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </IconButton>
            )}

            {/* Title and subtitle */}
            <div className="flex-1 flex items-center min-w-0">
              {(() => {
                const content = getHeaderContent();
                const subtitle = getDefaultSubtitle();

                // Always render the AnimatedTransition container, even if content is null
                // This ensures smooth transitions when content changes from null to something

                // Create a unified transition key based on the route path
                // This ensures we get proper animations even when content is temporarily null
                const transitionKey = `${location.pathname}-${Array.isArray(content) ? 'breadcrumb' : (content || 'empty')}`;

                return (
                  <AnimatedTransition
                    transitionKey={transitionKey}
                    className="min-h-[3rem] w-full"
                    delay={50}
                    reverse={direction === 'backward'}
                    centered={false}
                  >
                    <div className="flex flex-col">
                      {content ? (
                        Array.isArray(content) ? (
                          <>
                            <Breadcrumb items={content} />
                            {subtitle && (
                              <div className={`text-sm ${styles.mutedText} mt-0.5 pr-4`}>
                                {subtitle}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>{content}</h2>
                            {subtitle && (
                              <div className={`text-sm ${styles.mutedText} mt-0.5 pr-4`}>
                                {subtitle}
                              </div>
                            )}
                          </>
                        )
                      ) : (
                        // Render an empty placeholder to maintain layout
                        <div className="h-7" />
                      )}
                    </div>
                  </AnimatedTransition>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {workspace.config && (
              <div className={`text-sm ${styles.mutedText}`}>{workspace.config.path}</div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`
                p-2 rounded-lg transition-colors
                ${styles.cardBg} hover:bg-neutral-200 dark:hover:bg-neutral-700
                ${styles.textColor}
                ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Refresh workspace data"
            >
              <svg
                className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <SettingsMenu />
            <AuthAvatar />
          </div>
        </header>

        <main className={`flex-1 ${styles.contentBg} relative flex flex-col overflow-hidden`}>
          <AnimatedOutletWrapper
            className="flex-1"
            delay={200}
          />
        </main>
      </div>
    </div>
  );
}
