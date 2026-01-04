import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { PlanAgentService, type OpenQuestion, type SuggestedResponse } from '../services/PlanAgentService.js';
import type { PlanAgentMessage } from '../services/PlanAgentChatService.js';
import type { PlanIdeaContext } from '../prompts/planAgentPrompt.js';
import type { YjsCollaborationHandler } from './YjsCollaborationHandler.js';
import type { IdeaPlan } from '../services/IdeaService.js';
import type { AgentProgressEvent } from '../shared/agentProgress.js';

/**
 * Client message types for the plan agent WebSocket protocol
 */
interface ClientMessage {
  type: 'message' | 'clear_history' | 'idea_update' | 'cancel' | 'yjs_ready';
  content?: string;
  idea?: PlanIdeaContext;
  /** Document room name for Implementation Plan Yjs collaboration */
  documentRoomName?: string;
  /** Model ID to use for this message */
  modelId?: string;
}

/**
 * Server message types for the plan agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'message_complete' | 'history' | 'error' | 'greeting' | 'plan_update' | 'token_usage' | 'document_edit_start' | 'document_edit_end' | 'open_questions' | 'suggested_responses' | 'processing_start' | 'agent_progress';
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
  /** Open questions for the user (for open_questions) */
  questions?: OpenQuestion[];
  /** Suggested responses for quick user replies (for suggested_responses) */
  suggestions?: SuggestedResponse[];
  /** Agent progress event (for agent_progress) */
  event?: AgentProgressEvent;
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
  /** Document room name for Implementation Plan Yjs collaboration */
  documentRoomName: string | null;
  /** Cancel flag for ongoing operations */
  cancelled: boolean;
  /** Whether the client's Yjs connection is ready */
  yjsReady: boolean;
  /** Pending auto-start function to execute when Yjs is ready */
  pendingAutoStart: (() => Promise<void>) | null;
  /** Pending open questions that haven't been resolved yet */
  pendingOpenQuestions: OpenQuestion[] | null;
  /** Model ID to use for the agent */
  modelId: string | null;
}

/**
 * WebSocket handler for the plan agent chat.
 * Manages connections and routes messages to the PlanAgentService.
 */
export class PlanAgentWebSocketHandler {
  private clients: Map<WebSocket, PlanAgentClient> = new Map();
  private clientIdCounter = 0;
  private planAgentService: PlanAgentService;
  /** Pending open questions per idea ID - survives reconnects */
  private pendingQuestionsByIdea: Map<string, OpenQuestion[]> = new Map();

  constructor(yjsHandler: YjsCollaborationHandler) {
    this.planAgentService = new PlanAgentService(yjsHandler);
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /plan-agent-ws?ideaId=xxx&userId=xxx&userName=xxx&modelId=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const ideaId = url.searchParams.get('ideaId') || '';
    const userId = url.searchParams.get('userId') || '';
    const userName = url.searchParams.get('userName') || 'Anonymous';
    const modelId = url.searchParams.get('modelId') || null;

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
      documentRoomName: null,
      cancelled: false,
      yjsReady: false,
      pendingAutoStart: null,
      pendingOpenQuestions: null,
      modelId,
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

            // Update document room name if provided
            if (clientMessage.documentRoomName) {
              client.documentRoomName = clientMessage.documentRoomName;
              console.log(`[PlanAgent] Client ${client.clientId} set documentRoomName: ${client.documentRoomName}`);
            } else {
              console.log(`[PlanAgent] Client ${client.clientId} idea_update has no documentRoomName`);
            }

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
        case 'yjs_ready':
          // Client's Yjs connection is ready - execute pending auto-start if any
          client.yjsReady = true;
          console.log(`[PlanAgent] Client ${client.clientId} Yjs ready`);
          if (client.pendingAutoStart) {
            // Add a delay to ensure the Yjs connection is fully stabilized
            // and the client is ready to receive streamed updates.
            // Without this delay, the agent might start writing before the
            // client's y-websocket provider is ready to process incoming updates.
            console.log(`[PlanAgent] Waiting 300ms before auto-start for client ${client.clientId}`);
            const autoStart = client.pendingAutoStart;
            client.pendingAutoStart = null;
            setTimeout(async () => {
              if (client.ws.readyState === client.ws.OPEN && !client.cancelled) {
                console.log(`[PlanAgent] Executing pending auto-start for client ${client.clientId}`);
                await autoStart();
              } else {
                console.log(`[PlanAgent] Skipping auto-start: ws closed or cancelled`);
              }
            }, 300);
          }
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
   * @param isAutoStart - If true, this is an auto-start message that shouldn't be saved to history
   */
  private async handleChatMessage(client: PlanAgentClient, content: string, isAutoStart = false): Promise<void> {
    console.log(`[PlanAgent] handleChatMessage called for client ${client.clientId}. isAutoStart: ${isAutoStart}, documentRoomName: ${client.documentRoomName}, ideaId: ${client.ideaId}`);
    if (!content.trim()) return;

    if (!client.ideaContext) {
      this.send(client.ws, { type: 'error', error: 'Idea context is required' });
      return;
    }

    // Reset cancel flag
    client.cancelled = false;

    // Clear pending questions when user sends a message (they've responded)
    if (client.pendingOpenQuestions || this.pendingQuestionsByIdea.has(client.ideaId)) {
      console.log(`[PlanAgent] Clearing pending questions for idea ${client.ideaId} (user responded)`);
      client.pendingOpenQuestions = null;
      this.pendingQuestionsByIdea.delete(client.ideaId);
    }

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
          onDocumentEditStart: () => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'document_edit_start',
              });
            }
          },
          onDocumentEditEnd: () => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'document_edit_end',
              });
            }
          },
          onOpenQuestions: (questions) => {
            if (!client.cancelled) {
              // Store questions so they survive reconnects
              this.pendingQuestionsByIdea.set(client.ideaId, questions);
              client.pendingOpenQuestions = questions;
              console.log(`[PlanAgent] Stored ${questions.length} open questions for idea ${client.ideaId}`);
              this.send(client.ws, {
                type: 'open_questions',
                questions,
              });
            }
          },
          onSuggestedResponses: (suggestions) => {
            if (!client.cancelled && suggestions.length > 0) {
              this.send(client.ws, {
                type: 'suggested_responses',
                suggestions,
              });
            }
          },
          onProgressEvent: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'agent_progress',
                event,
              });
            }
          },
        },
        client.documentRoomName || undefined,
        isAutoStart,  // Skip saving user message for auto-start
        client.modelId || undefined
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
   * If no history exists, auto-starts the planning process once Yjs is ready.
   */
  private async sendHistoryAndGreeting(client: PlanAgentClient): Promise<void> {
    try {
      const messages = await this.planAgentService.getHistory(client.ideaId);
      this.send(client.ws, { type: 'history', messages });

      // Send any pending open questions that survived reconnects
      const pendingQuestions = this.pendingQuestionsByIdea.get(client.ideaId);
      if (pendingQuestions && pendingQuestions.length > 0) {
        console.log(`[PlanAgent] Restoring ${pendingQuestions.length} pending questions for idea ${client.ideaId}`);
        client.pendingOpenQuestions = pendingQuestions;
        this.send(client.ws, {
          type: 'open_questions',
          questions: pendingQuestions,
        });
      }

      // If no history, this is the first time entering planning for this idea
      // Send a greeting and auto-start the design process
      if (messages.length === 0 && client.ideaContext) {
        const greeting = `Let me review **"${client.ideaContext.title}"** so I can determine how we should approach this...`;
        const greetingMessageId = `msg-greeting-${Date.now()}`;

        // Save greeting to history first to prevent race conditions with other connections
        await this.planAgentService.saveGreeting(client.ideaId, greeting);

        this.send(client.ws, {
          type: 'greeting',
          text: greeting,
          messageId: greetingMessageId,
        });

        // Define the auto-start function
        const executeAutoStart = async () => {
          if (client.ws.readyState !== client.ws.OPEN || client.cancelled) {
            console.log(`[PlanAgent] Skipping auto-start: ws closed or cancelled`);
            return;
          }

          // Signal to client that processing is starting (so it can show loading indicator)
          this.send(client.ws, { type: 'processing_start' });

          const autoStartPrompt = 'Review the idea and begin creating the implementation design. If you need to ask clarifying questions, use the open_questions format. Otherwise, start writing the design document.';
          // Pass true for isAutoStart so the prompt isn't saved to chat history
          await this.handleChatMessage(client, autoStartPrompt, true);
        };

        // Wait for Yjs to be ready before auto-starting
        // This prevents the race condition where the agent writes to the Yjs doc
        // before the client has connected to receive the updates
        if (client.yjsReady) {
          // Even if Yjs is already marked ready, add a delay to ensure the
          // connection is fully stabilized and the client can receive streamed updates
          console.log(`[PlanAgent] Yjs already ready, waiting 300ms before auto-start`);
          setTimeout(() => executeAutoStart(), 300);
        } else {
          console.log(`[PlanAgent] Waiting for Yjs ready signal before auto-start`);
          client.pendingAutoStart = executeAutoStart;
        }
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
