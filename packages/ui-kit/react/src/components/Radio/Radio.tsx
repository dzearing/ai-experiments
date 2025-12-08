import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Radio.module.css';

/**
 * Radio component
 *
 * Surfaces used:
 * - inset (unchecked state)
 * - controlPrimary (checked state)
 *
 * Tokens used:
 * - --inset-bg, --inset-border
 * - --controlPrimary-bg
 * - --focus-ring
 */

export type RadioSize = 'sm' | 'md' | 'lg';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Radio size */
  size?: RadioSize;
  /** Label text */
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ size = 'md', label, className, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).slice(2, 9)}`;

    const wrapperClasses = [
      styles.wrapper,
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label className={wrapperClasses} htmlFor={radioId}>
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={styles.input}
          {...props}
        />
        <span className={styles.radio}>
          <span className={styles.dot} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
