import { type ReactNode, type CSSProperties } from 'react';
import { useAnimatePresence, type AnimationState } from './useAnimatePresence';
import styles from './Animation.module.css';

/**
 * Slide component - animates position for enter/exit
 *
 * Surfaces used: None (wrapper component)
 *
 * Tokens used:
 * - --duration-normal (default duration)
 * - --ease-default (default easing)
 */

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export interface SlideProps {
  /** Whether the content should be visible */
  isVisible: boolean;
  /** Content to animate */
  children: ReactNode;
  /** Direction to slide from (default: 'up') */
  direction?: SlideDirection;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Distance to slide in pixels (default: 20) */
  distance?: number;
  /** Whether to also animate opacity (default: true) */
  fade?: boolean;
  /** Callback when enter animation completes */
  onEnterComplete?: () => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

function getTransform(direction: SlideDirection, distance: number): string {
  switch (direction) {
    case 'up':
      return `translateY(${distance}px)`;
    case 'down':
      return `translateY(-${distance}px)`;
    case 'left':
      return `translateX(${distance}px)`;
    case 'right':
      return `translateX(-${distance}px)`;
    default:
      return 'translateY(0)';
  }
}

export function Slide({
  isVisible,
  children,
  direction = 'up',
  duration = 200,
  distance = 20,
  fade = true,
  onEnterComplete,
  onExitComplete,
  className,
  style,
}: SlideProps) {
  const { shouldRender, state } = useAnimatePresence({
    isPresent: isVisible,
    enterDuration: duration,
    exitDuration: duration,
    onEntered: onEnterComplete,
    onExited: onExitComplete,
  });

  if (!shouldRender) return null;

  const getStateStyle = (animationState: AnimationState): CSSProperties => {
    switch (animationState) {
      case 'entering':
      case 'entered':
        return {
          transform: 'translate(0)',
          opacity: fade ? 1 : undefined,
        };
      case 'exiting':
      case 'exited':
        return {
          transform: getTransform(direction, distance),
          opacity: fade ? 0 : undefined,
        };
    }
  };

  const animationStyle: CSSProperties = {
    ...style,
    ...getStateStyle(state),
    transition: `transform ${duration}ms var(--ease-default), opacity ${duration}ms var(--ease-default)`,
  };

  return (
    <div
      className={`${styles.slide} ${className || ''}`}
      style={animationStyle}
    >
      {children}
    </div>
  );
}

/**
 * SlideIn component - one-way slide in animation on mount
 */
export interface SlideInProps {
  /** Content to animate */
  children: ReactNode;
  /** Direction to slide from (default: 'up') */
  direction?: SlideDirection;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Distance to slide in pixels (default: 20) */
  distance?: number;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export function SlideIn({
  children,
  direction = 'up',
  duration = 200,
  delay = 0,
  distance = 20,
  className,
  style,
}: SlideInProps) {
  const animationName = `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)}`;

  const animationStyle: CSSProperties = {
    ...style,
    '--slide-distance': `${distance}px`,
    animation: `${animationName} ${duration}ms var(--ease-default) ${delay}ms both`,
  } as CSSProperties;

  return (
    <div className={`${styles.slideIn} ${className || ''}`} style={animationStyle}>
      {children}
    </div>
  );
}
