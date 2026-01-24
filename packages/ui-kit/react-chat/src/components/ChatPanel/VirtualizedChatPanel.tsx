import { type ReactNode, useRef, memo, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChatMessage, type ChatMessageToolCall, type ChatMessagePart } from '../ChatMessage';
import { useScrollLock } from '../../hooks/useScrollLock';
import styles from './ChatPanel.module.css';

/**
 * Message format for VirtualizedChatPanel
 */
export interface VirtualizedChatPanelMessage {
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
}

/**
 * Props for the VirtualizedChatPanel component
 */
export interface VirtualizedChatPanelProps {
  /** Array of messages to display */
  messages: VirtualizedChatPanelMessage[];

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
  renderAvatar?: (message: VirtualizedChatPanelMessage) => ReactNode;

  /** Called when a link is clicked in a message */
  onLinkClick?: (href: string) => void;

  /**
   * Number of items to render outside the visible area (above and below).
   * Higher values result in smoother scrolling but more DOM nodes.
   * Default: 10
   */
  overscan?: number;

  /**
   * Estimated height of a message in pixels.
   * Used for initial sizing before measurement.
   * Default: 80
   */
  estimatedMessageHeight?: number;

  /** Menu items to show in a dropdown when message timestamp is clicked */
  messageMenuItems?: Array<{
    value: string;
    label: string;
    icon?: ReactNode;
    danger?: boolean;
  }>;

  /** Callback when a menu item is selected */
  onMessageMenuSelect?: (value: string, messageId: string) => void;
}

/**
 * Estimate message height based on content
 */
function estimateMessageHeight(message: VirtualizedChatPanelMessage, baseHeight: number): number {
  // Base height for avatar, name, padding
  let height = baseHeight;

  // Estimate content lines (rough: ~80 chars per line at 14px font)
  const contentLength = message.content?.length ?? 0;
  const estimatedLines = Math.max(1, Math.ceil(contentLength / 80));

  height += estimatedLines * 24; // ~24px per line

  // Add height for tool calls
  const toolCallCount = message.toolCalls?.length ?? 0;
  const partsToolCalls = message.parts?.filter(p => p.type === 'tool_calls')
    .reduce((sum, p) => sum + (p.type === 'tool_calls' ? p.calls.length : 0), 0) ?? 0;

  height += (toolCallCount + partsToolCalls) * 40;

  return height;
}

/**
 * VirtualizedChatPanel component
 *
 * A performance-optimized chat panel that only renders messages
 * visible in the viewport (plus overscan buffer).
 *
 * Features:
 * - Virtual scrolling for thousands of messages
 * - Dynamic height measurement with caching
 * - Smart scroll-lock (auto-scroll when at bottom, unlock when user scrolls up)
 * - Jump-to-bottom button when new messages arrive while reading history
 *
 * Use this instead of ChatPanel when:
 * - Chat history can grow to 100+ messages
 * - Messages contain variable-height content (code blocks, tool calls)
 * - Scroll performance is degraded
 */
export const VirtualizedChatPanel = memo(function VirtualizedChatPanel({
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
  overscan = 10,
  estimatedMessageHeight = 80,
  messageMenuItems,
  onMessageMenuSelect,
}: VirtualizedChatPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const lastScrolledToCountRef = useRef(0);
  const lastScrollHeightRef = useRef(0);

  // Smart scroll lock behavior
  // We disable autoScrollWhenLocked because we handle scrolling via direct DOM manipulation
  const { lockState, lockStateRef, hasNewContent, setLockState, clearNewContent, markProgrammaticScroll, markNewContent } = useScrollLock(
    parentRef,
    { initialState: autoScroll ? 'locked' : 'unlocked', autoScrollWhenLocked: false }
  );

  // Track last known scroll position for restoration during resize
  const lastScrollTopRef = useRef(0);
  const isRestoringScrollRef = useRef(false);
  // Track when user is actively scrolling (wheel/touch)
  const userScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preserve scroll position when content height changes while unlocked (e.g., tool expansion)
  // This approach detects and restores unwanted scroll adjustments in real-time
  useEffect(() => {
    const container = parentRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    // Initialize refs
    lastScrollTopRef.current = container.scrollTop;
    lastScrollHeightRef.current = container.scrollHeight;

    // Mark user scroll start
    const handleUserScrollStart = () => {
      userScrollingRef.current = true;
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      userScrollTimeoutRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 200);
    };

    // Handle scroll events - detect and restore unwanted adjustments
    const handleScroll = () => {
      // Don't process during restoration
      if (isRestoringScrollRef.current) return;

      // Only care about scroll preservation when unlocked
      if (lockStateRef.current !== 'unlocked') {
        // When locked, just track position
        lastScrollTopRef.current = container.scrollTop;
        lastScrollHeightRef.current = container.scrollHeight;
        return;
      }

      const currentScrollTop = container.scrollTop;
      const savedScrollTop = lastScrollTopRef.current;
      const scrollDelta = Math.abs(currentScrollTop - savedScrollTop);

      // If scroll changed significantly and NOT from user interaction, restore
      if (scrollDelta > 50 && !userScrollingRef.current) {
        // This is likely a virtualizer adjustment - restore immediately
        isRestoringScrollRef.current = true;
        container.scrollTop = savedScrollTop;

        // Keep restoring across multiple frames to fight delayed adjustments
        requestAnimationFrame(() => {
          container.scrollTop = savedScrollTop;
          requestAnimationFrame(() => {
            container.scrollTop = savedScrollTop;
            setTimeout(() => {
              container.scrollTop = savedScrollTop;
              lastScrollHeightRef.current = container.scrollHeight;
              isRestoringScrollRef.current = false;
            }, 50);
          });
        });
      } else if (userScrollingRef.current) {
        // User is scrolling - update saved position
        lastScrollTopRef.current = currentScrollTop;
        lastScrollHeightRef.current = container.scrollHeight;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleUserScrollStart, { passive: true });
    container.addEventListener('touchmove', handleUserScrollStart, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleUserScrollStart);
      container.removeEventListener('touchmove', handleUserScrollStart);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [lockStateRef]);

  // Track when new messages arrive while unlocked
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;

    // If message count increased and we're unlocked, mark new content
    if (currentCount > prevCount && lockStateRef.current === 'unlocked') {
      markNewContent();
    }

    prevMessageCountRef.current = currentCount;
  }, [messages.length, lockStateRef, markNewContent]);

  // Virtualizer instance
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => estimateMessageHeight(messages[index], estimatedMessageHeight),
    overscan,
    // Measure actual element height after render
    measureElement: (element) => {
      return element.getBoundingClientRect().height;
    },
    // Custom scroll function - handle scroll based on lock state
    scrollToFn: (offset, { adjustments }, instance) => {
      const container = instance.scrollElement;
      if (!container) return;

      // When unlocked and there are adjustments, don't touch scroll - preserve user's position
      if (adjustments && lockStateRef.current === 'unlocked') {
        return;
      }

      // When locked, always stay at the bottom (ignore virtualizer's offset requests)
      if (lockStateRef.current === 'locked') {
        container.scrollTop = container.scrollHeight;
        return;
      }

      // Only apply offset when unlocked and no adjustments
      container.scrollTop = offset;
    },
  });

  // Scroll to bottom when locked and NEW messages are added
  useEffect(() => {
    // Only proceed if we have messages
    if (messages.length === 0) return;

    // Only scroll if this is a NEW message (count increased) and we haven't scrolled for this count yet
    // This prevents spurious scrolls when effect re-runs for other reasons
    if (messages.length <= lastScrolledToCountRef.current) return;

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      // Re-check lock state right before scrolling
      if (lockStateRef.current === 'locked') {
        markProgrammaticScroll();
        const container = parentRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        lastScrolledToCountRef.current = messages.length;
      }
    });
  }, [messages.length, lockStateRef, markProgrammaticScroll]);

  // Track if any message is streaming
  const isStreaming = messages.some(m => m.isStreaming);

  // Auto-scroll to bottom during streaming when locked
  // Uses a simple interval that checks lock state and scrolls if needed
  useEffect(() => {
    if (!isStreaming) return;

    const scrollToBottomIfLocked = () => {
      // Check lock state in real-time via ref
      if (lockStateRef.current !== 'locked') return;

      const container = parentRef.current;
      if (!container) return;

      // Use direct DOM scroll - more reliable than virtualizer during streaming
      markProgrammaticScroll();
      container.scrollTop = container.scrollHeight;
    };

    // Scroll periodically while streaming (only when locked)
    const interval = setInterval(scrollToBottomIfLocked, 150);

    return () => clearInterval(interval);
  }, [isStreaming, lockStateRef, markProgrammaticScroll]);

  // Notify parent of scroll lock changes
  const handleJumpToBottom = useCallback(() => {
    setLockState('locked');
    markProgrammaticScroll();
    // Use scrollToOffset to scroll to the actual bottom of the content
    // This is more reliable than scrollToIndex which may not fully reach the bottom
    const container = parentRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    clearNewContent();
    onScrollLockChange?.(true);
  }, [setLockState, markProgrammaticScroll, clearNewContent, onScrollLockChange]);

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');
  const showJumpToBottom = autoScroll && lockState === 'unlocked' && hasNewContent;

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={containerClasses}>
      {messages.length === 0 && emptyState ? (
        <div className={styles.emptyState}>{emptyState}</div>
      ) : (
        <div ref={parentRef} className={styles.virtualizedMessages}>
          {/* Virtual scroll container - height must match total content size */}
          <div
            ref={contentRef}
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
              // Prevent browser scroll anchoring
              overflowAnchor: 'none',
            }}
          >
            {virtualItems.map((virtualItem) => {
              const message = messages[virtualItem.index];
              const prevMessage = virtualItem.index > 0 ? messages[virtualItem.index - 1] : null;
              const isConsecutive =
                prevMessage?.senderName === message.senderName && !prevMessage?.isOwn === !message.isOwn;

              return (
                <div
                  key={message.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    // Prevent browser from using this element as scroll anchor
                    overflowAnchor: 'none',
                  }}
                >
                  <ChatMessage
                    id={message.id}
                    content={message.content}
                    parts={message.parts}
                    timestamp={message.timestamp}
                    senderName={message.senderName}
                    senderColor={message.senderColor}
                    isOwn={message.isOwn}
                    isConsecutive={isConsecutive}
                    isStreaming={message.isStreaming}
                    toolCalls={message.toolCalls}
                    renderMarkdown={message.renderMarkdown ?? true}
                    avatar={renderAvatar ? renderAvatar(message) : message.avatar}
                    onLinkClick={onLinkClick}
                    menuItems={message.isOwn ? messageMenuItems : undefined}
                    onMenuSelect={onMessageMenuSelect}
                  />
                </div>
              );
            })}
          </div>
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

      {/* Debug: Lock state indicator */}
      <div className={styles.lockIndicator} data-state={lockState}>
        {lockState === 'locked' ? '🔒 LOCKED' : '🔓 UNLOCKED'}
      </div>

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

export default VirtualizedChatPanel;
