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

interface TransitionState {
  current: ReactNode;
  prev: ReactNode | null;
  isTransitioning: boolean;
}

export function AnimatedTransition({ 
  children, 
  transitionKey, 
  className = '',
  delay = 100,
  reverse = false,
  centered = true
}: AnimatedTransitionProps) {
  const [state, setState] = useState<TransitionState>({
    current: children,
    prev: null,
    isTransitioning: false
  });
  
  const prevKeyRef = useRef(transitionKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      // Don't update children during transition
      if (!state.isTransitioning) {
        setState(prev => ({
          ...prev,
          current: children
        }));
      }
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    prevKeyRef.current = transitionKey;

    // Start transition - keep old content as current until transition completes
    setState(prev => ({
      current: prev.current,  // Keep displaying old content
      prev: prev.current,     // Also animate it out
      isTransitioning: true
    }));

    // After a short delay, bring in the new content
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        current: children  // Now update to new content
      }));
    }, 50);

    // Clean up after animations complete
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        prev: null,
        isTransitioning: false
      }));
    }, 200 + delay);

  }, [transitionKey, children, delay]);

  const { current, prev, isTransitioning } = state;

  const containerClasses = centered 
    ? `relative flex items-center justify-center ${className}`
    : `relative ${className}`;
    
  const contentClasses = centered
    ? "absolute inset-0 flex items-center justify-center"
    : "absolute inset-0";

  return (
    <div className={containerClasses}>
      {/* Previous content (exiting) */}
      {prev && isTransitioning && (
        <div
          className={contentClasses}
          style={{
            animation: reverse 
              ? 'slideOutToRight 200ms cubic-bezier(0, 0, 0.2, 1) forwards'
              : 'slideOutToLeft 200ms cubic-bezier(0, 0, 0.2, 1) forwards',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {prev}
        </div>
      )}
      
      {/* Current content (entering or static) */}
      <div
        className={isTransitioning ? contentClasses : centered ? "w-full" : "static"}
        style={{
          animation: isTransitioning
            ? reverse
              ? `slideInFromLeft 200ms cubic-bezier(0, 0, 0.2, 1) ${delay}ms forwards`
              : `slideInFromRight 200ms cubic-bezier(0, 0, 0.2, 1) ${delay}ms forwards`
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