import React from 'react';
import styles from './Spinner.module.css';
import cx from 'clsx';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: 'small' | 'medium' | 'large';
  /** Loading text */
  label?: string;
  /** Center in container */
  center?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  label,
  center = false,
  className,
  ...props
}) => {
  const containerClasses = cx(
    styles.root,
    center && styles.center,
    className
  );

  const spinnerClasses = cx(
    styles.spinner,
    styles[size]
  );

  return (
    <div className={containerClasses} {...props}>
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