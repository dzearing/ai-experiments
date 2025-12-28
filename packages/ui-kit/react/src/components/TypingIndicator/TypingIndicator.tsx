import { type HTMLAttributes } from 'react';
import styles from './TypingIndicator.module.css';

/**
 * TypingIndicator - Bouncing dots animation for chat typing indicators
 *
 * Shows animated dots that bounce sequentially, commonly used to indicate
 * that someone is typing in a chat interface.
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
 * - --duration-normal (animation timing)
 */

export type TypingIndicatorSize = 'sm' | 'md' | 'lg';
export type TypingIndicatorVariant = 'default' | 'primary';

export interface TypingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the dots */
  size?: TypingIndicatorSize;
  /** Color variant */
  variant?: TypingIndicatorVariant;
  /** Number of dots (3-5) */
  count?: 3 | 4 | 5;
  /** Accessible label for screen readers */
  label?: string;
}

export function TypingIndicator({
  size = 'md',
  variant = 'default',
  count = 3,
  label = 'Typing',
  className,
  ...props
}: TypingIndicatorProps) {
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

TypingIndicator.displayName = 'TypingIndicator';
