import { type ReactNode, type CSSProperties } from 'react';
import { useAnimatePresence, type AnimationState } from './useAnimatePresence';
import styles from './Animation.module.css';

/**
 * Fade component - animates opacity for enter/exit
 *
 * Surfaces used: None (wrapper component)
 *
 * Tokens used:
 * - --duration-normal (default duration)
 * - --ease-default (default easing)
 */

export interface FadeProps {
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
  /** Inline styles */
  style?: CSSProperties;
}

const stateStyles: Record<AnimationState, CSSProperties> = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};

export function Fade({
  isVisible,
  children,
  duration = 200,
  onEnterComplete,
  onExitComplete,
  className,
  style,
}: FadeProps) {
  const { shouldRender, state } = useAnimatePresence({
    isPresent: isVisible,
    enterDuration: duration,
    exitDuration: duration,
    onEntered: onEnterComplete,
    onExited: onExitComplete,
  });

  if (!shouldRender) return null;

  const animationStyle: CSSProperties = {
    ...style,
    ...stateStyles[state],
    opacity: state === 'entering' ? 1 : state === 'exiting' ? 0 : stateStyles[state].opacity,
    transition: `opacity ${duration}ms var(--ease-default)`,
  };

  // Set initial opacity for entering state
  if (state === 'entering') {
    animationStyle.opacity = 1;
  }

  return (
    <div
      className={`${styles.fade} ${className || ''}`}
      style={animationStyle}
    >
      {children}
    </div>
  );
}

/**
 * FadeIn component - one-way fade in animation on mount
 */
export interface FadeInProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export function FadeIn({
  children,
  duration = 200,
  delay = 0,
  className,
  style,
}: FadeInProps) {
  const animationStyle: CSSProperties = {
    ...style,
    animation: `fadeIn ${duration}ms var(--ease-default) ${delay}ms both`,
  };

  return (
    <div className={`${styles.fadeIn} ${className || ''}`} style={animationStyle}>
      {children}
    </div>
  );
}
