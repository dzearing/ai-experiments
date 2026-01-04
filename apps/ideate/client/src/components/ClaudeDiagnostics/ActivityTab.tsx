import { useMemo, useState, useEffect } from 'react';
import { Text, Spinner, Chip, Code, Card } from '@ui-kit/react';
import { ApiCallView } from './ApiCallView';
import type { SessionMessage, RoleFilter, InFlightRequest } from './types';
import styles from './ClaudeDiagnostics.module.css';

/**
 * Represents a grouped API call (request + optional response)
 */
interface ApiCall {
  id: string;
  request: SessionMessage;
  response?: SessionMessage;
}

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
 * Group messages into API calls (request/response pairs)
 */
function groupIntoApiCalls(messages: SessionMessage[]): ApiCall[] {
  const apiCalls: ApiCall[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];

    if (msg.role === 'user') {
      // Look for the next assistant message as the response
      const nextMsg = messages[i + 1];
      if (nextMsg && nextMsg.role === 'assistant') {
        apiCalls.push({
          id: `${msg.id}-${nextMsg.id}`,
          request: msg,
          response: nextMsg,
        });
        i += 2;
      } else {
        // User message without response (might be pending)
        apiCalls.push({
          id: msg.id,
          request: msg,
        });
        i += 1;
      }
    } else if (msg.role === 'assistant') {
      // Orphan assistant message (shouldn't happen often)
      // Create a synthetic request for display purposes
      apiCalls.push({
        id: msg.id,
        request: {
          ...msg,
          id: `synthetic-${msg.id}`,
          role: 'user',
          content: '(No request captured)',
        },
        response: msg,
      });
      i += 1;
    } else {
      // System or other messages - skip
      i += 1;
    }
  }

  return apiCalls;
}

/**
 * Activity tab showing API calls to the Claude Agent SDK.
 * Groups user requests with their assistant responses.
 * Shows in-flight requests at top, completed calls below.
 */
export function ActivityTab({ messages, roleFilter: _roleFilter, searchQuery, inFlightRequests = [] }: ActivityTabProps) {
  // State for elapsed time updates
  const [, setTick] = useState(0);

  // Update elapsed time display every second when there are active requests
  useEffect(() => {
    const activeRequests = inFlightRequests.filter(
      (req) => req.status === 'pending' || req.status === 'streaming'
    );
    if (activeRequests.length === 0) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inFlightRequests]);

  // Group messages into API calls
  const apiCalls = useMemo(() => {
    return groupIntoApiCalls(messages);
  }, [messages]);

  // Filter API calls based on search query
  const filteredApiCalls = useMemo(() => {
    if (!searchQuery) return apiCalls;

    const query = searchQuery.toLowerCase();
    return apiCalls.filter((call) => {
      const requestMatch = extractTextContent(call.request.content).toLowerCase().includes(query);
      const responseMatch = call.response
        ? extractTextContent(call.response.content).toLowerCase().includes(query)
        : false;
      const toolMatch = call.response?.toolCalls?.some((tc) =>
        tc.name.toLowerCase().includes(query) ||
        JSON.stringify(tc.input).toLowerCase().includes(query)
      );
      return requestMatch || responseMatch || toolMatch;
    });
  }, [apiCalls, searchQuery]);

  // Active in-flight requests (pending or streaming)
  const activeRequests = inFlightRequests.filter(
    (req) => req.status === 'pending' || req.status === 'streaming'
  );

  if (filteredApiCalls.length === 0 && activeRequests.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text color="soft">
          {messages.length === 0
            ? 'No API calls in this session'
            : 'No API calls match your search'}
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

      {/* Completed API calls */}
      {filteredApiCalls.map((call) => (
        <ApiCallView key={call.id} request={call.request} response={call.response} />
      ))}
    </div>
  );
}
