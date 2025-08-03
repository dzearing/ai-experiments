import React from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Checkbox size */
  size?: 'small' | 'medium' | 'large';
  /** Label text */
  label?: React.ReactNode;
  /** Error state */
  error?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'medium',
      label,
      error = false,
      indeterminate = false,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    const mergedRef = ref || checkboxRef;

    React.useEffect(() => {
      if (mergedRef && 'current' in mergedRef && mergedRef.current) {
        mergedRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, mergedRef]);

    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const containerClasses = [
      styles.container,
      styles[size],
      error && styles.error,
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label htmlFor={checkboxId} className={containerClasses}>
        <input
          ref={mergedRef}
          type="checkbox"
          id={checkboxId}
          className={styles.input}
          disabled={disabled}
          {...props}
        />
        <span className={styles.checkbox}>
          <svg
            className={styles.checkIcon}
            viewBox="0 0 12 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.indeterminateIcon} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';