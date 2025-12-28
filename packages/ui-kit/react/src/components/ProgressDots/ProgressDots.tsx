import { type HTMLAttributes } from 'react';
import styles from './ProgressDots.module.css';

/**
 * ProgressDots - Visual indicator for multi-step progress
 *
 * Shows a series of dots representing steps in a flow. Completed steps
 * are filled, the current step has a ring highlight, and pending steps
 * are dimmed.
 *
 * Surfaces used:
 * - soft (pending dots)
 * - primary (completed and current dots)
 *
 * Tokens used:
 * - --soft-border (pending dot color)
 * - --primary-bg (completed/current dot color)
 * - --primary-bg-disabled (current dot ring)
 * - --space-1, --space-2 (gap between dots)
 * - --radius-full (dot shape)
 * - --duration-fast, --ease-default (transitions)
 */

export type ProgressDotsSize = 'sm' | 'md' | 'lg';

export interface ProgressDotsProps extends HTMLAttributes<HTMLDivElement> {
  /** Current step index (0-based) */
  current: number;
  /** Total number of steps */
  total: number;
  /** Size of the dots */
  size?: ProgressDotsSize;
  /** Accessible label for the progress indicator */
  'aria-label'?: string;
}

export function ProgressDots({
  current,
  total,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Progress',
  ...props
}: ProgressDotsProps) {
  const classNames = [styles.root, styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={ariaLabel}
      {...props}
    >
      {Array.from({ length: total }, (_, i) => {
        const isComplete = i < current;
        const isCurrent = i === current;

        const dotClassNames = [
          styles.dot,
          isComplete && styles.complete,
          isCurrent && styles.current,
        ]
          .filter(Boolean)
          .join(' ');

        return <div key={i} className={dotClassNames} />;
      })}
    </div>
  );
}

ProgressDots.displayName = 'ProgressDots';
