import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { EventEmitter } from 'events';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

import type { DocumentMetadata } from '../services/documentMetadataExtractor/types.js';
import { extractMetadataFromMarkdown } from '../services/documentMetadataExtractor/extractMetadataFromMarkdown.js';

// Message types for the Yjs WebSocket protocol
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_SESSION = 2; // Custom: session info (sessionId, color)

// Maximum number of diagnostic events to store
const MAX_DIAGNOSTIC_EVENTS = 200;

/**
 * Types of diagnostic events emitted by the handler
 */
export type DiagnosticEventType =
  | 'server_start'
  | 'server_stop'
  | 'client_join'
  | 'client_leave'
  | 'room_create'
  | 'room_ready'
  | 'room_destroy'
  | 'sync'
  | 'awareness'
  | 'persist'
  | 'agent_active'
  | 'agent_inactive';

/**
 * A diagnostic event for monitoring server state
 */
export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: DiagnosticEventType;
  roomName?: string;
  clientId?: number;
  details?: Record<string, unknown>;
}

/**
 * Room data exposed for diagnostics
 */
export interface DiagnosticRoomData {
  name: string;
  /** Document title extracted from the Y.Doc content (first H1 heading) */
  title: string | null;
  clientCount: number;
  docSize: number;
  clients: Array<{
    clientId: number;
    username: string | null;
    color: string;
    awarenessClientId: number | null;
  }>;
}

/**
 * Client data exposed for diagnostics
 */
export interface DiagnosticClientData {
  clientId: number;
  username: string | null;
  roomName: string;
  color: string;
  awarenessClientId: number | null;
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

/**
 * Represents a connected client
 */
interface YjsClient {
  ws: WebSocket;
  roomName: string;
  clientId: number;
  sessionId: string;
  color: string;
  /**
   * The Yjs awareness clientID for this WebSocket connection.
   * Each client has exactly ONE awareness clientID derived from their Y.Doc's clientID.
   * We only track this single ID to ensure proper cleanup on disconnect.
   */
  awarenessClientId: number | null;
}

/**
 * Represents a collaborative document room
 */
interface YjsRoom {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Set<YjsClient>;
  persistPath?: string;
  persistTimeout?: ReturnType<typeof setTimeout>;
  /** Promise that resolves when room is fully initialized (content loaded) */
  ready: Promise<void>;
}

/**
 * Configuration options for the handler
 */
export interface YjsCollaborationHandlerOptions {
  /** Directory to persist documents (optional) */
  persistDir?: string;
  /** Debounce time for persistence in ms (default: 2000) */
  persistDebounceMs?: number;
  /** Callback when a room is created */
  onRoomCreated?: (roomName: string) => void;
  /** Callback when a room is destroyed */
  onRoomDestroyed?: (roomName: string) => void;
  /**
   * Callback to get initial content for a new document.
   * Called when a room is created and no persisted Yjs state exists.
   * Returns the markdown content to initialize the Y.Doc with, or null for empty doc.
   */
  getInitialContent?: (documentId: string) => Promise<string | null>;
}

/**
 * WebSocket handler for Yjs collaborative editing.
 *
 * Implements the y-websocket protocol for real-time synchronization
 * of Yjs documents between multiple clients.
 *
 * Features:
 * - Yjs sync protocol (y-protocols/sync)
 * - Awareness protocol for cursors/presence
 * - Document persistence to filesystem
 * - Room-based collaboration
 */
export class YjsCollaborationHandler extends EventEmitter {
  private rooms: Map<string, YjsRoom> = new Map();
  private clients: Map<WebSocket, YjsClient> = new Map();
  private clientIdCounter = 0;
  private eventIdCounter = 0;
  private diagnosticEvents: DiagnosticEvent[] = [];
  private startTime = Date.now();
  /** Maps sessionId to assigned color (persists across reconnects) */
  private sessionColors: Map<string, string> = new Map();
  /** Counter for assigning colors to new sessions */
  private colorCounter = 0;
  /** Tracks active agent sessions per room (prevents room destruction while agent is working) */
  private agentSessions: Map<string, { userId: string; startedAt: number }> = new Map();
  private options: Required<Omit<YjsCollaborationHandlerOptions, 'getInitialContent'>> & {
    getInitialContent?: (documentId: string) => Promise<string | null>;
  };

  constructor(options: YjsCollaborationHandlerOptions = {}) {
    super();
    this.options = {
      persistDir: options.persistDir ?? '',
      persistDebounceMs: options.persistDebounceMs ?? 2000,
      onRoomCreated: options.onRoomCreated ?? (() => {}),
      onRoomDestroyed: options.onRoomDestroyed ?? (() => {}),
      getInitialContent: options.getInitialContent,
    };

    // Record server start event
    this.recordEvent('server_start', undefined, undefined, {
      persistDir: this.options.persistDir || '(none)',
    });
  }

  /**
   * Record a diagnostic event and emit it
   */
  private recordEvent(
    type: DiagnosticEventType,
    roomName?: string,
    clientId?: number,
    details?: Record<string, unknown>
  ): void {
    const event: DiagnosticEvent = {
      id: `evt-${++this.eventIdCounter}`,
      timestamp: Date.now(),
      type,
      roomName,
      clientId,
      details,
    };

    // Add to circular buffer
    this.diagnosticEvents.push(event);
    if (this.diagnosticEvents.length > MAX_DIAGNOSTIC_EVENTS) {
      this.diagnosticEvents.shift();
    }

    // Emit for real-time subscribers
    this.emit('diagnostic', event);
  }

  /**
   * Get or assign a color for a session.
   * If sessionId exists, returns previously assigned color.
   * If not, assigns a new color and stores it.
   */
  private getOrAssignSessionColor(sessionId: string): string {
    let color = this.sessionColors.get(sessionId);
    if (!color) {
      // Assign next color in rotation
      color = COLLABORATOR_COLORS[this.colorCounter % COLLABORATOR_COLORS.length];
      this.colorCounter++;
      this.sessionColors.set(sessionId, color);
      console.log(`[Yjs] Assigned color ${color} to new session ${sessionId}`);
    }
    return color;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Send session info (sessionId, color) to client
   */
  private sendSessionInfo(ws: WebSocket, sessionId: string, color: string): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SESSION);
    encoding.writeVarString(encoder, JSON.stringify({ sessionId, color }));
    this.send(ws, encoding.toUint8Array(encoder));
  }

  /**
   * Handle a new WebSocket connection.
   * The room name is extracted from the URL path.
   * Session ID is extracted from query params (or generated if not provided).
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    // Extract room name from URL path (e.g., /ws/my-document-id)
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Expect path like /yjs/room-name or just /room-name
    const roomName = pathParts[pathParts.length - 1] || 'default';

    // Get or generate session ID from query params
    let sessionId = url.searchParams.get('sessionId') || '';
    if (!sessionId) {
      sessionId = this.generateSessionId();
    }

    // Get or assign color for this session
    const color = this.getOrAssignSessionColor(sessionId);

    // Create client
    const clientId = this.clientIdCounter++;

    const client: YjsClient = {
      ws,
      roomName,
      clientId,
      sessionId,
      color,
      awarenessClientId: null,
    };

    this.clients.set(ws, client);

    // Get or create room
    const room = this.getOrCreateRoom(roomName);
    room.clients.add(client);

    console.log(`[Yjs] Client ${clientId} joined room "${roomName}" (${room.clients.size} clients)`);
    this.recordEvent('client_join', roomName, clientId, { totalClientsInRoom: room.clients.size });

    // Set up WebSocket handlers
    ws.binaryType = 'arraybuffer';

    // Queue messages until room is ready to prevent race conditions
    // where client sends data before server has loaded initial content
    const messageQueue: RawData[] = [];
    let roomReady = false;

    ws.on('message', (data: RawData) => {
      if (!roomReady) {
        // Queue messages until room is initialized
        messageQueue.push(data);
        return;
      }
      console.log(`[Yjs] Client ${clientId} message received, size: ${(data as ArrayBuffer).byteLength}`);
      this.handleMessage(client, room, data);
    });

    ws.on('close', (code, reason) => {
      console.log(`[Yjs] Client ${clientId} close event, code: ${code}, reason: ${reason?.toString() || 'none'}`);
      this.handleDisconnect(client, room);
    });

    ws.on('error', (error) => {
      console.error(`[Yjs] Client ${clientId} error:`, error);
      this.handleDisconnect(client, room);
    });

    // Wait for room to be fully initialized before sending sync
    // This ensures initial content is loaded before clients start syncing
    room.ready.then(() => {
      roomReady = true;

      // Check if client is still connected
      if (ws.readyState === ws.OPEN) {
        // Send session info (sessionId, color) first so client can use it
        this.sendSessionInfo(ws, sessionId, color);

        // Send initial sync step 1
        this.sendSyncStep1(client, room);

        // Send current awareness state
        this.sendAwarenessState(client, room);

        // Process any queued messages
        for (const data of messageQueue) {
          console.log(`[Yjs] Client ${clientId} processing queued message, size: ${(data as ArrayBuffer).byteLength}`);
          this.handleMessage(client, room, data);
        }
        messageQueue.length = 0; // Clear queue
      }
    }).catch((error) => {
      console.error(`[Yjs] Room initialization failed for "${roomName}":`, error);
    });
  }

  /**
   * Handle an incoming message from a client.
   */
  private handleMessage(client: YjsClient, room: YjsRoom, data: RawData): void {
    try {
      const message = new Uint8Array(data as ArrayBuffer);
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC:
          this.handleSyncMessage(client, room, decoder);
          break;
        case MESSAGE_AWARENESS:
          this.handleAwarenessMessage(client, room, decoder);
          break;
        default:
          console.warn(`[Yjs] Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('[Yjs] Error handling message:', error);
    }
  }

  /**
   * Handle a sync protocol message.
   */
  private handleSyncMessage(
    client: YjsClient,
    room: YjsRoom,
    decoder: decoding.Decoder
  ): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);

    const syncMessageType = syncProtocol.readSyncMessage(
      decoder,
      encoder,
      room.doc,
      null // We don't track transaction origin for now
    );

    // If there's a response to send
    if (encoding.length(encoder) > 1) {
      this.send(client.ws, encoding.toUint8Array(encoder));
    }

    // If this was a sync step 2 or update, broadcast to other clients
    if (syncMessageType === syncProtocol.messageYjsUpdate) {
      // Record sync event
      this.recordEvent('sync', room.name, client.clientId, { messageType: 'update' });

      // Schedule persistence
      this.schedulePersist(room);

      // Broadcast update to other clients
      const updateEncoder = encoding.createEncoder();
      encoding.writeVarUint(updateEncoder, MESSAGE_SYNC);
      encoding.writeVarUint(updateEncoder, syncProtocol.messageYjsUpdate);

      // Get the update from the decoder (it was already applied to the doc)
      // We need to re-encode the update that was just applied
      // Actually, we should broadcast the original message
      // For simplicity, we'll let the doc observer handle broadcasting
    }
  }

  /**
   * Handle an awareness protocol message.
   */
  private handleAwarenessMessage(
    client: YjsClient,
    room: YjsRoom,
    decoder: decoding.Decoder
  ): void {
    const update = decoding.readVarUint8Array(decoder);

    // Extract and track the client's PRIMARY awareness clientID (only once).
    // Each client has exactly ONE awareness clientID derived from their Y.Doc's clientID.
    // We only track this for disconnect cleanup - we must NOT track other clientIDs
    // that may appear in relayed updates, otherwise we'd incorrectly remove other
    // clients' awareness when this client disconnects.
    if (client.awarenessClientId === null) {
      try {
        const updateDecoder = decoding.createDecoder(update);
        const numClients = decoding.readVarUint(updateDecoder);

        for (let i = 0; i < numClients; i++) {
          const awarenessClientId = decoding.readVarUint(updateDecoder);
          decoding.readVarUint(updateDecoder); // clock
          const stateStr = decoding.readVarString(updateDecoder); // state JSON

          // Track the first clientID with actual state (not null/removed).
          // This is the sender's own awareness clientID.
          if (stateStr !== 'null' && stateStr !== '{}') {
            client.awarenessClientId = awarenessClientId;
            break;
          }
        }
      } catch {
        // If decoding fails, continue anyway - the update will still be applied
      }
    }

    awarenessProtocol.applyAwarenessUpdate(room.awareness, update, client.ws);
    this.recordEvent('awareness', room.name, client.clientId);
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: YjsClient, room: YjsRoom): void {
    room.clients.delete(client);
    this.clients.delete(client.ws);
    this.recordEvent('client_leave', room.name, client.clientId, { remainingClients: room.clients.size });

    // Remove client's awareness state using their tracked Yjs awareness clientID
    if (client.awarenessClientId !== null) {
      const clientIds = [client.awarenessClientId];

      // Broadcast awareness removal BEFORE calling removeAwarenessStates
      // because removeAwarenessStates deletes the states from the awareness map
      // and we need them to encode the update
      this.broadcastAwarenessRemoval(room, clientIds);

      // Now remove the states (this will emit 'update' but we've already broadcast)
      awarenessProtocol.removeAwarenessStates(room.awareness, clientIds, 'disconnect');

      console.log(
        `[Yjs] Client ${client.clientId} left room "${room.name}" (removed awareness for clientID: ${client.awarenessClientId})`
      );
    } else {
      console.log(`[Yjs] Client ${client.clientId} left room "${room.name}" (no awareness to remove)`);
    }

    console.log(`[Yjs] Room "${room.name}" now has ${room.clients.size} clients`);

    // Clean up empty room after a short delay (allows for quick reconnects like page refresh)
    if (room.clients.size === 0) {
      setTimeout(() => {
        // Only destroy if this EXACT room object is still in the map and is still empty
        // Using === ensures we don't destroy a recreated room with the same name
        // Also check for active agent sessions - don't destroy while agent is working
        const hasActiveAgent = this.agentSessions.has(room.name);

        if (this.rooms.get(room.name) === room && room.clients.size === 0 && !hasActiveAgent) {
          this.destroyRoom(room);
        } else if (hasActiveAgent) {
          console.log(`[Yjs] Room "${room.name}" kept alive due to active agent session`);
        }
      }, 20000); // Keep room alive for 20 seconds
    }
  }

  /**
   * Get or create a room for a document.
   */
  private getOrCreateRoom(roomName: string): YjsRoom {
    let room = this.rooms.get(roomName);

    if (!room) {
      const doc = new Y.Doc();
      const awareness = new awarenessProtocol.Awareness(doc);

      // CRITICAL: Clear the server's own awareness state.
      // The Awareness constructor automatically calls setLocalState({}), creating
      // a state for the server's Y.Doc clientID. This would appear as a "stale"
      // cursor to clients. The server is just a relay and shouldn't have its own
      // awareness state.
      awareness.setLocalState(null);

      // Create a deferred promise for room initialization
      let resolveReady: () => void;
      const ready = new Promise<void>((resolve) => {
        resolveReady = resolve;
      });

      room = {
        name: roomName,
        doc,
        awareness,
        clients: new Set(),
        persistPath: this.options.persistDir
          ? join(this.options.persistDir, `${roomName}.yjs`)
          : undefined,
        ready,
      };

      // Set up doc update observer for broadcasting
      doc.on('update', (update: Uint8Array, origin: unknown) => {
        // Don't broadcast if origin is a WebSocket (to avoid loops)
        if (origin instanceof WebSocket) {
          console.log(`[Yjs] Doc update from WebSocket, skipping broadcast for room "${roomName}"`);
          return;
        }

        console.log(`[Yjs] Doc update from non-WebSocket origin in room "${roomName}", update size: ${update.length}`);
        this.broadcastUpdate(room!, update);
      });

      // Set up awareness observer for broadcasting
      awareness.on('update', ({ added, updated, removed }: {
        added: number[];
        updated: number[];
        removed: number[];
      }, origin: unknown) => {
        // Skip if this is a disconnect or cleanup removal (we handle those manually)
        if (origin === 'disconnect' || origin === 'cleanup') return;

        const changedClients = added.concat(updated, removed);
        this.broadcastAwareness(room!, changedClients);
      });

      this.rooms.set(roomName, room);

      // Load persisted document if exists, then mark room as ready
      this.loadPersistedDoc(room).then(() => {
        resolveReady!();
        // Emit room_ready event after content is loaded so diagnostics can update
        this.recordEvent('room_ready', roomName, undefined, {
          docSize: Y.encodeStateAsUpdate(room!.doc).length,
        });
      }).catch((error) => {
        console.error(`[Yjs] Failed to load persisted doc for room "${roomName}":`, error);
        resolveReady!(); // Still resolve so clients can connect
        this.recordEvent('room_ready', roomName);
      });

      this.options.onRoomCreated(roomName);
      console.log(`[Yjs] Created room "${roomName}"`);
      this.recordEvent('room_create', roomName, undefined, { totalRooms: this.rooms.size });
    }

    return room;
  }

  /**
   * Destroy a room and clean up resources.
   */
  private destroyRoom(room: YjsRoom): void {
    // Persist before destroying
    if (room.persistPath) {
      this.persistDoc(room).catch(console.error);
    }

    if (room.persistTimeout) {
      clearTimeout(room.persistTimeout);
    }

    room.awareness.destroy();
    room.doc.destroy();
    this.rooms.delete(room.name);

    this.options.onRoomDestroyed(room.name);
    console.log(`[Yjs] Destroyed room "${room.name}"`);
    this.recordEvent('room_destroy', room.name, undefined, { remainingRooms: this.rooms.size });
  }

  /**
   * Send sync step 1 to a newly connected client.
   */
  private sendSyncStep1(client: YjsClient, room: YjsRoom): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    const message = encoding.toUint8Array(encoder);
    console.log(`[Yjs] Sending sync step 1 to client ${client.clientId}, size: ${message.length}`);
    this.send(client.ws, message);
  }

  /**
   * Send current awareness state to a newly connected client.
   * Only sends awareness for OTHER clients that have actually sent awareness.
   * This prevents stale awareness from being sent.
   */
  private sendAwarenessState(client: YjsClient, room: YjsRoom): void {
    const awarenessStates = room.awareness.getStates();

    // Get clientIDs of OTHER connected clients who have sent awareness
    // (exclude the newly connected client who hasn't sent awareness yet)
    const validClientIds = new Set<number>();
    for (const c of room.clients) {
      if (c !== client && c.awarenessClientId !== null) {
        validClientIds.add(c.awarenessClientId);
      }
    }

    // Clear stale awareness states (ones not associated with any connected client)
    const allConnectedClientIds = new Set<number>();
    for (const c of room.clients) {
      if (c.awarenessClientId !== null) {
        allConnectedClientIds.add(c.awarenessClientId);
      }
    }

    const staleClientIds = Array.from(awarenessStates.keys()).filter(
      clientId => !allConnectedClientIds.has(clientId)
    );

    if (staleClientIds.length > 0) {
      console.log(`[Yjs] Cleaning up ${staleClientIds.length} stale awareness states in room "${room.name}": ${staleClientIds.join(', ')}`);

      // Broadcast removal of stale states to ALL clients (including the new one)
      this.broadcastAwarenessRemoval(room, staleClientIds);

      // Now delete the states from the awareness map
      for (const clientId of staleClientIds) {
        room.awareness.states.delete(clientId);
        room.awareness.meta.delete(clientId);
      }
    }

    // Send awareness only for valid clients (other connected clients who have sent awareness)
    const validClientIdArray = Array.from(validClientIds);
    if (validClientIdArray.length > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(room.awareness, validClientIdArray)
      );
      this.send(client.ws, encoding.toUint8Array(encoder));
    }
  }

  /**
   * Broadcast an update to all clients in a room.
   */
  private broadcastUpdate(room: YjsRoom, update: Uint8Array): void {
    if (room.clients.size === 0) {
      console.log(`[Yjs] broadcastUpdate: No clients in room "${room.name}", skipping`);
      return;
    }

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    console.log(`[Yjs] Broadcasting update to ${room.clients.size} clients in room "${room.name}", size: ${update.length}`);

    for (const client of room.clients) {
      this.send(client.ws, message);
    }
  }

  /**
   * Broadcast awareness removal to all clients in a room.
   * This manually constructs the removal message because we need to send
   * it BEFORE removeAwarenessStates deletes the states from the awareness map.
   */
  private broadcastAwarenessRemoval(room: YjsRoom, clientIds: number[]): void {
    if (clientIds.length === 0 || room.clients.size === 0) return;

    // Manually construct awareness update with null states for removed clients
    // Format: [numClients][clientId, clock, "null"]...
    const innerEncoder = encoding.createEncoder();
    encoding.writeVarUint(innerEncoder, clientIds.length);

    for (const clientId of clientIds) {
      // Use a very high clock value to ensure the removal is applied
      // The client will only apply updates if clock >= their current clock
      // Using timestamp ensures we're always higher than any previous clock
      const meta = room.awareness.meta.get(clientId);
      const baseClock = meta ? meta.clock : 0;
      const clock = Math.max(baseClock + 1, Math.floor(Date.now() / 1000));

      encoding.writeVarUint(innerEncoder, clientId);
      encoding.writeVarUint(innerEncoder, clock);
      encoding.writeVarString(innerEncoder, 'null'); // null state = removed
    }

    const innerMessage = encoding.toUint8Array(innerEncoder);

    // Wrap in awareness message
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(encoder, innerMessage);
    const message = encoding.toUint8Array(encoder);

    console.log(`[Yjs] Broadcasting awareness removal for ${clientIds.length} clients to ${room.clients.size} remaining clients`);

    for (const client of room.clients) {
      this.send(client.ws, message);
    }
  }

  /**
   * Broadcast awareness update to all clients in a room.
   */
  private broadcastAwareness(room: YjsRoom, changedClients: number[]): void {
    if (changedClients.length === 0) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    for (const client of room.clients) {
      this.send(client.ws, message);
    }
  }

  /**
   * Send a message to a WebSocket.
   */
  private send(ws: WebSocket, message: Uint8Array): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }

  /**
   * Schedule document persistence (debounced).
   */
  private schedulePersist(room: YjsRoom): void {
    if (!room.persistPath) return;

    if (room.persistTimeout) {
      clearTimeout(room.persistTimeout);
    }

    room.persistTimeout = setTimeout(() => {
      this.persistDoc(room).catch(console.error);
    }, this.options.persistDebounceMs);
  }

  /**
   * Persist document state to filesystem.
   */
  private async persistDoc(room: YjsRoom): Promise<void> {
    if (!room.persistPath) return;

    try {
      // Ensure directory exists
      await fs.mkdir(dirname(room.persistPath), { recursive: true });

      // Encode document state
      const state = Y.encodeStateAsUpdate(room.doc);

      // Write to file
      await fs.writeFile(room.persistPath, state);

      console.log(`[Yjs] Persisted room "${room.name}" to ${room.persistPath}`);
      this.recordEvent('persist', room.name, undefined, { docSize: state.length });
    } catch (error) {
      console.error(`[Yjs] Failed to persist room "${room.name}":`, error);
    }
  }

  /**
   * Load persisted document state from filesystem.
   * If no persisted state exists and getInitialContent is configured,
   * initialize the document from markdown content.
   */
  private async loadPersistedDoc(room: YjsRoom): Promise<void> {
    // Try to load persisted Yjs state first
    if (room.persistPath) {
      try {
        const state = await fs.readFile(room.persistPath);
        Y.applyUpdate(room.doc, new Uint8Array(state));

        // Check if the loaded document has actual content
        const yText = room.doc.getText('content');
        const contentLength = yText.toString().length;

        if (contentLength > 0) {
          console.log(`[Yjs] Loaded persisted room "${room.name}" from ${room.persistPath} (${contentLength} chars)`);
          return; // Successfully loaded with content, done
        } else {
          console.log(`[Yjs] Persisted room "${room.name}" was empty, will try getInitialContent fallback`);
          // Don't return - fall through to try getInitialContent
        }
      } catch (error) {
        // File doesn't exist yet, continue to try initializing from markdown
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`[Yjs] Failed to load room "${room.name}":`, error);
        }
      }
    }

    // No persisted state - try to initialize from markdown content
    console.log(`[Yjs] No persisted state for room "${room.name}", checking getInitialContent...`);
    if (this.options.getInitialContent) {
      try {
        console.log(`[Yjs] Calling getInitialContent for room "${room.name}"...`);
        const content = await this.options.getInitialContent(room.name);
        console.log(`[Yjs] getInitialContent returned: ${content ? `"${content.substring(0, 50)}..." (${content.length} chars)` : 'null'}`);
        if (content) {
          const yText = room.doc.getText('content');
          yText.insert(0, content);
          console.log(`[Yjs] Initialized room "${room.name}" from markdown (${content.length} chars)`);

          // Persist the initial state
          this.schedulePersist(room);
        }
      } catch (error) {
        console.error(`[Yjs] Failed to get initial content for room "${room.name}":`, error);
      }
    }
  }

  /**
   * Get the number of active rooms.
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get the total number of connected clients.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get or create a session with an assigned color.
   * Used by the REST API to provide session info to clients.
   */
  getOrCreateSession(sessionId?: string): { sessionId: string; color: string } {
    const id = sessionId || this.generateSessionId();
    const color = this.getOrAssignSessionColor(id);
    return { sessionId: id, color };
  }

  /**
   * Get information about a specific room.
   */
  getRoomInfo(roomName: string): { clientCount: number; docSize: number } | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    return {
      clientCount: room.clients.size,
      docSize: Y.encodeStateAsUpdate(room.doc).length,
    };
  }

  /**
   * Force persist all rooms.
   */
  async persistAll(): Promise<void> {
    const promises = Array.from(this.rooms.values()).map((room) =>
      this.persistDoc(room)
    );
    await Promise.all(promises);
  }

  /**
   * Clean up all resources.
   */
  async destroy(): Promise<void> {
    // Record server stop event before cleanup
    this.recordEvent('server_stop', undefined, undefined, {
      roomCount: this.rooms.size,
      clientCount: this.clients.size,
    });

    // Persist all rooms
    await this.persistAll();

    // Destroy all rooms
    for (const room of this.rooms.values()) {
      if (room.persistTimeout) {
        clearTimeout(room.persistTimeout);
      }
      room.awareness.destroy();
      room.doc.destroy();
    }

    this.rooms.clear();
    this.clients.clear();
  }

  // ==========================================
  // Diagnostic Methods
  // ==========================================

  /**
   * Get server uptime in milliseconds.
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get all stored diagnostic events.
   */
  getEvents(): DiagnosticEvent[] {
    return [...this.diagnosticEvents];
  }

  /**
   * Get user info from awareness state for a client.
   * Returns username and color from the client's awareness state.
   */
  private getUserInfoFromAwareness(room: YjsRoom, client: YjsClient): { name: string | null; color: string | null } {
    if (client.awarenessClientId === null) {
      return { name: null, color: null };
    }
    const awarenessStates = room.awareness.getStates();
    const state = awarenessStates.get(client.awarenessClientId) as { user?: { name?: string; color?: string } } | undefined;
    if (state?.user) {
      return {
        name: state.user.name || null,
        color: state.user.color || null,
      };
    }
    return { name: null, color: null };
  }

  /**
   * Extract the document title from Y.Doc content (first H1 heading).
   */
  private extractTitleFromDoc(doc: Y.Doc): string | null {
    const yText = doc.getText('content');
    const content = yText.toString();
    // Match ATX-style H1: # Heading (must be at line start)
    const match = content.match(/^#\s+(.+?)(?:\s*#*)?$/m);
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Get detailed data for all rooms.
   */
  getRoomsData(): DiagnosticRoomData[] {
    const roomsData: DiagnosticRoomData[] = [];

    for (const room of this.rooms.values()) {
      const clients = Array.from(room.clients).map((client) => {
        const userInfo = this.getUserInfoFromAwareness(room, client);
        return {
          clientId: client.clientId,
          username: userInfo.name,
          // Prefer color from awareness state (sent by client), fallback to server-assigned
          color: userInfo.color || client.color,
          awarenessClientId: client.awarenessClientId,
        };
      });

      roomsData.push({
        name: room.name,
        title: this.extractTitleFromDoc(room.doc),
        clientCount: room.clients.size,
        docSize: Y.encodeStateAsUpdate(room.doc).length,
        clients,
      });
    }

    return roomsData;
  }

  /**
   * Get detailed data for all clients.
   */
  getClientsData(): DiagnosticClientData[] {
    const clientsData: DiagnosticClientData[] = [];

    for (const client of this.clients.values()) {
      const room = this.rooms.get(client.roomName);
      const userInfo = room ? this.getUserInfoFromAwareness(room, client) : { name: null, color: null };
      clientsData.push({
        clientId: client.clientId,
        username: userInfo.name,
        roomName: client.roomName,
        // Prefer color from awareness state (sent by client), fallback to server-assigned
        color: userInfo.color || client.color,
        awarenessClientId: client.awarenessClientId,
      });
    }

    return clientsData;
  }

  /**
   * Get full diagnostic snapshot for initial load.
   */
  getDiagnosticSnapshot(): {
    uptime: number;
    roomCount: number;
    clientCount: number;
    rooms: DiagnosticRoomData[];
    clients: DiagnosticClientData[];
    events: DiagnosticEvent[];
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      uptime: this.getUptime(),
      roomCount: this.getRoomCount(),
      clientCount: this.getClientCount(),
      rooms: this.getRoomsData(),
      clients: this.getClientsData(),
      events: this.getEvents(),
      memoryUsage: process.memoryUsage(),
    };
  }

  // ==========================================
  // Server-Side Editing API (for AI agents)
  // ==========================================

  /**
   * Get or create a room and return its Y.Doc and awareness.
   * Used by AI agents to edit documents programmatically.
   */
  async getOrCreateRoomForAgent(roomName: string): Promise<{
    doc: Y.Doc;
    text: Y.Text;
    awareness: awarenessProtocol.Awareness;
    clientId: number;
  }> {
    const room = this.getOrCreateRoom(roomName);

    // Wait for room to be initialized (content loaded)
    await room.ready;

    // Generate a unique client ID for the agent
    const clientId = this.clientIdCounter++;

    return {
      doc: room.doc,
      text: room.doc.getText('content'),
      awareness: room.awareness,
      clientId,
    };
  }

  /**
   * Set awareness state for an AI agent.
   * This makes the agent's cursor visible to other users.
   *
   * The cursor should use Yjs RelativePosition objects (from Y.createRelativePositionFromTypeIndex)
   * for proper display by yCollab on the client side.
   */
  setAgentAwareness(
    roomName: string,
    clientId: number,
    user: { name: string; color: string },
    cursor?: { anchor: Y.RelativePosition; head: Y.RelativePosition }
  ): void {
    const room = this.rooms.get(roomName);
    if (!room) {
      console.log(`[Yjs] setAgentAwareness: room "${roomName}" not found`);
      return;
    }

    // Create awareness state for the agent
    // yCollab expects: { user: { name, color }, cursor: { anchor: RelativePosition, head: RelativePosition } | null }
    const state: Record<string, unknown> = { user };
    if (cursor) {
      state.cursor = cursor;
    }

    // Manually encode and broadcast awareness update
    // Since the agent isn't a real client, we need to set the state directly
    room.awareness.states.set(clientId, state);

    // Update meta to track clock
    const currentMeta = room.awareness.meta.get(clientId);
    const clock = currentMeta ? currentMeta.clock + 1 : 1;
    room.awareness.meta.set(clientId, { clock, lastUpdated: Date.now() });

    // Log every 100th update to avoid spam
    if (clock % 100 === 1) {
      console.log(`[Yjs] setAgentAwareness: broadcasting cursor for clientId ${clientId} in room "${roomName}", clients: ${room.clients.size}`);
    }

    // Broadcast the awareness update to all clients
    this.broadcastAwareness(room, [clientId]);
  }

  /**
   * Remove awareness state for an AI agent.
   */
  removeAgentAwareness(roomName: string, clientId: number): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    // Broadcast removal first
    this.broadcastAwarenessRemoval(room, [clientId]);

    // Then remove from awareness
    room.awareness.states.delete(clientId);
    room.awareness.meta.delete(clientId);
  }

  // ==========================================
  // Agent Session Tracking API
  // ==========================================

  /**
   * Mark an agent as actively working on a room.
   * This prevents the room from being destroyed while the agent is processing,
   * even if all user clients disconnect (e.g., dialog closed).
   */
  markAgentActive(roomName: string, userId: string): void {
    this.agentSessions.set(roomName, {
      userId,
      startedAt: Date.now(),
    });

    console.log(`[Yjs] Agent marked active in room "${roomName}" (user: ${userId})`);
    this.recordEvent('agent_active', roomName, undefined, { userId });
  }

  /**
   * Mark an agent as no longer working on a room.
   * After calling this, the room may be destroyed if no clients are connected.
   */
  markAgentInactive(roomName: string): void {
    const session = this.agentSessions.get(roomName);

    if (session) {
      const duration = Date.now() - session.startedAt;

      this.agentSessions.delete(roomName);
      console.log(`[Yjs] Agent marked inactive in room "${roomName}" (duration: ${duration}ms)`);
      this.recordEvent('agent_inactive', roomName, undefined, {
        userId: session.userId,
        durationMs: duration,
      });

      // Check if room should be cleaned up now that agent is done
      const room = this.rooms.get(roomName);

      if (room && room.clients.size === 0) {
        // Room has no clients and agent just finished - clean up after delay
        setTimeout(() => {
          if (this.rooms.get(roomName) === room &&
              room.clients.size === 0 &&
              !this.agentSessions.has(roomName)) {
            this.destroyRoom(room);
          }
        }, 20000);
      }
    }
  }

  /**
   * Check if a room has an active agent session.
   */
  hasActiveAgent(roomName: string): boolean {
    return this.agentSessions.has(roomName);
  }

  /**
   * Get agent session info for a room.
   */
  getAgentSession(roomName: string): { userId: string; startedAt: number } | null {
    return this.agentSessions.get(roomName) ?? null;
  }

  /**
   * Flush any pending document changes and extract metadata from the document.
   * This ensures all edits are persisted and returns structured metadata
   * parsed from the markdown content.
   */
  async flushAndExtractMetadata(roomName: string): Promise<DocumentMetadata | null> {
    const room = this.rooms.get(roomName);

    if (!room) {
      console.log(`[Yjs] flushAndExtractMetadata: room "${roomName}" not found`);

      return null;
    }

    // Wait for room to be fully initialized
    await room.ready;

    // Force persist if persistence is enabled
    if (room.persistPath) {
      // Clear any pending debounced persist
      if (room.persistTimeout) {
        clearTimeout(room.persistTimeout);
        room.persistTimeout = undefined;
      }

      // Persist immediately
      await this.persistDoc(room);
    }

    // Extract content from Y.Doc
    const yText = room.doc.getText('content');
    const content = yText.toString();

    if (!content.trim()) {
      console.log(`[Yjs] flushAndExtractMetadata: room "${roomName}" has empty content`);

      return null;
    }

    // Extract and return metadata
    const metadata = extractMetadataFromMarkdown(content);

    console.log(`[Yjs] flushAndExtractMetadata: extracted metadata from room "${roomName}" - title: "${metadata.title}"`);

    return metadata;
  }
}
