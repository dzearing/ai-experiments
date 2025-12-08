import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Panel.module.css';

/**
 * Panel component - a container with background and optional border
 *
 * Surfaces used:
 * - panel
 *
 * Tokens used:
 * - --panel-bg
 * - --panel-border
 * - --radius-md, --radius-lg
 * - --shadow-sm, --shadow-md
 */

export type PanelVariant = 'default' | 'elevated' | 'outlined';
export type PanelPadding = 'none' | 'sm' | 'md' | 'lg';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Panel variant */
  variant?: PanelVariant;
  /** Padding size */
  padding?: PanelPadding;
  /** Panel content */
  children: ReactNode;
}

export function Panel({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: PanelProps) {
  const classNames = [
    styles.panel,
    styles[variant],
    styles[`padding-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}
