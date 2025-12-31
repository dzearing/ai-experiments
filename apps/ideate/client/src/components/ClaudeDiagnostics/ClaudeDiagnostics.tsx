import { useState, useCallback } from 'react';
import { SplitPane, Spinner } from '@ui-kit/react';
import { SessionList } from './SessionList';
import { SessionDetail } from './SessionDetail';
import { useClaudeDiagnosticsSocket } from '../../hooks/useClaudeDiagnosticsSocket';
import type { ClaudeSession, SessionMessage, RoleFilter, SessionType } from './types';
import styles from './ClaudeDiagnostics.module.css';

/**
 * Main Claude Diagnostics component.
 * Shows master-detail view of all chat sessions.
 * Lazy-loads WebSocket connection when mounted.
 */
export function ClaudeDiagnostics() {
  // State
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClaudeSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle session list updates
  const handleSessionList = useCallback((newSessions: ClaudeSession[]) => {
    setSessions(newSessions);
  }, []);

  // Handle messages received for a session
  const handleSessionMessages = useCallback(
    (sessionType: SessionType, sessionId: string, newMessages: SessionMessage[]) => {
      // Only update if this is for the currently selected session
      if (
        selectedSession &&
        selectedSession.type === sessionType &&
        selectedSession.id === sessionId
      ) {
        setMessages(newMessages);
        setIsLoadingMessages(false);
      }
    },
    [selectedSession]
  );

  // Handle WebSocket errors
  const handleError = useCallback((error: string) => {
    console.error('[ClaudeDiagnostics] Error:', error);
    setIsLoadingMessages(false);
  }, []);

  // Connect to WebSocket (lazy - only when this component is mounted)
  const { isConnected, getMessages, clearSessions } = useClaudeDiagnosticsSocket({
    onSessionList: handleSessionList,
    onSessionMessages: handleSessionMessages,
    onError: handleError,
  });

  // Handle session selection
  const handleSelectSession = useCallback(
    (session: ClaudeSession) => {
      setSelectedSession(session);
      setMessages([]);
      setIsLoadingMessages(true);
      // Request messages for the selected session
      getMessages(session.type, session.id, 200);
    },
    [getMessages]
  );

  // Handle clearing all sessions
  const handleClearSessions = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all session logs? This cannot be undone.')) {
      clearSessions();
      setSelectedSession(null);
      setMessages([]);
    }
  }, [clearSessions]);

  // Show loading state while connecting
  if (!isConnected && sessions.length === 0) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="lg" />
        <p>Connecting to diagnostics server...</p>
      </div>
    );
  }

  // Left pane: Session List
  const leftPane = (
    <SessionList
      sessions={sessions}
      selectedSession={selectedSession}
      onSelectSession={handleSelectSession}
      roleFilter={roleFilter}
      onRoleFilterChange={setRoleFilter}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onClearSessions={handleClearSessions}
    />
  );

  // Right pane: Session Detail or empty state
  const rightPane = selectedSession ? (
    <SessionDetail
      session={selectedSession}
      messages={messages}
      isLoading={isLoadingMessages}
      roleFilter={roleFilter}
      searchQuery={searchQuery}
    />
  ) : (
    <div className={styles.emptyState}>
      <p>Select a session to view details</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <SplitPane
        first={leftPane}
        second={rightPane}
        orientation="horizontal"
        defaultSize="300px"
        minSize={250}
        className={styles.splitPane}
      />
    </div>
  );
}
