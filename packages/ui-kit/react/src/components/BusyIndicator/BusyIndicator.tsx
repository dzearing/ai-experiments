import { type HTMLAttributes } from 'react';
import styles from './BusyIndicator.module.css';

/**
 * BusyIndicator - Pulsing dots animation for AI processing states
 *
 * Shows animated dots that pulse/fade in sequence, commonly used to indicate
 * that an AI or system is processing or thinking.
 *
 * Surfaces used:
 * - body (default, uses page text color)
 * - primary (uses primary color)
 *
 * Tokens used:
 * - --primary-bg (primary variant color)
 * - --page-text-soft (default variant color)
 * - --space-1 (gap between dots)
 * - --radius-full (dot shape)
 * - --duration-slow (animation timing)
 */

export type BusyIndicatorSize = 'sm' | 'md' | 'lg';
export type BusyIndicatorVariant = 'default' | 'primary';

export interface BusyIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the dots */
  size?: BusyIndicatorSize;
  /** Color variant */
  variant?: BusyIndicatorVariant;
  /** Number of dots (3-5) */
  count?: 3 | 4 | 5;
  /** Accessible label for screen readers */
  label?: string;
}

export function BusyIndicator({
  size = 'md',
  variant = 'default',
  count = 3,
  label = 'Processing',
  className,
  ...props
}: BusyIndicatorProps) {
  const classNames = [styles.root, styles[size], styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="status"
      aria-label={label}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={styles.dot} />
      ))}
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}

BusyIndicator.displayName = 'BusyIndicator';
