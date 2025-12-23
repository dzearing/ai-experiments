import { type ReactNode, type MouseEvent } from 'react';
import { Avatar, Menu, type MenuItem } from '@ui-kit/react';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import styles from './ChatMessage.module.css';

/**
 * Tool call information for AI assistant messages
 */
export interface ChatMessageToolCall {
  name: string;
  input?: Record<string, unknown>;
  output?: string;
}

/**
 * Props for the ChatMessage component
 */
export interface ChatMessageProps {
  /** Unique message ID */
  id: string;

  /** Message content (text or markdown) */
  content: string;

  /** When the message was sent */
  timestamp: string | number | Date;

  /** Sender's display name */
  senderName: string;

  /** Sender's avatar color */
  senderColor?: string;

  /** Whether this message is from the current user (highlights the message) */
  isOwn?: boolean;

  /** Whether this is a consecutive message from the same sender (hides avatar/name) */
  isConsecutive?: boolean;

  /** Whether to render content as markdown (default: true) */
  renderMarkdown?: boolean;

  /** Whether the message is currently being streamed */
  isStreaming?: boolean;

  /** Tool calls made during this message (for AI assistants) */
  toolCalls?: ChatMessageToolCall[];

  /** Menu items for message actions (edit, delete, etc.) */
  menuItems?: MenuItem[];

  /** Called when a menu item is selected */
  onMenuSelect?: (value: string, messageId: string) => void;

  /** Custom avatar element (overrides default Avatar) */
  avatar?: ReactNode;

  /** Additional CSS class */
  className?: string;
}

/**
 * Format timestamp as HH:MM
 */
function formatTime(timestamp: string | number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ChatMessage component
 *
 * Displays a single message in a chat interface with support for:
 * - Avatar and sender name display
 * - Consecutive message grouping
 * - Markdown rendering
 * - Message actions via menu
 * - AI features (streaming indicator, tool calls)
 */
export function ChatMessage({
  id,
  content,
  timestamp,
  senderName,
  senderColor,
  isOwn = false,
  isConsecutive = false,
  renderMarkdown = true,
  isStreaming = false,
  toolCalls,
  menuItems,
  onMenuSelect,
  avatar,
  className = '',
}: ChatMessageProps) {
  const handleMenuSelect = (value: string) => {
    onMenuSelect?.(value, id);
  };

  const handleTimestampClick = (e: MouseEvent) => {
    // Prevent click from bubbling if there's no menu
    if (!menuItems || menuItems.length === 0) {
      e.preventDefault();
    }
  };

  const messageClasses = [
    styles.message,
    isConsecutive && styles.consecutive,
    isOwn && styles.highlighted,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const avatarColumnClasses = [
    styles.avatarColumn,
    isConsecutive && styles.hidden,
  ]
    .filter(Boolean)
    .join(' ');

  const formattedTime = formatTime(timestamp);
  const hasMenu = menuItems && menuItems.length > 0;

  return (
    <div className={messageClasses} data-message-id={id}>
      {/* Column 1: Avatar + Name */}
      <div className={avatarColumnClasses}>
        {!isConsecutive && (
          <>
            {avatar || (
              <Avatar
                size="xs"
                fallback={senderName}
                color={senderColor}
              />
            )}
            <span
              className={styles.senderName}
              style={senderColor ? { color: senderColor } : undefined}
            >
              {senderName}
            </span>
          </>
        )}
      </div>

      {/* Column 2: Timestamp (with optional menu for own messages) */}
      {hasMenu ? (
        <Menu
          items={menuItems}
          onSelect={handleMenuSelect}
          position="bottom-start"
        >
          <button
            type="button"
            className={styles.timestampButton}
            onClick={handleTimestampClick}
          >
            {formattedTime}
          </button>
        </Menu>
      ) : (
        <span className={styles.timestamp}>{formattedTime}</span>
      )}

      {/* Column 3: Content */}
      <div className={styles.content}>
        {renderMarkdown ? (
          <MarkdownRenderer
            content={content}
            enableDeepLinks={false}
            showLineNumbers={false}
            imageAuthor={senderName}
            imageTimestamp={typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString()}
            className={styles.markdownContent}
          />
        ) : (
          <p className={styles.plainText}>{content}</p>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <span className={styles.streamingIndicator} aria-label="Generating response">
            <span className={styles.streamingDot} />
            <span className={styles.streamingDot} />
            <span className={styles.streamingDot} />
          </span>
        )}

        {/* Tool calls */}
        {Array.isArray(toolCalls) && toolCalls.length > 0 && (
          <div className={styles.toolCalls}>
            {toolCalls.map((toolCall, index) => (
              <div key={index} className={styles.toolCall}>
                <span className={styles.toolName}>{toolCall.name}</span>
                {toolCall.output && (
                  <span className={styles.toolStatus}>completed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
