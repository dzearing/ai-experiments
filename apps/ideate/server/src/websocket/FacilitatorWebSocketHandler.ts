import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { FacilitatorService, type OpenQuestion } from '../services/FacilitatorService.js';
import type { FacilitatorMessage } from '../services/FacilitatorChatService.js';
import { getFacilitatorSettings } from '../routes/personas.js';

/**
 * Navigation context from the client - where the user is in the app
 */
interface NavigationContext {
  workspaceId?: string;
  workspaceName?: string;
  documentId?: string;
  documentTitle?: string;
  chatRoomId?: string;
  chatRoomName?: string;
  currentPage?: string;
  /** Active Thing ID (if viewing/selected a Thing) */
  activeThingId?: string;
  /** Active Thing name */
  activeThingName?: string;
  /** Referenced Thing IDs from ^thing-name references in message */
  referencedThingIds?: string[];
}

/**
 * Client message types for the facilitator WebSocket protocol
 */
interface ClientMessage {
  type: 'message' | 'clear_history' | 'context_update' | 'persona_change' | 'cancel';
  content?: string;
  context?: NavigationContext;
  /** Preset ID for persona_change (or '__custom__' for user persona) */
  presetId?: string;
}

/**
 * Server message types for the facilitator WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'tool_use' | 'tool_result' | 'message_complete' | 'history' | 'error' | 'persona_changed' | 'greeting' | 'loading' | 'open_questions';
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
  /** Timestamp when tool started (for tool_use timing display) */
  startTime?: number;
  /** Complete message object (for history/message_complete) */
  message?: FacilitatorMessage;
  /** Array of messages (for history) */
  messages?: FacilitatorMessage[];
  /** Error message */
  error?: string;
  /** Persona name (for persona_changed) */
  personaName?: string;
  /** Loading state (true = loading, false = done) */
  isLoading?: boolean;
  /** Open questions for user clarification */
  questions?: OpenQuestion[];
}

/**
 * Represents a connected facilitator client
 */
interface FacilitatorClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  clientId: number;
  /** Current navigation context */
  context: NavigationContext;
  /** Version counter for persona changes - used to cancel stale greeting generations */
  personaChangeVersion: number;
  /** AbortController for the current operation (if any) */
  currentAbortController: AbortController | null;
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
      context: {},
      personaChangeVersion: 0,
      currentAbortController: null,
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
          // Update context if provided with the message
          if (clientMessage.context) {
            client.context = clientMessage.context;
          }
          await this.handleChatMessage(client, clientMessage.content || '');
          break;
        case 'clear_history':
          await this.handleClearHistory(client);
          break;
        case 'context_update':
          // Update the client's navigation context
          if (clientMessage.context) {
            client.context = clientMessage.context;
            console.log(`[Facilitator] Client ${client.clientId} context updated:`, client.context);
          }
          break;
        case 'persona_change':
          await this.handlePersonaChange(client, clientMessage.presetId || '');
          break;
        case 'cancel':
          this.handleCancel(client);
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

    // Get the display name from settings
    const settings = getFacilitatorSettings();

    // Create an AbortController for this operation
    const abortController = new AbortController();
    client.currentAbortController = abortController;

    try {
      await this.facilitatorService.processMessage(
        client.userId,
        client.userName,
        content.trim(),
        client.context,
        {
          onTextChunk: (text, messageId) => {
            // Don't send if aborted
            if (abortController.signal.aborted) return;
            this.send(client.ws, {
              type: 'text_chunk',
              text,
              messageId,
            });
          },
          onToolUse: ({ name, input, messageId }) => {
            if (abortController.signal.aborted) return;
            this.send(client.ws, {
              type: 'tool_use',
              toolName: name,
              toolInput: input,
              messageId,
              startTime: Date.now(),
            });
          },
          onToolResult: ({ name, output, messageId }) => {
            if (abortController.signal.aborted) return;
            this.send(client.ws, {
              type: 'tool_result',
              toolName: name,
              toolOutput: output,
              messageId,
            });
          },
          onOpenQuestions: (questions) => {
            if (abortController.signal.aborted) return;
            this.send(client.ws, {
              type: 'open_questions',
              questions,
            });
          },
          onComplete: (message) => {
            // Don't send completion if aborted
            if (abortController.signal.aborted) return;
            this.send(client.ws, {
              type: 'message_complete',
              messageId: message.id,
              message,
            });
          },
          onError: (error) => {
            if (abortController.signal.aborted) return;
            this.send(client.ws, {
              type: 'error',
              error,
            });
          },
        },
        settings.name,  // Pass display name from settings
        abortController.signal  // Pass abort signal
      );
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[Facilitator] Client ${client.clientId} operation aborted`);
        return;
      }
      console.error('[Facilitator] Error processing message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    } finally {
      client.currentAbortController = null;
    }
  }

  /**
   * Handle a cancel request from a client.
   */
  private handleCancel(client: FacilitatorClient): void {
    if (client.currentAbortController) {
      console.log(`[Facilitator] Cancelling operation for client ${client.clientId}`);
      client.currentAbortController.abort();
      client.currentAbortController = null;
    } else {
      console.log(`[Facilitator] No operation to cancel for client ${client.clientId}`);
    }
  }

  /**
   * Handle a clear history request from a client.
   * Clears history and starts a fresh session (no greeting).
   */
  private async handleClearHistory(client: FacilitatorClient): Promise<void> {
    console.log(`[Facilitator] handleClearHistory called for client ${client.clientId}`);
    try {
      await this.facilitatorService.clearHistory(client.userId);
      this.send(client.ws, { type: 'history', messages: [] });
      console.log(`[Facilitator] Cleared history for client ${client.clientId}`);
    } catch (error) {
      console.error('[Facilitator] Error clearing history:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to clear history' });
    }
  }

  /**
   * Handle a persona change request from a client.
   * This clears history, changes persona, and generates a greeting.
   * Uses a version counter to cancel stale greeting generations.
   */
  private async handlePersonaChange(client: FacilitatorClient, presetId: string): Promise<void> {
    const CUSTOM_PRESET_ID = '__custom__';

    // Increment version to cancel any in-progress greeting generation
    client.personaChangeVersion++;
    const currentVersion = client.personaChangeVersion;

    try {
      console.log(`[Facilitator] Client ${client.clientId} changing persona to: ${presetId} (v${currentVersion})`);

      // Get display name from settings
      const settings = getFacilitatorSettings();

      // 1. Change the persona
      let personaName: string;
      if (presetId === CUSTOM_PRESET_ID) {
        const persona = this.facilitatorService.setCustomPersona();
        personaName = persona.name;
      } else {
        const persona = this.facilitatorService.setPersonaByPreset(presetId);
        personaName = persona.name;
      }

      // 2. Clear chat history
      await this.facilitatorService.clearHistory(client.userId);

      // 3. Send persona_changed + empty history to client
      this.send(client.ws, {
        type: 'persona_changed',
        personaName,
      });
      this.send(client.ws, { type: 'history', messages: [] });

      // 4. Signal loading state - greeting generation starting
      this.send(client.ws, { type: 'loading', isLoading: true });

      // 5. Generate greeting with the new persona (pass display name from settings)
      console.log(`[Facilitator] Generating greeting for ${client.userName} from ${personaName} (display: ${settings.name})...`);
      const greeting = await this.facilitatorService.generateGreeting(client.userName, settings.name);

      // Check if a newer persona change has started - if so, don't send this greeting
      if (client.personaChangeVersion !== currentVersion) {
        console.log(`[Facilitator] Discarding stale greeting (v${currentVersion}, current: v${client.personaChangeVersion})`);
        return;
      }

      // 6. Send greeting as a complete assistant message
      const greetingMessageId = `msg-greeting-${Date.now()}`;
      this.send(client.ws, {
        type: 'greeting',
        text: greeting,
        messageId: greetingMessageId,
        personaName,
      });

      // 7. Signal loading complete
      this.send(client.ws, { type: 'loading', isLoading: false });

      console.log(`[Facilitator] Persona change complete for client ${client.clientId} (v${currentVersion})`);
    } catch (error) {
      // Only send error if this is still the current version
      if (client.personaChangeVersion === currentVersion) {
        console.error('[Facilitator] Error changing persona:', error);
        this.send(client.ws, { type: 'loading', isLoading: false });
        this.send(client.ws, { type: 'error', error: 'Failed to change persona' });
      }
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
