import { useMemo } from 'react';
import { SearchInput, Select, RelativeTime, Text, Chip, Button, Spinner } from '@ui-kit/react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import type { ClaudeSession, RoleFilter, InFlightRequest } from './types';
import styles from './ClaudeDiagnostics.module.css';

interface SessionListProps {
  sessions: ClaudeSession[];
  selectedSession: ClaudeSession | null;
  onSelectSession: (session: ClaudeSession) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (filter: RoleFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearSessions: () => void;
  inFlightRequests?: InFlightRequest[];
}

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Messages' },
  { value: 'user', label: 'User Only' },
  { value: 'assistant', label: 'Assistant Only' },
];

/**
 * Get icon letter for session type
 */
function getTypeIcon(type: ClaudeSession['type']): string {
  switch (type) {
    case 'facilitator':
      return 'F';
    case 'chatroom':
      return 'C';
    case 'ideaagent':
      return 'I';
    case 'planagent':
      return 'P';
    case 'importagent':
      return 'M';
    default:
      return '?';
  }
}

/**
 * Master list of all chat sessions.
 * Includes filter controls and clickable session rows.
 */
/**
 * Get status label for in-flight request
 */
function getStatusLabel(status: InFlightRequest['status']): string {
  switch (status) {
    case 'pending':
      return 'Starting...';
    case 'streaming':
      return 'Streaming...';
    case 'completed':
      return 'Done';
    case 'error':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export function SessionList({
  sessions,
  selectedSession,
  onSelectSession,
  roleFilter,
  onRoleFilterChange,
  searchQuery,
  onSearchQueryChange,
  onClearSessions,
  inFlightRequests = [],
}: SessionListProps) {
  // Filter sessions by search query (matches name)
  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter((s) => s.name.toLowerCase().includes(query));
  }, [sessions, searchQuery]);

  return (
    <div className={styles.sessionListPane}>
      {/* Header with Title and Filters */}
      <div className={styles.sessionListHeader}>
        <div className={styles.sessionListTitleRow}>
          <Text size="base" weight="semibold">Chat Sessions ({sessions.length})</Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSessions}
            disabled={sessions.length === 0}
            title="Clear all session logs"
          >
            <TrashIcon size={16} />
          </Button>
        </div>
        <div className={styles.filterBar}>
          <Select
            size="sm"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
            options={ROLE_FILTER_OPTIONS}
          />
          <SearchInput
            size="sm"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* In-Flight Requests */}
      {inFlightRequests.length > 0 && (
        <div className={styles.inFlightSection}>
          <Text size="xs" weight="semibold" color="soft" className={styles.inFlightHeader}>
            Active Requests ({inFlightRequests.length})
          </Text>
          {inFlightRequests.map((request) => (
            <div key={request.id} className={styles.inFlightRow}>
              <div className={styles.inFlightSpinner}>
                <Spinner size="sm" />
              </div>
              <div className={styles.inFlightInfo}>
                <Text size="sm" weight="medium">
                  {request.sessionType}: {request.sessionId.slice(0, 8)}...
                </Text>
                <div className={styles.inFlightMeta}>
                  <Chip size="sm" variant={request.status === 'streaming' ? 'success' : 'default'}>
                    {getStatusLabel(request.status)}
                  </Chip>
                  <Text size="xs" color="soft">
                    {Math.round((Date.now() - request.startTime) / 1000)}s
                  </Text>
                </div>
                <Text size="xs" color="soft" className={styles.inFlightMessage}>
                  {request.userMessage.slice(0, 50)}{request.userMessage.length > 50 ? '...' : ''}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session List */}
      <div className={styles.sessionList}>
        {filteredSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <Text color="soft">
              {sessions.length === 0
                ? 'No chat sessions found'
                : 'No sessions match your search'}
            </Text>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={`${session.type}-${session.id}`}
              className={`${styles.sessionRow} ${
                selectedSession?.id === session.id && selectedSession?.type === session.type
                  ? styles.selected
                  : ''
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className={`${styles.sessionIcon} ${styles[session.type]}`}>
                {getTypeIcon(session.type)}
              </div>
              <div className={styles.sessionInfo}>
                <Text size="sm" weight="medium" className={styles.sessionName}>
                  {session.name}
                </Text>
                <div className={styles.sessionMeta}>
                  <Chip size="sm" variant="default">{session.messageCount} msgs</Chip>
                  <RelativeTime timestamp={session.lastActivity} format="short" size="sm" color="soft" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
