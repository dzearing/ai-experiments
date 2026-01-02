import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { PlanAgentService } from '../services/PlanAgentService.js';
import type { PlanAgentMessage } from '../services/PlanAgentChatService.js';
import type { PlanIdeaContext } from '../prompts/planAgentPrompt.js';
import type { IdeaPlan } from '../services/IdeaService.js';

/**
 * Client message types for the plan agent WebSocket protocol
 */
interface ClientMessage {
  type: 'message' | 'clear_history' | 'idea_update' | 'cancel';
  content?: string;
  idea?: PlanIdeaContext;
}

/**
 * Server message types for the plan agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'plan_update' | 'token_usage';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Complete message object (for history/message_complete) */
  message?: PlanAgentMessage;
  /** Array of messages (for history) */
  messages?: PlanAgentMessage[];
  /** Error message */
  error?: string;
  /** Plan data (for plan_update) */
  plan?: Partial<IdeaPlan>;
  /** Token usage information */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Represents a connected plan agent client
 */
interface PlanAgentClient {
  ws: WebSocket;
  ideaId: string;
  userId: string;
  userName: string;
  clientId: number;
  /** Current idea context */
  ideaContext: PlanIdeaContext | null;
  /** Cancel flag for ongoing operations */
  cancelled: boolean;
}

/**
 * WebSocket handler for the plan agent chat.
 * Manages connections and routes messages to the PlanAgentService.
 */
export class PlanAgentWebSocketHandler {
  private clients: Map<WebSocket, PlanAgentClient> = new Map();
  private clientIdCounter = 0;
  private planAgentService: PlanAgentService;

  constructor() {
    this.planAgentService = new PlanAgentService();
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /plan-agent-ws?ideaId=xxx&userId=xxx&userName=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const ideaId = url.searchParams.get('ideaId') || '';
    const userId = url.searchParams.get('userId') || '';
    const userName = url.searchParams.get('userName') || 'Anonymous';

    if (!ideaId || !userId) {
      ws.close(4000, 'Idea ID and User ID are required');
      return;
    }

    // Create client
    const clientId = this.clientIdCounter++;
    const client: PlanAgentClient = {
      ws,
      ideaId,
      userId,
      userName,
      clientId,
      ideaContext: null,
      cancelled: false,
    };

    this.clients.set(ws, client);
    console.log(`[PlanAgent] Client ${clientId} (${userName}) connected for idea ${ideaId}`);

    // Set up WebSocket handlers
    ws.on('message', (data: RawData) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`[PlanAgent] Client ${clientId} error:`, error);
      this.handleDisconnect(client);
    });

    // Note: We defer sendHistoryAndGreeting until we receive the first idea_update
    // This allows us to include the idea context in the greeting generation.
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: PlanAgentClient, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'message':
          if (clientMessage.idea) {
            client.ideaContext = clientMessage.idea;
          }
          await this.handleChatMessage(client, clientMessage.content || '');
          break;
        case 'clear_history':
          await this.handleClearHistory(client);
          break;
        case 'idea_update':
          // Update the idea context
          if (clientMessage.idea) {
            const isFirstContext = !client.ideaContext;
            client.ideaContext = clientMessage.idea;

            // If this is the first context we received, now send history and greeting
            if (isFirstContext) {
              await this.sendHistoryAndGreeting(client);
            }
          }
          break;
        case 'cancel':
          client.cancelled = true;
          console.log(`[PlanAgent] Client ${client.clientId} cancelled current operation`);
          break;
        default:
          console.warn(`[PlanAgent] Unknown message type: ${(clientMessage as ClientMessage).type}`);
      }
    } catch (error) {
      console.error('[PlanAgent] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a chat message from a client.
   */
  private async handleChatMessage(client: PlanAgentClient, content: string): Promise<void> {
    if (!content.trim()) return;

    if (!client.ideaContext) {
      this.send(client.ws, { type: 'error', error: 'Idea context is required' });
      return;
    }

    // Reset cancel flag
    client.cancelled = false;

    try {
      await this.planAgentService.processMessage(
        client.ideaId,
        client.userId,
        content.trim(),
        client.ideaContext,
        {
          onTextChunk: (text, messageId) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'text_chunk',
                text,
                messageId,
              });
            }
          },
          onPlanUpdate: (plan) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'plan_update',
                plan,
              });
            }
          },
          onComplete: (message) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'message_complete',
                messageId: message.id,
                message,
              });
            }
          },
          onError: (error) => {
            this.send(client.ws, {
              type: 'error',
              error,
            });
          },
          onTokenUsage: (usage) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'token_usage',
                usage: {
                  inputTokens: usage.inputTokens,
                  outputTokens: usage.outputTokens,
                },
              });
            }
          },
        }
      );
    } catch (error) {
      console.error('[PlanAgent] Error processing message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a clear history request from a client.
   * Clears history and starts a fresh session (no greeting).
   */
  private async handleClearHistory(client: PlanAgentClient): Promise<void> {
    try {
      await this.planAgentService.clearHistory(client.ideaId);
      this.send(client.ws, { type: 'history', messages: [] });
      console.log(`[PlanAgent] Cleared history for client ${client.clientId}`);
    } catch (error) {
      console.error('[PlanAgent] Error clearing history:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to clear history' });
    }
  }

  /**
   * Send message history to a newly connected client, with greeting if no history.
   */
  private async sendHistoryAndGreeting(client: PlanAgentClient): Promise<void> {
    try {
      const messages = await this.planAgentService.getHistory(client.ideaId);
      this.send(client.ws, { type: 'history', messages });

      // If no history, send a greeting and save it to prevent duplicates
      if (messages.length === 0 && client.ideaContext) {
        const greeting = await this.planAgentService.generateGreeting(client.ideaContext);
        const greetingMessageId = `msg-greeting-${Date.now()}`;

        // Save greeting to history first to prevent race conditions with other connections
        await this.planAgentService.saveGreeting(client.ideaId, greeting);

        this.send(client.ws, {
          type: 'greeting',
          text: greeting,
          messageId: greetingMessageId,
        });
      }
    } catch (error) {
      console.error('[PlanAgent] Error fetching history:', error);
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: PlanAgentClient): void {
    this.clients.delete(client.ws);
    console.log(`[PlanAgent] Client ${client.clientId} (${client.userName}) disconnected`);
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
   * Get the underlying service for external use.
   */
  getService(): PlanAgentService {
    return this.planAgentService;
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
