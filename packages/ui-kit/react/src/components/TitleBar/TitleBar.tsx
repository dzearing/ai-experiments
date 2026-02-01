import type { ReactNode } from 'react';
import styles from './TitleBar.module.css';

/**
 * TitleBar component - app-level navigation bar with logo, title, tabs, and actions
 *
 * Tokens used:
 * - --soft-bg, --soft-border (surface)
 * - --base-fg, --base-fg-soft (text)
 * - --primary-bg (active tab indicator)
 * - --space-* (spacing)
 * - --z-sticky (z-index)
 */

export interface TitleBarTab {
  /** Tab identifier */
  value: string;
  /** Tab label */
  label: ReactNode;
  /** Tab icon (optional) */
  icon?: ReactNode;
}

export interface TitleBarProps {
  /** App logo or icon */
  logo?: ReactNode;
  /** App title */
  title?: ReactNode;
  /** Navigation tabs (e.g., Work/Web) */
  tabs?: TitleBarTab[];
  /** Currently active tab */
  activeTab?: string;
  /** Tab change callback */
  onTabChange?: (value: string) => void;
  /** Right-side actions (profile, settings) */
  actions?: ReactNode;
  /** Additional className */
  className?: string;
}

export function TitleBar({
  logo,
  title,
  tabs,
  activeTab,
  onTabChange,
  actions,
  className,
}: TitleBarProps) {
  return (
    <header role="banner" className={`${styles.titleBar} ${className || ''}`}>
      <div className={styles.leading}>
        {logo && <div className={styles.logo}>{logo}</div>}
        {title && <span className={styles.title}>{title}</span>}
      </div>

      {tabs && tabs.length > 0 && (
        <nav className={styles.tabs} role="tablist" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
              onClick={() => onTabChange?.(tab.value)}
            >
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {actions && <div className={styles.trailing}>{actions}</div>}
    </header>
  );
}

TitleBar.displayName = 'TitleBar';
