import { type ReactNode, useRef, memo, useCallback } from 'react';
import { ChatMessage, type ChatMessageToolCall, type ChatMessagePart, type ChatMessageProps } from '../ChatMessage';
import { useScrollLock } from '../../hooks/useScrollLock';
import styles from './ChatPanel.module.css';

/**
 * Message format for ChatPanel
 * Extends ChatMessageProps with the required fields
 */
export interface ChatPanelMessage {
  /** Unique message ID */
  id: string;
  /** Message content - DEPRECATED: use parts instead for interleaved text/tools */
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
  /** @deprecated Use parts instead for proper interleaving */
  toolCalls?: ChatMessageToolCall[];
  /** Message parts array - supports interleaved text and tool calls */
  parts?: ChatMessagePart[];
  /** Custom avatar element */
  avatar?: ReactNode;
  /** Whether to render content as markdown */
  renderMarkdown?: boolean;
  /** Custom content to render instead of text/parts */
  customContent?: ReactNode;
  /** Whether this is a system message (full-width, uses customContent) */
  isSystem?: boolean;
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

  /**
   * Whether to auto-scroll to bottom on new messages.
   * When true (default), uses smart scroll-lock behavior:
   * - Locked: Auto-scrolls to new messages
   * - Unlocked: User scrolled up, stays at position until they scroll back to bottom
   */
  autoScroll?: boolean;

  /** Called when scroll lock state changes */
  onScrollLockChange?: (locked: boolean) => void;

  /** Additional CSS class */
  className?: string;

  /** Render function for custom avatar per message */
  renderAvatar?: (message: ChatPanelMessage) => ReactNode;

  /** Called when a link is clicked in a message */
  onLinkClick?: (href: string) => void;

  /** Custom renderer for tool results in messages */
  renderToolResult?: ChatMessageProps['renderToolResult'];
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
 *
 * Memoized to prevent re-renders when parent state changes but messages haven't.
 */
export const ChatPanel = memo(function ChatPanel({
  messages,
  emptyState,
  isLoading = false,
  loadingText = 'Thinking...',
  typingUsers = [],
  autoScroll = true,
  onScrollLockChange,
  className = '',
  renderAvatar,
  onLinkClick,
  renderToolResult,
}: ChatPanelProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Smart scroll lock behavior
  const { lockState, scrollToBottom, hasNewContent, setLockState, clearNewContent } = useScrollLock(
    messagesContainerRef,
    { initialState: autoScroll ? 'locked' : 'unlocked' }
  );

  // Notify parent of scroll lock changes
  const handleJumpToBottom = useCallback(() => {
    setLockState('locked');
    scrollToBottom();
    clearNewContent();
    onScrollLockChange?.(true);
  }, [setLockState, scrollToBottom, clearNewContent, onScrollLockChange]);

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');
  const showJumpToBottom = autoScroll && lockState === 'unlocked' && hasNewContent;

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
                parts={message.parts}
                timestamp={message.timestamp}
                senderName={message.senderName}
                senderColor={message.senderColor}
                isOwn={message.isOwn}
                isSystem={message.isSystem}
                isConsecutive={isConsecutive}
                isStreaming={message.isStreaming}
                toolCalls={message.toolCalls}
                renderMarkdown={message.renderMarkdown ?? true}
                avatar={renderAvatar ? renderAvatar(message) : message.avatar}
                onLinkClick={onLinkClick}
                renderToolResult={renderToolResult}
                customContent={message.customContent}
              />
            );
          })}
        </div>
      )}

      {/* Jump to bottom button - shows when user scrolled up and new messages arrived */}
      {showJumpToBottom && (
        <button
          type="button"
          className={styles.jumpToBottom}
          onClick={handleJumpToBottom}
          aria-label="Jump to latest messages"
        >
          <span className={styles.jumpToBottomArrow}>↓</span>
          <span className={styles.jumpToBottomText}>New messages</span>
        </button>
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
});

export default ChatPanel;
