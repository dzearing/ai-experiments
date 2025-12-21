import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { YjsCollaborationHandler, DiagnosticEvent } from './YjsCollaborationHandler.js';

/**
 * WebSocket handler for real-time diagnostics.
 *
 * Connects to the YjsCollaborationHandler's event stream and broadcasts
 * diagnostic events to connected clients in real-time.
 */
export class DiagnosticsHandler {
  private clients: Set<WebSocket> = new Set();
  private yjsHandler: YjsCollaborationHandler;

  constructor(yjsHandler: YjsCollaborationHandler) {
    this.yjsHandler = yjsHandler;

    // Subscribe to diagnostic events from the Yjs handler
    this.yjsHandler.on('diagnostic', (event: DiagnosticEvent) => {
      // For events that change rooms/clients state, include updated state
      const stateChangingEvents = ['client_join', 'client_leave', 'room_create', 'room_ready', 'room_destroy', 'awareness'];

      if (stateChangingEvents.includes(event.type)) {
        // Include current rooms and clients data for live updates
        const snapshot = this.yjsHandler.getDiagnosticSnapshot();
        this.broadcast({
          type: 'event',
          event,
          rooms: snapshot.rooms,
          clients: snapshot.clients,
        });
      } else {
        this.broadcast({
          type: 'event',
          event,
        });
      }
    });
  }

  /**
   * Handle a new WebSocket connection for diagnostics.
   */
  handleConnection(ws: WebSocket, _req: IncomingMessage): void {
    this.clients.add(ws);
    console.log(`[Diagnostics] Client connected (${this.clients.size} total)`);

    // Send full snapshot on connect
    const snapshot = this.yjsHandler.getDiagnosticSnapshot();
    this.send(ws, {
      type: 'snapshot',
      data: snapshot,
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`[Diagnostics] Client disconnected (${this.clients.size} remaining)`);
    });

    ws.on('error', (error) => {
      console.error('[Diagnostics] WebSocket error:', error);
      this.clients.delete(ws);
    });

    // Handle incoming messages (for future request-response patterns)
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch {
        console.error('[Diagnostics] Failed to parse message');
      }
    });
  }

  /**
   * Handle an incoming message from a client.
   */
  private handleMessage(ws: WebSocket, message: { type: string; payload?: unknown }): void {
    switch (message.type) {
      case 'refresh':
        // Client requests a fresh snapshot
        const snapshot = this.yjsHandler.getDiagnosticSnapshot();
        this.send(ws, {
          type: 'snapshot',
          data: snapshot,
        });
        break;

      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      default:
        console.log(`[Diagnostics] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Send a message to a single client.
   */
  private send(ws: WebSocket, message: object): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected clients.
   */
  private broadcast(message: object): void {
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
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
  }
}
