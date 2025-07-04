import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useApp } from '../contexts/AppContext';
import { useLayout } from '../contexts/LayoutContext';
import { BackgroundPattern } from './BackgroundPatternOptimized';
import { AnimatedTransition } from './AnimatedTransition';
import { AnimatedOutletWrapper } from './AnimatedOutletWrapper';
import { useNavigationDirection } from '../hooks/useNavigationDirection';
import { SettingsMenu } from './SettingsMenu';
import { AuthAvatar } from './AuthAvatar';

export function ThemedLayoutV2() {
  const location = useLocation();
  const { currentStyles, backgroundEffectEnabled } = useTheme();
  const { workspace } = useWorkspace();
  const { projects, workItems } = useApp();
  const { headerTitle } = useLayout();
  const styles = currentStyles;
  const direction = useNavigationDirection();

  // Extract projectId from various routes
  const getProjectIdFromPath = () => {
    // Match /projects/:projectId/workitems/new
    const projectMatch = location.pathname.match(/^\/projects\/([^\/]+)\/workitems\/new$/);
    if (projectMatch) return projectMatch[1];
    
    // Match /work-items/:workItemId/edit
    const editMatch = location.pathname.match(/^\/work-items\/([^\/]+)\/edit$/);
    if (editMatch) {
      const workItem = workItems.find(w => w.id === editMatch[1]);
      return workItem?.projectId;
    }
    
    return null;
  };
  
  const projectId = getProjectIdFromPath();
  const project = projectId ? projects.find(p => p.id === projectId) : null;
  
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/work-items', label: 'Work items' },
    { path: '/personas', label: 'Personas' },
    { path: '/jam-sessions', label: 'Jam sessions' },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  const currentLabel = navItems.find(item => item.path === location.pathname)?.label || 'Page';
  
  // Determine what to show in the header
  const getHeaderContent = () => {
    // If headerTitle is set by a page component, use it
    if (headerTitle) {
      return headerTitle;
    }
    
    // Otherwise, use the default logic
    if (project && (location.pathname.includes('/workitems/new') || location.pathname.includes('/work-items/') && location.pathname.includes('/edit'))) {
      return project.name;
    }
    if (location.pathname === '/work-items/new') {
      return 'Create work item';
    }
    return currentLabel;
  };
  
  return (
    <div className={`h-screen flex ${backgroundEffectEnabled ? '' : styles.mainBg} ${styles.fontFamily} relative overflow-hidden`}>
      {/* Background pattern when enabled */}
      {backgroundEffectEnabled && <BackgroundPattern />}
      {/* Sidebar */}
      <aside className={`w-64 ${styles.sidebarBg} ${styles.sidebarBorder} border-r relative z-10`}>
        <div className="p-6">
          <h1 className={`text-2xl font-bold ${styles.sidebarText}`}>
            Claude Flow
          </h1>
        </div>
        
        <nav className="px-4 pb-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                block px-4 py-3 mb-1 ${styles.borderRadius} transition-all duration-200
                ${isActive(item.path) 
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
                ${isActive('/debug-claude') 
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
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className={`${styles.contentBg} ${styles.contentBorder} border-b px-8 py-4 relative flex-shrink-0 flex items-center justify-between`}>
          <AnimatedTransition 
            transitionKey={location.pathname}
            className="h-8 flex-1"
            delay={100}
            reverse={direction === 'backward'}
            centered={false}
          >
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>
              {getHeaderContent()}
            </h2>
          </AnimatedTransition>
          <div className="flex items-center gap-4">
            {workspace.config && (
              <div className={`text-sm ${styles.mutedText}`}>
                {workspace.config.path}
              </div>
            )}
            <AuthAvatar />
            <SettingsMenu />
          </div>
        </header>
        
        <main className={`flex-1 p-8 ${styles.contentBg} relative overflow-y-auto`}>
          <AnimatedOutletWrapper
            className="max-w-6xl mx-auto h-full"
            delay={200}
          />
        </main>
      </div>
    </div>
  );
}