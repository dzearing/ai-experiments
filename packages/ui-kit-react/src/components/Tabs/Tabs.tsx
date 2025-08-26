import React, { useState, useRef, useEffect } from 'react';
import styles from './Tabs.module.css';
import cx from 'clsx';

export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Whether tab can be closed */
  closable?: boolean;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Tab content */
  content?: React.ReactNode;
}

export interface TabsProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab id */
  activeTabId?: string;
  /** Callback when active tab changes */
  onTabChange?: (tabId: string) => void;
  /** Callback when tab is closed */
  onTabClose?: (tabId: string) => void;
  /** Optional toolbar content */
  toolbar?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Tab bar className */
  tabBarClassName?: string;
  /** Content className */
  contentClassName?: string;
  /** Tab size */
  size?: 'small' | 'medium' | 'large';
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      activeTabId,
      onTabChange,
      onTabClose,
      toolbar,
      className,
      tabBarClassName,
      contentClassName,
      size = 'medium',
    },
    ref
  ) => {
    const [internalActiveId, setInternalActiveId] = useState<string>(
      activeTabId || tabs[0]?.id || ''
    );
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeTabRef = useRef<HTMLButtonElement>(null);

    const currentActiveId = activeTabId !== undefined ? activeTabId : internalActiveId;
    const activeTab = tabs.find((tab) => tab.id === currentActiveId);

    useEffect(() => {
      if (activeTabId && activeTabId !== internalActiveId) {
        setInternalActiveId(activeTabId);
      }
    }, [activeTabId, internalActiveId]);

    // Scroll active tab into view when it changes
    useEffect(() => {
      if (activeTabRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const tab = activeTabRef.current;
        
        const containerRect = container.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        
        if (tabRect.left < containerRect.left) {
          container.scrollLeft -= containerRect.left - tabRect.left;
        } else if (tabRect.right > containerRect.right) {
          container.scrollLeft += tabRect.right - containerRect.right;
        }
      }
    }, [currentActiveId]);

    const handleTabClick = (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab && !tab.disabled) {
        setInternalActiveId(tabId);
        onTabChange?.(tabId);
      }
    };

    const handleTabClose = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      onTabClose?.(tabId);
      
      // If closing active tab, activate previous or next tab
      if (tabId === currentActiveId && tabs.length > 1) {
        const currentIndex = tabs.findIndex((t) => t.id === tabId);
        const nextTab = tabs[currentIndex + 1] || tabs[currentIndex - 1];
        if (nextTab) {
          handleTabClick(nextTab.id);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
      const currentIndex = tabs.findIndex((t) => t.id === tabId);
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          const prevTab = tabs[currentIndex - 1];
          if (prevTab && !prevTab.disabled) {
            handleTabClick(prevTab.id);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          const nextTab = tabs[currentIndex + 1];
          if (nextTab && !nextTab.disabled) {
            handleTabClick(nextTab.id);
          }
          break;
        case 'Home':
          e.preventDefault();
          const firstTab = tabs.find((t) => !t.disabled);
          if (firstTab) {
            handleTabClick(firstTab.id);
          }
          break;
        case 'End':
          e.preventDefault();
          const lastTab = [...tabs].reverse().find((t) => !t.disabled);
          if (lastTab) {
            handleTabClick(lastTab.id);
          }
          break;
      }
    };

    return (
      <div ref={ref} className={cx(styles.root, size !== 'medium' && styles[size], className)}>
        <div className={cx(styles.tabBar, tabBarClassName)}>
          <div className={styles.scrollContainer} ref={scrollContainerRef}>
            <div className={styles.tabList} role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  ref={tab.id === currentActiveId ? activeTabRef : null}
                  type="button"
                  role="tab"
                  aria-selected={tab.id === currentActiveId}
                  aria-disabled={tab.disabled}
                  disabled={tab.disabled}
                  className={cx(
                    styles.tab,
                    tab.id === currentActiveId && styles.active,
                    tab.disabled && styles.disabled
                  )}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, tab.id)}
                  tabIndex={tab.id === currentActiveId ? 0 : -1}
                >
                  {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
                  <span className={styles.label}>{tab.label}</span>
                  {tab.closable && (
                    <button
                      type="button"
                      className={styles.closeButton}
                      onClick={(e) => handleTabClose(e, tab.id)}
                      aria-label={`Close ${tab.label}`}
                      tabIndex={-1}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 4L4 12M4 4L12 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
          {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        </div>
        {activeTab?.content && (
          <div 
            className={cx(styles.content, contentClassName)}
            role="tabpanel"
            aria-labelledby={currentActiveId}
          >
            {activeTab.content}
          </div>
        )}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';