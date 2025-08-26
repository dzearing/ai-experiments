import React from 'react';
import styles from './Button.module.css';
import { Spinner } from '../Spinner';
import cx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'neutral' | 'outline' | 'inline' | 'danger' | 'success';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Button shape */
  shape?: 'square' | 'pill' | 'circle';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'neutral',
      size = 'medium',
      shape,
      fullWidth = false,
      loading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cx(
      styles.root,
      styles[variant],
      styles[size],
      shape && styles[shape],
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner}>
            <Spinner size="small" />
          </span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';