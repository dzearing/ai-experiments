import { type ReactNode, useEffect, useRef } from 'react';
import { ChatMessage, type ChatMessageProps, type ChatMessageToolCall } from '../ChatMessage';
import styles from './ChatPanel.module.css';

/**
 * Message format for ChatPanel
 * Extends ChatMessageProps with the required fields
 */
export interface ChatPanelMessage {
  /** Unique message ID */
  id: string;
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: string | number | Date;
  /** Sender's display name */
  senderName: string;
  /** Sender's avatar color */
  senderColor?: string;
  /** Whether this message is from the current user */
  isOwn?: boolean;
  /** Whether the message is currently being streamed */
  isStreaming?: boolean;
  /** Tool calls made during this message */
  toolCalls?: ChatMessageToolCall[];
  /** Custom avatar element */
  avatar?: ReactNode;
  /** Whether to render content as markdown */
  renderMarkdown?: boolean;
}

/**
 * Props for the ChatPanel component
 */
export interface ChatPanelProps {
  /** Array of messages to display */
  messages: ChatPanelMessage[];

  /** Content to display when there are no messages */
  emptyState?: ReactNode;

  /** Whether the AI is currently loading/thinking */
  isLoading?: boolean;

  /** Text to display while loading (e.g., "Thinking...", "Captain is thinking...") */
  loadingText?: string;

  /** Typing users for group chat indicators */
  typingUsers?: string[];

  /** Whether to auto-scroll to bottom on new messages */
  autoScroll?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Render function for custom avatar per message */
  renderAvatar?: (message: ChatPanelMessage) => ReactNode;

  /** Menu items for message actions */
  messageMenuItems?: ChatMessageProps['menuItems'];

  /** Called when a menu item is selected */
  onMessageMenuSelect?: (value: string, messageId: string) => void;

  /** Called when a link is clicked in a message */
  onLinkClick?: (href: string) => void;
}

/**
 * ChatPanel component
 *
 * A unified chat rendering component that encapsulates:
 * - Message list with auto-scroll
 * - Empty state display
 * - Loading/thinking indicators
 * - Typing indicators for group chat
 * - Consecutive message grouping
 *
 * Used by:
 * - ChatRoom (group chat)
 * - FacilitatorOverlay (AI facilitator)
 * - IdeaWorkspaceOverlay (idea agent)
 */
export function ChatPanel({
  messages,
  emptyState,
  isLoading = false,
  loadingText = 'Thinking...',
  typingUsers = [],
  autoScroll = true,
  className = '',
  renderAvatar,
  messageMenuItems,
  onMessageMenuSelect,
  onLinkClick,
}: ChatPanelProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesContainerRef.current) {
      // Scroll the messages container directly to avoid scrolling wrong ancestor
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, autoScroll]);

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {messages.length === 0 && emptyState ? (
        <div className={styles.emptyState}>{emptyState}</div>
      ) : (
        <div ref={messagesContainerRef} className={styles.messages}>
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isConsecutive =
              prevMessage?.senderName === message.senderName && !prevMessage?.isOwn === !message.isOwn;

            return (
              <ChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                timestamp={message.timestamp}
                senderName={message.senderName}
                senderColor={message.senderColor}
                isOwn={message.isOwn}
                isConsecutive={isConsecutive}
                isStreaming={message.isStreaming}
                toolCalls={message.toolCalls}
                renderMarkdown={message.renderMarkdown ?? !message.isOwn}
                avatar={renderAvatar ? renderAvatar(message) : message.avatar}
                menuItems={messageMenuItems}
                onMenuSelect={onMessageMenuSelect}
                onLinkClick={onLinkClick}
              />
            );
          })}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingText}>{loadingText}</span>
        </div>
      )}

      {/* Typing indicator for group chat */}
      {typingUsers.length > 0 && (
        <div className={styles.typingIndicator}>
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
          <span className={styles.typingText}>
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                : `${typingUsers.length} people are typing...`}
          </span>
        </div>
      )}
    </div>
  );
}

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;
