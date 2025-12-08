import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

/**
 * Button component
 *
 * Surfaces used:
 * - control (default variant)
 * - controlPrimary (variant="primary")
 * - controlDanger (variant="danger")
 * - controlSubtle (variant="ghost")
 * - controlDisabled (when disabled)
 *
 * Tokens used:
 * - --{surface}-bg, --{surface}-bg-hover, --{surface}-bg-pressed
 * - --{surface}-text
 * - --{surface}-border
 * - --space-2, --space-4 (padding)
 * - --radius-md
 * - --focus-ring, --focus-ring-offset, --focus-ring-width
 * - --duration-fast, --ease-default
 */

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before children */
  icon?: ReactNode;
  /** Icon to display after children */
  iconAfter?: ReactNode;
  /** Icon-only mode (square button, no text) */
  iconOnly?: boolean;
  /** Button content */
  children?: ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  icon,
  iconAfter,
  iconOnly = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {!iconOnly && children && <span className={styles.label}>{children}</span>}
      {iconAfter && <span className={styles.icon}>{iconAfter}</span>}
    </button>
  );
}
