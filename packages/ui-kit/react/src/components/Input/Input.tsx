import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

/**
 * Input component
 *
 * Surfaces used:
 * - inset
 *
 * Tokens used:
 * - --inset-bg, --inset-bg-hover, --inset-bg-focus
 * - --inset-text, --inset-text-soft
 * - --inset-border, --inset-border-focus
 * - --space-2, --space-3 (padding)
 * - --radius-md
 * - --focus-ring
 */

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size */
  size?: InputSize;
  /** Error state */
  error?: boolean;
  /** Full width input */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', error = false, fullWidth = false, className, ...props }, ref) => {
    const classNames = [
      styles.input,
      styles[size],
      error && styles.error,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} className={classNames} {...props} />;
  }
);

Input.displayName = 'Input';
