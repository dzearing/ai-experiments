import { type ReactNode, useState, useEffect, useRef, useCallback, memo } from 'react';
import { Avatar, BusyIndicator, Spinner } from '@ui-kit/react';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { XCircleIcon } from '@ui-kit/icons/XCircleIcon';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import { useChatContext } from '../../context';
import { MessageToolbar } from '../MessageToolbar';
import styles from './ChatMessage.module.css';

/**
 * Timer component that shows elapsed time for tool calls
 * @param startTime - When the tool started (epoch ms)
 * @param isComplete - Whether the tool has completed
 * @param duration - Pre-computed duration in ms (used for rehydrated tools)
 */
function ToolTimer({ startTime, isComplete, duration }: { startTime?: number; isComplete: boolean; duration?: number }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalElapsedRef = useRef<number | null>(null);

  useEffect(() => {
    // If duration is provided (rehydrated from storage), use it directly
    if (duration !== undefined && isComplete) {
      setElapsed(duration);
      return;
    }

    // If no start time and no duration, don't show timer
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
  }, [startTime, isComplete, duration]);

  // Don't render if no start time and no duration
  if (!startTime && duration === undefined) return null;

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
  /** When the tool call started (epoch ms) */
  startTime?: number;
  /** When the tool call completed (epoch ms) */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Whether the tool execution is complete */
  completed?: boolean;
  /** Whether the tool execution was cancelled */
  cancelled?: boolean;
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
      // Show command with first argument (e.g., "pnpm install" instead of just "pnpm")
      const fullCmd = input?.command ? String(input.command).trim() : '';
      const cmdParts = fullCmd.split(/\s+/);
      const cmdDisplay = cmdParts.length > 1 ? `${cmdParts[0]} ${cmdParts[1]}` : cmdParts[0];
      return <>Running {cmdDisplay ? bold(cmdDisplay) : 'command'}</>;
    case 'Glob':
      return <>Finding files {input?.pattern ? <>matching {bold(String(input.pattern))}</> : ''}</>;
    case 'Grep':
      return <>Searching for {input?.pattern ? bold(String(input.pattern)) : 'pattern'}</>;
    case 'WebFetch':
    case 'web_fetch':
      return <>Fetching {input?.url ? bold(new URL(String(input.url)).hostname) : 'URL'}</>;
    case 'WebSearch':
    case 'web_search':
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
      return <>Tracking new Thing: {input?.name ? bold(String(input.name)) : ''}</>;
    case 'thing_update':
      return <>Updating Thing {input?.name ? bold(String(input.name)) : ''}</>;
    case 'thing_delete':
      return <>Deleting Thing</>;
    case 'thing_read_linked_files':
      return <>Reading linked files</>;

    // Topic tools (handle both snake_case and space-separated variants)
    case 'topic_list':
    case 'topic list':
      return <>Listing topics</>;
    case 'topic_get':
    case 'topic get':
      return <>Getting topic details</>;
    case 'topic_search':
    case 'topic search':
      return <>Searching for {input?.query ? bold(String(input.query)) : 'topics'}</>;
    case 'topic_create':
    case 'topic create':
      return <>Creating topic {input?.name ? bold(String(input.name)) : ''}</>;
    case 'topic_update':
    case 'topic update':
      return <>Updating topic {input?.name ? bold(String(input.name)) : ''}</>;
    case 'topic_delete':
    case 'topic delete':
      return <>Deleting topic</>;
    case 'topic_move':
    case 'topic move':
      return <>Moving topic</>;
    case 'topic_add_link':
    case 'topic add link':
      return <>Adding link to topic</>;
    case 'topic_remove_link':
    case 'topic remove link':
      return <>Removing link from topic</>;
    case 'topic_read_linked_files':
    case 'topic read linked files':
      return <>Reading linked files</>;

    // Idea tools
    case 'idea_create':
      return <>Creating Idea {input?.title ? bold(String(input.title)) : ''}</>;
    case 'idea_list':
      return <>Listing Ideas{input?.status ? <> ({String(input.status)})</> : ''}</>;
    case 'idea_get':
      return <>Getting Idea details</>;

    // Memory/Facts tools
    case 'remember_fact':
      return <>Remembering: {input?.subject ? bold(String(input.subject)) : 'fact'}</>;
    case 'recall_facts':
      return <>Recalling remembered facts</>;
    case 'forget_fact':
      return <>Forgetting fact</>;

    // Navigation/UI action tools
    case 'open_idea_workspace': {
      // Try to extract idea name from initialGreeting (e.g., "I'm crafting an Idea for **Hello World App**!")
      // Look for text between ** ** markers
      if (input?.initialGreeting) {
        const greetingStr = String(input.initialGreeting);
        const boldMatch = greetingStr.match(/\*\*([^*]+)\*\*/);
        if (boldMatch && boldMatch[1]) {
          return <>Opening Idea: {bold(boldMatch[1])}</>;
        }
      }
      // If existing idea by ID, just say "Opening Idea"
      if (input?.ideaId) {
        return <>Opening Idea</>;
      }
      // Fallback for new ideas without context
      return <>Opening Idea workspace</>;
    }
    case 'navigate_to_thing':
      return <>Navigating to Thing</>;
    case 'close_facilitator':
      return <>Closing assistant</>;

    // File tools
    case 'file_read':
      return <>Reading {input?.path ? bold(getFileName(String(input.path))) : 'file'}</>;
    case 'file_list':
      return <>Listing {input?.path ? bold(getFileName(String(input.path))) : 'directory'}</>;

    default:
      // For unknown tools, format nicely: replace underscores with spaces, capitalize
      return <>{normalizedName.replace(/_/g, ' ')}</>;
  }
}

/**
 * Determines whether a tool's output should be hidden from display.
 * Some tools (like navigation actions) return internal JSON that isn't useful to show.
 */
function shouldHideToolOutput(name: string): boolean {
  const normalizedName = normalizeMcpToolName(name);
  const hiddenOutputTools = [
    // Navigation/UI action tools - their outputs are internal JSON actions
    'open_idea_workspace',
    'navigate_to_thing',
    'close_facilitator',
    // Creation tools - output is verbose JSON, description is sufficient
    'thing_create',
    'idea_create',
    'workspace_create',
    'document_create',
    // Memory/Facts tools - output is internal confirmation
    'remember_fact',
    'forget_fact',
  ];
  return hiddenOutputTools.includes(normalizedName);
}

/**
 * Extract plain text content from message parts for clipboard copy
 */
function extractTextContent(parts: ChatMessagePart[]): string {
  return parts
    .filter((p): p is ChatMessageTextPart => p.type === 'text')
    .map(p => p.text)
    .join('\n');
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

  /** Enable edit button in toolbar (default: false) */
  enableEdit?: boolean;

  /** Callback when edit is clicked on toolbar */
  onEdit?: (messageId: string) => void;

  /** Custom avatar element (overrides default Avatar) */
  avatar?: ReactNode;

  /** Additional CSS class */
  className?: string;

  /** Callback when a link is clicked in the message content */
  onLinkClick?: (href: string) => void;
}

/**
 * Custom comparison for React.memo to prevent unnecessary re-renders.
 * Only re-renders when message content or display state actually changes.
 */
function arePropsEqual(prevProps: ChatMessageProps, nextProps: ChatMessageProps): boolean {
  // Fast path: same reference means definitely equal
  if (prevProps === nextProps) return true;

  // Check primitive props that affect rendering
  if (
    prevProps.id !== nextProps.id ||
    prevProps.content !== nextProps.content ||
    prevProps.senderName !== nextProps.senderName ||
    prevProps.senderColor !== nextProps.senderColor ||
    prevProps.isOwn !== nextProps.isOwn ||
    prevProps.isSystem !== nextProps.isSystem ||
    prevProps.isConsecutive !== nextProps.isConsecutive ||
    prevProps.isStreaming !== nextProps.isStreaming ||
    prevProps.renderMarkdown !== nextProps.renderMarkdown ||
    prevProps.className !== nextProps.className
  ) {
    return false;
  }

  // Check parts array (shallow comparison of reference, then content)
  if (prevProps.parts !== nextProps.parts) {
    // If one is undefined and other isn't, not equal
    if (!prevProps.parts || !nextProps.parts) return false;
    // If lengths differ, not equal
    if (prevProps.parts.length !== nextProps.parts.length) return false;
    // Check each part
    for (let i = 0; i < prevProps.parts.length; i++) {
      const prev = prevProps.parts[i];
      const next = nextProps.parts[i];
      if (prev.type !== next.type) return false;
      if (prev.type === 'text' && next.type === 'text') {
        if (prev.text !== next.text) return false;
      } else if (prev.type === 'tool_calls' && next.type === 'tool_calls') {
        // For tool calls, check if any tool completion status changed
        if (prev.calls.length !== next.calls.length) return false;
        for (let j = 0; j < prev.calls.length; j++) {
          const prevCall = prev.calls[j];
          const nextCall = next.calls[j];
          if (
            prevCall.name !== nextCall.name ||
            prevCall.output !== nextCall.output ||
            prevCall.completed !== nextCall.completed
          ) {
            return false;
          }
        }
      }
    }
  }

  // Check deprecated toolCalls array
  if (prevProps.toolCalls !== nextProps.toolCalls) {
    if (!prevProps.toolCalls || !nextProps.toolCalls) return false;
    if (prevProps.toolCalls.length !== nextProps.toolCalls.length) return false;
    for (let i = 0; i < prevProps.toolCalls.length; i++) {
      const prev = prevProps.toolCalls[i];
      const next = nextProps.toolCalls[i];
      if (
        prev.name !== next.name ||
        prev.output !== next.output ||
        prev.completed !== next.completed
      ) {
        return false;
      }
    }
  }

  // Edit props
  if (prevProps.enableEdit !== nextProps.enableEdit) return false;

  // Callbacks - reference equality (callers should memoize)
  if (prevProps.onEdit !== nextProps.onEdit) return false;
  if (prevProps.onLinkClick !== nextProps.onLinkClick) return false;

  // Avatar - reference equality
  if (prevProps.avatar !== nextProps.avatar) return false;

  // Timestamp - can change format but unlikely to affect display
  // We do a simple string comparison after converting
  const prevTime = String(prevProps.timestamp);
  const nextTime = String(nextProps.timestamp);
  if (prevTime !== nextTime) return false;

  return true;
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
 *
 * Memoized to prevent re-renders when parent state changes but message data hasn't.
 */
export const ChatMessage = memo(function ChatMessage({
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
  enableEdit = false,
  onEdit,
  avatar,
  className = '',
  onLinkClick,
}: ChatMessageProps) {
  // Try to read chat context (may not exist if ChatMessage used standalone)
  // chatMode will be used in Phase 2 for mode-aware rendering
  let chatMode: '1on1' | 'group' = '1on1';

  try {
    const context = useChatContext();

    chatMode = context.mode;
  } catch {
    // ChatMessage used outside ChatProvider - default to 1on1 mode
  }

  // chatMode is now used for mode-conditional rendering

  // Track which tool outputs are expanded (collapsed by default)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messageRef = useRef<HTMLDivElement>(null);

  const toggleToolExpanded = useCallback((toolKey: string) => {
    // Find the scroll container by walking up the DOM tree
    // Look for the virtualizedMessages container or any scrollable parent
    let scrollContainer: HTMLElement | null = null;
    let element = messageRef.current?.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        scrollContainer = element;
        break;
      }
      element = element.parentElement;
    }

    // Capture scroll position before state change
    const savedScrollTop = scrollContainer?.scrollTop ?? 0;

    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolKey)) {
        next.delete(toolKey);
      } else {
        next.add(toolKey);
      }
      return next;
    });

    // Restore scroll position after DOM updates
    // Use multiple restoration attempts to fight against virtualizer re-measurements
    if (scrollContainer) {
      const restore = () => {
        if (scrollContainer) {
          scrollContainer.scrollTop = savedScrollTop;
        }
      };

      // Immediate restoration
      requestAnimationFrame(restore);
      // Second attempt after React commits
      requestAnimationFrame(() => requestAnimationFrame(restore));
      // Third attempt after virtualizer measures (typical ~16-32ms)
      setTimeout(restore, 50);
      // Final attempt to catch any late adjustments
      setTimeout(restore, 100);
    }
  }, []);

  // Convert legacy content/toolCalls to parts format if parts not provided
  const messageParts: ChatMessagePart[] = parts ?? [
    ...(content ? [{ type: 'text' as const, text: content }] : []),
    ...(toolCalls && toolCalls.length > 0 ? [{ type: 'tool_calls' as const, calls: toolCalls }] : []),
  ];

  // Callback to get message content for clipboard copy
  const getContent = useCallback(() => {
    return extractTextContent(messageParts);
  }, [messageParts]);

  // Callback when edit button is clicked
  const handleEdit = useCallback(() => {
    onEdit?.(id);
  }, [onEdit, id]);

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
    // 1-on-1 mode classes
    chatMode === '1on1' && styles.oneOnOneMessage,
    chatMode === '1on1' && isOwn && styles.oneOnOneUserMessage,
    chatMode === '1on1' && !isOwn && styles.oneOnOneAssistantMessage,
    // Group mode classes
    chatMode === 'group' && styles.groupMessage,
    chatMode === 'group' && isOwn && styles.groupMessageUser,
    chatMode === 'group' && !isOwn && styles.groupMessageOther,
    // Shared classes
    isConsecutive && styles.consecutive,
    isOwn && chatMode !== '1on1' && styles.highlighted, // Only apply highlighted in group mode
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Helper to render message content (reused in both modes)
  const renderMessageContent = () => (
    <>
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
                // Check for cancelled state first
                const isCancelled = toolCall.cancelled ?? false;
                // Use `completed` field if available, otherwise fall back to checking output
                const isComplete = toolCall.completed ?? !!toolCall.output;
                // Ensure output is a string, treat '__complete__' as empty (no box to show)
                const rawOutput = typeof toolCall.output === 'string' ? toolCall.output : '';
                const outputText = rawOutput === '__complete__' ? '' : rawOutput;
                const hasOutput = isComplete && outputText && !shouldHideToolOutput(toolCall.name);
                const toolKey = `${partIndex}-${toolIndex}`;
                const isExpanded = expandedTools.has(toolKey);

                // Determine the status class
                let statusClass = styles.toolRunning;

                if (isCancelled) {
                  statusClass = styles.toolCancelled;
                } else if (isComplete) {
                  statusClass = styles.toolComplete;
                }

                // Determine which icon to show
                const renderIcon = () => {
                  if (isCancelled) {
                    return <XCircleIcon />;
                  }
                  if (isComplete) {
                    return <CheckIcon />;
                  }

                  return <Spinner size="sm" />;
                };

                return (
                  <div key={toolIndex} className={styles.toolCallWrapper}>
                    <button
                      type="button"
                      className={`${styles.toolCall} ${statusClass} ${hasOutput ? styles.toolExpandable : ''}`}
                      onClick={hasOutput ? () => toggleToolExpanded(toolKey) : undefined}
                      disabled={!hasOutput}
                    >
                      <span className={styles.toolIcon}>
                        {renderIcon()}
                      </span>
                      <span className={styles.toolDescription}>
                        {formatToolDescription(toolCall.name, toolCall.input)}
                      </span>
                      <ToolTimer
                        startTime={toolCall.startTime}
                        isComplete={isComplete || isCancelled}
                        duration={toolCall.duration}
                      />
                      {hasOutput && (
                        <span className={`${styles.toolChevron} ${isExpanded ? styles.toolChevronExpanded : ''}`}>
                          <ChevronDownIcon />
                        </span>
                      )}
                    </button>
                    {hasOutput && isExpanded && (
                      <div className={styles.toolResult}>
                        <pre className={styles.toolResultContent}>
                          {outputText}
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
    </>
  );

  return (
    <div
      ref={messageRef}
      className={messageClasses}
      data-message-id={id}
      data-consecutive={chatMode === 'group' ? (isConsecutive ? 'true' : 'false') : undefined}
    >
      {/* GROUP MODE: Avatar + MessageBody (name above content) */}
      {chatMode === 'group' && (
        <>
          {/* Hover toolbar with timestamp and actions */}
          <MessageToolbar
            timestamp={timestamp}
            getContent={getContent}
            isOwn={isOwn}
            showEdit={enableEdit}
            onEdit={handleEdit}
            className={styles.messageToolbar}
          />

          {/* Avatar - always in DOM for layout, visibility controlled by CSS */}
          <div className={styles.groupSenderIndicator} style={senderColor ? { background: senderColor } : undefined}>
            {avatar || (
              <Avatar size="xs" fallback={senderName} color={senderColor} />
            )}
          </div>

          {/* Message body with sender name and content */}
          <div className={styles.groupMessageBody}>
            <div className={`${styles.groupSenderName} ${isOwn ? styles.groupSenderNameUser : styles.groupSenderNameOther}`}>
              {senderName}
            </div>
            <div className={styles.groupContent}>
              {renderMessageContent()}
            </div>
          </div>
        </>
      )}

      {/* 1-ON-1 MODE: Just content (no avatar/timestamp columns) */}
      {chatMode === '1on1' && (
        <>
          {/* Hover toolbar with timestamp and actions */}
          <MessageToolbar
            timestamp={timestamp}
            getContent={getContent}
            isOwn={isOwn}
            showEdit={enableEdit}
            onEdit={handleEdit}
            className={styles.messageToolbar}
          />
          <div className={styles.content}>
            {renderMessageContent()}
          </div>
        </>
      )}
    </div>
  );
}, arePropsEqual);

export default ChatMessage;
