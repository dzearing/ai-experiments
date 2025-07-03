import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { BackgroundPattern } from './BackgroundPatternOptimized';
import { AnimatedTransition } from './AnimatedTransition';
import { AnimatedOutletWrapper } from './AnimatedOutletWrapper';
import { useNavigationDirection } from '../hooks/useNavigationDirection';
import { Toggle } from './ui/Toggle';

export function ThemedLayoutV2() {
  const location = useLocation();
  const { currentStyles, backgroundEffectEnabled } = useTheme();
  const styles = currentStyles;
  const direction = useNavigationDirection();
  const [mockMode, setMockMode] = useState(() => {
    const saved = localStorage.getItem('mockMode');
    return saved ? JSON.parse(saved) : true;
  });

  
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/work-items', label: 'Work Items' },
    { path: '/personas', label: 'Personas' },
    { path: '/jam-sessions', label: 'Jam Sessions' },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  const currentLabel = navItems.find(item => item.path === location.pathname)?.label || 'Page';
  
  return (
    <div className={`h-screen flex ${backgroundEffectEnabled ? '' : styles.mainBg} ${styles.fontFamily} relative overflow-hidden`}>
      {/* Background pattern when enabled */}
      {backgroundEffectEnabled && <BackgroundPattern />}
      {/* Sidebar */}
      <aside className={`w-64 ${styles.sidebarBg} ${styles.sidebarBorder} border-r relative z-10`}>
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
              Daily Report
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
          
          <div className={`mt-4 pt-4 ${styles.sidebarBorder} border-t`}>
            <div className="px-4">
              <Toggle
                checked={mockMode}
                onChange={(newValue) => {
                  setMockMode(newValue);
                  localStorage.setItem('mockMode', JSON.stringify(newValue));
                  window.dispatchEvent(new CustomEvent('mockModeChanged', { detail: newValue }));
                }}
                label="Mock Mode"
                className="justify-between w-full"
              />
              {mockMode && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Using mock responses</span>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className={`${styles.contentBg} ${styles.contentBorder} border-b px-8 py-4 relative flex-shrink-0`}>
          <AnimatedTransition 
            transitionKey={location.pathname}
            className="h-8"
            delay={100}
            reverse={direction === 'backward'}
          >
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>
              {currentLabel}
            </h2>
          </AnimatedTransition>
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