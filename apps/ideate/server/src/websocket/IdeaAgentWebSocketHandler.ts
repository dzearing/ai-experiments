import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import {
  IdeaAgentService,
  type IdeaContext,
  type StreamCallbacks,
  type TokenUsage,
  type OpenQuestion,
  type SuggestedResponse,
} from '../services/IdeaAgentService.js';
import type { IdeaAgentMessage } from '../services/IdeaAgentChatService.js';
import type { YjsCollaborationHandler } from './YjsCollaborationHandler.js';
import type { WorkspaceWebSocketHandler } from './WorkspaceWebSocketHandler.js';
import type { ResourceEventBus } from '../services/resourceEventBus/ResourceEventBus.js';
import type { AgentProgressEvent } from '../shared/agentProgress.js';
import type { IdeaService } from '../services/IdeaService.js';

/**
 * Client message types for the idea agent WebSocket protocol
 */
interface ClientMessage {
  type: 'message' | 'clear_history' | 'idea_update' | 'cancel';
  content?: string;
  idea?: IdeaContext;
  /** Document room name for Yjs collaboration (client provides this) */
  documentRoomName?: string;
  /** Initial greeting to use instead of generating one */
  initialGreeting?: string;
  /** Model ID to use for this message */
  modelId?: string;
}

/**
 * Server message types for the idea agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'document_edit_start' | 'document_edit_end' | 'token_usage' | 'open_questions' | 'suggested_responses' | 'agent_progress';
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
  /** Suggested responses for the user */
  suggestions?: SuggestedResponse[];
  /** Agent progress event */
  event?: AgentProgressEvent;
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
  /** Document room name for Yjs collaboration */
  documentRoomName: string | null;
  /** Initial greeting provided by the client (overrides generated greeting) */
  initialGreeting: string | null;
  /** Model ID to use for the agent */
  modelId: string | null;
  /** Workspace ID for broadcasting state changes */
  workspaceId: string | null;
  /** Previous document room name for session transfer (when reconnecting after idea creation) */
  transferFromRoom: string | null;
  /** Whether a session was transferred from another room (skip sending history/greeting) */
  sessionTransferred: boolean;
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
  private ideaService?: IdeaService;

  constructor(yjsHandler?: YjsCollaborationHandler, workspaceWsHandler?: WorkspaceWebSocketHandler, resourceEventBus?: ResourceEventBus, ideaService?: IdeaService) {
    this.ideaAgentService = new IdeaAgentService(yjsHandler, resourceEventBus);
    this.ideaService = ideaService;

    // Set up callbacks to broadcast updates to clients
    if (workspaceWsHandler) {
      // Broadcast agent status changes (running/idle/error)
      this.ideaAgentService.setSessionStateChangeCallback((ideaId, status, userId, workspaceId, agentStartedAt, agentFinishedAt) => {
        console.log(`[IdeaAgentWS] Received state change callback: idea=${ideaId}, status=${status}, userId=${userId}, workspaceId=${workspaceId}, startedAt=${agentStartedAt}, finishedAt=${agentFinishedAt}`);
        // Broadcast to workspace subscribers AND to the owner's clients
        // This ensures global ideas (no workspaceId) also receive updates
        workspaceWsHandler.notifyIdeaUpdate(
          ideaId,
          userId,
          workspaceId,
          {
            id: ideaId,
            agentStatus: status,
            agentStartedAt,
            agentFinishedAt,
          }
        );
      });

      // Broadcast metadata updates (title, summary, tags, description)
      this.ideaAgentService.setMetadataUpdateCallback(async (ideaId, metadata, userId, workspaceId) => {
        console.log(`[IdeaAgentWS] Received metadata update callback: idea=${ideaId}, title="${metadata.title}", userId=${userId}`);

        // PERSIST metadata to file storage so API returns updated data
        if (this.ideaService && ideaId !== 'new') {
          try {
            await this.ideaService.updateIdea(ideaId, userId, {
              title: metadata.title,
              summary: metadata.summary,
              tags: metadata.tags,
            });
            console.log(`[IdeaAgentWS] Persisted metadata for idea ${ideaId}`);
          } catch (error) {
            console.error(`[IdeaAgentWS] Failed to persist metadata for idea ${ideaId}:`, error);
          }
        }

        // Broadcast to workspace subscribers AND to the owner's clients
        workspaceWsHandler.notifyIdeaUpdate(
          ideaId,
          userId,
          workspaceId,
          {
            id: ideaId,
            title: metadata.title,
            summary: metadata.summary,
            tags: metadata.tags,
            description: metadata.description,
          }
        );
      });
    } else {
      console.log(`[IdeaAgentWS] No workspaceWsHandler provided, skipping callback setup`);
    }
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /idea-agent-ws?ideaId=xxx&userId=xxx&userName=xxx&documentRoomName=xxx&modelId=xxx&workspaceId=xxx&transferFromRoom=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const ideaId = url.searchParams.get('ideaId') || '';
    const userId = url.searchParams.get('userId') || '';
    const userName = url.searchParams.get('userName') || 'Anonymous';
    const documentRoomName = url.searchParams.get('documentRoomName') || null;
    const modelId = url.searchParams.get('modelId') || null;
    const workspaceId = url.searchParams.get('workspaceId') || null;
    const transferFromRoom = url.searchParams.get('transferFromRoom') || null;

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
      documentRoomName,
      initialGreeting: null,
      modelId,
      workspaceId,
      transferFromRoom,
      sessionTransferred: false,
    };

    this.clients.set(ws, client);
    console.log(`[IdeaAgent] Client ${clientId} (${userName}) connected for idea ${effectiveIdeaId}${transferFromRoom ? ` (transferring from ${transferFromRoom})` : ''}`);

    // Register this client with the service for message delivery
    // This enables background execution - messages are delivered to client or queued
    // If transferFromRoom is provided, the service will transfer the session from the old chatId
    const chatId = getChatId(client);
    const sessionTransferred = this.ideaAgentService.registerClient(chatId, this.createCallbacks(client), workspaceId || undefined, transferFromRoom || undefined);
    client.sessionTransferred = sessionTransferred;

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
    // This allows us to include topicContext in the greeting generation.
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
          if (clientMessage.modelId) {
            client.modelId = clientMessage.modelId;
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

            // Store initial greeting if provided (from facilitator)
            if (clientMessage.initialGreeting) {
              client.initialGreeting = clientMessage.initialGreeting;
            }

            // If this is the first context we received, now send history and greeting
            // (we deferred this from connection time to get topicContext)
            // Skip if session was transferred - client already has messages and we don't want to overwrite them
            if (isFirstContext && !client.sessionTransferred) {
              await this.sendHistoryAndGreeting(client);
            }
          }
          if (clientMessage.documentRoomName) {
            client.documentRoomName = clientMessage.documentRoomName;
          }
          break;
        case 'cancel': {
          const chatId = getChatId(client);
          this.ideaAgentService.abortSession(chatId);
          console.log(`[IdeaAgent] Client ${client.clientId} cancelled current operation`);
          break;
        }
        default:
          console.warn(`[IdeaAgent] Unknown message type: ${(clientMessage as ClientMessage).type}`);
      }
    } catch (error) {
      console.error('[IdeaAgent] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Create callbacks for a client to receive streamed messages.
   */
  private createCallbacks(client: IdeaAgentClient): StreamCallbacks {
    return {
      onTextChunk: (text: string, messageId: string) => {
        this.send(client.ws, {
          type: 'text_chunk',
          text,
          messageId,
        });
      },
      onComplete: (message: IdeaAgentMessage) => {
        this.send(client.ws, {
          type: 'message_complete',
          messageId: message.id,
          message,
        });
      },
      onError: (error: string) => {
        this.send(client.ws, {
          type: 'error',
          error,
        });
      },
      onDocumentEditStart: () => {
        this.send(client.ws, { type: 'document_edit_start' });
      },
      onDocumentEditEnd: () => {
        this.send(client.ws, { type: 'document_edit_end' });
      },
      onTokenUsage: (usage: TokenUsage) => {
        this.send(client.ws, {
          type: 'token_usage',
          usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
          },
        });
      },
      onOpenQuestions: (questions: OpenQuestion[]) => {
        if (questions.length > 0) {
          this.send(client.ws, {
            type: 'open_questions',
            questions,
          });
        }
      },
      onSuggestedResponses: (suggestions: SuggestedResponse[]) => {
        if (suggestions.length > 0) {
          this.send(client.ws, {
            type: 'suggested_responses',
            suggestions,
          });
        }
      },
      onProgressEvent: (event: AgentProgressEvent) => {
        this.send(client.ws, {
          type: 'agent_progress',
          event,
        });
      },
    };
  }

  /**
   * Handle a chat message from a client.
   * Messages are processed by the IdeaAgentService which manages background execution.
   */
  private async handleChatMessage(client: IdeaAgentClient, content: string): Promise<void> {
    if (!content.trim()) return;

    if (!client.ideaContext) {
      this.send(client.ws, { type: 'error', error: 'Idea context is required' });
      return;
    }

    try {
      const chatId = getChatId(client);
      // Process message - callbacks are registered at connection time
      // Service handles abort signals internally via session management
      await this.ideaAgentService.processMessage(
        chatId,
        client.userId,
        content.trim(),
        client.ideaContext,
        client.documentRoomName || undefined,
        client.modelId || undefined
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
        if (this.isGreetingStale(firstMessage.content ?? '', client.ideaContext)) {
          console.log(`[IdeaAgent] Greeting is stale for client ${client.clientId}, regenerating`);
          // Clear history to regenerate with correct context
          await this.ideaAgentService.clearHistory(chatId);
          messages = [];
        }
      }

      this.send(client.ws, { type: 'history', messages });

      // If no history, send a greeting and save it to prevent duplicates
      if (messages.length === 0) {
        // Use client-provided initialGreeting if available (e.g., from facilitator),
        // otherwise generate one based on the idea context
        const greeting = client.initialGreeting || this.ideaAgentService.generateGreeting(client.ideaContext);
        const greetingMessageId = `msg-greeting-${Date.now()}`;

        // Save greeting to history first to prevent race conditions with other connections
        await this.ideaAgentService.saveGreeting(chatId, greeting);

        this.send(client.ws, {
          type: 'greeting',
          text: greeting,
          messageId: greetingMessageId,
        });

        // Clear the initial greeting after use so it's not reused on reconnect
        client.initialGreeting = null;
      }
    } catch (error) {
      console.error('[IdeaAgent] Error fetching history:', error);
    }
  }

  /**
   * Handle client disconnect.
   * Unregisters callback but does NOT abort - session continues running in background.
   * Messages will be queued for replay when client reconnects.
   */
  private handleDisconnect(client: IdeaAgentClient): void {
    // Unregister callbacks - session continues running, messages are queued
    const chatId = getChatId(client);
    this.ideaAgentService.unregisterClient(chatId);
    this.clients.delete(client.ws);
    console.log(`[IdeaAgent] Client ${client.clientId} (${client.userName}) disconnected - session continues in background`);
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
