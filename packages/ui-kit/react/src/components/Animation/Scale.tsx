import { type ReactNode, type CSSProperties } from 'react';
import { useAnimatePresence, type AnimationState } from './useAnimatePresence';
import styles from './Animation.module.css';

/**
 * Scale component - animates scale for enter/exit
 *
 * Surfaces used: None (wrapper component)
 *
 * Tokens used:
 * - --duration-normal (default duration)
 * - --ease-default (default easing)
 */

export type ScaleOrigin =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface ScaleProps {
  /** Whether the content should be visible */
  isVisible: boolean;
  /** Content to animate */
  children: ReactNode;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Initial scale when entering (default: 0.95) */
  initialScale?: number;
  /** Transform origin (default: 'center') */
  origin?: ScaleOrigin;
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

function getTransformOrigin(origin: ScaleOrigin): string {
  switch (origin) {
    case 'center':
      return 'center center';
    case 'top':
      return 'center top';
    case 'bottom':
      return 'center bottom';
    case 'left':
      return 'left center';
    case 'right':
      return 'right center';
    case 'top-left':
      return 'left top';
    case 'top-right':
      return 'right top';
    case 'bottom-left':
      return 'left bottom';
    case 'bottom-right':
      return 'right bottom';
    default:
      return 'center center';
  }
}

export function Scale({
  isVisible,
  children,
  duration = 200,
  initialScale = 0.95,
  origin = 'center',
  fade = true,
  onEnterComplete,
  onExitComplete,
  className,
  style,
}: ScaleProps) {
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
          transform: 'scale(1)',
          opacity: fade ? 1 : undefined,
        };
      case 'exiting':
      case 'exited':
        return {
          transform: `scale(${initialScale})`,
          opacity: fade ? 0 : undefined,
        };
    }
  };

  const animationStyle: CSSProperties = {
    ...style,
    ...getStateStyle(state),
    transformOrigin: getTransformOrigin(origin),
    transition: `transform ${duration}ms var(--ease-default), opacity ${duration}ms var(--ease-default)`,
  };

  return (
    <div
      className={`${styles.scale} ${className || ''}`}
      style={animationStyle}
    >
      {children}
    </div>
  );
}

/**
 * ScaleIn component - one-way scale in animation on mount
 */
export interface ScaleInProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Initial scale (default: 0.95) */
  initialScale?: number;
  /** Transform origin (default: 'center') */
  origin?: ScaleOrigin;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export function ScaleIn({
  children,
  duration = 200,
  delay = 0,
  initialScale = 0.95,
  origin = 'center',
  className,
  style,
}: ScaleInProps) {
  const animationStyle: CSSProperties = {
    ...style,
    '--scale-initial': initialScale,
    transformOrigin: getTransformOrigin(origin),
    animation: `scaleIn ${duration}ms var(--ease-default) ${delay}ms both`,
  } as CSSProperties;

  return (
    <div className={`${styles.scaleIn} ${className || ''}`} style={animationStyle}>
      {children}
    </div>
  );
}
