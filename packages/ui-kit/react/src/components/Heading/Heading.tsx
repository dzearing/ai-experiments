import { type ReactNode } from 'react';
import styles from './Heading.module.css';

/**
 * Heading component - semantic heading element
 *
 * Tokens used:
 * - --body-text
 * - --text-* sizes, --weight-*
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps {
  /** Heading content */
  children: ReactNode;
  /** Semantic heading level (h1-h6) */
  level?: HeadingLevel;
  /** Visual size (can differ from level) */
  size?: HeadingLevel;
  /** Additional class name */
  className?: string;
}

export function Heading({
  children,
  level = 2,
  size,
  className = '',
}: HeadingProps) {
  const Component = `h${level}` as const;
  const visualSize = size || level;

  return (
    <Component className={`${styles.heading} ${styles[`h${visualSize}`]} ${className}`}>
      {children}
    </Component>
  );
}
