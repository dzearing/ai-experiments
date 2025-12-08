import React from 'react';
import styles from './Progress.module.css';
import cx from 'clsx';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
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
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const label = `${Math.round(percentage)}%`;

  const containerClasses = cx(
    styles.root,
    className
  );

  const trackClasses = cx(
    styles.track,
    styles[size],
    styles[variant]
  );

  const barClasses = cx(
    styles.bar,
    indeterminate && styles.indeterminate
  );

  const labelClasses = cx(
    styles.label,
    styles[`label-${labelPosition}`],
    styles[`label-${size}`]
  );

  return (
    <div className={containerClasses} {...props}>
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