import { type ReactNode, type RefObject } from 'react';
import { ChatProvider, type ChatMode, type ChatParticipant } from '../../context';
import { ChatPanel, type ChatPanelMessage } from '../ChatPanel';
import { ThinkingIndicator, type ThinkingIndicatorProps } from '../ThinkingIndicator';
import { MessageQueue, type QueuedMessage } from '../MessageQueue';
import { ChatInput, type ChatInputProps, type ChatInputRef } from '../ChatInput';
import styles from './ChatLayout.module.css';

export interface ChatLayoutProps {
  /** Array of messages to display */
  messages: ChatPanelMessage[];

  /** Content to display when there are no messages */
  emptyState?: ReactNode;

  /** Render function for custom avatar per message */
  renderAvatar?: (message: ChatPanelMessage) => ReactNode;

  /** Called when a link is clicked in a message */
  onLinkClick?: (href: string) => void;

  /** Whether to auto-scroll to bottom on new messages (default: true) */
  autoScroll?: boolean;

  /** Called when scroll lock state changes */
  onScrollLockChange?: (locked: boolean) => void;

  /** Typing users for group chat indicators */
  typingUsers?: string[];

  /** Header content rendered above the chat panel */
  header?: ReactNode;

  /** Chat mode: '1on1' for AI conversations, 'group' for multi-user chat */
  mode?: ChatMode;

  /** Participants for group mode (optional, used for avatars/names in group chat) */
  participants?: ChatParticipant[];

  /** Whether the AI is currently thinking/processing */
  isThinking?: boolean;

  /** Props to pass to ThinkingIndicator (statusText, showEscapeHint, etc.) */
  thinkingIndicatorProps?: Omit<ThinkingIndicatorProps, 'isActive'>;

  /** Queued messages to display */
  queuedMessages?: QueuedMessage[];

  /** Called when a queued message is removed */
  onRemoveQueuedMessage?: (id: string) => void;

  /** Props to pass to ChatInput */
  chatInputProps?: ChatInputProps;

  /** Ref for the ChatInput component */
  chatInputRef?: RefObject<ChatInputRef | null>;

  /** Additional class name for the container */
  className?: string;
}

/**
 * ChatLayout component
 *
 * A complete chat interface that renders:
 * - Header (optional)
 * - ChatPanel (messages with auto-scroll)
 * - ThinkingIndicator (when AI is processing)
 * - MessageQueue (queued messages above input)
 * - ChatInput (bottom)
 *
 * Use this component for consistent chat UX across all chat scenarios.
 */
export function ChatLayout({
  messages,
  emptyState,
  renderAvatar,
  onLinkClick,
  autoScroll = true,
  onScrollLockChange,
  typingUsers,
  header,
  mode = '1on1',
  participants,
  isThinking = false,
  thinkingIndicatorProps,
  queuedMessages = [],
  onRemoveQueuedMessage,
  chatInputProps,
  chatInputRef,
  className,
}: ChatLayoutProps) {
  const containerClassName = className
    ? `${styles.container} ${className}`
    : styles.container;

  return (
    <ChatProvider mode={mode} participants={participants}>
      <div className={containerClassName}>
        {header && <div className={styles.header}>{header}</div>}

        <div className={styles.chatArea}>
          <ChatPanel
            messages={messages}
            emptyState={emptyState}
            renderAvatar={renderAvatar}
            onLinkClick={onLinkClick}
            autoScroll={autoScroll}
            onScrollLockChange={onScrollLockChange}
            typingUsers={typingUsers}
            className={styles.messagesContainer}
          />
        </div>

        {isThinking && (
          <div className={styles.thinkingContainer}>
            <ThinkingIndicator
              isActive={isThinking}
              {...thinkingIndicatorProps}
            />
          </div>
        )}

        {queuedMessages.length > 0 && (
          <div className={styles.messageQueueContainer}>
            <MessageQueue
              messages={queuedMessages}
              onRemove={onRemoveQueuedMessage}
            />
          </div>
        )}

        {chatInputProps && (
          <div className={styles.inputContainer}>
            <ChatInput ref={chatInputRef} {...chatInputProps} />
          </div>
        )}
      </div>
    </ChatProvider>
  );
}

ChatLayout.displayName = 'ChatLayout';

export default ChatLayout;
