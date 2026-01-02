import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { ExecutionAgentService, type TaskCompleteEvent, type PhaseCompleteEvent, type ExecutionBlockedEvent, type NewIdeaEvent } from '../services/ExecutionAgentService.js';
import type { ExecutionIdeaContext } from '../prompts/executionAgentPrompt.js';
import type { IdeaPlan } from '../services/IdeaService.js';
import type { IdeaService } from '../services/IdeaService.js';

/**
 * Client message types for the execution agent WebSocket protocol
 */
interface ClientMessage {
  type: 'start_execution' | 'continue_execution' | 'pause' | 'resume' | 'feedback' | 'cancel';
  /** Idea context for execution */
  idea?: ExecutionIdeaContext;
  /** Plan data for execution */
  plan?: IdeaPlan;
  /** Phase ID to execute */
  phaseId?: string;
  /** Feedback content (for feedback type) */
  content?: string;
}

/**
 * Server message types for the execution agent WebSocket protocol
 */
interface ServerMessage {
  type: 'text_chunk' | 'task_complete' | 'phase_complete' | 'execution_blocked' | 'new_idea' | 'tool_use_start' | 'tool_use_end' | 'execution_complete' | 'error' | 'token_usage';
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
  /** Tool name (for tool_use_start/end) */
  toolName?: string;
  /** Tool input (for tool_use_start) */
  toolInput?: unknown;
  /** Tool result (for tool_use_end) */
  toolResult?: string;
  /** Error message */
  error?: string;
  /** Token usage information */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
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
  /** Cancel flag for ongoing operations */
  cancelled: boolean;
}

/**
 * WebSocket handler for the execution agent.
 * Manages connections and routes messages to the ExecutionAgentService.
 */
export class ExecutionAgentWebSocketHandler {
  private clients: Map<WebSocket, ExecutionAgentClient> = new Map();
  private clientIdCounter = 0;
  private executionAgentService: ExecutionAgentService;

  constructor(ideaService: IdeaService) {
    this.executionAgentService = new ExecutionAgentService(ideaService);
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

    // Create client
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
      cancelled: false,
    };

    this.clients.set(ws, client);
    console.log(`[ExecutionAgent] Client ${clientId} (${userName}) connected for idea ${ideaId}`);

    // Set up WebSocket handlers
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
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: ExecutionAgentClient, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'start_execution':
          if (clientMessage.idea && clientMessage.plan && clientMessage.phaseId) {
            client.ideaContext = clientMessage.idea;
            client.plan = clientMessage.plan;
            client.currentPhaseId = clientMessage.phaseId;
            client.cancelled = false;
            client.isPaused = false;
            await this.handleStartExecution(client);
          } else {
            this.send(client.ws, { type: 'error', error: 'Idea, plan, and phaseId are required' });
          }
          break;

        case 'feedback':
          if (clientMessage.content && client.plan && client.currentPhaseId) {
            await this.handleFeedback(client, clientMessage.content);
          } else {
            this.send(client.ws, { type: 'error', error: 'Feedback content and active execution required' });
          }
          break;

        case 'pause':
          client.isPaused = true;
          console.log(`[ExecutionAgent] Client ${client.clientId} paused execution`);
          break;

        case 'resume':
          client.isPaused = false;
          console.log(`[ExecutionAgent] Client ${client.clientId} resumed execution`);
          break;

        case 'cancel':
          client.cancelled = true;
          console.log(`[ExecutionAgent] Client ${client.clientId} cancelled execution`);
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
    if (!client.ideaContext || !client.plan || !client.currentPhaseId) {
      this.send(client.ws, { type: 'error', error: 'Missing execution context' });
      return;
    }

    try {
      await this.executionAgentService.executePhase(
        client.ideaId,
        client.ideaContext,
        client.plan,
        client.currentPhaseId,
        client.userId,
        {
          onTextChunk: (text, messageId) => {
            if (!client.cancelled && !client.isPaused) {
              this.send(client.ws, {
                type: 'text_chunk',
                text,
                messageId,
              });
            }
          },
          onTaskComplete: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'task_complete',
                taskComplete: event,
              });
            }
          },
          onPhaseComplete: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'phase_complete',
                phaseComplete: event,
              });
            }
          },
          onExecutionBlocked: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'execution_blocked',
                executionBlocked: event,
              });
            }
          },
          onNewIdea: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'new_idea',
                newIdea: event,
              });
            }
          },
          onToolUseStart: (toolName, toolInput) => {
            if (!client.cancelled && !client.isPaused) {
              this.send(client.ws, {
                type: 'tool_use_start',
                toolName,
                toolInput,
              });
            }
          },
          onToolUseEnd: (toolName, result) => {
            if (!client.cancelled && !client.isPaused) {
              this.send(client.ws, {
                type: 'tool_use_end',
                toolName,
                toolResult: result,
              });
            }
          },
          onComplete: () => {
            if (!client.cancelled) {
              this.send(client.ws, { type: 'execution_complete' });
            }
          },
          onError: (error) => {
            this.send(client.ws, { type: 'error', error });
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
      console.error('[ExecutionAgent] Error during execution:', error);
      this.send(client.ws, { type: 'error', error: 'Execution failed' });
    }
  }

  /**
   * Handle feedback during execution.
   */
  private async handleFeedback(client: ExecutionAgentClient, feedback: string): Promise<void> {
    if (!client.ideaContext || !client.plan || !client.currentPhaseId) {
      this.send(client.ws, { type: 'error', error: 'Missing execution context' });
      return;
    }

    try {
      await this.executionAgentService.continueWithFeedback(
        client.ideaId,
        client.ideaContext,
        client.plan,
        client.currentPhaseId,
        client.userId,
        feedback,
        {
          onTextChunk: (text, messageId) => {
            if (!client.cancelled && !client.isPaused) {
              this.send(client.ws, {
                type: 'text_chunk',
                text,
                messageId,
              });
            }
          },
          onTaskComplete: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'task_complete',
                taskComplete: event,
              });
            }
          },
          onPhaseComplete: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'phase_complete',
                phaseComplete: event,
              });
            }
          },
          onExecutionBlocked: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'execution_blocked',
                executionBlocked: event,
              });
            }
          },
          onNewIdea: (event) => {
            if (!client.cancelled) {
              this.send(client.ws, {
                type: 'new_idea',
                newIdea: event,
              });
            }
          },
          onToolUseStart: (toolName, toolInput) => {
            if (!client.cancelled && !client.isPaused) {
              this.send(client.ws, {
                type: 'tool_use_start',
                toolName,
                toolInput,
              });
            }
          },
          onToolUseEnd: (toolName, result) => {
            if (!client.cancelled && !client.isPaused) {
              this.send(client.ws, {
                type: 'tool_use_end',
                toolName,
                toolResult: result,
              });
            }
          },
          onComplete: () => {
            if (!client.cancelled) {
              this.send(client.ws, { type: 'execution_complete' });
            }
          },
          onError: (error) => {
            this.send(client.ws, { type: 'error', error });
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
      console.error('[ExecutionAgent] Error during feedback handling:', error);
      this.send(client.ws, { type: 'error', error: 'Feedback handling failed' });
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: ExecutionAgentClient): void {
    client.cancelled = true; // Cancel any ongoing operations
    this.clients.delete(client.ws);
    console.log(`[ExecutionAgent] Client ${client.clientId} (${client.userName}) disconnected`);
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
      client.cancelled = true;
      client.ws.close();
    }
    this.clients.clear();
  }
}
