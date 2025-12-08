import React from 'react';
import { ChevronDownIcon } from '@claude-flow/ui-kit-icons';
import styles from './Panel.module.css';
import cx from 'clsx';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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
  ...props
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(!internalCollapsed);
    }
    onCollapsedChange?.(!isCollapsed);
  };

  const panelClasses = cx(
    styles.root,
    bordered && styles.bordered,
    className
  );

  const contentClasses = cx(
    styles.content,
    styles[`padding-${padding}`]
  );

  return (
    <div className={panelClasses} {...props}>
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
              <ChevronDownIcon 
                className={cx(styles.collapseIcon, isCollapsed && styles.collapsed)}
                size={16}
              />
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