import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';

export type ScrollLockState = 'locked' | 'unlocked';

export interface UseScrollLockOptions {
  /** Distance from bottom (in pixels) to consider "at bottom". Default: 50 */
  threshold?: number;
  /** Initial lock state. Default: 'locked' */
  initialState?: ScrollLockState;
  /**
   * Whether to automatically scroll to bottom when locked and content changes.
   * Set to false when consumer handles scrolling (e.g., virtualized lists).
   * Default: true
   */
  autoScrollWhenLocked?: boolean;
}

export interface UseScrollLockResult {
  /** Current scroll lock state */
  lockState: ScrollLockState;
  /** Ref that tracks lock state in real-time (use in callbacks/intervals) */
  lockStateRef: React.RefObject<ScrollLockState>;
  /** Programmatically scroll to bottom (only works when locked) */
  scrollToBottom: () => void;
  /** Manually set lock state */
  setLockState: (state: ScrollLockState) => void;
  /** Whether new content exists below current view (when unlocked) */
  hasNewContent: boolean;
  /** Mark that new content arrived (call when new messages arrive while unlocked) */
  markNewContent: () => void;
  /** Reset hasNewContent flag (e.g., when user clicks "jump to bottom") */
  clearNewContent: () => void;
  /** Call before programmatic scrolls to prevent them from being treated as user scrolls */
  markProgrammaticScroll: () => void;
}

/**
 * Hook to manage scroll lock behavior for chat panels.
 *
 * When locked (default):
 * - Auto-scrolls to bottom when content changes
 * - New messages stay visible
 *
 * When unlocked:
 * - User can scroll freely to read history
 * - Tracks whether new content exists below viewport
 * - Re-locks automatically when user scrolls back to bottom
 *
 * @param containerRef - Ref to the scrollable container element
 * @param options - Configuration options
 */
export function useScrollLock(
  containerRef: RefObject<HTMLElement | null>,
  options: UseScrollLockOptions = {}
): UseScrollLockResult {
  const { threshold = 50, initialState = 'locked', autoScrollWhenLocked = true } = options;

  const [lockState, setLockStateInternal] = useState<ScrollLockState>(initialState);
  const [hasNewContent, setHasNewContent] = useState(false);

  // Ref that tracks lock state in real-time (for use in callbacks/intervals)
  const lockStateRef = useRef<ScrollLockState>(initialState);

  // Wrapper that updates both state and ref simultaneously
  const setLockState = useCallback((state: ScrollLockState) => {
    lockStateRef.current = state;
    setLockStateInternal(state);
  }, []);

  // Track whether current scroll is user-initiated
  const isUserScrolling = useRef(false);
  const userScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track scroll height to detect new content
  const lastScrollHeight = useRef<number>(0);

  /**
   * Check if scrolled near bottom (uses configurable threshold)
   */
  const isNearBottom = useCallback(() => {
    const container = containerRef.current;

    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom <= threshold;
  }, [containerRef, threshold]);

  /**
   * Check if scrolled to the very bottom (strict 5px threshold)
   * Used for re-locking after user scrolls back to bottom
   */
  const isAtVeryBottom = useCallback(() => {
    const container = containerRef.current;

    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Use a strict 5px threshold for re-locking
    return distanceFromBottom <= 5;
  }, [containerRef]);

  /**
   * Scroll container to bottom
   */
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    // Mark this as a programmatic scroll (not user-initiated)
    isUserScrolling.current = false;
    container.scrollTop = container.scrollHeight;
    setHasNewContent(false);
  }, [containerRef]);

  /**
   * Clear new content flag
   */
  const clearNewContent = useCallback(() => {
    setHasNewContent(false);
  }, []);

  /**
   * Mark that the next scroll is programmatic (not user-initiated)
   * Call this before any programmatic scroll like virtualizer.scrollToIndex()
   */
  const markProgrammaticScroll = useCallback(() => {
    isUserScrolling.current = false;
    if (userScrollTimeout.current) {
      clearTimeout(userScrollTimeout.current);
      userScrollTimeout.current = null;
    }
  }, []);

  /**
   * Handle scroll events
   */
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        // Only process if this was a user-initiated scroll
        if (isUserScrolling.current) {
          if (isAtVeryBottom()) {
            // User scrolled to bottom - re-lock immediately
            setLockState('locked');
            setHasNewContent(false);
          } else if (!isNearBottom()) {
            // User scrolled away from bottom - unlock
            setLockState('unlocked');
          }
        }

        ticking = false;
      });
    };

    // Detect user-initiated scroll events
    const markUserScroll = () => {
      isUserScrolling.current = true;

      // Reset flag after scroll settles
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }

      userScrollTimeout.current = setTimeout(() => {
        isUserScrolling.current = false;
        // Check for re-lock when scroll settles
        if (isAtVeryBottom()) {
          setLockState('locked');
          setHasNewContent(false);
        }
      }, 100);

      // Only unlock if not at bottom
      if (!isAtVeryBottom()) {
        setLockState('unlocked');
      }
    };

    // Listen for scroll
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Listen for user scroll interactions (wheel and touch only)
    // Note: mousedown was removed because it fires on ANY click (including tool expand),
    // causing false unlocks. Wheel and touchmove are sufficient for scroll detection.
    container.addEventListener('wheel', markUserScroll, { passive: true });
    container.addEventListener('touchmove', markUserScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', markUserScroll);
      container.removeEventListener('touchmove', markUserScroll);

      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
    };
  }, [containerRef, isNearBottom, isAtVeryBottom, setLockState]);

  /**
   * Auto-scroll when locked (if autoScrollWhenLocked is true)
   * Note: "new content" detection is NOT done here via scrollHeight because
   * scrollHeight changes for many reasons (tool expand, image load, etc.)
   * The consumer should call setHasNewContent when actual new messages arrive.
   */
  useEffect(() => {
    if (!autoScrollWhenLocked) return;

    const container = containerRef.current;
    if (!container) return;

    const currentScrollHeight = container.scrollHeight;

    // Only auto-scroll when locked, not detect new content
    if (currentScrollHeight > lastScrollHeight.current && lockState === 'locked') {
      scrollToBottom();
    }

    lastScrollHeight.current = currentScrollHeight;
  });

  /**
   * Mark that new content exists (call when new messages arrive while unlocked)
   */
  const markNewContent = useCallback(() => {
    if (lockStateRef.current === 'unlocked') {
      setHasNewContent(true);
    }
  }, []);

  return {
    lockState,
    lockStateRef,
    scrollToBottom,
    setLockState,
    hasNewContent,
    markNewContent,
    clearNewContent,
    markProgrammaticScroll,
  };
}
