import React from 'react';
import styles from './Stack.module.css';
import cx from 'clsx';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction of the stack */
  direction?: 'vertical' | 'horizontal';
  /** Gap between items */
  gap?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  /** Alignment of items along the main axis */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Alignment of items along the cross axis */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  /** Whether the stack should wrap items */
  wrap?: boolean;
  /** HTML tag to render */
  as?: 'div' | 'section' | 'article' | 'nav' | 'aside' | 'header' | 'footer' | 'main';
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ 
    direction = 'vertical',
    gap = 'medium',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    as: Component = 'div',
    className,
    children,
    ...props 
  }, ref) => {
    const classes = cx(
      styles.root,
      styles[direction],
      styles[`gap-${gap}`],
      styles[`align-${align}`],
      styles[`justify-${justify}`],
      wrap && styles.wrap,
      className
    );

    return (
      <Component
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Stack.displayName = 'Stack';