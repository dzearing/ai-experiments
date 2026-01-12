import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import {
  ExecutionAgentService,
  type TaskCompleteEvent,
  type PhaseCompleteEvent,
  type ExecutionBlockedEvent,
  type NewIdeaEvent,
  type TaskUpdateEvent,
  type ExecutionStreamCallbacks,
} from '../services/ExecutionAgentService.js';
import type { ExecutionIdeaContext } from '../prompts/executionAgentPrompt.js';
import type { IdeaPlan } from '../services/IdeaService.js';
import type { IdeaService } from '../services/IdeaService.js';
import type { WorkspaceWebSocketHandler } from './WorkspaceWebSocketHandler.js';

/**
 * Client message types for the execution agent WebSocket protocol
 */
interface ClientMessage {
  type: 'connect' | 'start_execution' | 'continue_execution' | 'pause' | 'resume' | 'feedback' | 'cancel' | 'get_history' | 'get_session_state' | 'send_message';
  /** Idea context for execution */
  idea?: ExecutionIdeaContext;
  /** Plan data for execution */
  plan?: IdeaPlan;
  /** Phase ID to execute */
  phaseId?: string;
  /** Feedback/message content */
  content?: string;
  /** Limit for history retrieval */
  limit?: number;
  /** Whether to pause between phases (default: false = auto-continue) */
  pauseBetweenPhases?: boolean;
}

/**
 * Server message types for the execution agent WebSocket protocol
 */
interface ServerMessage {
  type: 'connected' | 'session_state' | 'history' | 'text_chunk' | 'task_complete' | 'phase_complete' | 'execution_blocked' | 'new_idea' | 'task_update' | 'tool_use_start' | 'tool_use_end' | 'execution_complete' | 'error' | 'token_usage';
  /** Text content chunk (for streaming) */
  text?: string;
  /** Message ID being updated */
  messageId?: string;
  /** Task completion event */
  taskComplete?: TaskCompleteEvent;
  /** Phase completion event */
  phaseComplete?: PhaseCompleteEvent;
  /** Execution blocked event */
  executionBlocked?: ExecutionBlockedEvent;
  /** New idea discovered */
  newIdea?: NewIdeaEvent;
  /** Task update event */
  taskUpdate?: TaskUpdateEvent;
  /** Tool name (for tool_use_start/end) */
  toolName?: string;
  /** Tool input (for tool_use_start) */
  toolInput?: unknown;
  /** Tool result (for tool_use_end) */
  toolResult?: string;
  /** Error message */
  error?: string;
  /** Token usage information */
  usage?: { inputTokens: number; outputTokens: number };
  /** Session state for reconnection */
  session?: {
    status: 'running' | 'paused' | 'blocked' | 'completed' | 'error' | 'idle';
    phaseId?: string;
    startedAt?: number;
    errorMessage?: string;
  };
  /** Chat history messages */
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    type?: string;
    /** Tool calls made during this message */
    toolCalls?: Array<{
      name: string;
      input?: Record<string, unknown>;
      output?: string;
    }>;
  }>;
  /** Whether there's an active execution */
  hasActiveExecution?: boolean;
}

/**
 * Represents a connected execution agent client
 */
interface ExecutionAgentClient {
  ws: WebSocket;
  ideaId: string;
  userId: string;
  userName: string;
  clientId: number;
  /** Current idea context */
  ideaContext: ExecutionIdeaContext | null;
  /** Current plan */
  plan: IdeaPlan | null;
  /** Currently executing phase ID */
  currentPhaseId: string | null;
  /** Whether execution is paused */
  isPaused: boolean;
  /** Whether client wants to stop receiving updates */
  muted: boolean;
  /** Whether to pause between phases (default: false = auto-continue) */
  pauseBetweenPhases: boolean;
}

/**
 * WebSocket handler for the execution agent.
 * Manages connections and routes messages to the ExecutionAgentService.
 * Supports server-driven execution with reconnect/replay capabilities.
 */
export class ExecutionAgentWebSocketHandler {
  private clients: Map<WebSocket, ExecutionAgentClient> = new Map();
  private clientIdCounter = 0;
  private executionAgentService: ExecutionAgentService;
  private ideaService: IdeaService;

  constructor(ideaService: IdeaService, workspaceWsHandler?: WorkspaceWebSocketHandler) {
    this.ideaService = ideaService;
    this.executionAgentService = new ExecutionAgentService(ideaService);

    // Set up callback to broadcast execution state changes to clients
    if (workspaceWsHandler) {
      this.executionAgentService.setExecutionStateChangeCallback((ideaId, idea) => {
        const ideaData = idea as { workspaceId?: string; ownerId?: string };
        // Broadcast to workspace subscribers AND to the owner's clients
        // This ensures global ideas (no workspaceId) also receive updates
        if (ideaData.ownerId) {
          // Determine agentStatus based on session state
          const session = this.executionAgentService.getSession(ideaId);
          const agentStatus = session?.status === 'running' ? 'running'
            : session?.status === 'blocked' ? 'running'  // blocked is still "running" from card perspective
            : session?.status === 'error' ? 'error'
            : 'idle';

          workspaceWsHandler.notifyIdeaUpdate(
            ideaId,
            ideaData.ownerId,
            ideaData.workspaceId,
            {
              ...(idea as object),
              agentStatus,
              agentStartedAt: session?.startedAt ? new Date(session.startedAt).toISOString() : undefined,
              agentErrorMessage: session?.errorMessage,
            }
          );
        }
      });
    }
  }

  /**
   * Handle a new WebSocket connection.
   * URL format: /execution-agent-ws?ideaId=xxx&userId=xxx&userName=xxx
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

    const clientId = this.clientIdCounter++;
    const client: ExecutionAgentClient = {
      ws,
      ideaId,
      userId,
      userName,
      clientId,
      ideaContext: null,
      plan: null,
      currentPhaseId: null,
      isPaused: false,
      muted: false,
      pauseBetweenPhases: false,
    };

    this.clients.set(ws, client);
    console.log(`[ExecutionAgent] Client ${clientId} (${userName}) connected for idea ${ideaId}`);

    // Register with service to receive updates and replay queued messages
    this.registerClientWithService(client);

    ws.on('message', (data: RawData) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`[ExecutionAgent] Client ${clientId} error:`, error);
      this.handleDisconnect(client);
    });
  }

  /**
   * Register a client with the execution service to receive updates.
   */
  private registerClientWithService(client: ExecutionAgentClient): void {
    const callbacks = this.createCallbacks(client);
    this.executionAgentService.registerClient(client.ideaId, callbacks);

    // Send connection acknowledgment with session state
    const session = this.executionAgentService.getSession(client.ideaId);
    this.send(client.ws, {
      type: 'connected',
      hasActiveExecution: !!session && session.status === 'running',
      session: session ? {
        status: session.status,
        phaseId: session.phaseId,
        startedAt: session.startedAt,
        errorMessage: session.errorMessage,
      } : { status: 'idle' },
    });
  }

  /**
   * Create callbacks for the service to send messages to the client.
   */
  private createCallbacks(client: ExecutionAgentClient): ExecutionStreamCallbacks {
    return {
      onTextChunk: (text, messageId) => {
        if (!client.muted && !client.isPaused) {
          this.send(client.ws, { type: 'text_chunk', text, messageId });
        }
      },
      onTaskComplete: (event) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'task_complete', taskComplete: event });
        }
      },
      onPhaseComplete: (event) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'phase_complete', phaseComplete: event });
        }
      },
      onExecutionBlocked: (event) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'execution_blocked', executionBlocked: event });
        }
      },
      onNewIdea: (event) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'new_idea', newIdea: event });
        }
      },
      onTaskUpdate: (event) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'task_update', taskUpdate: event });
        }
      },
      onToolUseStart: (toolName, toolInput, messageId) => {
        if (!client.muted && !client.isPaused) {
          this.send(client.ws, { type: 'tool_use_start', toolName, toolInput, messageId });
        }
      },
      onToolUseEnd: (toolName, result, messageId) => {
        if (!client.muted && !client.isPaused) {
          this.send(client.ws, { type: 'tool_use_end', toolName, toolResult: result, messageId });
        }
      },
      onComplete: () => {
        if (!client.muted) {
          this.send(client.ws, { type: 'execution_complete' });
        }
      },
      onError: (error) => {
        this.send(client.ws, { type: 'error', error });
      },
      onTokenUsage: (usage) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'token_usage', usage });
        }
      },
      onSessionState: (session) => {
        if (!client.muted) {
          this.send(client.ws, { type: 'session_state', session, hasActiveExecution: session.status === 'running' });
        }
      },
    };
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: ExecutionAgentClient, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'connect':
          // Client reconnecting - just send current state (already handled in handleConnection)
          await this.handleGetSessionState(client);
          break;

        case 'start_execution':
          console.log(`[ExecutionAgent] Received start_execution: ideaId=${client.ideaId}, phaseId=${clientMessage.phaseId}, hasIdea=${!!clientMessage.idea}, hasPlan=${!!clientMessage.plan}, pauseBetweenPhases=${clientMessage.pauseBetweenPhases}`);
          if (clientMessage.idea && clientMessage.plan && clientMessage.phaseId) {
            client.ideaContext = clientMessage.idea;
            client.plan = clientMessage.plan;
            client.currentPhaseId = clientMessage.phaseId;
            client.isPaused = false;
            client.pauseBetweenPhases = clientMessage.pauseBetweenPhases ?? false;
            console.log(`[ExecutionAgent] Calling handleStartExecution for idea: ${clientMessage.idea.title}`);
            await this.handleStartExecution(client);
          } else {
            console.log(`[ExecutionAgent] start_execution missing required fields: idea=${!!clientMessage.idea}, plan=${!!clientMessage.plan}, phaseId=${!!clientMessage.phaseId}`);
            this.send(client.ws, { type: 'error', error: 'Idea, plan, and phaseId are required' });
          }
          break;

        case 'send_message':
        case 'feedback':
          console.log(`[ExecutionAgent] Received message from client ${client.clientId}: "${clientMessage.content?.slice(0, 50)}..."`);
          if (clientMessage.content) {
            // Get context from client, active session, or fetch from idea
            const session = this.executionAgentService.getSession(client.ideaId);
            let hasContext: boolean = !!(client.plan || (session?.plan && session?.ideaContext));

            // If no context, try to fetch from idea service
            if (!hasContext) {
              console.log(`[ExecutionAgent] No cached context, fetching from idea service...`);
              const idea = await this.ideaService.getIdeaByIdNoAuth(client.ideaId);
              if (idea?.plan && idea.plan.phases?.length > 0) {
                // Build idea context and restore to client
                client.plan = idea.plan;
                client.ideaContext = {
                  id: idea.id,
                  title: idea.title,
                  summary: idea.summary || '',
                  description: idea.description || '',
                };
                hasContext = true;
                console.log(`[ExecutionAgent] Restored context from idea: ${idea.title}`);
              }
            }

            console.log(`[ExecutionAgent] hasContext=${hasContext}, client.plan=${!!client.plan}, session.plan=${!!session?.plan}`);
            if (hasContext) {
              await this.handleSendMessage(client, clientMessage.content);
            } else {
              console.log(`[ExecutionAgent] Error: No plan found for idea ${client.ideaId}`);
              this.send(client.ws, { type: 'error', error: 'No plan found for this idea. Please create a plan first.' });
            }
          } else {
            this.send(client.ws, { type: 'error', error: 'Message content is required' });
          }
          break;

        case 'get_history':
          await this.handleGetHistory(client, clientMessage.limit);
          break;

        case 'get_session_state':
          await this.handleGetSessionState(client);
          break;

        case 'pause':
          client.isPaused = true;
          console.log(`[ExecutionAgent] Client ${client.clientId} paused updates`);
          break;

        case 'resume':
          client.isPaused = false;
          console.log(`[ExecutionAgent] Client ${client.clientId} resumed updates`);
          break;

        case 'cancel':
          client.muted = true;
          console.log(`[ExecutionAgent] Client ${client.clientId} muted (execution continues in background)`);
          break;

        default:
          console.warn(`[ExecutionAgent] Unknown message type: ${(clientMessage as ClientMessage).type}`);
      }
    } catch (error) {
      console.error('[ExecutionAgent] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle starting execution of a phase.
   */
  private async handleStartExecution(client: ExecutionAgentClient): Promise<void> {
    console.log(`[ExecutionAgent] handleStartExecution called: ideaId=${client.ideaId}, phaseId=${client.currentPhaseId}`);
    if (!client.ideaContext || !client.plan || !client.currentPhaseId) {
      console.log(`[ExecutionAgent] handleStartExecution missing context: ideaContext=${!!client.ideaContext}, plan=${!!client.plan}, phaseId=${!!client.currentPhaseId}`);
      this.send(client.ws, { type: 'error', error: 'Missing execution context' });
      return;
    }

    try {
      console.log(`[ExecutionAgent] Calling executionAgentService.startExecution for idea: ${client.ideaContext.title}, pauseBetweenPhases=${client.pauseBetweenPhases}`);
      // Start execution in background - service handles everything
      await this.executionAgentService.startExecution(
        client.ideaId,
        client.ideaContext,
        client.plan,
        client.currentPhaseId,
        client.userId,
        client.pauseBetweenPhases
      );
      console.log(`[ExecutionAgent] executionAgentService.startExecution completed (async started)`);
    } catch (error) {
      console.error('[ExecutionAgent] Error starting execution:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to start execution' });
    }
  }

  /**
   * Handle sending a message during execution.
   */
  private async handleSendMessage(client: ExecutionAgentClient, message: string): Promise<void> {
    // Get context from client first, then fallback to session
    const session = this.executionAgentService.getSession(client.ideaId);
    const ideaContext = client.ideaContext || session?.ideaContext;
    const plan = client.plan || session?.plan;

    if (!ideaContext || !plan) {
      this.send(client.ws, { type: 'error', error: 'Missing execution context' });
      return;
    }

    try {
      await this.executionAgentService.sendMessage(
        client.ideaId,
        ideaContext,
        plan,
        client.userId,
        message
      );
    } catch (error) {
      console.error('[ExecutionAgent] Error sending message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to send message' });
    }
  }

  /**
   * Handle getting chat history.
   */
  private async handleGetHistory(client: ExecutionAgentClient, limit?: number): Promise<void> {
    try {
      const messages = await this.executionAgentService.getChatHistory(client.ideaId, limit);
      this.send(client.ws, {
        type: 'history',
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          type: m.type,
          // Include tool calls for persistence
          toolCalls: m.toolCalls,
        })),
      });
    } catch (error) {
      console.error('[ExecutionAgent] Error getting history:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to get history' });
    }
  }

  /**
   * Handle getting current session state.
   */
  private async handleGetSessionState(client: ExecutionAgentClient): Promise<void> {
    const session = this.executionAgentService.getSession(client.ideaId);
    this.send(client.ws, {
      type: 'session_state',
      hasActiveExecution: !!session && session.status === 'running',
      session: session ? {
        status: session.status,
        phaseId: session.phaseId,
        startedAt: session.startedAt,
        errorMessage: session.errorMessage,
      } : { status: 'idle' },
    });
  }

  /**
   * Handle client disconnect.
   * Execution continues in background - we just unregister the client.
   */
  private handleDisconnect(client: ExecutionAgentClient): void {
    // Unregister from service - execution continues in background
    this.executionAgentService.unregisterClient(client.ideaId);
    this.clients.delete(client.ws);
    console.log(`[ExecutionAgent] Client ${client.clientId} (${client.userName}) disconnected (execution continues)`);
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
  getService(): ExecutionAgentService {
    return this.executionAgentService;
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    for (const client of this.clients.values()) {
      this.executionAgentService.unregisterClient(client.ideaId);
      client.ws.close();
    }
    this.clients.clear();
  }
}
