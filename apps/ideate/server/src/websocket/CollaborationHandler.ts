import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  ws: WebSocket;
  userId?: string;
  userName?: string;
  color: string;
  documentId?: string;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
}

interface DocumentSession {
  documentId: string;
  clients: Map<string, Client>;
  content: string;
  version: number;
}

// Predefined colors for collaborators
const COLLABORATOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

export class CollaborationHandler {
  private clients: Map<string, Client> = new Map();
  private sessions: Map<string, DocumentSession> = new Map();

  /**
   * Handle a new WebSocket connection.
   */
  handleConnection(ws: WebSocket, _req: IncomingMessage): void {
    const clientId = uuidv4();
    const colorIndex = this.clients.size % COLLABORATOR_COLORS.length;

    const client: Client = {
      id: clientId,
      ws,
      color: COLLABORATOR_COLORS[colorIndex],
      cursorPosition: 0,
      selectionStart: 0,
      selectionEnd: 0,
    };

    this.clients.set(clientId, client);
    console.log(`Client connected: ${clientId}`);

    // Send client their ID
    this.send(ws, {
      type: 'connected',
      clientId,
      color: client.color,
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`Client error ${clientId}:`, error);
      this.handleDisconnect(client);
    });
  }

  /**
   * Handle a message from a client.
   */
  private handleMessage(
    client: Client,
    message: {
      type: string;
      documentId?: string;
      userId?: string;
      userName?: string;
      content?: string;
      edits?: Array<{ from: number; to: number; insert: string }>;
      cursorPosition?: number;
      selectionStart?: number;
      selectionEnd?: number;
    }
  ): void {
    switch (message.type) {
      case 'join':
        this.handleJoin(client, message);
        break;
      case 'leave':
        this.handleLeave(client);
        break;
      case 'edit':
        this.handleEdit(client, message);
        break;
      case 'cursor':
        this.handleCursor(client, message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle a client joining a document.
   */
  private handleJoin(
    client: Client,
    message: {
      documentId?: string;
      userId?: string;
      userName?: string;
      content?: string;
    }
  ): void {
    const { documentId, userId, userName, content } = message;

    if (!documentId) return;

    // Leave any existing document
    if (client.documentId) {
      this.handleLeave(client);
    }

    client.documentId = documentId;
    client.userId = userId;
    client.userName = userName || 'Anonymous';

    // Get or create session
    let session = this.sessions.get(documentId);

    if (!session) {
      session = {
        documentId,
        clients: new Map(),
        content: content || '',
        version: 0,
      };
      this.sessions.set(documentId, session);
    }

    session.clients.set(client.id, client);

    // Send current state to joining client
    this.send(client.ws, {
      type: 'sync',
      documentId,
      content: session.content,
      version: session.version,
      coAuthors: this.getCoAuthors(session, client.id),
    });

    // Notify others that someone joined
    this.broadcastToDocument(documentId, client.id, {
      type: 'presence',
      action: 'joined',
      userId: client.userId,
      userName: client.userName,
      color: client.color,
      clientId: client.id,
    });

    console.log(`Client ${client.id} joined document ${documentId}`);
  }

  /**
   * Handle a client leaving a document.
   */
  private handleLeave(client: Client): void {
    const { documentId } = client;

    if (!documentId) return;

    const session = this.sessions.get(documentId);

    if (session) {
      session.clients.delete(client.id);

      // Notify others
      this.broadcastToDocument(documentId, client.id, {
        type: 'presence',
        action: 'left',
        userId: client.userId,
        clientId: client.id,
      });

      // Clean up empty sessions
      if (session.clients.size === 0) {
        this.sessions.delete(documentId);
      }
    }

    client.documentId = undefined;
    console.log(`Client ${client.id} left document ${documentId}`);
  }

  /**
   * Handle an edit operation.
   */
  private handleEdit(
    client: Client,
    message: {
      edits?: Array<{ from: number; to: number; insert: string }>;
    }
  ): void {
    const { documentId } = client;
    const { edits } = message;

    if (!documentId || !edits) return;

    const session = this.sessions.get(documentId);

    if (!session) return;

    // Apply edits to session content
    for (const edit of edits.sort((a, b) => b.from - a.from)) {
      const before = session.content.slice(0, edit.from);
      const after = session.content.slice(edit.to);
      session.content = before + edit.insert + after;
    }

    session.version++;

    // Broadcast to all other clients
    this.broadcastToDocument(documentId, client.id, {
      type: 'edit',
      edits,
      version: session.version,
      clientId: client.id,
      userId: client.userId,
      userName: client.userName,
      color: client.color,
    });
  }

  /**
   * Handle cursor position update.
   */
  private handleCursor(
    client: Client,
    message: {
      cursorPosition?: number;
      selectionStart?: number;
      selectionEnd?: number;
    }
  ): void {
    const { documentId } = client;

    if (!documentId) return;

    client.cursorPosition = message.cursorPosition ?? client.cursorPosition;
    client.selectionStart = message.selectionStart ?? client.selectionStart;
    client.selectionEnd = message.selectionEnd ?? client.selectionEnd;

    // Broadcast cursor position to others
    this.broadcastToDocument(documentId, client.id, {
      type: 'cursor',
      clientId: client.id,
      userId: client.userId,
      userName: client.userName,
      color: client.color,
      cursorPosition: client.cursorPosition,
      selectionStart: client.selectionStart,
      selectionEnd: client.selectionEnd,
    });
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: Client): void {
    this.handleLeave(client);
    this.clients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Get co-author information for a session.
   */
  private getCoAuthors(
    session: DocumentSession,
    excludeClientId: string
  ): Array<{
    id: string;
    name: string;
    color: string;
    cursorPosition: number;
    selectionStart: number;
    selectionEnd: number;
  }> {
    return Array.from(session.clients.values())
      .filter((c) => c.id !== excludeClientId)
      .map((c) => ({
        id: c.id,
        name: c.userName || 'Anonymous',
        color: c.color,
        cursorPosition: c.cursorPosition,
        selectionStart: c.selectionStart,
        selectionEnd: c.selectionEnd,
      }));
  }

  /**
   * Send a message to a WebSocket.
   */
  private send(ws: WebSocket, data: unknown): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast a message to all clients in a document except one.
   */
  private broadcastToDocument(
    documentId: string,
    excludeClientId: string,
    data: unknown
  ): void {
    const session = this.sessions.get(documentId);

    if (!session) return;

    for (const [clientId, client] of session.clients) {
      if (clientId !== excludeClientId) {
        this.send(client.ws, data);
      }
    }
  }
}
