import { type ReactNode } from 'react';
import styles from './Code.module.css';

/**
 * Code component - inline or block code display
 *
 * Tokens used:
 * - --code-background, --code-text
 * - --font-mono
 */

export interface CodeProps {
  /** Code content */
  children: ReactNode;
  /** Display as block (pre) or inline (code) */
  block?: boolean;
  /** Language for syntax highlighting hint */
  language?: string;
  /** Additional class name */
  className?: string;
}

export function Code({
  children,
  block = false,
  language,
  className = '',
}: CodeProps) {
  if (block) {
    return (
      <pre className={`${styles.pre} ${className}`} data-language={language}>
        <code className={styles.code}>{children}</code>
      </pre>
    );
  }

  return (
    <code className={`${styles.inline} ${className}`} data-language={language}>
      {children}
    </code>
  );
}
