import React from 'react';
import styles from './DancingDots.module.css';

export interface DancingDotsProps {
  /** Dots size */
  size?: 'small' | 'medium' | 'large';
  /** Dots color variant */
  variant?: 'default' | 'primary' | 'success' | 'danger';
  /** Number of dots */
  count?: 3 | 4 | 5;
  /** Loading text */
  label?: string;
  /** Center in container */
  center?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const DancingDots: React.FC<DancingDotsProps> = ({
  size = 'medium',
  variant = 'default',
  count = 3,
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

  const dotsClasses = [
    styles.dots,
    styles[size],
    styles[variant],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className={dotsClasses} role="status" aria-label={label || 'Loading'}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={styles.dot} />
        ))}
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};