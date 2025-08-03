import React from 'react';
import styles from './Progress.module.css';

export interface ProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'outside';
  /** Indeterminate state (loading) */
  indeterminate?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'medium',
  variant = 'primary',
  showLabel = false,
  labelPosition = 'outside',
  indeterminate = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const label = `${Math.round(percentage)}%`;

  const containerClasses = [
    styles.container,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const trackClasses = [
    styles.track,
    styles[size],
    styles[variant],
  ]
    .filter(Boolean)
    .join(' ');

  const barClasses = [
    styles.bar,
    indeterminate && styles.indeterminate,
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = [
    styles.label,
    styles[`label-${labelPosition}`],
    styles[`label-${size}`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {showLabel && labelPosition === 'outside' && (
        <div className={labelClasses}>{label}</div>
      )}
      <div 
        className={trackClasses}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div 
          className={barClasses}
          style={!indeterminate ? { width: `${percentage}%` } : undefined}
        >
          {showLabel && labelPosition === 'inside' && percentage > 20 && (
            <span className={labelClasses}>{label}</span>
          )}
        </div>
      </div>
    </div>
  );
};