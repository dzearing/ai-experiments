import type { HTMLAttributes, ReactNode, ElementType } from 'react';
import styles from './Stack.module.css';

/**
 * Stack component - arranges children in a vertical or horizontal stack
 *
 * Tokens used:
 * - --space-1, --space-2, --space-3, etc. (gap)
 */

export type StackDirection = 'vertical' | 'horizontal';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** HTML element to render */
  as?: ElementType;
  /** Stack direction */
  direction?: StackDirection;
  /** Align items */
  align?: StackAlign;
  /** Justify content */
  justify?: StackJustify;
  /** Gap between items */
  gap?: StackGap;
  /** Wrap items */
  wrap?: boolean;
  /** Stack content */
  children: ReactNode;
}

export function Stack({
  as: Component = 'div',
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  const classNames = [
    styles.stack,
    styles[direction],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    styles[`gap-${gap}`],
    wrap && styles.wrap,
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
Stack.displayName = 'Stack';
