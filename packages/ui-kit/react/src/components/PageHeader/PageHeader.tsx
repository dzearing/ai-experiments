import type { ReactNode, AnchorHTMLAttributes } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import styles from './PageHeader.module.css';

/**
 * PageHeader component - page-level header with breadcrumbs and actions
 *
 * Tokens used:
 * - --base-fg, --base-fg-soft (text colors)
 * - --space-* (spacing)
 * - --text-* (font sizes)
 */

export interface PageHeaderProps {
  /** Page title - can be string or custom element */
  title: ReactNode;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Actions slot (buttons, menus) */
  actions?: ReactNode;
  /** Optional subtitle/description */
  description?: ReactNode;
  /** Custom link component for breadcrumb routing */
  linkComponent?: React.ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
  /** Additional className */
  className?: string;
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  description,
  linkComponent,
  className,
}: PageHeaderProps) {
  return (
    <header className={`${styles.pageHeader} ${className || ''}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs}
          linkComponent={linkComponent}
          className={styles.breadcrumbs}
        />
      )}
      <div className={styles.titleRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}

PageHeader.displayName = 'PageHeader';
