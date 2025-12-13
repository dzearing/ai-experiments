import { type ReactNode, type CSSProperties } from 'react';
import { useAnimatePresence, type AnimationState } from './useAnimatePresence';
import styles from './Animation.module.css';

/**
 * Transition component - flexible wrapper for custom enter/exit animations
 *
 * Surfaces used: None (wrapper component)
 *
 * Tokens used:
 * - --duration-normal (default duration)
 * - --ease-default (default easing)
 */

export interface TransitionProps {
  /** Whether the content should be visible */
  isVisible: boolean;
  /** Content to animate */
  children: ReactNode;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Callback when enter animation completes */
  onEnterComplete?: () => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
  /** Additional class name */
  className?: string;
  /** CSS class to apply when entering */
  enterClassName?: string;
  /** CSS class to apply when entered (stable) */
  enteredClassName?: string;
  /** CSS class to apply when exiting */
  exitClassName?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Inline styles when entering */
  enterStyle?: CSSProperties;
  /** Inline styles when entered (stable) */
  enteredStyle?: CSSProperties;
  /** Inline styles when exiting */
  exitStyle?: CSSProperties;
}

export function Transition({
  isVisible,
  children,
  duration = 200,
  onEnterComplete,
  onExitComplete,
  className,
  enterClassName,
  enteredClassName,
  exitClassName,
  style,
  enterStyle,
  enteredStyle,
  exitStyle,
}: TransitionProps) {
  const { shouldRender, state } = useAnimatePresence({
    isPresent: isVisible,
    enterDuration: duration,
    exitDuration: duration,
    onEntered: onEnterComplete,
    onExited: onExitComplete,
  });

  if (!shouldRender) return null;

  const getStateClassName = (animationState: AnimationState): string => {
    switch (animationState) {
      case 'entering':
        return enterClassName || '';
      case 'entered':
        return enteredClassName || enterClassName || '';
      case 'exiting':
        return exitClassName || '';
      case 'exited':
        return exitClassName || '';
    }
  };

  const getStateStyle = (animationState: AnimationState): CSSProperties => {
    switch (animationState) {
      case 'entering':
        return enterStyle || {};
      case 'entered':
        return enteredStyle || enterStyle || {};
      case 'exiting':
        return exitStyle || {};
      case 'exited':
        return exitStyle || {};
    }
  };

  const combinedClassName = [
    styles.transition,
    className,
    getStateClassName(state),
    styles[state],
  ]
    .filter(Boolean)
    .join(' ');

  const combinedStyle: CSSProperties = {
    ...style,
    ...getStateStyle(state),
  };

  return (
    <div className={combinedClassName} style={combinedStyle} data-state={state}>
      {children}
    </div>
  );
}
Transition.displayName = 'Transition';

/**
 * AnimatePresence component - wrapper for managing mount/unmount animations
 * Keeps children in DOM during exit animations
 */
export interface AnimatePresenceProps {
  /** Whether children should be visible/mounted */
  isPresent: boolean;
  /** Content to animate */
  children: ReactNode;
  /** Exit animation duration in ms (default: 200) */
  exitDuration?: number;
  /** Callback when exit animation completes and children are unmounted */
  onExitComplete?: () => void;
}

export function AnimatePresence({
  isPresent,
  children,
  exitDuration = 200,
  onExitComplete,
}: AnimatePresenceProps) {
  const { shouldRender } = useAnimatePresence({
    isPresent,
    exitDuration,
    onExited: onExitComplete,
  });

  if (!shouldRender) return null;

  return <>{children}</>;
}
AnimatePresence.displayName = 'AnimatePresence';
