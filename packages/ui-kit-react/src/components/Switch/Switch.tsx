import React from 'react';
import styles from './Switch.module.css';

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
  /** Additional CSS class */
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  size = 'medium',
  error = false,
  helperText,
  labelRight = true,
  className,
  disabled,
  ...inputProps
}) => {
  const containerClasses = [
    styles.container,
    labelRight && styles.labelRight,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const switchClasses = [
    styles.switch,
    styles[size],
    error && styles.error,
  ]
    .filter(Boolean)
    .join(' ');

  const switchElement = (
    <label className={switchClasses}>
      <input
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
        <span className={styles.label}>{label}</span>
      )}
      {switchElement}
      {label && labelRight && (
        <span className={styles.label}>{label}</span>
      )}
      {helperText && (
        <div className={[
          styles.helperText,
          error && styles.errorText,
        ].filter(Boolean).join(' ')}>
          {helperText}
        </div>
      )}
    </div>
  );
};