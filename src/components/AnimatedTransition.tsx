import { useEffect, useState, useRef, ReactNode } from 'react';

interface AnimatedTransitionProps {
  children: ReactNode;
  transitionKey: string;
  className?: string;
  delay?: number;
  distance?: number;
  reverse?: boolean;
}

interface TransitionItem {
  key: string;
  element: ReactNode;
  state: 'entering' | 'active' | 'exiting';
  reverse: boolean;
}

export function AnimatedTransition({ 
  children, 
  transitionKey, 
  className = '',
  delay = 150,
  distance = 20,
  reverse = false
}: AnimatedTransitionProps) {
  const [items, setItems] = useState<TransitionItem[]>([
    { key: `${transitionKey}-init`, element: children, state: 'active', reverse: false }
  ]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);
  const hasNavigated = useRef(false);
  const prevKey = useRef(transitionKey);
  const transitionInProgress = useRef<string | null>(null);

  useEffect(() => {
    // Handle first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevKey.current = transitionKey;
      // Update the element on first render
      setItems(current => 
        current.map(item => ({ ...item, element: children }))
      );
      return;
    }
    
    // Skip if same key
    if (prevKey.current === transitionKey) {
      return;
    }
    
    // Check if already transitioning to this key
    if (transitionInProgress.current === transitionKey) {
      return;
    }
    
    // This is a real navigation
    hasNavigated.current = true;
    transitionInProgress.current = transitionKey;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    prevKey.current = transitionKey;
    const timestamp = Date.now();
    const newKey = `${transitionKey}-${timestamp}`;
    
    // Mark existing as exiting and add new as entering
    setItems(current => {
      // Filter out any stale entering items
      const activeItems = current.filter(item => item.state === 'active');
      
      // If we have active items, transition them
      if (activeItems.length > 0) {
        const exiting = activeItems.map(item => ({ ...item, state: 'exiting' as const }));
        return [...exiting, { key: newKey, element: children, state: 'entering', reverse }];
      }
      
      // Otherwise just add the new item
      return [{ key: newKey, element: children, state: 'entering', reverse }];
    });

    // Activate the entering item after the animation completes
    timeoutRef.current = setTimeout(() => {
      setItems(current => {
        // Find the entering item and activate it
        const updated = current.map(item => 
          item.key === newKey 
            ? { ...item, state: 'active' as const }
            : item
        );
        
        // Remove exiting items in the same update
        return updated.filter(item => item.state !== 'exiting');
      });
      
      transitionInProgress.current = null;
    }, delay + 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transitionKey]);

  return (
    <div className={`relative ${className}`}>
      {items.map((item) => {
        const isEntering = item.state === 'entering';
        const isActive = item.state === 'active';
        const isExiting = item.state === 'exiting';
        
        // Define styles based on state
        let style: React.CSSProperties = {
          position: 'absolute',
          inset: 0,
          pointerEvents: isActive ? 'auto' : 'none',
          zIndex: isActive || isEntering ? 2 : 1
        };

        if (isEntering) {
          // Initial state: invisible and offset
          style.opacity = 0;
          style.transform = `translateX(${item.reverse ? -distance : distance}px)`;
          style.animation = item.reverse 
            ? `slideInFromLeft 300ms ease-out ${delay}ms forwards`
            : `slideInFromRight 300ms ease-out ${delay}ms forwards`;
        } else if (isExiting) {
          style.animation = item.reverse 
            ? 'slideOutToRight 300ms ease-out forwards'
            : 'slideOutToLeft 300ms ease-out forwards';
        } else if (isActive) {
          style.opacity = 1;
          style.transform = 'translateX(0)';
        }
        
        return (
          <div key={item.key} style={style}>
            {isActive ? children : item.element}
          </div>
        );
      })}
    </div>
  );
}