import type { AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './LinkButton.module.css';

export type LinkButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
export type LinkButtonSize = 'sm' | 'md' | 'lg';

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Button variant */
  variant?: LinkButtonVariant;
  /** Button size */
  size?: LinkButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * LinkButton component - an anchor element styled as a button
 *
 * Use this for navigation actions that should look like buttons.
 * For actual button actions, use the Button component.
 */
export function LinkButton({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: LinkButtonProps) {
  const classNames = [
    styles.linkButton,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a className={classNames} {...props}>
      {children}
    </a>
  );
}
