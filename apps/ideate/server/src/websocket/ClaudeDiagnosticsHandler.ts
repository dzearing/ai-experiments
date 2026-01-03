import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import {
  ClaudeDiagnosticsService,
  type ClaudeSession,
  type SessionMessage,
  type SessionType,
  type InFlightRequest,
} from '../services/ClaudeDiagnosticsService.js';
import { getClaudeDiagnosticsService } from '../routes/diagnostics.js';

/**
 * Client message types
 */
interface ClientMessage {
  type: 'refresh' | 'subscribe_session' | 'unsubscribe_session' | 'get_messages' | 'ping' | 'clear_sessions';
  sessionType?: SessionType;
  sessionId?: string;
  limit?: number;
}

/**
 * Server message types
 */
interface ServerMessage {
  type: 'session_list' | 'session_messages' | 'session_update' | 'in_flight_update' | 'in_flight_list' | 'error' | 'pong';
  sessions?: ClaudeSession[];
  messages?: SessionMessage[];
  session?: ClaudeSession;
  error?: string;
  sessionType?: SessionType;
  sessionId?: string;
  /** In-flight request update */
  inFlightRequest?: InFlightRequest;
  /** List of all in-flight requests */
  inFlightRequests?: InFlightRequest[];
}

/**
 * WebSocket handler for Claude diagnostics.
 *
 * Provides real-time access to chat sessions from all three systems:
 * - Facilitator (AI assistant)
 * - Chat Rooms (team chat)
 * - Idea Agent (per-idea AI)
 *
 * This handler connects when the user views the Claude tab in diagnostics,
 * and disconnects when they navigate away (lazy loading).
 */
export class ClaudeDiagnosticsHandler {
  private clients: Set<WebSocket> = new Set();
  private claudeService: ClaudeDiagnosticsService;

  // Track which session each client is viewing
  private clientSubscriptions: Map<WebSocket, { type: SessionType; id: string } | null> = new Map();

  // Polling interval for session list updates (30 seconds)
  private pollInterval: NodeJS.Timeout | null = null;
  private static POLL_INTERVAL_MS = 30000;

  // Cleanup function for in-flight update subscription
  private unsubscribeInFlight: (() => void) | null = null;

  constructor() {
    this.claudeService = getClaudeDiagnosticsService();

    // Subscribe to in-flight request updates
    this.unsubscribeInFlight = this.claudeService.onInFlightUpdate((request) => {
      this.broadcastInFlightUpdate(request);
    });
  }

  /**
   * Handle a new WebSocket connection for Claude diagnostics.
   */
  async handleConnection(ws: WebSocket, _req: IncomingMessage): Promise<void> {
    this.clients.add(ws);
    this.clientSubscriptions.set(ws, null);
    console.log(`[ClaudeDiagnostics] Client connected (${this.clients.size} total)`);

    // Start polling if this is the first client
    if (this.clients.size === 1) {
      this.startPolling();
    }

    // Send full session list on connect
    await this.sendSessionList(ws);

    // Send current in-flight requests
    this.sendInFlightList(ws);

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      this.clientSubscriptions.delete(ws);
      console.log(`[ClaudeDiagnostics] Client disconnected (${this.clients.size} remaining)`);

      // Stop polling if no clients remain
      if (this.clients.size === 0) {
        this.stopPolling();
      }
    });

    ws.on('error', (error) => {
      console.error('[ClaudeDiagnostics] WebSocket error:', error);
      this.clients.delete(ws);
      this.clientSubscriptions.delete(ws);
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('[ClaudeDiagnostics] Failed to parse message:', error);
        this.send(ws, { type: 'error', error: 'Invalid message format' });
      }
    });
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    switch (message.type) {
      case 'refresh':
        // Client requests a fresh session list
        await this.sendSessionList(ws);
        break;

      case 'subscribe_session':
        // Client wants to subscribe to a specific session's updates
        if (message.sessionType && message.sessionId) {
          this.clientSubscriptions.set(ws, {
            type: message.sessionType,
            id: message.sessionId,
          });
          // Send messages for the subscribed session
          await this.sendSessionMessages(ws, message.sessionType, message.sessionId, message.limit);
        }
        break;

      case 'unsubscribe_session':
        // Client wants to unsubscribe from session updates
        this.clientSubscriptions.set(ws, null);
        break;

      case 'get_messages':
        // Client requests messages for a session
        if (message.sessionType && message.sessionId) {
          await this.sendSessionMessages(ws, message.sessionType, message.sessionId, message.limit);
        }
        break;

      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      case 'clear_sessions':
        // Client wants to clear all sessions (or specific type)
        await this.handleClearSessions(ws, message.sessionType);
        break;

      default:
        console.log(`[ClaudeDiagnostics] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle clearing sessions.
   */
  private async handleClearSessions(ws: WebSocket, sessionType?: SessionType): Promise<void> {
    try {
      await this.claudeService.clearAllSessions(sessionType);
      console.log(`[ClaudeDiagnostics] Cleared sessions${sessionType ? ` of type ${sessionType}` : ''}`);
      // Broadcast updated (empty) session list to all clients
      await this.broadcastSessionList();
    } catch (error) {
      console.error('[ClaudeDiagnostics] Error clearing sessions:', error);
      this.send(ws, { type: 'error', error: 'Failed to clear sessions' });
    }
  }

  /**
   * Send the session list to a client.
   */
  private async sendSessionList(ws: WebSocket): Promise<void> {
    try {
      const sessions = await this.claudeService.listAllSessions();
      this.send(ws, {
        type: 'session_list',
        sessions,
      });
    } catch (error) {
      console.error('[ClaudeDiagnostics] Error fetching sessions:', error);
      this.send(ws, { type: 'error', error: 'Failed to fetch sessions' });
    }
  }

  /**
   * Send messages for a specific session to a client.
   */
  private async sendSessionMessages(
    ws: WebSocket,
    sessionType: SessionType,
    sessionId: string,
    limit: number = 100
  ): Promise<void> {
    try {
      const messages = await this.claudeService.getSessionMessages(sessionType, sessionId, limit);
      this.send(ws, {
        type: 'session_messages',
        sessionType,
        sessionId,
        messages,
      });
    } catch (error) {
      console.error('[ClaudeDiagnostics] Error fetching messages:', error);
      this.send(ws, {
        type: 'error',
        error: 'Failed to fetch messages',
        sessionType,
        sessionId,
      });
    }
  }

  /**
   * Start polling for session updates.
   */
  private startPolling(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(async () => {
      await this.broadcastSessionList();
    }, ClaudeDiagnosticsHandler.POLL_INTERVAL_MS);

    console.log('[ClaudeDiagnostics] Started polling for session updates');
  }

  /**
   * Stop polling for session updates.
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('[ClaudeDiagnostics] Stopped polling for session updates');
    }
  }

  /**
   * Broadcast the session list to all connected clients.
   */
  private async broadcastSessionList(): Promise<void> {
    if (this.clients.size === 0) return;

    try {
      const sessions = await this.claudeService.listAllSessions();
      const message: ServerMessage = {
        type: 'session_list',
        sessions,
      };

      this.broadcast(message);
    } catch (error) {
      console.error('[ClaudeDiagnostics] Error broadcasting sessions:', error);
    }
  }

  /**
   * Send the current in-flight request list to a client.
   */
  private sendInFlightList(ws: WebSocket): void {
    const inFlightRequests = this.claudeService.getInFlightRequests();
    this.send(ws, {
      type: 'in_flight_list',
      inFlightRequests,
    });
  }

  /**
   * Broadcast an in-flight request update to all clients.
   */
  private broadcastInFlightUpdate(request: InFlightRequest): void {
    this.broadcast({
      type: 'in_flight_update',
      inFlightRequest: request,
    });
  }

  /**
   * Send a message to a single client.
   */
  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected clients.
   */
  private broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  }

  /**
   * Get the number of connected diagnostics clients.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stopPolling();
    if (this.unsubscribeInFlight) {
      this.unsubscribeInFlight();
      this.unsubscribeInFlight = null;
    }
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.clientSubscriptions.clear();
  }
}
