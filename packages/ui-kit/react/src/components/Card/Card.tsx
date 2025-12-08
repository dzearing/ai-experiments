import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

/**
 * Card component
 *
 * Surfaces used:
 * - card (default)
 *
 * Tokens used:
 * - --card-bg, --card-text, --card-text-soft, --card-text-hard
 * - --card-border, --card-shadow
 * - --space-4, --space-6 (padding)
 * - --radius-lg
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Card content */
  children: ReactNode;
}

export function Card({
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const classNames = [styles.card, styles[padding], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`${styles.title} ${className || ''}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`${styles.description} ${className || ''}`} {...props}>
      {children}
    </p>
  );
}
