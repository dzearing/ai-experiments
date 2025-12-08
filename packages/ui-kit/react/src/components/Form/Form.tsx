import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './Form.module.css';

/**
 * Form component - container for form elements with consistent spacing
 */
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  /** Form content */
  children: ReactNode;
}

export function Form({ className, children, ...props }: FormProps) {
  const classNames = [styles.form, className].filter(Boolean).join(' ');

  return (
    <form className={classNames} {...props}>
      {children}
    </form>
  );
}

/**
 * FormField component - wrapper for individual form fields with label, hint, and error
 */
export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Field label */
  label?: string;
  /** Field is required */
  required?: boolean;
  /** Hint text below the input */
  hint?: string;
  /** Error message (replaces hint when present) */
  error?: string;
  /** HTML id for the input (used for label association) */
  htmlFor?: string;
  /** Field content (input, select, etc.) */
  children: ReactNode;
}

export function FormField({
  label,
  required,
  hint,
  error,
  htmlFor,
  className,
  children,
  ...props
}: FormFieldProps) {
  const classNames = [styles.field, error && styles.hasError, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.control}>{children}</div>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
}

/**
 * FormActions component - container for form buttons with proper alignment
 */
export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Alignment of actions */
  align?: 'start' | 'center' | 'end' | 'between';
  /** Action buttons */
  children: ReactNode;
}

export function FormActions({
  align = 'end',
  className,
  children,
  ...props
}: FormActionsProps) {
  const classNames = [styles.actions, styles[`align-${align}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

/**
 * FormRow component - horizontal layout for multiple fields in a row
 */
export interface FormRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Row content (FormField components) */
  children: ReactNode;
}

export function FormRow({ className, children, ...props }: FormRowProps) {
  const classNames = [styles.row, className].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}
