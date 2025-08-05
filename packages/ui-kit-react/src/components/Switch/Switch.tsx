import React from 'react';
import styles from './Switch.module.css';
import cx from 'clsx';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Switch label */
  label?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Error state */
  error?: boolean;
  /** Helper text */
  helperText?: string;
  /** Show label on the right side */
  labelRight?: boolean;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>((
  {
    label,
    size = 'medium',
    error = false,
    helperText,
    labelRight = true,
    className,
    disabled,
    ...inputProps
  }, ref) => {
  const containerClasses = cx(
    styles.root,
    labelRight && styles.labelRight,
    disabled && styles.disabled,
    className
  );

  const switchClasses = cx(
    styles.switch,
    styles[size],
    error && styles.error
  );

  const switchElement = (
    <label className={switchClasses}>
      <input
        ref={ref}
        type="checkbox"
        className={styles.input}
        disabled={disabled}
        {...inputProps}
      />
      <span className={styles.slider}>
        <span className={styles.thumb} />
      </span>
    </label>
  );

  if (!label && !helperText) {
    return switchElement;
  }

  return (
    <div className={containerClasses}>
      {label && !labelRight && (
        <div className={styles.labelWrapper}>
          <span className={styles.label}>{label}</span>
          {helperText && (
            <div className={cx(
              styles.helperText,
              error && styles.errorText
            )}>
              {helperText}
            </div>
          )}
        </div>
      )}
      {switchElement}
      {label && labelRight && (
        <div className={styles.labelWrapper}>
          <span className={styles.label}>{label}</span>
          {helperText && (
            <div className={cx(
              styles.helperText,
              error && styles.errorText
            )}>
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';