import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';
import { Tooltip, type TooltipPosition } from '../Tooltip';
import styles from './IconButton.module.css';

/**
 * IconButton component
 *
 * A button designed for icon-only use cases with automatic tooltip.
 * Uses aria-label as the tooltip content.
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
export type IconButtonShape = 'square' | 'round';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The icon to display */
  icon: ReactNode;
  /** Button variant */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
  /** Button shape: 'square' (default) or 'round' (circular) */
  shape?: IconButtonShape;
  /** Accessible label for the button (required for accessibility, also used as tooltip) */
  'aria-label': string;
  /** Tooltip position */
  tooltipPosition?: TooltipPosition;
  /** Disable the tooltip (aria-label still applies) */
  hideTooltip?: boolean;
}

export function IconButton({
  icon,
  variant = 'default',
  size = 'md',
  shape = 'square',
  tooltipPosition = 'top',
  hideTooltip = false,
  className,
  ...props
}: IconButtonProps) {
  const classNames = [
    styles.iconButton,
    styles[shape],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const button = (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      className={classNames}
      {...props}
    />
  );

  // If tooltip is hidden or no aria-label, just return the button
  if (hideTooltip || !props['aria-label']) {
    return button;
  }

  return (
    <Tooltip content={props['aria-label']} position={tooltipPosition}>
      {button}
    </Tooltip>
  );
}
IconButton.displayName = 'IconButton';
