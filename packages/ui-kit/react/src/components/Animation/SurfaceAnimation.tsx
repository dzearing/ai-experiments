import { type ReactNode, type CSSProperties } from 'react';
import { useAnimatePresence } from './useAnimatePresence';
import styles from './SurfaceAnimation.module.css';

/**
 * Direction of animation relative to trigger element.
 * - 'down': Surface appears below trigger, slides from top
 * - 'up': Surface appears above trigger, slides from bottom
 * - 'right': Surface appears to right, slides from left
 * - 'left': Surface appears to left, slides from right
 * - 'center': Centered surface (dialogs), scales from center
 */
export type SurfaceDirection = 'up' | 'down' | 'left' | 'right' | 'center';

export interface SurfaceAnimationProps {
  /** Whether the surface should be visible */
  isVisible: boolean;
  /** Direction of animation (default: 'center') */
  direction?: SurfaceDirection;
  /** Content to animate */
  children: ReactNode;
  /** Animation duration in ms (default: 150) */
  duration?: number;
  /** Slide distance in px for directional animations (default: 8) */
  distance?: number;
  /** Scale factor for center animation (default: 0.95) */
  scale?: number;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/**
 * SurfaceAnimation - Consistent enter/exit animations for raised surfaces
 *
 * Provides two animation modes:
 * - Directional (menus, popovers, dropdowns): slide + fade from source direction
 * - Centered (dialogs, modals): scale + fade from center
 *
 * @example
 * ```tsx
 * // Menu-style animation (slides from direction)
 * <SurfaceAnimation isVisible={isOpen} direction="down">
 *   <MenuContent />
 * </SurfaceAnimation>
 *
 * // Dialog-style animation (scales from center)
 * <SurfaceAnimation isVisible={isOpen} direction="center">
 *   <DialogContent />
 * </SurfaceAnimation>
 * ```
 */
export function SurfaceAnimation({
  isVisible,
  direction = 'center',
  children,
  duration = 150,
  distance = 8,
  scale = 0.95,
  onExitComplete,
  className,
  style,
}: SurfaceAnimationProps) {
  const { shouldRender, state } = useAnimatePresence({
    isPresent: isVisible,
    enterDuration: duration,
    exitDuration: duration,
    onExited: onExitComplete,
  });

  if (!shouldRender) return null;

  const isExiting = state === 'exiting';

  // Capitalize direction for class name (e.g., 'down' -> 'Down')
  const directionClass = styles[`direction${direction.charAt(0).toUpperCase()}${direction.slice(1)}`];

  const animationStyle: CSSProperties = {
    ...style,
    '--surface-duration': `${duration}ms`,
    '--surface-distance': `${distance}px`,
    '--surface-scale': scale,
  } as CSSProperties;

  const classNames = [
    styles.surface,
    directionClass,
    isExiting && styles.exiting,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={animationStyle}
      data-state={state}
    >
      {children}
    </div>
  );
}

SurfaceAnimation.displayName = 'SurfaceAnimation';

/**
 * Utility to map position strings to animation directions.
 * Use this when integrating with positioned components like Menu, Popover, Dropdown.
 *
 * @example
 * const direction = getAnimationDirection('bottom-start'); // returns 'down'
 */
export function getAnimationDirection(position: string): SurfaceDirection {
  if (position.startsWith('bottom')) return 'down';
  if (position.startsWith('top')) return 'up';
  if (position.startsWith('right')) return 'right';
  if (position.startsWith('left')) return 'left';
  return 'down'; // default for positioned elements
}
