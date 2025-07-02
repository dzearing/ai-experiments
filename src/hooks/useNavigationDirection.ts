import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type NavigationDirection = 'forward' | 'backward';

export function useNavigationDirection() {
  const location = useLocation();
  const [direction, setDirection] = useState<NavigationDirection>('forward');
  const historyStack = useRef<string[]>([location.pathname]);
  const historyIndex = useRef(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentPath = location.pathname;
    const stack = historyStack.current;
    const currentIndex = historyIndex.current;
    
    // Find where this path exists in our history
    let foundIndex = -1;
    for (let i = 0; i < stack.length; i++) {
      if (stack[i] === currentPath) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex !== -1) {
      // Path exists in history
      if (foundIndex < currentIndex) {
        // Going backward
        setDirection('backward');
      } else if (foundIndex > currentIndex) {
        // Going forward in history
        setDirection('forward');
      }
      historyIndex.current = foundIndex;
    } else {
      // New path - truncate forward history and add new path
      stack.splice(currentIndex + 1);
      stack.push(currentPath);
      historyIndex.current = stack.length - 1;
      setDirection('forward');
    }
    
    // Keep stack size reasonable
    if (stack.length > 50) {
      stack.splice(0, 10);
      historyIndex.current = Math.max(0, historyIndex.current - 10);
    }
  }, [location.pathname]);

  return direction;
}