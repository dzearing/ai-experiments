import { useEffect, useState, useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

interface OutletItem {
  key: string;
  element: React.ReactElement | null;
  state: 'entering' | 'active' | 'exiting';
}

export function AnimatedOutlet() {
  const location = useLocation();
  const currentOutlet = useOutlet();
  const [items, setItems] = useState<OutletItem[]>([
    { key: location.pathname, element: currentOutlet, state: 'active' }
  ]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Always animate on route change
    const newKey = `${location.pathname}-${Date.now()}`;
    
    // Mark existing as exiting and add new as entering
    setItems(current => {
      const exiting = current.map(item => ({ ...item, state: 'exiting' as const }));
      return [...exiting, { key: newKey, element: currentOutlet, state: 'entering' }];
    });

    // Immediately activate the entering item
    requestAnimationFrame(() => {
      setItems(current => 
        current.map(item => 
          item.key === newKey 
            ? { ...item, state: 'active' }
            : item
        )
      );
    });

    // Clean up exiting items after animation
    timeoutRef.current = setTimeout(() => {
      setItems(current => current.filter(item => item.state === 'active'));
    }, 450);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location.pathname]);

  return (
    <div className="relative w-full h-full">
      {items.map((item) => (
        <div
          key={item.key}
          className="absolute inset-0 transition-all duration-300 ease-out"
          style={{
            opacity: item.state === 'active' ? 1 : 0,
            transform: 
              item.state === 'active' 
                ? 'translateX(0)' 
                : item.state === 'entering'
                  ? 'translateX(20px)'
                  : 'translateX(-20px)',
            transitionDelay: item.state === 'entering' ? '200ms' : '0ms',
            pointerEvents: item.state === 'active' ? 'auto' : 'none',
            zIndex: item.state === 'active' ? 2 : 1
          }}
        >
          {item.element}
        </div>
      ))}
    </div>
  );
}