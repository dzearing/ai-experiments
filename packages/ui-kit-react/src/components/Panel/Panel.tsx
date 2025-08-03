import React from 'react';
import styles from './Panel.module.css';

export interface PanelProps {
  /** Panel title */
  title?: React.ReactNode;
  /** Panel actions (shown in header) */
  actions?: React.ReactNode;
  /** Panel footer content */
  footer?: React.ReactNode;
  /** Padding size */
  padding?: 'none' | 'small' | 'medium' | 'large';
  /** Show border */
  bordered?: boolean;
  /** Collapsible panel */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Collapse change handler */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Panel content */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  actions,
  footer,
  padding = 'medium',
  bordered = true,
  collapsible = false,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  children,
  className,
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(!internalCollapsed);
    }
    onCollapsedChange?.(!isCollapsed);
  };

  const panelClasses = [
    styles.panel,
    bordered && styles.bordered,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClasses = [
    styles.content,
    styles[`padding-${padding}`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={panelClasses}>
      {(title || actions || collapsible) && (
        <div className={styles.header}>
          {collapsible && (
            <button
              type="button"
              className={styles.collapseButton}
              onClick={handleToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <svg
                className={[styles.collapseIcon, isCollapsed && styles.collapsed].filter(Boolean).join(' ')}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {title && (
            <div className={styles.title}>{title}</div>
          )}
          {actions && (
            <div className={styles.actions}>{actions}</div>
          )}
        </div>
      )}
      
      {!isCollapsed && (
        <div className={contentClasses}>
          {children}
        </div>
      )}
      
      {footer && !isCollapsed && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
};