import { type ReactNode, type CSSProperties, useEffect, useRef, useState } from 'react';
import styles from './ShimmerText.module.css';

export interface ShimmerTextProps {
  /** The text content to display with shimmer effect */
  children: ReactNode;
  /** Whether the shimmer animation is active */
  isActive?: boolean;
  /** Duration range for transitions in ms [min, max] */
  durationRange?: [number, number];
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/**
 * ShimmerText component
 *
 * Displays text with an animated shimmer gradient effect.
 * The shimmer randomly roams left/right with smooth easing.
 *
 * Tokens used:
 * - --base-fg (base text color)
 * - --base-fg-primary (shimmer highlight color)
 */
export function ShimmerText({
  children,
  isActive = true,
  durationRange = [800, 1500],
  className = '',
  style,
}: ShimmerTextProps) {
  const [position, setPosition] = useState({ x1: 50, x2: 60 });
  const [duration, setDuration] = useState(1000);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isActive) return;

    const pickNewPosition = () => {
      // Random position between 0 and 100 for both gradients
      const newX1 = Math.random() * 100;
      // Secondary gradient offset slightly from primary
      const newX2 = Math.random() * 100;
      // Random duration within range
      const [minDuration, maxDuration] = durationRange;
      const newDuration = minDuration + Math.random() * (maxDuration - minDuration);

      setPosition({ x1: newX1, x2: newX2 });
      setDuration(newDuration);

      // Schedule next position change after transition completes
      timeoutRef.current = setTimeout(pickNewPosition, newDuration);
    };

    // Start the animation
    pickNewPosition();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, durationRange]);

  const combinedClassName = `${styles.shimmerText} ${isActive ? styles.active : ''} ${className}`.trim();

  return (
    <span
      className={combinedClassName}
      style={{
        ...style,
        '--shimmer-x1': `${position.x1}%`,
        '--shimmer-x2': `${position.x2}%`,
        '--shimmer-duration': `${duration}ms`,
      } as CSSProperties}
    >
      {children}
    </span>
  );
}

ShimmerText.displayName = 'ShimmerText';
