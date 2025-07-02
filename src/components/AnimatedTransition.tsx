import { useEffect, useState, useRef, ReactNode } from 'react';

interface AnimatedTransitionProps {
  children: ReactNode;
  transitionKey: string;
  className?: string;
  delay?: number;
  distance?: number;
}

interface TransitionItem {
  key: string;
  element: ReactNode;
  state: 'entering' | 'active' | 'exiting';
}

export function AnimatedTransition({ 
  children, 
  transitionKey, 
  className = '',
  delay = 150,
  distance = 20
}: AnimatedTransitionProps) {
  const [items, setItems] = useState<TransitionItem[]>([
    { key: `${transitionKey}-init`, element: children, state: 'active' }
  ]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);
  const prevKey = useRef(transitionKey);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
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

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const newKey = `${transitionKey}-${Date.now()}`;
    prevKey.current = transitionKey;
    
    // Mark existing as exiting and add new as entering
    setItems(current => {
      const exiting = current.map(item => ({ ...item, state: 'exiting' as const }));
      return [...exiting, { key: newKey, element: children, state: 'entering' }];
    });

    // Activate the entering item after the animation completes
    timeoutRef.current = setTimeout(() => {
      setItems(current => 
        current.map(item => 
          item.key === newKey 
            ? { ...item, state: 'active' }
            : item
        )
      );
      
      // Clean up exiting items
      setTimeout(() => {
        setItems(current => current.filter(item => item.state === 'active'));
      }, 50);
    }, delay + 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transitionKey, children]);

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
          style.transform = `translateX(${distance}px)`;
          style.animation = `slideInFromRight 300ms ease-out ${delay}ms forwards`;
        } else if (isExiting) {
          style.animation = 'slideOutToLeft 300ms ease-out forwards';
        } else if (isActive) {
          style.opacity = 1;
          style.transform = 'translateX(0)';
        }
        
        return (
          <div key={item.key} style={style}>
            {item.element}
          </div>
        );
      })}
    </div>
  );
}