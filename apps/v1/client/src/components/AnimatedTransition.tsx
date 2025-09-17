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
  centered = true,
}: AnimatedTransitionProps) {
  const [items, setItems] = useState<AnimationItem[]>([
    {
      key: transitionKey,
      content: children,
      state: 'active',
      timestamp: Date.now(),
    },
  ]);

  const prevKeyRef = useRef(transitionKey);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    // Skip if key hasn't changed
    if (prevKeyRef.current === transitionKey) {
      // Update the content of the active item without animation
      setItems((current) =>
        current.map((item) => (item.state === 'active' ? { ...item, content: children } : item))
      );
      return;
    }

    prevKeyRef.current = transitionKey;

    // Create unique key for this transition
    const newKey = `${transitionKey}-${Date.now()}`;

    // Clear all existing timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    // Set new items with proper states
    setItems((current) => {
      // Only keep items that are currently active or entering
      // This prevents stale exiting items from previous transitions
      const activeItems = current.filter((item) => item.state === 'active' || item.state === 'entering');

      // Mark current active/entering as exiting
      const exitingItems = activeItems.map((item) => ({ ...item, state: 'exiting' as const }));

      // Add new item as entering
      const newItem: AnimationItem = {
        key: newKey,
        content: children,
        state: 'entering',
        timestamp: Date.now(),
      };

      return [...exitingItems, newItem];
    });

    // Transition new item to active after delay
    const activateTimeout = setTimeout(() => {
      setItems((current) =>
        current.map((item) => (item.key === newKey ? { ...item, state: 'active' } : item))
      );
    }, delay);

    timeoutsRef.current.set(`${newKey}-activate`, activateTimeout);

    // Remove exiting items after animation completes
    const cleanupTimeout = setTimeout(() => {
      setItems((current) => current.filter((item) => item.state !== 'exiting'));
    }, 300); // Standard animation duration

    timeoutsRef.current.set(`${newKey}-cleanup`, cleanupTimeout);
  }, [transitionKey, children, delay]);

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

  // For non-centered content (like headers)
  if (!centered) {
    return (
      <div className={`relative overflow-hidden h-full ${className}`} style={{ minHeight: '3rem' }}>
        {items.map((item) => (
          <div
            key={item.key}
            className={item.state === 'active' ? '' : 'absolute top-0 left-0 right-0'}
            style={{
              opacity: item.state === 'active' ? 1 : 0,
              transform: getTransform(item.state, reverse),
              transition: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`,
              pointerEvents: item.state === 'active' ? 'auto' : 'none',
              height: '100%',
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    );
  }

  // For centered content, use absolute positioning
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {items.map((item) => (
        <div
          key={item.key}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: item.state === 'active' ? 1 : 0,
            transform: getTransform(item.state, reverse),
            transition: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`,
            pointerEvents: item.state === 'active' ? 'auto' : 'none',
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}