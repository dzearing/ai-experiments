import { useRef, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import styles from './PageTransition.module.css';

export type TransitionDirection = 'forward' | 'back';

export interface PageTransitionProps {
  /** The content to display - typically the current route's page component */
  children: ReactNode;
  /**
   * A unique key that triggers transitions when changed.
   * Typically use location.key from react-router (not just pathname) for proper uniqueness.
   */
  transitionKey: string;
  /**
   * Optional history index for automatic direction detection.
   * When provided, the component will automatically determine direction based on
   * whether the index increased (forward) or decreased (back).
   * This takes precedence over the `direction` prop.
   */
  historyIndex?: number;
  /**
   * Direction of the transition animation.
   * - 'forward': Old page slides left, new page enters from right (default)
   * - 'back': Old page slides right, new page enters from left
   *
   * Note: This is ignored if `historyIndex` is provided.
   */
  direction?: TransitionDirection;
  /** Duration of the transition in ms (default: 300) */
  duration?: number;
  /** Whether to scroll to top after transition starts (default: true) */
  scrollToTop?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Callback fired when transition starts */
  onTransitionStart?: () => void;
  /** Callback fired when transition completes */
  onTransitionEnd?: () => void;
}

interface Layer {
  key: string;
  content: ReactNode;
  state: 'entering' | 'exiting' | 'idle';
  direction: TransitionDirection;
}

/**
 * PageTransition component for animating between page changes.
 *
 * Both old and new pages animate simultaneously:
 * - Forward: Old page slides left, new page enters from right
 * - Back: Old page slides right, new page enters from left
 *
 * IMPORTANT: This component stores children in state to "freeze" the exiting content.
 * This works well for static content but may not work correctly with React Router's
 * `<Outlet />` which always renders the current route. For React Router apps,
 * consider using the specialized PageTransition from the website package.
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 * import { PageTransition } from '@ui-kit/react';
 *
 * function App() {
 *   const [page, setPage] = useState({ key: 'home', content: <HomePage /> });
 *   const [historyIndex, setHistoryIndex] = useState(0);
 *
 *   const navigate = (key: string, content: ReactNode, isBack = false) => {
 *     setHistoryIndex(prev => isBack ? prev - 1 : prev + 1);
 *     setPage({ key, content });
 *   };
 *
 *   return (
 *     <PageTransition transitionKey={page.key} historyIndex={historyIndex}>
 *       {page.content}
 *     </PageTransition>
 *   );
 * }
 * ```
 */
export function PageTransition({
  children,
  transitionKey,
  historyIndex,
  direction: directionProp = 'forward',
  duration = 300,
  scrollToTop = true,
  className,
  onTransitionStart,
  onTransitionEnd,
}: PageTransitionProps) {
  // Keep track of layers for crossfade effect
  const [layers, setLayers] = useState<Layer[]>([
    { key: transitionKey, content: children, state: 'idle', direction: 'forward' }
  ]);

  const isInitialMount = useRef(true);
  const prevKeyRef = useRef(transitionKey);
  const prevHistoryIndexRef = useRef(historyIndex ?? 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Use useLayoutEffect to update layers synchronously before paint
  useLayoutEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevKeyRef.current = transitionKey;
      prevHistoryIndexRef.current = historyIndex ?? 0;
      return;
    }

    // If key hasn't changed, just update content in place
    if (transitionKey === prevKeyRef.current) {
      setLayers(prev => prev.map(layer =>
        layer.key === transitionKey ? { ...layer, content: children } : layer
      ));
      return;
    }

    // Determine direction - historyIndex takes precedence over direction prop
    let direction: TransitionDirection;
    if (historyIndex !== undefined) {
      direction = historyIndex > prevHistoryIndexRef.current ? 'forward' : 'back';
      prevHistoryIndexRef.current = historyIndex;
    } else {
      direction = directionProp;
    }

    // Key changed - create new entering layer and mark existing as exiting
    onTransitionStart?.();

    setLayers(prev => {
      const exitingLayers = prev.map(layer => ({
        ...layer,
        state: 'exiting' as const,
        direction
      }));
      return [...exitingLayers, {
        key: transitionKey,
        content: children,
        state: 'entering' as const,
        direction
      }];
    });

    // Scroll to top
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // After animation, remove exiting layers
    timerRef.current = setTimeout(() => {
      setLayers(prev =>
        prev
          .filter(layer => layer.state !== 'exiting')
          .map(layer => ({ ...layer, state: 'idle' as const }))
      );
      onTransitionEnd?.();
    }, duration);

    prevKeyRef.current = transitionKey;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [transitionKey, children, historyIndex, directionProp, duration, scrollToTop, onTransitionStart, onTransitionEnd]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {layers.map((layer) => (
        <div
          key={layer.key}
          className={`${styles.layer} ${styles[layer.state]} ${styles[layer.direction]}`}
          style={{ '--transition-duration': `${duration}ms` } as React.CSSProperties}
        >
          {layer.content}
        </div>
      ))}
    </div>
  );
}
PageTransition.displayName = 'PageTransition';
