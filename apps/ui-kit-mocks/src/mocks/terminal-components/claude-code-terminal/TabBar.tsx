import React from 'react';
import { CloseIcon, AddIcon } from '@claude-flow/ui-kit-icons';
import { Button } from '@claude-flow/ui-kit-react';
import styles from './TabBar.module.css';

export interface Tab {
  id: string;
  title: string;
  type: 'chat' | 'context' | 'agents' | 'plan' | 'diff' | 'image' | 'document';
  isActive?: boolean;
  isDirty?: boolean;
  icon?: React.ReactNode;
}

export interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab
}) => {
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabList}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.tabActive : ''}`}
            onClick={() => onTabSelect(tab.id)}
            title={tab.title}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span className={styles.tabTitle}>
              {tab.isDirty && <span className={styles.tabDirtyIndicator}>•</span>}
              {tab.title}
            </span>
            <button
              className={styles.tabCloseButton}
              onClick={(e) => handleTabClose(e, tab.id)}
              aria-label={`Close ${tab.title}`}
            >
              <CloseIcon size={12} />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="inline"
        shape="square"
        size="small"
        onClick={onNewTab}
        className={styles.newTabButton}
        aria-label="New tab"
      >
        <AddIcon />
      </Button>
    </div>
  );
};