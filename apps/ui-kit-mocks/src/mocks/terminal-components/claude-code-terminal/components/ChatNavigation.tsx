import React, { useRef, useEffect, useState } from 'react';
import { Button, Spinner } from '@claude-flow/ui-kit-react';
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  HourglassIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  DragHandleIcon,
} from '@claude-flow/ui-kit-icons';
import styles from './ChatNavigation.module.css';
import type { Chat } from '../types';

interface ChatNavigationProps {
  chats: Chat[];
  activeChatId: string;
  showChatNav: boolean;
  chatFilter: 'all' | 'idle' | 'busy';
  isEditMode: boolean;
  newChatIds: Set<string>;
  hasInitialized: boolean;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onToggleNav: (show: boolean) => void;
  onFilterChange: (filter: 'all' | 'idle' | 'busy') => void;
  onEditModeToggle: (editMode: boolean) => void;
  onChatReorder: (draggedId: string, targetId: string) => void;
}

export const ChatNavigation: React.FC<ChatNavigationProps> = ({
  chats,
  activeChatId,
  showChatNav,
  chatFilter,
  isEditMode,
  newChatIds,
  hasInitialized,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onToggleNav,
  onFilterChange,
  onEditModeToggle,
  onChatReorder,
}) => {
  const chatNavRef = useRef<HTMLDivElement>(null);
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [dragOverChatId, setDragOverChatId] = useState<string | null>(null);

  // Handle escape key for edit mode
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode && chatNavRef.current?.contains(document.activeElement)) {
        onEditModeToggle(false);
      }
    };
    
    if (isEditMode) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isEditMode, onEditModeToggle]);

  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    setDraggedChatId(chatId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', chatId);
  };

  const handleDragOver = (e: React.DragEvent, chatId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedChatId || draggedChatId === chatId) return;
    
    setDragOverChatId(chatId);
    onChatReorder(draggedChatId, chatId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverChatId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedChatId(null);
    setDragOverChatId(null);
  };

  const handleDragEnd = () => {
    setDraggedChatId(null);
    setDragOverChatId(null);
  };


  const filteredChats = chats.filter(chat => {
    if (chatFilter === 'idle') return !chat.isBusy;
    if (chatFilter === 'busy') return chat.isBusy;
    return true;
  });

  const idleCount = chats.filter(c => !c.isBusy).length;
  const busyCount = chats.filter(c => c.isBusy).length;

  return (
    <div className={styles.chatNav} ref={chatNavRef} style={{ width: '100%' }}>
      <div className={styles.chatNavHeader}>
        <div className={styles.chatNavTitleRow}>
          <Button 
            variant="inline"
            shape="square"
            size="small"
            onClick={() => onToggleNav(false)}
            aria-label="Collapse chat navigation"
            className={styles.collapseButton}
          >
            <ChevronLeftIcon />
          </Button>
          <h3 className={styles.chatNavTitle}>Chats</h3>
          <Button
            variant="inline"
            shape="square"
            onClick={() => onEditModeToggle(!isEditMode)}
            aria-label={isEditMode ? "Exit edit mode" : "Enter edit mode"}
            className={`${styles.editButton} ${isEditMode ? styles.editButtonActive : ''}`}
          >
            <EditIcon size={20} />
          </Button>
        </div>
      </div>
      <div className={styles.chatNavFilters}>
        <Button
          variant={chatFilter === 'idle' ? 'primary' : 'outline'}
          size="small"
          shape="pill"
          onClick={() => onFilterChange(chatFilter === 'idle' ? 'all' : 'idle')}
          aria-label="Filter idle chats"
        >
          <span className={ styles.filterButtonContent}>
          <CheckCircleIcon className={styles.idleIcon} size={16} /> 
          Idle
          {idleCount > 1 && (
            <span className={`${styles.filterCount} ${chatFilter === 'idle' ? styles.filterCountSelected : ''}`}>
              {idleCount}
            </span>
          )}
          </span>
        </Button>
        <Button
          variant={chatFilter === 'busy' ? 'primary' : 'outline'}
          size="small"
          shape="pill"
          onClick={() => onFilterChange(chatFilter === 'busy' ? 'all' : 'busy')}
          aria-label="Filter busy chats"
        >
          <span className={ styles.filterButtonContent}>
            <HourglassIcon className={styles.busyIcon} size={16} /> 
            Busy
            {busyCount > 1 && (
              <span className={`${styles.filterCount} ${chatFilter === 'busy' ? styles.filterCountSelected : ''}`}>
                {busyCount}
              </span>
            )}
          </span>
        </Button>
      </div>
      <Button 
        variant="primary" 
        size="medium"
        onClick={onNewChat}
        aria-label="New chat"
        className={styles.newChatButton}
      >
        <AddIcon /> New chat
      </Button>
      <div className={styles.chatList}>
        {filteredChats.map((chat, index) => (
          <div 
            key={chat.id}
            className={`${styles.chatItem} ${!isEditMode && chat.isActive ? styles.chatItemActive : ''} ${hasInitialized && newChatIds.has(chat.id) ? styles.chatItemNew : ''} ${isEditMode ? styles.chatItemEditMode : ''} ${draggedChatId === chat.id ? styles.chatItemDragging : ''} ${dragOverChatId === chat.id ? styles.chatItemDragOver : ''}`}
            onClick={() => !isEditMode && onChatSelect(chat.id)}
            style={hasInitialized && newChatIds.has(chat.id) ? { animationDelay: `${index * 50}ms` } : undefined}
            draggable={false}
            onDragStart={(e) => handleDragStart(e, chat.id)}
            onDragOver={(e) => handleDragOver(e, chat.id)}
            onDragLeave={(e) => handleDragLeave(e)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            {isEditMode ? (
              <div 
                className={styles.dragHandle}
                onMouseDown={(e) => e.currentTarget.parentElement?.setAttribute('draggable', 'true')}
                onMouseUp={(e) => e.currentTarget.parentElement?.setAttribute('draggable', 'false')}
              >
                <DragHandleIcon size={20} />
              </div>
            ) : (
              <div className={styles.chatItemIndicator}>
                {chat.isBusy ? (
                  <Spinner size="small" />
                ) : (
                  <CheckCircleIcon className={styles.chatIndicatorIcon} />
                )}
              </div>
            )}
            <div className={styles.chatItemContent}>
              <div className={styles.chatItemTitle}>{chat.title}</div>
              <div className={styles.chatItemSubtitleContainer}>
                {chat.previousSubtitle && (
                  <div 
                    className={styles.chatItemSubtitle}
                    data-leaving="true"
                  >
                    {chat.previousSubtitle}
                  </div>
                )}
                <div 
                  key={chat.subtitle} 
                  className={styles.chatItemSubtitle}
                  data-animate={chat.previousSubtitle ? "true" : "false"}
                >
                  {chat.subtitle}
                </div>
              </div>
            </div>
            {isEditMode && (
              <Button
                variant="inline"
                shape="square"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                aria-label={`Delete ${chat.title}`}
                className={styles.deleteButton}
              >
                <DeleteIcon size={20} />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};