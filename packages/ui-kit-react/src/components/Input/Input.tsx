import React from 'react';
import styles from './Input.module.css';
import cx from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size */
  size?: 'small' | 'medium' | 'large';
  /** Error state */
  error?: boolean;
  /** Success state */
  success?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon/addon */
  leftIcon?: React.ReactNode;
  /** Right icon/addon */
  rightIcon?: React.ReactNode;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Label */
  label?: string;
  /** Required field */
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'medium',
      error = false,
      success = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      helperText,
      errorMessage,
      label,
      required,
      className,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = cx(
      styles.input,
      styles[size],
      error && styles.error,
      success && styles.success,
      fullWidth && styles.fullWidth,
      leftIcon && styles.hasLeftIcon,
      rightIcon && styles.hasRightIcon
    );

    const wrapperClasses = cx(
      styles.wrapper,
      fullWidth && styles.fullWidth
    );
    
    const rootClasses = cx(
      styles.root,
      fullWidth && styles.fullWidth,
      className
    );

    const inputElement = (
      <div className={wrapperClasses}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error}
          aria-describedby={
            errorMessage ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
    );

    // Always wrap in root div for consistent prop handling
    return (
      <div className={rootClasses} style={style} id={id}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        {inputElement}
        {errorMessage && (
          <span id={`${inputId}-error`} className={styles.errorText}>
            {errorMessage}
          </span>
        )}
        {helperText && !errorMessage && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';