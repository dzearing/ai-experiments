import React from 'react';
import styles from './Pulse.module.css';

export interface PulseProps {
  /** Pulse size */
  size?: 'small' | 'medium' | 'large';
  /** Pulse color variant */
  variant?: 'default' | 'primary' | 'success' | 'danger';
  /** Loading text */
  label?: string;
  /** Center in container */
  center?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  size = 'medium',
  variant = 'default',
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

  const pulseClasses = [
    styles.pulse,
    styles[size],
    styles[variant],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className={pulseClasses} role="status" aria-label={label || 'Loading'} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};