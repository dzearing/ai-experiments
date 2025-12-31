import { type ReactNode, type MouseEvent, useState, useEffect, useRef } from 'react';
import { Avatar, Menu, BusyIndicator, Spinner, type MenuItem } from '@ui-kit/react';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import styles from './ChatMessage.module.css';

/**
 * Timer component that shows elapsed time for tool calls
 */
function ToolTimer({ startTime, isComplete }: { startTime?: number; isComplete: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalElapsedRef = useRef<number | null>(null);

  useEffect(() => {
    // If no start time, don't show timer
    if (!startTime) return;

    // If complete and we already captured final time, keep showing it
    if (isComplete && finalElapsedRef.current !== null) {
      setElapsed(finalElapsedRef.current);
      return;
    }

    // If complete, capture final elapsed time
    if (isComplete) {
      const finalElapsed = Date.now() - startTime;
      finalElapsedRef.current = finalElapsed;
      setElapsed(finalElapsed);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start timer
    const updateElapsed = () => {
      setElapsed(Date.now() - startTime);
    };

    // Initial update
    updateElapsed();

    // Update every 100ms
    intervalRef.current = setInterval(updateElapsed, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime, isComplete]);

  // Don't render if no start time
  if (!startTime) return null;

  // Format as X.Xs (e.g., "0.3s", "1.2s", "15.7s")
  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <span className={isComplete ? styles.toolTimerComplete : styles.toolTimerRunning}>
      ({seconds}s)
    </span>
  );
}

/**
 * Tool call information for AI assistant messages
 */
export interface ChatMessageToolCall {
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  /** When the tool call started (for timing display) */
  startTime?: number;
}

/**
 * Text part of a message
 */
export interface ChatMessageTextPart {
  type: 'text';
  text: string;
}

/**
 * Tool calls part of a message
 */
export interface ChatMessageToolCallsPart {
  type: 'tool_calls';
  calls: ChatMessageToolCall[];
}

/**
 * A message part - either text or tool calls
 */
export type ChatMessagePart = ChatMessageTextPart | ChatMessageToolCallsPart;

/**
 * Extract filename from path
 */
function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

/**
 * Normalize MCP tool names to match our switch cases.
 * MCP tools come in various formats:
 * - "facilitator:thing_search" (server:tool format)
 * - "mcp__facilitator__thing_search" (double underscore format)
 * - "mcp facilitator thing search" (space-separated format from MCP display)
 * We extract the tool name and convert to snake_case.
 */
function normalizeMcpToolName(name: string): string {
  // Handle "server:tool" format
  if (name.includes(':')) {
    const parts = name.split(':');
    return parts[parts.length - 1];
  }
  // Handle "mcp__server__tool" format
  if (name.includes('__')) {
    const parts = name.split('__');
    return parts[parts.length - 1];
  }
  // Handle "mcp server tool_name" or "mcp server tool name" formats
  // Extract the last part(s) after common prefixes
  if (name.startsWith('mcp ')) {
    // Remove "mcp " prefix and server name (second word)
    const parts = name.slice(4).split(' ');
    if (parts.length >= 2) {
      // Skip server name (first part), join rest with underscores
      const toolParts = parts.slice(1);
      return toolParts.join('_');
    }
  }
  return name;
}

/**
 * Generate a human-readable description for a tool call
 */
function formatToolDescription(name: string, input?: Record<string, unknown>): React.ReactNode {
  const bold = (text: string) => <strong>{text}</strong>;

  // Normalize MCP tool names
  const normalizedName = normalizeMcpToolName(name);

  switch (normalizedName) {
    // Claude Code SDK tools
    case 'Read':
      return <>Reading {input?.file_path ? bold(getFileName(String(input.file_path))) : 'file'}</>;
    case 'Write':
      return <>Writing {input?.file_path ? bold(getFileName(String(input.file_path))) : 'file'}</>;
    case 'Edit':
      return <>Editing {input?.file_path ? bold(getFileName(String(input.file_path))) : 'file'}</>;
    case 'Bash':
      const cmd = input?.command ? String(input.command).split(' ')[0] : '';
      return <>Running {cmd ? bold(cmd) : 'command'}</>;
    case 'Glob':
      return <>Finding files {input?.pattern ? <>matching {bold(String(input.pattern))}</> : ''}</>;
    case 'Grep':
      return <>Searching for {input?.pattern ? bold(String(input.pattern)) : 'pattern'}</>;
    case 'WebFetch':
      return <>Fetching {input?.url ? bold(new URL(String(input.url)).hostname) : 'URL'}</>;
    case 'WebSearch':
      return <>Searching web for {input?.query ? bold(String(input.query)) : 'query'}</>;
    case 'Task':
      return <>Running sub-task</>;
    case 'LSP':
      return <>Querying language server</>;

    // Workspace tools
    case 'workspace_list':
      return <>Listing workspaces</>;
    case 'workspace_get':
      return <>Getting workspace {input?.workspaceId ? bold(String(input.workspaceId).slice(0, 8)) : ''}</>;
    case 'workspace_create':
      return <>Creating workspace {input?.name ? bold(String(input.name)) : ''}</>;
    case 'workspace_update':
      return <>Updating workspace {input?.name ? bold(String(input.name)) : ''}</>;
    case 'workspace_delete':
      return <>Deleting workspace {input?.workspaceId ? bold(String(input.workspaceId).slice(0, 8)) : ''}</>;

    // Document tools
    case 'document_list':
      return <>Listing documents{input?.workspaceId ? <> in {bold(String(input.workspaceId).slice(0, 8))}</> : <> (global scope)</>}</>;
    case 'document_get':
      return <>Reading document {input?.documentId ? bold(String(input.documentId).slice(0, 8)) : ''}</>;
    case 'document_create':
      return (
        <>
          Creating {input?.title ? bold(String(input.title)) : 'document'}
          {input?.workspaceId ? <> in {bold(String(input.workspaceId).slice(0, 8))}</> : <> (global scope)</>}
        </>
      );
    case 'document_update':
      return <>Updating document {input?.title ? bold(String(input.title)) : ''}</>;
    case 'document_delete':
      return <>Deleting document {input?.documentId ? bold(String(input.documentId).slice(0, 8)) : ''}</>;
    case 'document_move':
      return <>Moving document {input?.workspaceId ? <>to {bold(String(input.workspaceId).slice(0, 8))}</> : <>to global scope</>}</>;

    // Search/analysis tools
    case 'search_documents':
      return <>Searching for {input?.query ? bold(String(input.query)) : 'documents'}</>;
    case 'summarize_document':
      return <>Summarizing document</>;

    // Thing tools
    case 'thing_list':
      return <>Listing Things{input?.query ? <> matching {bold(String(input.query))}</> : ''}</>;
    case 'thing_get':
      // Show name if available, otherwise show truncated ID
      const thingName = input?.name ? String(input.name) : (input?.thingId ? String(input.thingId).slice(0, 8) : '');
      return <>Getting details about {thingName ? bold(thingName) : 'Thing'}</>;
    case 'thing_search':
      return <>Searching for {input?.query ? bold(String(input.query)) : 'Things'}</>;
    case 'thing_create':
      return <>Creating Thing {input?.name ? bold(String(input.name)) : ''}</>;
    case 'thing_update':
      return <>Updating Thing {input?.name ? bold(String(input.name)) : ''}</>;
    case 'thing_delete':
      return <>Deleting Thing</>;
    case 'thing_read_linked_files':
      return <>Reading linked files</>;

    default:
      // For unknown tools, format nicely: replace underscores with spaces, capitalize
      return <>{normalizedName.replace(/_/g, ' ')}</>;
  }
}

/**
 * Props for the ChatMessage component
 */
export interface ChatMessageProps {
  /** Unique message ID */
  id: string;

  /** Message content (text or markdown) - DEPRECATED: use parts instead */
  content?: string;

  /** Message parts array - supports interleaved text and tool calls */
  parts?: ChatMessagePart[];

  /** When the message was sent */
  timestamp: string | number | Date;

  /** Sender's display name */
  senderName: string;

  /** Sender's avatar color */
  senderColor?: string;

  /** Whether this message is from the current user (highlights the message) */
  isOwn?: boolean;

  /** Whether this is a system message (full-width, distinct styling) */
  isSystem?: boolean;

  /** Whether this is a consecutive message from the same sender (hides avatar/name) */
  isConsecutive?: boolean;

  /** Whether to render content as markdown (default: true) */
  renderMarkdown?: boolean;

  /** Whether the message is currently being streamed */
  isStreaming?: boolean;

  /** Tool calls made during this message (for AI assistants) - DEPRECATED: use parts instead */
  toolCalls?: ChatMessageToolCall[];

  /** Menu items for message actions (edit, delete, etc.) */
  menuItems?: MenuItem[];

  /** Called when a menu item is selected */
  onMenuSelect?: (value: string, messageId: string) => void;

  /** Custom avatar element (overrides default Avatar) */
  avatar?: ReactNode;

  /** Additional CSS class */
  className?: string;

  /** Callback when a link is clicked in the message content */
  onLinkClick?: (href: string) => void;
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
  parts,
  timestamp,
  senderName,
  senderColor,
  isOwn = false,
  isSystem = false,
  isConsecutive = false,
  renderMarkdown = true,
  isStreaming = false,
  toolCalls,
  menuItems,
  onMenuSelect,
  avatar,
  className = '',
  onLinkClick,
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

  // Convert legacy content/toolCalls to parts format if parts not provided
  const messageParts: ChatMessagePart[] = parts ?? [
    ...(content ? [{ type: 'text' as const, text: content }] : []),
    ...(toolCalls && toolCalls.length > 0 ? [{ type: 'tool_calls' as const, calls: toolCalls }] : []),
  ];

  // Get first text content for system messages
  const firstTextPart = messageParts.find((p): p is ChatMessageTextPart => p.type === 'text');
  const firstTextContent = firstTextPart?.text ?? '';

  // System messages have a simplified layout
  if (isSystem) {
    return (
      <div className={`${styles.systemMessage} ${className}`} data-message-id={id}>
        <div className={styles.systemContent}>
          {renderMarkdown ? (
            <MarkdownRenderer
              content={firstTextContent}
              enableDeepLinks={false}
              showLineNumbers={false}
              className={styles.systemMarkdown}
              onDeepLinkClick={onLinkClick}
            />
          ) : (
            <p className={styles.systemText}>{firstTextContent}</p>
          )}
        </div>
      </div>
    );
  }

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

      {/* Column 3: Content - render parts in order */}
      <div className={styles.content}>
        {messageParts.map((part, partIndex) => {
          // Skip invalid parts (defensive against malformed data)
          if (!part || typeof part !== 'object') {
            console.warn('[ChatMessage] Invalid part at index', partIndex, ':', part);
            return null;
          }

          if (part.type === 'text') {
            // Ensure text is a string (defensive against malformed data)
            const textContent = typeof part.text === 'string' ? part.text : String(part.text ?? '');
            return (
              <div key={partIndex} className={styles.textPart}>
                {renderMarkdown ? (
                  <MarkdownRenderer
                    content={textContent}
                    enableDeepLinks={false}
                    showLineNumbers={false}
                    imageAuthor={senderName}
                    imageTimestamp={typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString()}
                    className={styles.markdownContent}
                    onDeepLinkClick={onLinkClick}
                  />
                ) : (
                  <p className={styles.plainText}>{textContent}</p>
                )}
              </div>
            );
          }

          if (part.type === 'tool_calls') {
            // Ensure calls is an array (defensive against malformed data)
            const calls = Array.isArray(part.calls) ? part.calls : [];
            return (
              <div key={partIndex} className={styles.toolCalls}>
                {calls.map((toolCall, toolIndex) => {
                  const isComplete = !!toolCall.output;
                  // Ensure output is a string
                  const outputText = typeof toolCall.output === 'string' ? toolCall.output : '';
                  return (
                    <div key={toolIndex} className={styles.toolCallWrapper}>
                      <div
                        className={`${styles.toolCall} ${isComplete ? styles.toolComplete : styles.toolRunning}`}
                      >
                        <span className={styles.toolIcon}>
                          {isComplete ? <CheckIcon /> : <Spinner size="sm" />}
                        </span>
                        <span className={styles.toolDescription}>
                          {formatToolDescription(toolCall.name, toolCall.input)}
                        </span>
                        <ToolTimer startTime={toolCall.startTime} isComplete={isComplete} />
                      </div>
                      {isComplete && outputText && (
                        <div className={styles.toolResult}>
                          <pre className={styles.toolResultContent}>
                            {outputText.length > 200
                              ? `${outputText.slice(0, 200)}...`
                              : outputText}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          return null;
        })}

        {/* Streaming indicator */}
        {isStreaming && (
          <BusyIndicator
            size="md"
            label="Generating response"
            className={styles.streamingIndicator}
          />
        )}
      </div>
    </div>
  );
}

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
