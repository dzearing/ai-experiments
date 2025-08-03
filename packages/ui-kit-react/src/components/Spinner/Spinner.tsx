import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** Spinner size */
  size?: 'small' | 'medium' | 'large';
  /** Loading text */
  label?: string;
  /** Center in container */
  center?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  label,
  center = false,
  className,
}) => {
  const containerClasses = [
    styles.container,
    center && styles.center,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerClasses = [
    styles.spinner,
    styles[size],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <svg 
        className={spinnerClasses} 
        viewBox="0 0 24 24" 
        role="status" 
        aria-label={label || 'Loading'}
      >
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
        />
        <circle
          className={styles.circle}
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
        />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};