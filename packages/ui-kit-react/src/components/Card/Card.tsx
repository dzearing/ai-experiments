import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
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
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Click handler - makes card interactive */
  onClick?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    header,
    footer,
    padding = 'medium',
    variant = 'default',
    onClick,
    children,
    className,
    style,
  }, ref) => {
    const cardClasses = [
      styles.card,
      styles[variant],
      styles[`padding-${padding}`],
      onClick && styles.clickable,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const Component = onClick ? 'button' : 'div';

    return (
      <Component 
        ref={ref as any}
        className={cardClasses}
        onClick={onClick}
        type={onClick ? 'button' : undefined}
        style={style}
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
      </Component>
    );
  }
);

Card.displayName = 'Card';