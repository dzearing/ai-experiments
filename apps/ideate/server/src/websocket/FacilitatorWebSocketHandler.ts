import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { FacilitatorService } from '../services/FacilitatorService.js';
import type { FacilitatorMessage } from '../services/FacilitatorChatService.js';

/**
 * Client message types for the facilitator WebSocket protocol
 */
interface ClientMessage {
  type: 'message' | 'clear_history';
  content?: string;
}

/**
 * Server message types for the facilitator WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'tool_use' | 'tool_result' | 'message_complete' | 'history' | 'error';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Tool name (for tool_use/tool_result) */
  toolName?: string;
  /** Tool input (for tool_use) */
  toolInput?: Record<string, unknown>;
  /** Tool output (for tool_result) */
  toolOutput?: string;
  /** Complete message object (for history/message_complete) */
  message?: FacilitatorMessage;
  /** Array of messages (for history) */
  messages?: FacilitatorMessage[];
  /** Error message */
  error?: string;
}

/**
 * Represents a connected facilitator client
 */
interface FacilitatorClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  clientId: number;
}

/**
 * WebSocket handler for the facilitator chat.
 * Manages connections and routes messages to the FacilitatorService.
 */
export class FacilitatorWebSocketHandler {
  private clients: Map<WebSocket, FacilitatorClient> = new Map();
  private clientIdCounter = 0;
  private facilitatorService: FacilitatorService;
  private initialized = false;

  constructor() {
    this.facilitatorService = new FacilitatorService();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.facilitatorService.initialize();
    this.initialized = true;
  }

  /**
   * Get the underlying FacilitatorService for diagnostics.
   */
  getService(): FacilitatorService {
    return this.facilitatorService;
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /facilitator-ws?userId=xxx&userName=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || '';
    const userName = url.searchParams.get('userName') || 'Anonymous';

    if (!userId) {
      ws.close(4000, 'User ID is required');
      return;
    }

    // Create client
    const clientId = this.clientIdCounter++;
    const client: FacilitatorClient = {
      ws,
      userId,
      userName,
      clientId,
    };

    this.clients.set(ws, client);
    console.log(`[Facilitator] Client ${clientId} (${userName}) connected`);

    // Set up WebSocket handlers
    ws.on('message', (data: RawData) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`[Facilitator] Client ${clientId} error:`, error);
      this.handleDisconnect(client);
    });

    // Send message history
    this.sendHistory(client);
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: FacilitatorClient, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'message':
          await this.handleChatMessage(client, clientMessage.content || '');
          break;
        case 'clear_history':
          await this.handleClearHistory(client);
          break;
        default:
          console.warn(`[Facilitator] Unknown message type: ${(clientMessage as ClientMessage).type}`);
      }
    } catch (error) {
      console.error('[Facilitator] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a chat message from a client.
   */
  private async handleChatMessage(client: FacilitatorClient, content: string): Promise<void> {
    if (!content.trim()) return;

    // Ensure service is initialized
    await this.initialize();

    try {
      await this.facilitatorService.processMessage(
        client.userId,
        client.userName,
        content.trim(),
        {
          onTextChunk: (text, messageId) => {
            this.send(client.ws, {
              type: 'text_chunk',
              text,
              messageId,
            });
          },
          onToolUse: ({ name, input }) => {
            this.send(client.ws, {
              type: 'tool_use',
              toolName: name,
              toolInput: input,
            });
          },
          onToolResult: ({ name, output }) => {
            this.send(client.ws, {
              type: 'tool_result',
              toolName: name,
              toolOutput: output,
            });
          },
          onComplete: (message) => {
            this.send(client.ws, {
              type: 'message_complete',
              messageId: message.id,
              message,
            });
          },
          onError: (error) => {
            this.send(client.ws, {
              type: 'error',
              error,
            });
          },
        }
      );
    } catch (error) {
      console.error('[Facilitator] Error processing message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a clear history request from a client.
   */
  private async handleClearHistory(client: FacilitatorClient): Promise<void> {
    try {
      await this.facilitatorService.clearHistory(client.userId);
      this.send(client.ws, { type: 'history', messages: [] });
    } catch (error) {
      console.error('[Facilitator] Error clearing history:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to clear history' });
    }
  }

  /**
   * Send message history to a newly connected client.
   */
  private async sendHistory(client: FacilitatorClient): Promise<void> {
    // Ensure service is initialized
    await this.initialize();

    try {
      const messages = await this.facilitatorService.getHistory(client.userId);
      this.send(client.ws, { type: 'history', messages });
    } catch (error) {
      console.error('[Facilitator] Error fetching history:', error);
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: FacilitatorClient): void {
    this.clients.delete(client.ws);
    console.log(`[Facilitator] Client ${client.clientId} (${client.userName}) disconnected`);
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
    this.clients.clear();
  }
}
