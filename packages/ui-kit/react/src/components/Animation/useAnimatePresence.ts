import { useState, useEffect, useCallback, useRef } from 'react';

export type AnimationState = 'entering' | 'entered' | 'exiting' | 'exited';

export interface UseAnimatePresenceOptions {
  /** Whether the element should be present */
  isPresent: boolean;
  /** Duration of enter animation in ms */
  enterDuration?: number;
  /** Duration of exit animation in ms */
  exitDuration?: number;
  /** Callback when enter animation starts */
  onEnter?: () => void;
  /** Callback when enter animation completes */
  onEntered?: () => void;
  /** Callback when exit animation starts */
  onExit?: () => void;
  /** Callback when exit animation completes */
  onExited?: () => void;
}

export interface UseAnimatePresenceReturn {
  /** Whether the element should be rendered in the DOM */
  shouldRender: boolean;
  /** Current animation state */
  state: AnimationState;
  /** Whether currently animating (entering or exiting) */
  isAnimating: boolean;
}

/**
 * Hook for managing mount/unmount animations.
 *
 * Keeps elements in the DOM during exit animations, allowing for
 * smooth transitions before removal.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const { shouldRender, state } = useAnimatePresence({
 *     isPresent: isOpen,
 *     exitDuration: 200,
 *   });
 *
 *   if (!shouldRender) return null;
 *
 *   return (
 *     <div className={`modal ${state}`}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useAnimatePresence({
  isPresent,
  enterDuration = 200,
  exitDuration = 200,
  onEnter,
  onEntered,
  onExit,
  onExited,
}: UseAnimatePresenceOptions): UseAnimatePresenceReturn {
  const [state, setState] = useState<AnimationState>(
    isPresent ? 'entered' : 'exited'
  );

  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPresentRef = useRef(isPresent);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Skip if presence hasn't changed
    if (isPresent === prevPresentRef.current) return;
    prevPresentRef.current = isPresent;

    // Clear any existing timers
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    if (isPresent) {
      // Start enter animation
      setState('entering');
      onEnter?.();

      enterTimerRef.current = setTimeout(() => {
        setState('entered');
        onEntered?.();
      }, enterDuration);
    } else {
      // Start exit animation
      setState('exiting');
      onExit?.();

      exitTimerRef.current = setTimeout(() => {
        setState('exited');
        onExited?.();
      }, exitDuration);
    }
  }, [isPresent, enterDuration, exitDuration, onEnter, onEntered, onExit, onExited]);

  const shouldRender = state !== 'exited';
  const isAnimating = state === 'entering' || state === 'exiting';

  return { shouldRender, state, isAnimating };
}

/**
 * Hook for manually controlling animation state.
 * Useful when you need programmatic control over animations.
 */
export function useAnimationState(initialState: AnimationState = 'exited') {
  const [state, setState] = useState<AnimationState>(initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const enter = useCallback((duration: number = 200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('entering');
    timerRef.current = setTimeout(() => {
      setState('entered');
    }, duration);
  }, []);

  const exit = useCallback((duration: number = 200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('exiting');
    timerRef.current = setTimeout(() => {
      setState('exited');
    }, duration);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('exited');
  }, []);

  return {
    state,
    isAnimating: state === 'entering' || state === 'exiting',
    shouldRender: state !== 'exited',
    enter,
    exit,
    reset,
  };
}
