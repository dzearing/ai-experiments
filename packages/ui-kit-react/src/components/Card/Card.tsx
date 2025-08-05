import React from 'react';
import styles from './Card.module.css';
import cx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card header content */
  header?: React.ReactNode;
  /** Card footer content */
  footer?: React.ReactNode;
  /** Card padding */
  padding?: 'none' | 'small' | 'medium' | 'large';
  /** Card variant */
  variant?: 'default' | 'bordered' | 'elevated';
  /** Card content */
  children: React.ReactNode;
  /** Click handler - makes card interactive */
  onClick?: React.MouseEventHandler<HTMLDivElement | HTMLButtonElement>;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    header,
    footer,
    padding = 'medium',
    variant = 'default',
    children,
    className,
    onClick,
    ...props
  }, ref) => {
    const cardClasses = cx(
      styles.root,
      styles[variant],
      styles[`padding-${padding}`],
      onClick && styles.clickable,
      className
    );

    if (onClick) {
      return (
        <button 
          ref={ref as any}
          className={cardClasses}
          onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
          type="button"
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {header && (
            <div className={styles.header}>
              {header}
            </div>
          )}
          
          <div className={styles.content}>
            {children}
          </div>
          
          {footer && (
            <div className={styles.footer}>
              {footer}
            </div>
          )}
        </button>
      );
    }

    return (
      <div 
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {header && (
          <div className={styles.header}>
            {header}
          </div>
        )}
        
        <div className={styles.content}>
          {children}
        </div>
        
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';