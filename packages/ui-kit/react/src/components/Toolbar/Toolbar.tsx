import { type ReactNode, type HTMLAttributes } from 'react';
import styles from './Toolbar.module.css';

/**
 * Toolbar component - horizontal bar with tools and actions
 *
 * Surfaces used:
 * - panel (toolbar container)
 *
 * Tokens used:
 * - --panel-bg, --panel-border
 * - --space-* (spacing)
 */

export type ToolbarSize = 'sm' | 'md' | 'lg';
export type ToolbarVariant = 'default' | 'bordered' | 'floating';

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Toolbar items */
  children: ReactNode;
  /** Toolbar size */
  size?: ToolbarSize;
  /** Toolbar variant */
  variant?: ToolbarVariant;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Additional class name */
  className?: string;
}

export function Toolbar({
  children,
  size = 'md',
  variant = 'default',
  orientation = 'horizontal',
  className,
  ...props
}: ToolbarProps) {
  const classNames = [
    styles.toolbar,
    styles[size],
    styles[variant],
    styles[orientation],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="toolbar"
      aria-orientation={orientation}
      {...props}
    >
      {children}
    </div>
  );
}

// ToolbarGroup Component
export interface ToolbarGroupProps {
  /** Group items */
  children: ReactNode;
  /** Alignment within the toolbar */
  align?: 'start' | 'center' | 'end';
  /** Additional class name */
  className?: string;
}

export function ToolbarGroup({
  children,
  align = 'start',
  className,
}: ToolbarGroupProps) {
  const classNames = [
    styles.group,
    styles[`align-${align}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classNames}>{children}</div>;
}

// ToolbarDivider Component
export interface ToolbarDividerProps {
  /** Additional class name */
  className?: string;
}

export function ToolbarDivider({ className }: ToolbarDividerProps) {
  return <div className={`${styles.divider} ${className || ''}`} role="separator" />;
}

// ToolbarSpacer Component
export function ToolbarSpacer() {
  return <div className={styles.spacer} />;
}

// ButtonGroup Component (for connected buttons)
export interface ButtonGroupProps {
  /** Buttons to group */
  children: ReactNode;
  /** Button group variant */
  variant?: 'default' | 'outlined';
  /** Additional class name */
  className?: string;
}

export function ButtonGroup({
  children,
  variant = 'default',
  className,
}: ButtonGroupProps) {
  const classNames = [
    styles.buttonGroup,
    styles[`buttonGroup-${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classNames} role="group">{children}</div>;
}
