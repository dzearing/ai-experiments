import { forwardRef, type InputHTMLAttributes, type ChangeEvent } from 'react';
import styles from './Switch.module.css';

/**
 * Switch component (toggle)
 *
 * Surfaces used:
 * - inset (off state)
 * - controlPrimary (on state)
 *
 * Tokens used:
 * - --inset-bg, --inset-border
 * - --controlPrimary-bg
 * - --focus-ring
 */

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  /** Switch size */
  size?: SwitchSize;
  /** Label text */
  label?: string;
  /** Callback when switch value changes - receives the new checked state */
  onChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ size = 'md', label, className, id, onChange, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;

    const wrapperClasses = [
      styles.wrapper,
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.checked);
    };

    return (
      <label className={wrapperClasses} htmlFor={switchId}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={switchId}
          className={styles.input}
          onChange={handleChange}
          {...props}
        />
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
