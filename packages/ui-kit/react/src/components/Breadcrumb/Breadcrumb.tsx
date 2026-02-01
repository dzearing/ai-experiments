import type { ReactNode, AnchorHTMLAttributes } from 'react';
import styles from './Breadcrumb.module.css';

/**
 * Breadcrumb component - navigation path indicator
 *
 * Tokens used:
 * - --body-text, --body-text-soft
 * - --body-link
 */

export interface BreadcrumbItem {
  /** Item label */
  label: ReactNode;
  /** Item href (optional - not clickable if omitted) */
  href?: string;
}

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator between items */
  separator?: ReactNode;
  /** Custom link component for routing */
  linkComponent?: React.ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
  /** Additional className */
  className?: string;
}

const DefaultSeparator = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.separator}>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Breadcrumb({
  items,
  separator = <DefaultSeparator />,
  linkComponent: LinkComponent,
  className,
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`${styles.breadcrumb} ${className || ''}`}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Link = LinkComponent || 'a';

          return (
            <li key={index} className={styles.item}>
              {item.href && !isLast ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? styles.current : styles.text} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className={styles.separatorWrapper}>{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
Breadcrumb.displayName = 'Breadcrumb';
