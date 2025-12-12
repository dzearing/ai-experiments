import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';
import styles from './Text.module.css';

/**
 * Text component - styled text element
 *
 * Tokens used:
 * - --body-text, --body-text-soft
 * - --text-* sizes
 */

export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextColor = 'default' | 'soft' | 'inherit';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Text content */
  children: ReactNode;
  /** HTML element to render */
  as?: ElementType;
  /** Text size */
  size?: TextSize;
  /** Font weight */
  weight?: TextWeight;
  /** Text color */
  color?: TextColor;
  /** Truncate text with ellipsis */
  truncate?: boolean;
}

export function Text({
  children,
  as: Component = 'span',
  size = 'base',
  weight = 'normal',
  color = 'default',
  truncate = false,
  className,
  ...props
}: TextProps) {
  const classNames = [
    styles.text,
    styles[`size-${size}`],
    styles[`weight-${weight}`],
    styles[color],
    truncate && styles.truncate,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
}
