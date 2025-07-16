import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function ThemedLayout() {
  const location = useLocation();
  const { currentTheme } = useTheme();
  const styles = currentTheme.styles;
  
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/work-items', label: 'Work Items' },
    { path: '/personas', label: 'Personas' },
    { path: '/jam-sessions', label: 'Jam Sessions' },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className={`min-h-screen flex ${styles.mainBg} ${styles.fontFamily}`}>
      {/* Sidebar */}
      <aside className={`w-64 ${styles.sidebarBg} ${styles.sidebarBorder} border-r`}>
        <div className="p-6">
          <h1 className={`text-2xl font-bold ${styles.sidebarText}`}>
            Project Mgmt
          </h1>
        </div>
        
        <nav className="px-4 pb-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                block px-4 py-3 mb-1 ${styles.borderRadius} transition-colors
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
                ${styles.primaryButtonHover} ${styles.borderRadius}
                transition-colors
              `}
            >
              Daily Report
            </Link>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className={`${styles.contentBg} ${styles.contentBorder} border-b px-8 py-4`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>
              {navItems.find(item => isActive(item.path))?.label || 'Page'}
            </h2>
            <div className={`text-sm ${styles.mutedText}`}>
              Theme: {currentTheme.name}
            </div>
          </div>
        </header>
        
        <main className={`flex-1 p-8 ${styles.contentBg}`}>
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}