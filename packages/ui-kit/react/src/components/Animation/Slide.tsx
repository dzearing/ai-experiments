import { type ReactNode, type CSSProperties, useState, useEffect } from 'react';
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
  // Track the animated state - starts false, transitions after a frame when isVisible changes
  const [animatedVisible, setAnimatedVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // When becoming visible: wait a frame for the hidden state to paint, then animate in
      const frameId = requestAnimationFrame(() => {
        setAnimatedVisible(true);
      });

      // Callback when enter animation completes
      const timerId = setTimeout(() => {
        onEnterComplete?.();
      }, duration);

      return () => {
        cancelAnimationFrame(frameId);
        clearTimeout(timerId);
      };
    } else {
      // When becoming hidden: animate out immediately
      setAnimatedVisible(false);

      // Callback when exit animation completes
      const timerId = setTimeout(() => {
        onExitComplete?.();
      }, duration);

      return () => {
        clearTimeout(timerId);
      };
    }
  }, [isVisible, duration, onEnterComplete, onExitComplete]);

  // Always render - just toggle between hidden/visible styles
  const animationStyle: CSSProperties = {
    ...style,
    // Always apply transition for smooth animation
    transition: `transform ${duration}ms var(--ease-default), opacity ${duration}ms var(--ease-default)`,
    // Transform: offset when hidden, zero when visible
    transform: animatedVisible ? 'translate(0, 0)' : getTransform(direction, distance),
    // Opacity: 0 when hidden (if fade enabled), 1 when visible
    opacity: fade ? (animatedVisible ? 1 : 0) : undefined,
    // Prevent interaction when hidden
    pointerEvents: animatedVisible ? 'auto' : 'none',
  };

  return (
    <div
      className={`${styles.slide} ${className || ''}`}
      style={animationStyle}
      aria-hidden={!animatedVisible}
    >
      {children}
    </div>
  );
}
Slide.displayName = 'Slide';

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
SlideIn.displayName = 'SlideIn';
