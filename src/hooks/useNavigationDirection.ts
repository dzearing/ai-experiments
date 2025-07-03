import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type NavigationDirection = 'forward' | 'backward';

// This hook detects browser back/forward button navigation
export function useNavigationDirection(): NavigationDirection {
  const [direction, setDirection] = useState<NavigationDirection>('forward');
  const location = useLocation();
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const currentPath = location.pathname;
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Check if we're going back or forward
    const existingIndex = history.indexOf(currentPath);
    
    if (existingIndex !== -1 && existingIndex < currentIndex) {
      // We're going backward
      setDirection('backward');
      historyIndexRef.current = existingIndex;
    } else if (existingIndex !== -1 && existingIndex > currentIndex) {
      // We're going forward (through history)
      setDirection('forward');
      historyIndexRef.current = existingIndex;
    } else {
      // New navigation (not in history)
      setDirection('forward');
      // Trim history after current index and add new path
      historyRef.current = [...history.slice(0, currentIndex + 1), currentPath];
      historyIndexRef.current = historyRef.current.length - 1;
    }

    // Reset to forward after animations complete
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setDirection('forward');
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  return direction;
}