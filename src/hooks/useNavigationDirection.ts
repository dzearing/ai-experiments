import { useEffect, useState } from 'react';

type NavigationDirection = 'forward' | 'backward';

// This hook detects browser back/forward button navigation
export function useNavigationDirection(): NavigationDirection {
  const [direction, setDirection] = useState<NavigationDirection>('forward');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Listen for popstate events (browser back/forward buttons)
    const handlePopState = () => {
      setDirection('backward');
      
      // Reset to forward after animations complete
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDirection('forward');
      }, 500);
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(timeoutId);
    };
  }, []);

  // Regular navigation (clicking links) is always forward
  // Only popstate events (back/forward buttons) trigger backward
  return direction;
}