import styles from './Progress.module.css';

/**
 * Progress component - visual progress indicator
 *
 * Tokens used:
 * - --controlSubtle-bg
 * - --controlPrimary-bg
 * - --status-success, --status-warning, --status-error
 */

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Progress variant */
  variant?: ProgressVariant;
  /** Progress size */
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label format */
  formatLabel?: (value: number, max: number) => string;
  /** Indeterminate loading state */
  indeterminate?: boolean;
  /** Accessible label */
  'aria-label'?: string;
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  formatLabel,
  indeterminate = false,
  'aria-label': ariaLabel,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const label = formatLabel ? formatLabel(value, max) : `${Math.round(percentage)}%`;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.track} ${styles[size]}`}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
      >
        <div
          className={`${styles.bar} ${styles[variant]} ${indeterminate ? styles.indeterminate : ''}`}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
      {showLabel && !indeterminate && <span className={styles.label}>{label}</span>}
    </div>
  );
}
Progress.displayName = 'Progress';
