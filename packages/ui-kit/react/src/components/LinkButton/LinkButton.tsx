import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button/Button';

export type LinkButtonVariant = ButtonVariant;
export type LinkButtonSize = ButtonSize;

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** Button variant */
  variant?: LinkButtonVariant;
  /** Button size */
  size?: LinkButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before children */
  icon?: ReactNode;
  /** Icon to display after children */
  iconAfter?: ReactNode;
  /** Button content */
  children: ReactNode;
}

/**
 * LinkButton component - an anchor element styled as a button
 *
 * @deprecated Use `<Button as="a" href="...">` instead for consistency.
 * This component is kept for backward compatibility.
 */
export function LinkButton({
  variant,
  size,
  fullWidth,
  icon,
  iconAfter,
  children,
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Button
      as="a"
      href={href ?? '#'}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      icon={icon}
      iconAfter={iconAfter}
      {...props}
    >
      {children}
    </Button>
  );
}
