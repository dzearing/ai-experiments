import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';

interface AnimatedTransitionProps {
  children: ReactNode;
  transitionKey: string;
  className?: string;
  delay?: number;
  distance?: number;
  reverse?: boolean;
  centered?: boolean;
}

interface AnimationItem {
  key: string;
  content: ReactNode;
  state: 'entering' | 'active' | 'exiting';
  timestamp: number;
}

export function AnimatedTransition({ 
  children, 
  transitionKey, 
  className = '',
  delay = 100,
  distance = 20,
  reverse = false,
  centered = true
}: AnimatedTransitionProps) {
  const [items, setItems] = useState<AnimationItem[]>([
    {
      key: transitionKey,
      content: children,
      state: 'active',
      timestamp: Date.now()
    }
  ]);
  
  const prevKeyRef = useRef(transitionKey);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    // Skip if key hasn't changed
    if (prevKeyRef.current === transitionKey) {
      // Update the content of the active item without animation
      setItems(current => 
        current.map(item => 
          item.state === 'active' 
            ? { ...item, content: children }
            : item
        )
      );
      return;
    }

    prevKeyRef.current = transitionKey;

    // Create unique key for this transition
    const newKey = `${transitionKey}-${Date.now()}`;

    // Mark all existing items as exiting
    setItems(current => {
      const exitingItems = current.map(item => ({
        ...item,
        state: 'exiting' as const
      }));

      // Add new item as entering
      const newItem: AnimationItem = {
        key: newKey,
        content: children,
        state: 'entering',
        timestamp: Date.now()
      };

      return [...exitingItems, newItem];
    });

    // Clear any existing timeout for this key
    const existingTimeout = timeoutsRef.current.get(newKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Transition new item to active after delay
    const activateTimeout = setTimeout(() => {
      setItems(current => 
        current.map(item => 
          item.key === newKey 
            ? { ...item, state: 'active' }
            : item
        )
      );
    }, delay);

    timeoutsRef.current.set(`${newKey}-activate`, activateTimeout);

    // Remove exiting items after animation completes
    const cleanupTimeout = setTimeout(() => {
      setItems(current => 
        current.filter(item => item.state !== 'exiting')
      );
      
      // Clean up timeout references
      timeoutsRef.current.delete(`${newKey}-activate`);
      timeoutsRef.current.delete(`${newKey}-cleanup`);
    }, 300 + delay); // 300ms for exit animation + delay

    timeoutsRef.current.set(`${newKey}-cleanup`, cleanupTimeout);

  }, [transitionKey, children, delay]);

  const containerClasses = centered 
    ? `relative flex items-center justify-center ${className}`
    : `relative ${className}`;
    
  const contentClasses = centered
    ? "absolute inset-0 flex items-center justify-center"
    : "absolute inset-0";

  const getTransform = (state: AnimationItem['state'], reverse: boolean) => {
    switch (state) {
      case 'entering':
        return `translateX(${reverse ? -distance : distance}px)`;
      case 'active':
        return 'translateX(0)';
      case 'exiting':
        return `translateX(${reverse ? distance : -distance}px)`;
    }
  };

  return (
    <div className={containerClasses}>
      {items.map((item) => (
        <div
          key={item.key}
          className={contentClasses}
          style={{
            opacity: item.state === 'active' ? 1 : 0,
            transform: getTransform(item.state, reverse),
            transition: `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
            pointerEvents: item.state === 'active' ? 'auto' : 'none'
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}