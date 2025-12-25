import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

/**
 * Card component
 *
 * Uses the tonal surface system for proper token inheritance:
 * - Default: `surface soft` - soft background with base tokens
 * - Selected: `surface primary` - primary background with remapped tokens
 *
 * Content inside the card should use --base-* tokens, which the surface
 * system will automatically remap to the appropriate colors.
 *
 * Tokens used:
 * - --base-bg, --base-fg, --base-border (via surface system)
 * - --space-3, --space-4, --space-6 (padding)
 * - --radius-lg, --shadow-sm
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Whether the card is in a selected state */
  selected?: boolean;
  /** Card content */
  children: ReactNode;
}

export function Card({
  padding = 'md',
  selected = false,
  className,
  children,
  ...props
}: CardProps) {
  const classNames = [
    styles.card,
    styles[padding],
    selected && styles.selected,
    // Apply surface system classes
    'surface',
    selected ? 'primary' : 'soft',
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
Card.displayName = 'Card';

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
CardTitle.displayName = 'CardTitle';

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
CardDescription.displayName = 'CardDescription';
