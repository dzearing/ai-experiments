import { type ReactNode, type HTMLAttributes } from 'react';
import styles from './Heading.module.css';

/**
 * Heading component - semantic heading element
 *
 * Tokens used:
 * - --body-text
 * - --text-* sizes, --weight-*
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading content */
  children: ReactNode;
  /** Semantic heading level (h1-h6) */
  level?: HeadingLevel;
  /** Visual size (can differ from level) */
  size?: HeadingLevel;
}

export function Heading({
  children,
  level = 2,
  size,
  className,
  ...props
}: HeadingProps) {
  const Component = `h${level}` as const;
  const visualSize = size || level;

  const classNames = [styles.heading, styles[`h${visualSize}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
}
