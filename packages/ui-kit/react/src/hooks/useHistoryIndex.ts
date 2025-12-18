import { useRef } from 'react';

export type NavigationType = 'PUSH' | 'POP' | 'REPLACE';

export interface UseHistoryIndexOptions {
  /**
   * A unique key that changes on navigation.
   * With React Router, use `location.key`.
   */
  locationKey: string;
  /**
   * The type of navigation that occurred.
   * With React Router, use `useNavigationType()` which returns 'PUSH' | 'POP' | 'REPLACE'.
   */
  navigationType: NavigationType;
}

/**
 * Hook that tracks navigation history index for use with PageTransition.
 *
 * This hook correctly handles browser back/forward navigation by maintaining
 * a map of location keys to their history indices. This is necessary because
 * React Router's navigationType returns 'POP' for both back AND forward
 * navigation - it doesn't distinguish between them.
 *
 * - PUSH: Creates a new history entry with an incremented index
 * - POP: Looks up the existing index for the location key
 * - REPLACE: Updates the current entry's key without changing index
 *
 * @example
 * ```tsx
 * import { useLocation, useNavigationType } from 'react-router-dom';
 * import { PageTransition, useHistoryIndex } from '@ui-kit/react';
 *
 * function App() {
 *   const location = useLocation();
 *   const navigationType = useNavigationType();
 *   const historyIndex = useHistoryIndex({
 *     locationKey: location.key,
 *     navigationType,
 *   });
 *
 *   return (
 *     <PageTransition
 *       transitionKey={location.key}
 *       historyIndex={historyIndex}
 *     >
 *       <Routes location={location}>
 *         <Route path="/" element={<Home />} />
 *         <Route path="/about" element={<About />} />
 *       </Routes>
 *     </PageTransition>
 *   );
 * }
 * ```
 *
 * @param options - Configuration object with locationKey and navigationType
 * @returns The current history index for determining transition direction
 */
export function useHistoryIndex({
  locationKey,
  navigationType,
}: UseHistoryIndexOptions): number {
  // Map of location keys to their history indices
  const keyToIndexRef = useRef<Map<string, number>>(new Map());
  // Current position in our virtual history stack
  const currentIndexRef = useRef(0);
  // Previous location key to detect changes
  const prevLocationKeyRef = useRef<string | null>(null);

  // Initialize on first render
  if (prevLocationKeyRef.current === null) {
    keyToIndexRef.current.set(locationKey, 0);
    prevLocationKeyRef.current = locationKey;
    return 0;
  }

  // Compute history index synchronously during render
  if (locationKey !== prevLocationKeyRef.current) {
    if (navigationType === 'PUSH') {
      // New navigation: increment index and store mapping
      currentIndexRef.current += 1;
      keyToIndexRef.current.set(locationKey, currentIndexRef.current);
    } else if (navigationType === 'POP') {
      // Back/forward: look up the index for this key
      const storedIndex = keyToIndexRef.current.get(locationKey);
      if (storedIndex !== undefined) {
        currentIndexRef.current = storedIndex;
      }
      // If key not found (shouldn't happen), keep current index
    } else if (navigationType === 'REPLACE') {
      // Replace: update key mapping but keep same index
      keyToIndexRef.current.delete(prevLocationKeyRef.current);
      keyToIndexRef.current.set(locationKey, currentIndexRef.current);
    }
    prevLocationKeyRef.current = locationKey;
  }

  return currentIndexRef.current;
}
