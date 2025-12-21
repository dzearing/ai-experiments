import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { ChatRoomService, type ChatMessage } from '../services/ChatRoomService.js';
import { WorkspaceService } from '../services/WorkspaceService.js';

// Message types for the chat WebSocket protocol
interface ClientMessage {
  type: 'message' | 'join' | 'typing' | 'stop_typing';
  content?: string;
  userId?: string;
  userName?: string;
}

interface ServerMessage {
  type: 'message' | 'join' | 'leave' | 'typing' | 'stop_typing' | 'error' | 'history';
  message?: ChatMessage;
  messages?: ChatMessage[];
  userId?: string;
  userName?: string;
  error?: string;
}

/**
 * Represents a connected chat client
 */
interface ChatClient {
  ws: WebSocket;
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  clientId: number;
}

/**
 * Represents a chat room
 */
interface ChatRoom {
  id: string;
  clients: Set<ChatClient>;
}

/**
 * WebSocket handler for real-time chat messaging.
 * Uses simple JSON protocol for message exchange.
 */
export class ChatWebSocketHandler {
  private rooms: Map<string, ChatRoom> = new Map();
  private clients: Map<WebSocket, ChatClient> = new Map();
  private clientIdCounter = 0;
  private chatRoomService: ChatRoomService;
  private workspaceService: WorkspaceService;

  constructor() {
    this.chatRoomService = new ChatRoomService();
    this.workspaceService = new WorkspaceService();
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /chat-ws/{roomId}?userId=xxx&userName=xxx&userColor=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Extract room ID from path (e.g., /chat-ws/room-id)
    const roomId = pathParts[pathParts.length - 1] || '';
    const userId = url.searchParams.get('userId') || '';
    const userName = url.searchParams.get('userName') || 'Anonymous';
    const userColor = url.searchParams.get('userColor') || '#888888';

    if (!roomId || !userId) {
      ws.close(4000, 'Room ID and User ID are required');
      return;
    }

    // Validate access to the chat room
    this.validateAccess(roomId, userId).then((hasAccess) => {
      if (!hasAccess) {
        console.log(`[Chat] Access denied for user "${userId}" to room "${roomId}"`);
        ws.close(4003, 'Access denied');
        return;
      }

      // Create client
      const clientId = this.clientIdCounter++;
      const client: ChatClient = {
        ws,
        roomId,
        userId,
        userName,
        userColor,
        clientId,
      };

      this.clients.set(ws, client);

      // Get or create room
      const room = this.getOrCreateRoom(roomId);
      room.clients.add(client);

      console.log(`[Chat] Client ${clientId} (${userName}) joined room "${roomId}" (${room.clients.size} clients)`);

      // Set up WebSocket handlers
      ws.on('message', (data: RawData) => {
        this.handleMessage(client, room, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(client, room);
      });

      ws.on('error', (error) => {
        console.error(`[Chat] Client ${clientId} error:`, error);
        this.handleDisconnect(client, room);
      });

      // Send recent message history
      this.sendMessageHistory(client);

      // Broadcast join to other clients
      this.broadcast(room, {
        type: 'join',
        userId: client.userId,
        userName: client.userName,
      }, client);
    }).catch((error) => {
      console.error(`[Chat] Error validating access:`, error);
      ws.close(4000, 'Error validating access');
    });
  }

  /**
   * Validate if a user has access to a chat room.
   * Access is granted if user is:
   * - The owner of the chat room
   * - A participant of the chat room
   * - A member of the workspace the chat room belongs to
   */
  private async validateAccess(roomId: string, userId: string): Promise<boolean> {
    const chatRoomMeta = await this.chatRoomService.getChatRoomInternal(roomId);
    if (!chatRoomMeta) {
      return false;
    }

    // Check direct access (owner or participant)
    if (chatRoomMeta.ownerId === userId || chatRoomMeta.participantIds.includes(userId)) {
      return true;
    }

    // Check workspace membership
    const workspace = await this.workspaceService.getWorkspace(chatRoomMeta.workspaceId, userId);
    return workspace !== null;
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: ChatClient, room: ChatRoom, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'message':
          await this.handleChatMessage(client, room, clientMessage.content || '');
          break;
        case 'typing':
          this.broadcast(room, {
            type: 'typing',
            userId: client.userId,
            userName: client.userName,
          }, client);
          break;
        case 'stop_typing':
          this.broadcast(room, {
            type: 'stop_typing',
            userId: client.userId,
          }, client);
          break;
        default:
          console.warn(`[Chat] Unknown message type: ${clientMessage.type}`);
      }
    } catch (error) {
      console.error('[Chat] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a chat message from a client.
   */
  private async handleChatMessage(client: ChatClient, room: ChatRoom, content: string): Promise<void> {
    if (!content.trim()) return;

    try {
      // Persist message
      const message = await this.chatRoomService.addMessage(
        client.roomId,
        client.userId,
        client.userName,
        client.userColor,
        content.trim()
      );

      // Broadcast to ALL clients in the room (including sender)
      this.broadcast(room, {
        type: 'message',
        message,
      });
    } catch (error) {
      console.error('[Chat] Error saving message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to save message' });
    }
  }

  /**
   * Send message history to a newly connected client.
   */
  private async sendMessageHistory(client: ChatClient): Promise<void> {
    try {
      const messages = await this.chatRoomService.getMessages(client.roomId, 50);
      this.send(client.ws, {
        type: 'history',
        messages,
      });
    } catch (error) {
      console.error('[Chat] Error fetching message history:', error);
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: ChatClient, room: ChatRoom): void {
    room.clients.delete(client);
    this.clients.delete(client.ws);

    console.log(`[Chat] Client ${client.clientId} (${client.userName}) left room "${room.id}" (${room.clients.size} clients)`);

    // Broadcast leave to remaining clients
    this.broadcast(room, {
      type: 'leave',
      userId: client.userId,
      userName: client.userName,
    });

    // Clean up empty room after delay
    if (room.clients.size === 0) {
      setTimeout(() => {
        if (this.rooms.get(room.id) === room && room.clients.size === 0) {
          this.rooms.delete(room.id);
          console.log(`[Chat] Destroyed room "${room.id}"`);
        }
      }, 30000); // Keep room alive for 30 seconds
    }
  }

  /**
   * Get or create a room.
   */
  private getOrCreateRoom(roomId: string): ChatRoom {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        id: roomId,
        clients: new Set(),
      };
      this.rooms.set(roomId, room);
      console.log(`[Chat] Created room "${roomId}"`);
    }

    return room;
  }

  /**
   * Send a message to a WebSocket.
   */
  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all clients in a room.
   * Optionally exclude a specific client.
   */
  private broadcast(room: ChatRoom, message: ServerMessage, exclude?: ChatClient): void {
    for (const client of room.clients) {
      if (client !== exclude) {
        this.send(client.ws, message);
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
   * Clean up all resources.
   */
  destroy(): void {
    for (const client of this.clients.values()) {
      client.ws.close();
    }
    this.rooms.clear();
    this.clients.clear();
  }
}
