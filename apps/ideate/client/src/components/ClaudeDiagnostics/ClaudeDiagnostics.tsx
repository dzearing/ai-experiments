import { useState, useCallback } from 'react';
import { SplitPane, Spinner } from '@ui-kit/react';
import { ConfirmDialog } from '../ConfirmDialog';
import { SessionList } from './SessionList';
import { SessionDetail } from './SessionDetail';
import { useClaudeDiagnosticsSocket } from '../../hooks/useClaudeDiagnosticsSocket';
import type { ClaudeSession, SessionMessage, RoleFilter, SessionType, InFlightRequest } from './types';
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
  const [inFlightRequests, setInFlightRequests] = useState<InFlightRequest[]>([]);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

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

  // Handle in-flight request list
  const handleInFlightList = useCallback((requests: InFlightRequest[]) => {
    setInFlightRequests(requests);
  }, []);

  // Handle in-flight request updates
  const handleInFlightUpdate = useCallback((request: InFlightRequest) => {
    setInFlightRequests((prev) => {
      // If completed or error, remove after a delay (handled by server)
      // For now, update or add the request
      const existing = prev.findIndex((r) => r.id === request.id);
      if (request.status === 'completed' || request.status === 'error') {
        // Remove from list
        return prev.filter((r) => r.id !== request.id);
      }
      if (existing >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existing] = request;
        return updated;
      }
      // Add new
      return [...prev, request];
    });
  }, []);

  // Connect to WebSocket (lazy - only when this component is mounted)
  const { isConnected, getMessages, clearSessions } = useClaudeDiagnosticsSocket({
    onSessionList: handleSessionList,
    onSessionMessages: handleSessionMessages,
    onError: handleError,
    onInFlightList: handleInFlightList,
    onInFlightUpdate: handleInFlightUpdate,
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
    setClearConfirmOpen(true);
  }, []);

  // Confirm clearing all sessions
  const handleConfirmClear = useCallback(() => {
    clearSessions();
    setSelectedSession(null);
    setMessages([]);
    setClearConfirmOpen(false);
  }, [clearSessions]);

  // Cancel clearing sessions
  const handleCancelClear = useCallback(() => {
    setClearConfirmOpen(false);
  }, []);

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
      inFlightRequests={inFlightRequests}
    />
  );

  // Filter in-flight requests to only show ones for the selected session
  const sessionInFlightRequests = selectedSession
    ? inFlightRequests.filter(
        (req) =>
          req.sessionType === selectedSession.type &&
          req.sessionId === selectedSession.id
      )
    : [];

  // Right pane: Session Detail or empty state
  const rightPane = selectedSession ? (
    <SessionDetail
      session={selectedSession}
      messages={messages}
      isLoading={isLoadingMessages}
      roleFilter={roleFilter}
      searchQuery={searchQuery}
      inFlightRequests={sessionInFlightRequests}
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

      {/* Clear sessions confirmation dialog */}
      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear Session Logs?"
        message="Are you sure you want to clear all session logs? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
      />
    </div>
  );
}
