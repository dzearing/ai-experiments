import { useEffect, useState, useRef, ReactNode } from 'react';

interface AnimatedTransitionProps {
  children: ReactNode;
  transitionKey: string;
  className?: string;
  delay?: number;
  distance?: number;
  reverse?: boolean;
}

interface TransitionState {
  current: ReactNode;
  prev: ReactNode | null;
  isTransitioning: boolean;
}

export function AnimatedTransition({ 
  children, 
  transitionKey, 
  className = '',
  delay = 150,
  distance = 20,
  reverse = false
}: AnimatedTransitionProps) {
  const [state, setState] = useState<TransitionState>({
    current: children,
    prev: null,
    isTransitioning: false
  });
  
  const prevKeyRef = useRef(transitionKey);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update current content if key hasn't changed
    if (prevKeyRef.current === transitionKey) {
      setState(prev => ({
        ...prev,
        current: children
      }));
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    prevKeyRef.current = transitionKey;

    // Start transition
    setState(prev => ({
      current: children,
      prev: prev.current,
      isTransitioning: true
    }));

    // Clean up after animations complete
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        prev: null,
        isTransitioning: false
      }));
    }, 300 + delay);

  }, [transitionKey, children, delay]);

  const { current, prev, isTransitioning } = state;

  return (
    <div className={`relative ${className}`}>
      {/* Previous content (exiting) */}
      {prev && isTransitioning && (
        <div
          className="absolute inset-0"
          style={{
            animation: reverse 
              ? 'slideOutToRight 300ms ease-out forwards'
              : 'slideOutToLeft 300ms ease-out forwards',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {prev}
        </div>
      )}
      
      {/* Current content (entering or static) */}
      <div
        className={isTransitioning ? "absolute inset-0" : ""}
        style={{
          animation: isTransitioning
            ? reverse
              ? `slideInFromLeft 300ms ease-out ${delay}ms forwards`
              : `slideInFromRight 300ms ease-out ${delay}ms forwards`
            : undefined,
          opacity: isTransitioning ? 0 : 1,
          pointerEvents: isTransitioning ? 'none' : 'auto',
          zIndex: 2
        }}
      >
        {current}
      </div>
    </div>
  );
}