import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

export function ThemedLayoutV2() {
  const location = useLocation();
  const { currentStyles, backgroundEffectEnabled } = useTheme();
  const { workspace, reloadWorkspace } = useWorkspace();
  const { projects, workItems } = useApp();
  const { headerTitle, headerContent } = useLayout();
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
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label || null;

  // Determine what to show in the header
  const getHeaderContent = () => {
    // If headerContent is set by a page component, use it
    if (headerContent !== null) {
      return headerContent;
    }

    // If headerTitle is set by a page component, use it
    if (headerTitle) {
      return headerTitle;
    }

    // Pages that should not show header text (they have their own headers)
    const pagesWithOwnHeaders = ['/work-items', '/agents', '/projects', '/jam-sessions', '/'];
    if (pagesWithOwnHeaders.includes(location.pathname)) {
      return null;
    }

    // Otherwise, use the default logic
    if (
      project &&
      (location.pathname.includes('/workitems/new') ||
        (location.pathname.includes('/work-items/') && location.pathname.includes('/edit')))
    ) {
      return project.name;
    }
    if (location.pathname === '/work-items/new') {
      return 'Create work item';
    }

    // For routes like /agents/new, don't show anything
    if (!currentLabel) {
      return null;
    }

    return currentLabel;
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
          className={`${styles.contentBg} ${styles.contentBorder} border-b px-4 py-4 relative flex-shrink-0 flex items-center justify-between`}
        >
          <div className="flex-1">
            {(() => {
              const content = getHeaderContent();
              if (!content) return null;

              // Check if content is an array (breadcrumbs)
              if (Array.isArray(content)) {
                // Create a stable key from breadcrumb content
                const breadcrumbKey = content.map((item) => item.label).join(' > ');
                return (
                  <AnimatedTransition
                    transitionKey={breadcrumbKey}
                    className="h-8"
                    delay={50}
                    reverse={direction === 'backward'}
                    centered={false}
                  >
                    <Breadcrumb items={content} />
                  </AnimatedTransition>
                );
              }

              // Otherwise it's a string
              return (
                <AnimatedTransition
                  transitionKey={content}
                  className="h-8"
                  delay={100}
                  reverse={direction === 'backward'}
                  centered={false}
                >
                  <h2 className={`text-xl font-semibold ${styles.headingColor}`}>{content}</h2>
                </AnimatedTransition>
              );
            })()}
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

        <main className={`flex-1 p-8 ${styles.contentBg} relative overflow-y-auto`}>
          <AnimatedOutletWrapper
            className={`${location.pathname.includes('/jam') ? '' : 'max-w-6xl mx-auto'} h-full`}
            delay={200}
          />
        </main>
      </div>
    </div>
  );
}
