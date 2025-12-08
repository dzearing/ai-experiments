import React from 'react';
import styles from './DancingDots.module.css';
import cx from 'clsx';

export interface DancingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
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
}

export const DancingDots: React.FC<DancingDotsProps> = ({
  size = 'medium',
  variant = 'default',
  count = 3,
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

  const dotsClasses = cx(
    styles.dots,
    styles[size],
    styles[variant]
  );

  return (
    <div className={containerClasses} {...props}>
      <div className={dotsClasses} role="status" aria-label={label || 'Loading'}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={styles.dot} />
        ))}
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};