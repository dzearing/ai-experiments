import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

type NavigationDirection = 'forward' | 'backward';

// This hook detects browser back/forward button navigation
export function useNavigationDirection(): NavigationDirection {
  const [direction, setDirection] = useState<NavigationDirection>('forward');
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyStack = useRef<string[]>([]);
  const currentIndex = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const path = location.pathname;
    
    if (navigationType === 'POP') {
      // Browser back/forward navigation
      const stack = historyStack.current;
      const prevIndex = currentIndex.current;
      
      // Find where we are in the history
      let newIndex = stack.lastIndexOf(path);
      
      if (newIndex === -1) {
        // Path not in history, treat as forward
        setDirection('forward');
        stack.push(path);
        currentIndex.current = stack.length - 1;
      } else if (newIndex < prevIndex) {
        // We went back
        setDirection('backward');
        currentIndex.current = newIndex;
      } else {
        // We went forward
        setDirection('forward');
        currentIndex.current = newIndex;
      }
    } else {
      // Regular navigation (PUSH or REPLACE)
      setDirection('forward');
      
      if (navigationType === 'PUSH') {
        // Trim any forward history and add new entry
        const stack = historyStack.current.slice(0, currentIndex.current + 1);
        stack.push(path);
        historyStack.current = stack;
        currentIndex.current = stack.length - 1;
      }
    }

    // Reset to forward after animation completes
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDirection('forward');
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location, navigationType]);

  return direction;
}