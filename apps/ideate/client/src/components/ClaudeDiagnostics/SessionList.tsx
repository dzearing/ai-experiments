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
 * Check if a session has an active in-flight request
 */
function hasInFlightRequest(
  session: ClaudeSession,
  inFlightRequests: InFlightRequest[]
): boolean {
  return inFlightRequests.some(
    (req) =>
      req.sessionType === session.type &&
      req.sessionId === session.id &&
      (req.status === 'pending' || req.status === 'streaming')
  );
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
          filteredSessions.map((session) => {
            const isBusy = hasInFlightRequest(session, inFlightRequests);
            return (
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
                {isBusy && (
                  <div className={styles.sessionSpinner}>
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
