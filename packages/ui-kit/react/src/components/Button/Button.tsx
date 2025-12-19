import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
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
export type ButtonShape = 'pill' | 'square' | 'round';

interface ButtonBaseProps {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Button shape: 'pill' (fully rounded ends) */
  shape?: ButtonShape;
  /** Icon to display before children */
  icon?: ReactNode;
  /** Icon to display after children */
  iconAfter?: ReactNode;
  /** Button content */
  children?: ReactNode;
  /** Additional class name */
  className?: string;
}

export interface ButtonAsButtonProps
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  /** Render as button (default) */
  as?: 'button';
  /** href for navigation - renders as anchor when provided */
  href?: never;
}

export interface ButtonAsAnchorProps
  extends ButtonBaseProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> {
  /** Render as anchor for navigation */
  as?: 'a';
  /** URL to navigate to - when inside Router, uses client-side navigation */
  href: string;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

export function Button(props: ButtonProps) {
  const {
    variant = 'default',
    size = 'md',
    fullWidth = false,
    shape,
    icon,
    iconAfter,
    className,
    children,
    ...rest
  } = props;

  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    shape && styles[shape],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.label}>{children}</span>}
      {iconAfter && <span className={styles.icon}>{iconAfter}</span>}
    </>
  );

  // Render as anchor if href is provided
  if ('href' in props && props.href) {
    const { as: _, href, ...anchorProps } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { as?: 'a'; href: string };
    return (
      <a className={classNames} href={href} {...anchorProps}>
        {content}
      </a>
    );
  }

  // Default: button element
  const { as: _, ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };
  return (
    <button className={classNames} {...buttonProps}>
      {content}
    </button>
  );
}
Button.displayName = 'Button';
