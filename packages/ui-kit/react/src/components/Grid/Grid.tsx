import type { HTMLAttributes, ReactNode, CSSProperties } from 'react';
import styles from './Grid.module.css';

/**
 * Grid component - CSS Grid layout container
 *
 * Tokens used:
 * - --space-1, --space-2, --space-3, etc. (gap)
 */

export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns (or 'auto' for auto-fill) */
  columns?: number | 'auto';
  /** Minimum column width for auto columns */
  minColumnWidth?: string;
  /** Gap between items */
  gap?: GridGap;
  /** Align items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify items */
  justify?: 'start' | 'center' | 'end' | 'stretch';
  /** Grid content */
  children: ReactNode;
}

export function Grid({
  columns = 'auto',
  minColumnWidth = '200px',
  gap = 'md',
  align = 'stretch',
  justify = 'stretch',
  className,
  style,
  children,
  ...props
}: GridProps) {
  const classNames = [
    styles.grid,
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const gridStyle: CSSProperties = {
    ...style,
    gridTemplateColumns:
      columns === 'auto'
        ? `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`
        : `repeat(${columns}, 1fr)`,
  };

  return (
    <div className={classNames} style={gridStyle} {...props}>
      {children}
    </div>
  );
}
