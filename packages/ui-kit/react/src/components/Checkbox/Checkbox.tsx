import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Checkbox.module.css';

/**
 * Checkbox component
 *
 * Surfaces used:
 * - inset (unchecked state)
 * - controlPrimary (checked state)
 *
 * Tokens used:
 * - --inset-bg, --inset-border
 * - --controlPrimary-bg, --controlPrimary-text
 * - --radius-sm
 * - --focus-ring
 */

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Checkbox size */
  size?: CheckboxSize;
  /** Label text (can also use children) */
  label?: string;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Label content (alternative to label prop) */
  children?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ size = 'md', label, indeterminate = false, className, id, children, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    const wrapperClasses = [
      styles.wrapper,
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label className={wrapperClasses} htmlFor={checkboxId}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={styles.input}
          data-indeterminate={indeterminate}
          {...props}
        />
        <span className={styles.checkbox}>
          <svg className={styles.checkmark} viewBox="0 0 12 12" fill="none">
            {indeterminate ? (
              <path d="M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </span>
        {(label || children) && <span className={styles.label}>{children || label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
