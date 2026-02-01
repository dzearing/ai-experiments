import type { ReactNode } from 'react';
import styles from './ContentLayout.module.css';

/**
 * ContentLayout component - page wrapper with header, content, and footer slots
 *
 * Provides standard page structure with customizable max-width and padding.
 *
 * Tokens used:
 * - --space-* (spacing)
 *
 * Usage:
 * ```tsx
 * <ContentLayout
 *   header={<PageHeader title="Dashboard" />}
 *   footer={<Footer />}
 *   maxWidth="lg"
 *   padding="md"
 * >
 *   <YourContent />
 * </ContentLayout>
 * ```
 */

export type ContentLayoutMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ContentLayoutPadding = 'none' | 'sm' | 'md' | 'lg';

export interface ContentLayoutProps {
  /** Header content (typically PageHeader) */
  header?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Maximum content width */
  maxWidth?: ContentLayoutMaxWidth;
  /** Content padding */
  padding?: ContentLayoutPadding;
  /** Additional className */
  className?: string;
}

export function ContentLayout({
  header,
  children,
  footer,
  maxWidth = 'lg',
  padding = 'md',
  className,
}: ContentLayoutProps) {
  const contentClassName = [
    styles.content,
    styles[`maxWidth-${maxWidth}`],
    styles[`padding-${padding}`],
  ].join(' ');

  return (
    <div className={`${styles.layout} ${className || ''}`}>
      {header && <div className={styles.header}>{header}</div>}
      <main className={contentClassName}>
        {children}
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}

ContentLayout.displayName = 'ContentLayout';
