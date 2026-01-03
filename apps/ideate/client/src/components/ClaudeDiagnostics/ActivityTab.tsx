import { useMemo } from 'react';
import { Text, Spinner, Chip, Code, Card } from '@ui-kit/react';
import { MessageRow } from './MessageRow';
import type { SessionMessage, RoleFilter, InFlightRequest } from './types';
import styles from './ClaudeDiagnostics.module.css';

/**
 * Extract text from content that may be a string or an array of content blocks
 */
function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'text' in block) {
          return String(block.text);
        }
        return '';
      })
      .join('\n');
  }
  if (content && typeof content === 'object' && 'text' in content) {
    return String((content as { text: unknown }).text);
  }
  return JSON.stringify(content);
}

interface ActivityTabProps {
  messages: SessionMessage[];
  roleFilter: RoleFilter;
  searchQuery: string;
  inFlightRequests?: InFlightRequest[];
}

/**
 * Format elapsed time from start
 */
function formatElapsed(startTime: number): string {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  if (elapsed < 60) return `${elapsed}s`;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Format timestamp to time string
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Get status label for in-flight request
 */
function getStatusLabel(status: InFlightRequest['status']): string {
  switch (status) {
    case 'pending':
      return 'Starting...';
    case 'streaming':
      return 'Streaming';
    case 'completed':
      return 'Done';
    case 'error':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

/**
 * Activity tab showing list of messages with filtering.
 * Messages are shown in chronological order (newest at bottom).
 */
export function ActivityTab({ messages, roleFilter, searchQuery, inFlightRequests = [] }: ActivityTabProps) {
  // Filter messages based on role and search query
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Filter by role
      if (roleFilter !== 'all' && msg.role !== roleFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contentMatch = extractTextContent(msg.content).toLowerCase().includes(query);
        const senderMatch = msg.senderName?.toLowerCase().includes(query);
        if (!contentMatch && !senderMatch) {
          return false;
        }
      }

      return true;
    });
  }, [messages, roleFilter, searchQuery]);

  // Active in-flight requests (pending or streaming)
  const activeRequests = inFlightRequests.filter(
    (req) => req.status === 'pending' || req.status === 'streaming'
  );

  if (filteredMessages.length === 0 && activeRequests.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text color="soft">
          {messages.length === 0
            ? 'No messages in this session'
            : 'No messages match your filter'}
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.activityTab}>
      {/* In-flight requests shown at top */}
      {activeRequests.map((request) => (
        <div key={request.id} className={styles.pendingRequestRow}>
          <div className={styles.pendingRequestHeader}>
            <Spinner size="sm" />
            <Chip size="sm" variant={request.status === 'streaming' ? 'success' : 'warning'}>
              {getStatusLabel(request.status)}
            </Chip>
            <Text size="sm" color="soft">
              Started {formatTime(request.startTime)} • {formatElapsed(request.startTime)} elapsed
            </Text>
          </div>
          <div className={styles.pendingRequestContent}>
            <Text size="xs" weight="semibold" color="soft" className={styles.requestLabel}>
              REQUEST
            </Text>
            <Card className={styles.pendingRequestCard}>
              <Code block>{request.userMessage}</Code>
            </Card>
            {request.partialResponse && (
              <>
                <Text size="xs" weight="semibold" color="soft" className={styles.requestLabel}>
                  RESPONSE (partial)
                </Text>
                <Card className={styles.pendingRequestCard}>
                  <Code block>{request.partialResponse}</Code>
                </Card>
              </>
            )}
            {request.tokenUsage && (
              <div className={styles.pendingRequestMeta}>
                <Text size="xs" color="soft">
                  Tokens: {request.tokenUsage.inputTokens.toLocaleString()} in / {request.tokenUsage.outputTokens.toLocaleString()} out
                </Text>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Completed messages */}
      {filteredMessages.map((message) => (
        <MessageRow key={message.id} message={message} />
      ))}
    </div>
  );
}
