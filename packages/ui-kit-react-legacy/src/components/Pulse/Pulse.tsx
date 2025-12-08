import React from 'react';
import styles from './Pulse.module.css';
import cx from 'clsx';

export interface PulseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pulse size */
  size?: 'small' | 'medium' | 'large';
  /** Pulse color variant */
  variant?: 'default' | 'primary' | 'success' | 'danger';
  /** Loading text */
  label?: string;
  /** Center in container */
  center?: boolean;
}

export const Pulse: React.FC<PulseProps> = ({
  size = 'medium',
  variant = 'default',
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

  const pulseClasses = cx(
    styles.pulse,
    styles[size],
    styles[variant]
  );

  return (
    <div className={containerClasses} {...props}>
      <div className={pulseClasses} role="status" aria-label={label || 'Loading'} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};