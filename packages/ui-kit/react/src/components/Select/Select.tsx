import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

/**
 * Select component
 *
 * Surfaces used:
 * - inset
 *
 * Tokens used:
 * - --inset-bg, --inset-bg-hover, --inset-bg-focus
 * - --inset-text, --inset-text-soft
 * - --inset-border
 * - --focus-ring
 */

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select size */
  size?: SelectSize;
  /** Error state */
  error?: boolean;
  /** Full width select */
  fullWidth?: boolean;
  /** Placeholder option */
  placeholder?: string;
  /** Options array (alternative to children) */
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = 'md', error = false, fullWidth = false, placeholder, options, className, children, ...props }, ref) => {
    const classNames = [
      styles.select,
      styles[size],
      error && styles.error,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        <select ref={ref} className={classNames} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <span className={styles.arrow}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    );
  }
);

Select.displayName = 'Select';
