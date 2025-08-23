import React, { ReactNode } from 'react';
import { Button } from '@claude-flow/ui-kit-react';
import { CloseIcon } from '@claude-flow/ui-kit-icons';
import styles from './ViewTemplate.module.css';

/**
 * Panel configuration for stackable side panels
 */
export interface Panel {
  /** Unique identifier for the panel */
  id: string;
  /** Panel title/label */
  title: string;
  /** React content to render in the panel */
  content: ReactNode;
  /** Optional width (CSS value) - defaults to 240px */
  width?: string;
  /** Optional sort order for stacking panels */
  order?: number;
  /** Whether panel can be dismissed */
  dismissable?: boolean;
  /** Callback when panel is dismissed */
  onDismiss?: () => void;
  /** Whether this panel is newly added (for animation) */
  isNew?: boolean;
}

/**
 * Props for the ViewTemplate component
 */
export interface ViewTemplateProps {
  /** Optional header content */
  header?: ReactNode;
  /** Array of panels to display on the left side */
  leftPanels?: Panel[];
  /** Array of panels to display on the right side */
  rightPanels?: Panel[];
  /** Main content area */
  mainContent?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Callback to add a left panel */
  onAddLeftPanel?: () => void;
  /** Callback to add a right panel */
  onAddRightPanel?: () => void;
  /** Whether we can add more left panels */
  canAddLeft?: boolean;
  /** Whether we can add more right panels */
  canAddRight?: boolean;
}

export const ViewTemplate: React.FC<ViewTemplateProps> = ({
  header,
  leftPanels = [],
  rightPanels = [],
  mainContent,
  footer,
  className = '',
  onAddLeftPanel,
  onAddRightPanel,
  canAddLeft = false,
  canAddRight = false
}) => {
  return (
    <div className={`${styles.viewTemplate} ${className}`}>
      {header && (
        <header className={styles.header}>
          {header}
        </header>
      )}
      
      <div className={styles.body}>
        {leftPanels.length > 0 && (
          <aside className={`${styles.panels} ${styles.panelsLeft}`}>
            {leftPanels
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((panel) => (
                <div
                  key={panel.id}
                  className={`${styles.panel} ${panel.isNew ? styles.panelNew : ''}`}
                  style={{ width: panel.width }}
                >
                  {panel.dismissable && (
                    <div className={styles.panelHeader}>
                      <h3 className={styles.panelTitle}>{panel.title}</h3>
                      <Button
                        variant="inline"
                        size="small"
                        className={styles.panelDismiss}
                        onClick={panel.onDismiss}
                        aria-label={`Close ${panel.title} panel`}
                      >
                        <CloseIcon />
                      </Button>
                    </div>
                  )}
                  <div className={styles.panelBody}>
                    {panel.content}
                  </div>
                </div>
              ))}
          </aside>
        )}
        
        <main className={styles.main}>
          {mainContent}
        </main>
        
        {rightPanels.length > 0 && (
          <aside className={`${styles.panels} ${styles.panelsRight}`}>
            {rightPanels
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((panel) => (
                <div
                  key={panel.id}
                  className={`${styles.panel} ${panel.isNew ? styles.panelNew : ''}`}
                  style={{ width: panel.width }}
                >
                  {panel.dismissable && (
                    <div className={styles.panelHeader}>
                      <h3 className={styles.panelTitle}>{panel.title}</h3>
                      <Button
                        variant="inline"
                        size="small"
                        className={styles.panelDismiss}
                        onClick={panel.onDismiss}
                        aria-label={`Close ${panel.title} panel`}
                      >
                        <CloseIcon />
                      </Button>
                    </div>
                  )}
                  <div className={styles.panelBody}>
                    {panel.content}
                  </div>
                </div>
              ))}
          </aside>
        )}
      </div>
      
      {footer && (
        <footer className={styles.footer}>
          {/* Left Add Panel Button */}
          {canAddLeft && onAddLeftPanel && (
            <Button
              variant="primary"
              onClick={onAddLeftPanel}
              aria-label="Add left panel"
            >
              Add left panel
            </Button>
          )}
          
          {/* Footer Content */}
          <div className={styles.footerContent}>
            {footer}
          </div>
          
          {/* Right Add Panel Button */}
          {canAddRight && onAddRightPanel && (
            <Button
              variant="primary"
              onClick={onAddRightPanel}
              aria-label="Add right panel"
            >
              Add right panel
            </Button>
          )}
        </footer>
      )}
    </div>
  );
};