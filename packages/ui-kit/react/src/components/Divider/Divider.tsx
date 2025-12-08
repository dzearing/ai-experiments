import type { HTMLAttributes } from 'react';
import styles from './Divider.module.css';

/**
 * Divider component - a horizontal or vertical separator
 *
 * Tokens used:
 * - --panel-border (color)
 * - --space-2, --space-4 (margin)
 */

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Divider orientation */
  orientation?: DividerOrientation;
  /** Add margin around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export function Divider({
  orientation = 'horizontal',
  spacing = 'none',
  className,
  ...props
}: DividerProps) {
  const classNames = [
    styles.divider,
    styles[orientation],
    styles[`spacing-${spacing}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <hr className={classNames} {...props} />;
}
