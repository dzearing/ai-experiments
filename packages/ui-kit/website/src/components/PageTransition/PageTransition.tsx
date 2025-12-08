import { useRef, useLayoutEffect, useState, type ReactElement } from 'react';
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import styles from './PageTransition.module.css';

interface PageTransitionProps {
  duration?: number;
}

type Direction = 'forward' | 'back';

interface Layer {
  key: string;
  state: 'entering' | 'exiting' | 'idle';
  direction: Direction;
}

/**
 * FrozenOutlet component that captures the outlet once and never updates.
 * This is the key to making page transitions work - each layer gets its own
 * frozen outlet that doesn't change when the route changes.
 *
 * Based on Ryan Florence's recommendation for React Router v6 animations.
 * See: https://github.com/remix-run/react-router/discussions/8008
 */
function FrozenOutlet() {
  // Get the current outlet - this will be captured by useState below
  const outlet = useOutlet();
  // useState without a function initializer - the initial value is captured once
  // and never updates, even when the route changes and outlet would return different content
  const [frozenOutlet] = useState(outlet);
  return frozenOutlet;
}

/**
 * PageTransition component for animating between route changes.
 *
 * Both old and new pages animate simultaneously:
 * - Forward navigation (clicking links, browser forward): old slides left, new slides in from right
 * - Back navigation (browser back button): old slides right, new slides in from left
 *
 * Each layer renders its own FrozenOutlet which captures the outlet content
 * at mount time and never updates, allowing the old content to animate out
 * while new content animates in.
 */
export function PageTransition({
  duration = 300,
}: PageTransitionProps) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKey = location.key || location.pathname;

  const [layers, setLayers] = useState<Layer[]>(() => [{
    key: currentKey,
    state: 'idle',
    direction: 'forward'
  }]);

  const isInitialMount = useRef(true);
  const prevLocationKeyRef = useRef(currentKey);

  // Track history index to determine direction for POP navigations
  // React Router's 'POP' type is used for both back AND forward browser buttons
  // We need to track index ourselves to distinguish between them
  const historyIndexRef = useRef(0);
  const keyToIndexMap = useRef(new Map<string, number>());

  // Use useLayoutEffect to update layers synchronously before paint
  useLayoutEffect(() => {
    // Skip on initial mount - just register this location
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLocationKeyRef.current = currentKey;
      keyToIndexMap.current.set(currentKey, 0);
      return;
    }

    // If key hasn't changed, no transition needed
    if (currentKey === prevLocationKeyRef.current) {
      return;
    }

    // Determine direction based on navigation type and history tracking
    let direction: Direction;

    if (navigationType === 'PUSH') {
      // New navigation - always forward, increment index
      direction = 'forward';
      historyIndexRef.current += 1;
      keyToIndexMap.current.set(currentKey, historyIndexRef.current);
    } else if (navigationType === 'REPLACE') {
      // Replace - keep same index, same direction as forward
      direction = 'forward';
      keyToIndexMap.current.set(currentKey, historyIndexRef.current);
    } else {
      // POP - could be back or forward button
      // Check if we've seen this key before and compare indices
      const prevIndex = historyIndexRef.current;
      const newIndex = keyToIndexMap.current.get(currentKey);

      if (newIndex !== undefined && newIndex < prevIndex) {
        // Going to a previously visited location with lower index = back
        direction = 'back';
        historyIndexRef.current = newIndex;
      } else {
        // Going forward in history (or to a new location)
        direction = 'forward';
        if (newIndex !== undefined) {
          historyIndexRef.current = newIndex;
        } else {
          // New key we haven't seen - treat as forward
          historyIndexRef.current += 1;
          keyToIndexMap.current.set(currentKey, historyIndexRef.current);
        }
      }
    }

    // Mark existing layers as exiting and add new entering layer
    setLayers(prev => {
      const exitingLayers = prev.map(layer => ({
        ...layer,
        state: 'exiting' as const,
        direction
      }));
      return [...exitingLayers, {
        key: currentKey,
        state: 'entering' as const,
        direction
      }];
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // After animation completes, remove exiting layers and set entering to idle
    const timer = setTimeout(() => {
      setLayers(prev =>
        prev
          .filter(layer => layer.state !== 'exiting')
          .map(layer => ({ ...layer, state: 'idle' as const }))
      );
    }, duration);

    prevLocationKeyRef.current = currentKey;

    return () => clearTimeout(timer);
  }, [currentKey, duration, navigationType]);

  return (
    <div className={styles.container}>
      {layers.map((layer) => (
        <div
          key={layer.key}
          className={`${styles.layer} ${styles[layer.state]} ${styles[layer.direction]}`}
          style={{ '--transition-duration': `${duration}ms` } as React.CSSProperties}
        >
          {/* Each FrozenOutlet instance captures its outlet at mount time */}
          <FrozenOutlet />
        </div>
      ))}
    </div>
  );
}
