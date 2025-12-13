import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';

/**
 * IconButton component
 *
 * A square button designed for icon-only use cases.
 * Wrapper around Button with iconOnly mode enabled.
 *
 * Surfaces used:
 * - control (default variant)
 * - controlPrimary (variant="primary")
 * - controlDanger (variant="danger")
 * - controlSubtle (variant="ghost")
 * - controlDisabled (when disabled)
 */

export type IconButtonVariant = ButtonVariant;
export type IconButtonSize = ButtonSize;

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The icon to display */
  icon: ReactNode;
  /** Button variant */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
  /** Accessible label for the button (required for accessibility) */
  'aria-label': string;
}

export function IconButton({
  icon,
  variant = 'default',
  size = 'md',
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      iconOnly
      {...props}
    />
  );
}
IconButton.displayName = 'IconButton';
