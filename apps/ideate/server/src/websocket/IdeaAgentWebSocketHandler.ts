import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { IdeaAgentService, type IdeaContext } from '../services/IdeaAgentService.js';
import type { IdeaAgentMessage } from '../services/IdeaAgentChatService.js';
import type { YjsCollaborationHandler } from './YjsCollaborationHandler.js';

/**
 * Client message types for the idea agent WebSocket protocol
 */
interface ClientMessage {
  type: 'message' | 'clear_history' | 'idea_update' | 'cancel';
  content?: string;
  idea?: IdeaContext;
  /** Document room name for Yjs collaboration (client provides this) */
  documentRoomName?: string;
}

/**
 * Open question for the user to resolve
 */
interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  selectionType: 'single' | 'multiple';
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  allowCustom: boolean;
}

/**
 * Server message types for the idea agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'document_edit_start' | 'document_edit_end' | 'token_usage' | 'open_questions';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Complete message object (for history/message_complete) */
  message?: IdeaAgentMessage;
  /** Array of messages (for history) */
  messages?: IdeaAgentMessage[];
  /** Error message */
  error?: string;
  /** Token usage information */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /** Open questions for user to resolve */
  questions?: OpenQuestion[];
}

/**
 * Represents a connected idea agent client
 */
interface IdeaAgentClient {
  ws: WebSocket;
  ideaId: string;
  userId: string;
  userName: string;
  clientId: number;
  /** Current idea context */
  ideaContext: IdeaContext | null;
  /** Cancel flag for ongoing operations */
  cancelled: boolean;
  /** Document room name for Yjs collaboration */
  documentRoomName: string | null;
}

/**
 * Get the effective chat ID for storing/retrieving chat history.
 * For new ideas, use the documentRoomName (unique per session).
 * For existing ideas, use the ideaId.
 */
function getChatId(client: IdeaAgentClient): string {
  if (client.ideaId === 'new' && client.documentRoomName) {
    return client.documentRoomName;
  }
  return client.ideaId;
}

/**
 * WebSocket handler for the idea agent chat.
 * Manages connections and routes messages to the IdeaAgentService.
 */
export class IdeaAgentWebSocketHandler {
  private clients: Map<WebSocket, IdeaAgentClient> = new Map();
  private clientIdCounter = 0;
  private ideaAgentService: IdeaAgentService;

  constructor(yjsHandler?: YjsCollaborationHandler) {
    this.ideaAgentService = new IdeaAgentService(yjsHandler);
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /idea-agent-ws?ideaId=xxx&userId=xxx&userName=xxx&documentRoomName=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const ideaId = url.searchParams.get('ideaId') || '';
    const userId = url.searchParams.get('userId') || '';
    const userName = url.searchParams.get('userName') || 'Anonymous';
    const documentRoomName = url.searchParams.get('documentRoomName') || null;

    // Use 'new' as the default ideaId for new ideas
    const effectiveIdeaId = ideaId || 'new';

    if (!userId) {
      ws.close(4000, 'User ID is required');
      return;
    }

    // Create client
    const clientId = this.clientIdCounter++;
    const client: IdeaAgentClient = {
      ws,
      ideaId: effectiveIdeaId,
      userId,
      userName,
      clientId,
      ideaContext: null,
      cancelled: false,
      documentRoomName,
    };

    this.clients.set(ws, client);
    console.log(`[IdeaAgent] Client ${clientId} (${userName}) connected for idea ${effectiveIdeaId}`);

    // Set up WebSocket handlers
    ws.on('message', (data: RawData) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`[IdeaAgent] Client ${clientId} error:`, error);
      this.handleDisconnect(client);
    });

    // Note: We defer sendHistoryAndGreeting until we receive the first idea_update
    // This allows us to include thingContext in the greeting generation.
    // The client sends idea_update immediately after connecting.
  }

  /**
   * Initialize the service (pre-generate greetings).
   * Call this on server startup for instant greetings.
   */
  async initialize(): Promise<void> {
    await this.ideaAgentService.initialize();
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: IdeaAgentClient, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'message':
          if (clientMessage.idea) {
            client.ideaContext = clientMessage.idea;
          }
          if (clientMessage.documentRoomName) {
            client.documentRoomName = clientMessage.documentRoomName;
          }
          await this.handleChatMessage(client, clientMessage.content || '');
          break;
        case 'clear_history':
          await this.handleClearHistory(client);
          break;
        case 'idea_update':
          // Update the idea context and document room name
          if (clientMessage.idea) {
            const isFirstContext = !client.ideaContext;
            client.ideaContext = clientMessage.idea;

            // If this is the first context we received, now send history and greeting
            // (we deferred this from connection time to get thingContext)
            if (isFirstContext) {
              await this.sendHistoryAndGreeting(client);
            }
          }
          if (clientMessage.documentRoomName) {
            client.documentRoomName = clientMessage.documentRoomName;
          }
          break;
        case 'cancel':
          client.cancelled = true;
          console.log(`[IdeaAgent] Client ${client.clientId} cancelled current operation`);
          break;
        default:
          console.warn(`[IdeaAgent] Unknown message type: ${(clientMessage as ClientMessage).type}`);
      }
    } catch (error) {
      console.error('[IdeaAgent] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a chat message from a client.
   */
  private async handleChatMessage(client: IdeaAgentClient, content: string): Promise<void> {
    if (!content.trim()) return;

    if (!client.ideaContext) {
      this.send(client.ws, { type: 'error', error: 'Idea context is required' });
      return;
    }

    // Reset cancel flag
    client.cancelled = false;

    try {
      const chatId = getChatId(client);
      await this.ideaAgentService.processMessage(
        chatId,
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
          onDocumentEditStart: () => {
            if (!client.cancelled) {
              this.send(client.ws, { type: 'document_edit_start' });
            }
          },
          onDocumentEditEnd: () => {
            if (!client.cancelled) {
              this.send(client.ws, { type: 'document_edit_end' });
            }
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
          onOpenQuestions: (questions) => {
            if (!client.cancelled && questions.length > 0) {
              this.send(client.ws, {
                type: 'open_questions',
                questions,
              });
            }
          },
        },
        client.documentRoomName || undefined
      );
    } catch (error) {
      console.error('[IdeaAgent] Error processing message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a clear history request from a client.
   * Clears history and starts a fresh session (no greeting).
   */
  private async handleClearHistory(client: IdeaAgentClient): Promise<void> {
    try {
      const chatId = getChatId(client);
      await this.ideaAgentService.clearHistory(chatId);
      this.send(client.ws, { type: 'history', messages: [] });
      console.log(`[IdeaAgent] Cleared history for client ${client.clientId}`);
    } catch (error) {
      console.error('[IdeaAgent] Error clearing history:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to clear history' });
    }
  }

  /**
   * Check if the greeting matches the current idea context.
   * Returns true if the greeting is stale and should be regenerated.
   */
  private isGreetingStale(greeting: string, ideaContext: IdeaContext | null): boolean {
    if (!ideaContext) return false;

    const hasRealTitle = ideaContext.title &&
      ideaContext.title.trim() &&
      ideaContext.title !== 'New Idea' &&
      ideaContext.title !== 'Untitled Idea';

    if (!hasRealTitle) {
      // For new/untitled ideas, greeting is stale if it mentions a specific title
      // (i.e., it contains ** which is used for title formatting)
      return greeting.includes('**"') && !greeting.includes('New Idea');
    }

    // For existing ideas with real titles, check if greeting mentions the correct title
    // Greeting should contain the title if it's an existing idea
    const expectedTitlePattern = `**"${ideaContext.title}"**`;
    const hasCorrectTitle = greeting.includes(expectedTitlePattern);

    // Stale if: has a real title but greeting doesn't mention it correctly
    if (!hasCorrectTitle) {
      // Check if it's using a generic "new idea" greeting when it shouldn't
      const isGenericGreeting = greeting.includes("Let's bring your idea to life") ||
        greeting.includes("What would you like to explore") && !greeting.includes('**"');
      return isGenericGreeting;
    }

    return false;
  }

  /**
   * Send message history to a newly connected client, with greeting if no history.
   */
  private async sendHistoryAndGreeting(client: IdeaAgentClient): Promise<void> {
    try {
      const chatId = getChatId(client);
      let messages = await this.ideaAgentService.getHistory(chatId);

      // Check if the first message (greeting) is stale and should be regenerated
      if (messages.length > 0 && messages[0].role === 'assistant') {
        const firstMessage = messages[0];
        if (this.isGreetingStale(firstMessage.content, client.ideaContext)) {
          console.log(`[IdeaAgent] Greeting is stale for client ${client.clientId}, regenerating`);
          // Clear history to regenerate with correct context
          await this.ideaAgentService.clearHistory(chatId);
          messages = [];
        }
      }

      this.send(client.ws, { type: 'history', messages });

      // If no history, send a greeting and save it to prevent duplicates
      if (messages.length === 0) {
        const greeting = await this.ideaAgentService.generateGreeting(client.ideaContext);
        const greetingMessageId = `msg-greeting-${Date.now()}`;

        // Save greeting to history first to prevent race conditions with other connections
        await this.ideaAgentService.saveGreeting(chatId, greeting);

        this.send(client.ws, {
          type: 'greeting',
          text: greeting,
          messageId: greetingMessageId,
        });
      }
    } catch (error) {
      console.error('[IdeaAgent] Error fetching history:', error);
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: IdeaAgentClient): void {
    this.clients.delete(client.ws);
    console.log(`[IdeaAgent] Client ${client.clientId} (${client.userName}) disconnected`);
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
  getService(): IdeaAgentService {
    return this.ideaAgentService;
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
