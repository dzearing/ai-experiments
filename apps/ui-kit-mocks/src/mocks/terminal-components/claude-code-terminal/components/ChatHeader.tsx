import React from 'react';
import { Button } from '@claude-flow/ui-kit-react';
import { ChevronRightIcon } from '@claude-flow/ui-kit-icons';
import styles from './ChatHeader.module.css';
import type { Chat } from '../types';

interface ChatHeaderProps {
  chat: Chat;
  showChatNav: boolean;
  onToggleNav: (show: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  showChatNav,
  onToggleNav,
}) => {
  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        {!showChatNav && (
          <Button
            variant="inline"
            shape="square"
            size="small"
            onClick={() => onToggleNav(true)}
            aria-label="Expand chat navigation"
            className={styles.expandHeaderButton}
          >
            <ChevronRightIcon />
          </Button>
        )}
        <h2 className={styles.chatTitle}>{chat.title}</h2>
      </div>
      {(chat.repoPath || chat.branch) && (
        <div className={styles.chatRepoInfo}>
          {chat.repoPath && (
            <div className={styles.repoName}>
              <span className={styles.repoLabel}>Repo:</span> {chat.repoPath}
            </div>
          )}
          {chat.branch && (
            <div className={styles.branchName}>
              <span className={styles.branchLabel}>Branch:</span> {chat.branch}
            </div>
          )}
        </div>
      )}
    </div>
  );
};