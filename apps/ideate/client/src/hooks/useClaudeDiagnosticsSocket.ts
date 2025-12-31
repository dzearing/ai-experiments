import { useEffect, useRef, useState, useCallback } from 'react';
import { CLAUDE_DIAGNOSTICS_WS_URL } from '../config';
import type {
  ClaudeSession,
  SessionMessage,
  SessionType,
  ServerMessage,
  ClientMessage,
  ClientClearSessionsMessage,
} from '../components/ClaudeDiagnostics/types';

/**
 * Options for the useClaudeDiagnosticsSocket hook
 */
export interface UseClaudeDiagnosticsSocketOptions {
  /** Callback when session list is received */
  onSessionList?: (sessions: ClaudeSession[]) => void;
  /** Callback when messages are received for a session */
  onSessionMessages?: (sessionType: SessionType, sessionId: string, messages: SessionMessage[]) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Return type for the useClaudeDiagnosticsSocket hook
 */
export interface UseClaudeDiagnosticsSocketReturn {
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Request a refresh of the session list */
  refresh: () => void;
  /** Subscribe to a specific session's messages */
  subscribeSession: (sessionType: SessionType, sessionId: string, limit?: number) => void;
  /** Unsubscribe from session updates */
  unsubscribeSession: () => void;
  /** Get messages for a session (one-time request) */
  getMessages: (sessionType: SessionType, sessionId: string, limit?: number) => void;
  /** Clear all sessions (or specific type) */
  clearSessions: (sessionType?: SessionType) => void;
}

/**
 * Hook for connecting to the Claude diagnostics WebSocket.
 *
 * This hook:
 * - Connects when mounted, disconnects when unmounted (lazy loading)
 * - Auto-reconnects on disconnect
 * - Provides methods to interact with the WebSocket
 */
export function useClaudeDiagnosticsSocket(
  options: UseClaudeDiagnosticsSocketOptions = {}
): UseClaudeDiagnosticsSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Send a message to the WebSocket
  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('[ClaudeDiagnostics] Connecting...');
    const ws = new WebSocket(CLAUDE_DIAGNOSTICS_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[ClaudeDiagnostics] Connected');
      setIsConnected(true);
      optionsRef.current.onConnectionChange?.(true);
    };

    ws.onclose = () => {
      console.log('[ClaudeDiagnostics] Disconnected');
      setIsConnected(false);
      optionsRef.current.onConnectionChange?.(false);

      // Reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[ClaudeDiagnostics] Reconnecting...');
        connect();
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error('[ClaudeDiagnostics] WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('[ClaudeDiagnostics] Failed to parse message:', error);
      }
    };
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'session_list':
        optionsRef.current.onSessionList?.(message.sessions);
        break;

      case 'session_messages':
        optionsRef.current.onSessionMessages?.(
          message.sessionType,
          message.sessionId,
          message.messages
        );
        break;

      case 'error':
        console.error('[ClaudeDiagnostics] Server error:', message.error);
        optionsRef.current.onError?.(message.error);
        break;

      case 'pong':
        // Heartbeat response
        break;
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Public methods
  const refresh = useCallback(() => {
    sendMessage({ type: 'refresh' });
  }, [sendMessage]);

  const subscribeSession = useCallback((
    sessionType: SessionType,
    sessionId: string,
    limit?: number
  ) => {
    sendMessage({
      type: 'subscribe_session',
      sessionType,
      sessionId,
      limit,
    });
  }, [sendMessage]);

  const unsubscribeSession = useCallback(() => {
    sendMessage({ type: 'unsubscribe_session' });
  }, [sendMessage]);

  const getMessages = useCallback((
    sessionType: SessionType,
    sessionId: string,
    limit?: number
  ) => {
    sendMessage({
      type: 'get_messages',
      sessionType,
      sessionId,
      limit,
    });
  }, [sendMessage]);

  const clearSessions = useCallback((sessionType?: SessionType) => {
    sendMessage({
      type: 'clear_sessions',
      sessionType,
    } as ClientClearSessionsMessage);
  }, [sendMessage]);

  return {
    isConnected,
    refresh,
    subscribeSession,
    unsubscribeSession,
    getMessages,
    clearSessions,
  };
}
