import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { PlanAgentChatService, type PlanAgentMessage } from './PlanAgentChatService.js';
import { PlanAgentYjsClient } from './PlanAgentYjsClient.js';
import { buildPlanAgentSystemPrompt, type PlanIdeaContext } from '../prompts/planAgentPrompt.js';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';
import type { IdeaPlan, PlanPhase } from './IdeaService.js';
import type { DocumentEdit } from './IdeaAgentService.js';
import { getClaudeDiagnosticsService } from '../routes/diagnostics.js';
import type { AgentProgressCallbacks, AgentProgressEvent } from '../shared/agentProgress.js';
import { createStatusEvent } from '../shared/agentProgressUtils.js';
import { createToolStartEvent, createToolCompleteEvent } from '../shared/sdkStreamProcessor.js';
import { ThingService, THING_TYPE_SCHEMAS } from './ThingService.js';
import { createThingToolsMcpServer } from '../shared/thingToolsMcp.js';
// Re-export shared types for backwards compatibility
export type { OpenQuestion, SuggestedResponse, TokenUsage } from '../shared/agentResponseTypes.js';
import type { OpenQuestion, SuggestedResponse, TokenUsage } from '../shared/agentResponseTypes.js';
import {
  parseOpenQuestions,
  parseSuggestedResponses,
  findBlockStart,
  findSafeStreamEnd,
  PLAN_AGENT_BLOCK_TAGS,
  PLAN_AGENT_SAFE_STREAM_TAGS,
} from '../shared/agentResponseParsers.js';
import { buildConversationHistory, generateMessageId, MAX_QUEUED_MESSAGES } from '../shared/agentSessionUtils.js';

/**
 * Queued message for replay when client reconnects
 */
export interface PlanAgentQueuedMessage {
  type: 'text_chunk' | 'plan_update' | 'message_complete' | 'error' | 'token_usage' | 'document_edit_start' | 'document_edit_end' | 'open_questions' | 'suggested_responses' | 'agent_progress';
  data: unknown;
  timestamp: number;
  messageId?: string;
}

/**
 * Session state for an idea's plan agent chat
 */
export interface PlanAgentSession {
  ideaId: string;
  userId: string;
  status: 'idle' | 'running' | 'error';
  startedAt?: number;
  queuedMessages: PlanAgentQueuedMessage[];
  clientConnected: boolean;
  /** Current abort controller for the running operation */
  currentAbortController?: AbortController;
  /** Workspace ID for broadcasting state changes */
  workspaceId?: string;
}

/**
 * Callbacks for streaming plan agent responses
 */
export interface PlanStreamCallbacks extends AgentProgressCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when a plan update is detected */
  onPlanUpdate: (plan: Partial<IdeaPlan>) => void;
  /** Called when the response is complete */
  onComplete: (message: PlanAgentMessage) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called with token usage updates during streaming */
  onTokenUsage?: (usage: TokenUsage) => void;
  /** Called when document editing starts */
  onDocumentEditStart?: () => void;
  /** Called when document editing ends */
  onDocumentEditEnd?: () => void;
  /** Called when open questions are extracted from the response */
  onOpenQuestions?: (questions: OpenQuestion[]) => void;
  /** Called when suggested responses are extracted from the response */
  onSuggestedResponses?: (suggestions: SuggestedResponse[]) => void;
}

/**
 * Parsed plan update from agent response
 */
interface ParsedPlanUpdate {
  phases?: PlanPhase[];
  workingDirectory?: string;
  repositoryUrl?: string;
  branch?: string;
  isClone?: boolean;
  workspaceId?: string;
}

/**
 * Parse plan update from agent response
 * Chat response comes FIRST (before the tag), plan block at END
 */
function parsePlanUpdate(response: string): { plan: ParsedPlanUpdate | null; chatResponse: string } {
  const planMatch = response.match(/<plan_update>\s*([\s\S]*?)\s*<\/plan_update>/);

  if (!planMatch) {
    return { plan: null, chatResponse: response };
  }

  try {
    const plan = JSON.parse(planMatch[1]) as ParsedPlanUpdate;
    // Chat response is everything BEFORE the plan block
    const chatResponse = response.slice(0, response.indexOf('<plan_update>')).trim() || "I've created the plan for you.";
    return { plan, chatResponse };
  } catch {
    console.error('[PlanAgentService] Failed to parse plan update JSON');
    return { plan: null, chatResponse: response };
  }
}

/**
 * Parse implementation plan document update from agent response
 */
function parseImplPlanUpdate(response: string): { content: string | null; chatResponse: string } {
  const implPlanMatch = response.match(/<impl_plan_update>\s*([\s\S]*?)\s*<\/impl_plan_update>/);

  if (!implPlanMatch) {
    return { content: null, chatResponse: response };
  }

  // The content is the markdown directly (not JSON)
  const content = implPlanMatch[1].trim();
  const chatResponse = response.slice(0, response.indexOf('<impl_plan_update>')).trim() || "I've updated the implementation plan.";
  return { content, chatResponse };
}

/**
 * Parse implementation plan document edits from agent response
 */
function parseImplPlanEdits(response: string): { edits: DocumentEdit[] | null; chatResponse: string } {
  const editsMatch = response.match(/<impl_plan_edits>\s*([\s\S]*?)\s*<\/impl_plan_edits>/);

  if (!editsMatch) {
    return { edits: null, chatResponse: response };
  }

  try {
    const edits = JSON.parse(editsMatch[1]) as DocumentEdit[];
    const chatResponse = response.slice(0, response.indexOf('<impl_plan_edits>')).trim() || "I've made edits to the implementation plan.";
    return { edits, chatResponse };
  } catch {
    console.error('[PlanAgentService] Failed to parse impl plan edits JSON');
    return { edits: null, chatResponse: response };
  }
}

/**
 * Check if a partial response contains the start of any special block
 */
function findPlanBlockStart(text: string): number {
  return findBlockStart(text, PLAN_AGENT_BLOCK_TAGS);
}

/**
 * Service for orchestrating plan agent chat with Claude.
 * Handles message processing and streaming responses for implementation planning.
 * Supports editing the Implementation Plan document via Yjs.
 */
/**
 * Resolved execution context for an idea
 */
export interface ResolvedExecutionContext {
  /** Whether this is a code-related idea requiring execution context */
  isCodeIdea: boolean;
  /** Working directory on disk */
  workingDirectory?: string;
  /** Git repository URL */
  repositoryUrl?: string;
  /** Git branch */
  branch?: string;
  /** Whether to work on a clone */
  isClone?: boolean;
  /** Thing that provides the context */
  contextThingId?: string;
  contextThingName?: string;
}

/**
 * Result of trying to resolve execution context
 */
export interface ExecutionContextResult {
  /** Resolved context if found */
  resolved?: ResolvedExecutionContext;
  /** Questions to ask user if context couldn't be resolved */
  questions?: OpenQuestion[];
}

export class PlanAgentService {
  private chatService: PlanAgentChatService;
  private yjsClient: PlanAgentYjsClient | null = null;
  private thingService: ThingService;

  // Session management for background execution
  private activeSessions = new Map<string, PlanAgentSession>();
  private clientCallbacks = new Map<string, PlanStreamCallbacks>();
  /** Callback for broadcasting session state changes to clients */
  private onSessionStateChange?: (ideaId: string, status: 'idle' | 'running' | 'error', userId: string, workspaceId?: string) => void;

  constructor(yjsHandler?: YjsCollaborationHandler) {
    this.chatService = new PlanAgentChatService();
    this.thingService = new ThingService();
    if (yjsHandler) {
      this.yjsClient = new PlanAgentYjsClient(yjsHandler);
    }
  }

  /**
   * Set a callback to be called when session state changes.
   * This allows the WebSocket handler to broadcast updates to clients.
   */
  setSessionStateChangeCallback(callback: (ideaId: string, status: 'idle' | 'running' | 'error', userId: string, workspaceId?: string) => void): void {
    this.onSessionStateChange = callback;
  }

  /**
   * Register a client's callbacks for receiving messages.
   * Replays any queued messages from background execution.
   */
  registerClient(ideaId: string, callbacks: PlanStreamCallbacks, workspaceId?: string): void {
    this.clientCallbacks.set(ideaId, callbacks);
    let session = this.activeSessions.get(ideaId);
    if (session) {
      session.clientConnected = true;
      // Update workspaceId if provided (needed for broadcasts)
      if (workspaceId) {
        session.workspaceId = workspaceId;
      }
      // Replay any queued messages
      console.log(`[PlanAgentService] Client connected to idea ${ideaId}, replaying ${session.queuedMessages.length} queued messages`);
      for (const msg of session.queuedMessages) {
        this.dispatchMessage(msg, callbacks);
      }
      session.queuedMessages = [];
    } else if (workspaceId) {
      // Create a session to store workspaceId even if no active session yet
      session = {
        ideaId,
        userId: '', // Will be updated when processMessage is called
        status: 'idle',
        queuedMessages: [],
        clientConnected: true,
        workspaceId,
      };
      this.activeSessions.set(ideaId, session);
    }
  }

  /**
   * Unregister a client's callbacks (when they disconnect).
   * The session continues running - messages are queued for later replay.
   */
  unregisterClient(ideaId: string): void {
    this.clientCallbacks.delete(ideaId);
    const session = this.activeSessions.get(ideaId);
    if (session) {
      session.clientConnected = false;
      console.log(`[PlanAgentService] Client disconnected from idea ${ideaId}, session continues in background`);
    }
  }

  /**
   * Get the current session for an idea (if any).
   */
  getSession(ideaId: string): PlanAgentSession | undefined {
    return this.activeSessions.get(ideaId);
  }

  /**
   * Abort the current session for an idea.
   * Called when user presses Escape to explicitly cancel.
   */
  abortSession(ideaId: string): void {
    const session = this.activeSessions.get(ideaId);
    if (session?.currentAbortController) {
      console.log(`[PlanAgentService] Aborting session for idea ${ideaId}`);
      session.currentAbortController.abort();
      session.status = 'idle';
      session.currentAbortController = undefined;
    }
  }

  /**
   * Dispatch a message to the client or queue it for later.
   */
  private dispatchOrQueue(ideaId: string, message: PlanAgentQueuedMessage): void {
    const callbacks = this.clientCallbacks.get(ideaId);
    if (callbacks) {
      this.dispatchMessage(message, callbacks);
    } else {
      const session = this.activeSessions.get(ideaId);
      if (session) {
        session.queuedMessages.push(message);
        // Limit queue size to prevent memory issues
        if (session.queuedMessages.length > MAX_QUEUED_MESSAGES * 2) {
          session.queuedMessages = session.queuedMessages.slice(-MAX_QUEUED_MESSAGES);
        }
      }
    }
  }

  /**
   * Dispatch a queued message to the client callbacks.
   */
  private dispatchMessage(message: PlanAgentQueuedMessage, callbacks: PlanStreamCallbacks): void {
    switch (message.type) {
      case 'text_chunk': {
        const { text, messageId } = message.data as { text: string; messageId: string };
        callbacks.onTextChunk(text, messageId);
        break;
      }
      case 'plan_update':
        callbacks.onPlanUpdate(message.data as Partial<IdeaPlan>);
        break;
      case 'message_complete':
        callbacks.onComplete(message.data as PlanAgentMessage);
        break;
      case 'error':
        callbacks.onError(message.data as string);
        break;
      case 'token_usage':
        callbacks.onTokenUsage?.(message.data as TokenUsage);
        break;
      case 'document_edit_start':
        callbacks.onDocumentEditStart?.();
        break;
      case 'document_edit_end':
        callbacks.onDocumentEditEnd?.();
        break;
      case 'open_questions':
        callbacks.onOpenQuestions?.(message.data as OpenQuestion[]);
        break;
      case 'suggested_responses':
        callbacks.onSuggestedResponses?.(message.data as SuggestedResponse[]);
        break;
      case 'agent_progress':
        callbacks.onProgressEvent?.(message.data as AgentProgressEvent);
        break;
    }
  }

  /**
   * Resolve execution context for an idea based on linked things.
   * Returns either a resolved context or questions to ask the user.
   *
   * @param ideaTitle - The idea title (for inferring if code-related)
   * @param ideaSummary - The idea summary (for inferring if code-related)
   * @param linkedThingIds - Thing IDs linked to this idea
   * @param userId - The user ID for access control
   */
  async resolveExecutionContext(
    ideaTitle: string,
    ideaSummary: string,
    linkedThingIds: string[],
    userId: string
  ): Promise<ExecutionContextResult> {
    // 1. Infer if this is a code-related idea
    const isCodeIdea = this.inferIsCodeIdea(ideaTitle, ideaSummary, linkedThingIds);

    if (!isCodeIdea) {
      // Non-code idea - no execution context needed
      return {
        resolved: { isCodeIdea: false },
      };
    }

    // 2. Try to resolve from linked things
    for (const thingId of linkedThingIds) {
      const thing = await this.thingService.getThing(thingId, userId, true);
      if (!thing) continue;

      // Check if this thing type provides execution context
      const schema = THING_TYPE_SCHEMAS[thing.type];
      if (!schema?.providesExecutionContext) continue;

      // Resolve key properties
      const keyProps = await this.thingService.resolveKeyProperties(thingId, userId);

      if (keyProps.localPath || keyProps.remoteUrl) {
        return {
          resolved: {
            isCodeIdea: true,
            workingDirectory: keyProps.localPath,
            repositoryUrl: keyProps.remoteUrl,
            branch: keyProps.branch,
            isClone: keyProps.requiresClone,
            contextThingId: thingId,
            contextThingName: thing.name,
          },
        };
      }
    }

    // 3. No context found - ask user to select a thing or provide a path
    return {
      questions: [{
        id: 'execution-scope',
        question: 'Where should this code be implemented?',
        context: 'Select an existing project/package or provide a folder path where the code will live.',
        selectionType: 'single', // Will be 'thing-picker' once we implement that
        options: [
          {
            id: 'new-folder',
            label: 'New folder',
            description: 'I\'ll provide a path to a new or existing folder',
          },
          {
            id: 'existing-thing',
            label: 'Existing project',
            description: 'Select from my existing projects and packages',
          },
        ],
        allowCustom: true,
      }],
    };
  }

  /**
   * Infer whether an idea is code-related based on title, summary, and linked things.
   */
  private inferIsCodeIdea(
    title: string,
    summary: string,
    linkedThingIds: string[]
  ): boolean {
    // Code-related keywords
    const codeKeywords = [
      'implement', 'build', 'create', 'develop', 'code', 'program',
      'fix', 'bug', 'feature', 'api', 'backend', 'frontend', 'ui',
      'component', 'service', 'function', 'class', 'module',
      'refactor', 'optimize', 'test', 'deploy', 'integrate',
      'database', 'endpoint', 'route', 'migration'
    ];

    // Non-code keywords (research, creative, planning)
    const nonCodeKeywords = [
      'research', 'investigate', 'explore', 'study', 'analyze',
      'write', 'story', 'article', 'blog', 'document', 'specification',
      'design', 'mockup', 'wireframe', 'prototype',
      'plan', 'strategy', 'roadmap', 'proposal'
    ];

    const textToCheck = `${title} ${summary}`.toLowerCase();

    // Count keyword matches
    const codeMatches = codeKeywords.filter(kw => textToCheck.includes(kw)).length;
    const nonCodeMatches = nonCodeKeywords.filter(kw => textToCheck.includes(kw)).length;

    // If linked to things, check if any are execution-context types
    if (linkedThingIds.length > 0) {
      // Having linked things suggests it's more likely to be code-related
      // (This is a simple heuristic - could be refined)
      return codeMatches >= nonCodeMatches;
    }

    // Default: if more code keywords than non-code, it's code-related
    // Or if explicitly has strong code indicators
    return codeMatches > nonCodeMatches || codeMatches >= 2;
  }

  /**
   * Get message history for an idea's plan chat.
   */
  async getHistory(ideaId: string): Promise<PlanAgentMessage[]> {
    return this.chatService.getMessages(ideaId);
  }

  /**
   * Clear message history for an idea's plan chat.
   */
  async clearHistory(ideaId: string): Promise<void> {
    return this.chatService.clearMessages(ideaId);
  }

  /**
   * Delete all plan chat data for an idea.
   */
  async deleteIdeaChat(ideaId: string): Promise<void> {
    return this.chatService.deleteIdeaChat(ideaId);
  }

  /**
   * Generate an initial greeting for the plan agent.
   */
  async generateGreeting(ideaContext: PlanIdeaContext): Promise<string> {
    const { title, summary, thingContext } = ideaContext;

    // Build a contextual greeting based on what we know
    let greeting = `Let's create an implementation plan for **"${title}"**.`;

    if (summary) {
      greeting += `\n\n> ${summary}`;
    }

    if (thingContext) {
      greeting += `\n\nThis idea is connected to **${thingContext.name}** (${thingContext.type}).`;
    }

    greeting += `\n\nTo create a good plan, I need to understand a few things:

1. **Technology stack** - What languages, frameworks, or tools will we use?
2. **Environment** - Is this for an existing project, or are we starting fresh?
3. **Scope** - What's the minimum viable version look like?

Feel free to share any details, and I'll start building out the phases and tasks.`;

    return greeting;
  }

  /**
   * Save a greeting message to plan chat history.
   */
  async saveGreeting(ideaId: string, greeting: string): Promise<void> {
    await this.chatService.addMessage(ideaId, 'system', 'assistant', greeting);
  }

  /**
   * Process a user message and stream the response via callbacks.
   * Streams chat text in real-time, buffers plan blocks, then calls onPlanUpdate.
   * Handles Implementation Plan document edits via Yjs if documentRoomName provided.
   * Uses session management for background execution support.
   * @param isAutoStart - If true, skip saving the user message (used for server-initiated auto-start)
   * @param modelId - Optional model ID to use (defaults to claude-sonnet-4-5-20250929)
   */
  async processMessage(
    ideaId: string,
    userId: string,
    content: string,
    ideaContext: PlanIdeaContext,
    documentRoomName?: string,
    isAutoStart = false,
    modelId?: string
  ): Promise<void> {
    // Create or get session
    let session = this.activeSessions.get(ideaId);
    if (!session) {
      session = {
        ideaId,
        userId,
        status: 'idle',
        queuedMessages: [],
        clientConnected: this.clientCallbacks.has(ideaId),
      };
      this.activeSessions.set(ideaId, session);
    }

    // Create abort controller for this operation
    const abortController = new AbortController();
    session.currentAbortController = abortController;
    session.status = 'running';
    session.startedAt = Date.now();

    // Broadcast state change
    this.onSessionStateChange?.(ideaId, 'running', session.userId, session.workspaceId);

    // Create local callbacks wrapper that uses dispatchOrQueue
    // This allows messages to be queued if client disconnects during execution
    const callbacks: PlanStreamCallbacks = {
      onTextChunk: (text: string, msgId: string) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'text_chunk', data: { text, messageId: msgId }, timestamp: Date.now(), messageId: msgId });
      },
      onPlanUpdate: (plan: Partial<IdeaPlan>) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'plan_update', data: plan, timestamp: Date.now() });
      },
      onComplete: (message: PlanAgentMessage) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'message_complete', data: message, timestamp: Date.now(), messageId: message.id });
      },
      onError: (error: string) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'error', data: error, timestamp: Date.now() });
      },
      onTokenUsage: (usage: TokenUsage) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'token_usage', data: usage, timestamp: Date.now() });
      },
      onDocumentEditStart: () => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'document_edit_start', data: null, timestamp: Date.now() });
      },
      onDocumentEditEnd: () => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'document_edit_end', data: null, timestamp: Date.now() });
      },
      onOpenQuestions: (questions: OpenQuestion[]) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'open_questions', data: questions, timestamp: Date.now() });
      },
      onSuggestedResponses: (suggestions: SuggestedResponse[]) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'suggested_responses', data: suggestions, timestamp: Date.now() });
      },
      onProgressEvent: (event: AgentProgressEvent) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'agent_progress', data: event, timestamp: Date.now() });
      },
    };

    // Save the user message (unless this is an auto-start)
    if (!isAutoStart) {
      await this.chatService.addMessage(ideaId, userId, 'user', content);
    }

    // Get history for context
    const history = await this.chatService.getMessages(ideaId);

    // Connect to Yjs room and get current document content if document editing is enabled
    let documentContent: string | null = null;
    if (this.yjsClient && documentRoomName) {
      try {
        await this.yjsClient.connect(documentRoomName);
        // Get current document content for the prompt (enables accurate edits)
        documentContent = this.yjsClient.getContent(documentRoomName);
        console.log(`[PlanAgentService] Got document content, length: ${documentContent?.length || 0}`);
      } catch (error) {
        console.error('[PlanAgentService] Failed to connect to Yjs room:', error);
      }
    }

    // Build the system prompt with idea context and current document
    const systemPrompt = buildPlanAgentSystemPrompt(ideaContext, documentContent);

    // Build the full prompt with conversation history
    const conversationHistory = buildConversationHistory(history.slice(0, -1));
    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = generateMessageId();

    // Streaming state
    let fullResponse = '';
    let streamedChatLength = 0;
    let foundBlockStart = false;
    let questionsSent = false;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Track tool calls for matching results
    const pendingToolCalls: Array<{ id: string; name: string; input: Record<string, unknown>; output?: string }> = [];

    // Track this request for diagnostics
    const diagnosticsService = getClaudeDiagnosticsService();
    const requestId = diagnosticsService.startRequest('planagent', ideaId, content.slice(0, 100));

    try {
      console.log(`[PlanAgentService] Processing message for idea ${ideaId}: "${content.slice(0, 50)}..."`);

      // Use the query function from @anthropic-ai/claude-agent-sdk
      const effectiveModel = modelId || 'claude-sonnet-4-5-20250929';
      console.log(`[PlanAgentService] Starting query with model ${effectiveModel}...`);

      // Create MCP server for thing tools so the agent can look up and modify Things
      const thingToolsServer = createThingToolsMcpServer(userId);

      const response = query({
        prompt: fullPrompt,
        options: {
          systemPrompt,
          model: effectiveModel,
          tools: [], // No built-in tools, only MCP tools
          mcpServers: { 'thing-tools': thingToolsServer },
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          maxTurns: 5, // Allow tool iterations for looking up Things
        },
      });

      console.log(`[PlanAgentService] Query created, starting stream...`);
      // Mark as streaming once we start receiving
      let hasStartedStreaming = false;

      // Stream response in real-time
      for await (const message of response) {
        console.log(`[PlanAgentService] Received message type: ${message.type}`);
        if (message.type === 'assistant') {
          // Update diagnostics to streaming status on first content
          if (!hasStartedStreaming) {
            hasStartedStreaming = true;
            diagnosticsService.updateRequest(requestId, { status: 'streaming' });
          }
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

          // Extract usage info if available
          const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
          if (usage) {
            if (usage.input_tokens) totalInputTokens = usage.input_tokens;
            if (usage.output_tokens) {
              totalOutputTokens = usage.output_tokens;
              callbacks.onTokenUsage?.({
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
              });
            }
          }

          // Extract text from message and handle tool_use blocks
          let newText = '';
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                newText += block.text;
              } else if (block.type === 'tool_use') {
                // Tool use - emit progress event
                const toolUseBlock = block as { type: 'tool_use'; id?: string; name: string; input: Record<string, unknown> };
                console.log(`[PlanAgentService] Tool use: ${toolUseBlock.name}`);
                pendingToolCalls.push({
                  id: toolUseBlock.id || '',
                  name: toolUseBlock.name,
                  input: toolUseBlock.input || {},
                });
                callbacks.onProgressEvent?.(createToolStartEvent(toolUseBlock.name, toolUseBlock.input || {}));
              }
            }
          } else if (typeof msgContent === 'string') {
            newText = msgContent;
          }

          if (newText) {
            fullResponse += newText;

            // Check for open questions block and send immediately when found
            if (!questionsSent && fullResponse.includes('</open_questions>')) {
              callbacks.onProgressEvent?.(createStatusEvent('Extracting clarifying questions...'));
              const { questions, responseWithoutQuestions } = parseOpenQuestions(fullResponse);
              if (questions && questions.length > 0) {
                console.log(`[PlanAgentService] Found ${questions.length} open questions, sending to client`);
                callbacks.onOpenQuestions?.(questions);
                questionsSent = true;
                // Update fullResponse to exclude the questions block
                fullResponse = responseWithoutQuestions;
              }
            }

            // Stream chat text until we hit any special block
            if (!foundBlockStart) {
              const blockStartPos = findPlanBlockStart(fullResponse);

              if (blockStartPos >= 0) {
                // Found start of special block - stream up to it, then stop streaming
                foundBlockStart = true;
                const chatPortion = fullResponse.slice(streamedChatLength, blockStartPos).trim();
                if (chatPortion) {
                  callbacks.onTextChunk(chatPortion, messageId);
                  streamedChatLength = blockStartPos;
                }
              } else {
                // No special block yet - stream new content
                // But be careful: don't stream partial tags
                const safeEnd = findSafeStreamEnd(fullResponse, PLAN_AGENT_SAFE_STREAM_TAGS);
                if (safeEnd > streamedChatLength) {
                  const newChunk = fullResponse.slice(streamedChatLength, safeEnd);
                  callbacks.onTextChunk(newChunk, messageId);
                  streamedChatLength = safeEnd;
                }
              }
            }
          }
        } else if (message.type === 'user') {
          // User message contains tool results
          const userMsg = message as { type: 'user'; message: { content: unknown[] } };
          if (Array.isArray(userMsg.message?.content)) {
            for (const block of userMsg.message.content) {
              if ((block as { type?: string }).type === 'tool_result') {
                const toolResult = block as { type: 'tool_result'; tool_use_id?: string; content?: unknown };

                // Find matching pending tool call (by ID or first without output)
                const pendingTool = pendingToolCalls.find(
                  tc => !tc.output && (tc.id === toolResult.tool_use_id || !toolResult.tool_use_id)
                );

                if (pendingTool) {
                  // Extract output content from tool result
                  let outputContent = 'completed';
                  if (typeof toolResult.content === 'string') {
                    outputContent = toolResult.content;
                  } else if (Array.isArray(toolResult.content)) {
                    const textBlock = toolResult.content.find((c: unknown) => (c as { type?: string }).type === 'text');
                    if (textBlock && typeof (textBlock as { text?: string }).text === 'string') {
                      outputContent = (textBlock as { text: string }).text;
                    }
                  }

                  pendingTool.output = outputContent;
                  console.log(`[PlanAgentService] Tool result: ${pendingTool.name}`);
                  callbacks.onProgressEvent?.(createToolCompleteEvent(pendingTool.name, outputContent));
                }
              }
            }
          }
        } else if (message.type === 'result') {
          if (message.subtype === 'success' && message.result) {
            if (!fullResponse) {
              fullResponse = message.result;
            }
            // Extract final usage from result if available
            const resultUsage = (message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
            if (resultUsage) {
              if (resultUsage.input_tokens) totalInputTokens = resultUsage.input_tokens;
              if (resultUsage.output_tokens) totalOutputTokens = resultUsage.output_tokens;
              callbacks.onTokenUsage?.({
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
              });
            }
          } else if (message.subtype === 'error_during_execution') {
            callbacks.onError('An error occurred during processing');
            return;
          }
        }
      }

      // Log full response for debugging document streaming issues
      console.log(`[PlanAgentService] Full response length: ${fullResponse.length}`);
      console.log(`[PlanAgentService] Has impl_plan_update tag: ${fullResponse.includes('<impl_plan_update>')}`);
      console.log(`[PlanAgentService] Has plan_update tag: ${fullResponse.includes('<plan_update>')}`);
      console.log(`[PlanAgentService] Response preview (last 500 chars): ${fullResponse.slice(-500)}`);

      // Parse suggested responses FIRST (before any streaming of remaining content)
      // This ensures the <suggested_responses> block never gets streamed to the client
      const { suggestions, responseWithoutSuggestions: fullResponseClean } = parseSuggestedResponses(fullResponse);
      const suggestionsToSend = suggestions;

      // Final parse to get chat response and handle various block types
      // All block types are processed independently (not mutually exclusive)
      let chatResponse = fullResponseClean;

      // 1. Check for execution plan update (phases/tasks)
      callbacks.onProgressEvent?.(createStatusEvent('Parsing implementation plan...'));
      const { plan, chatResponse: planChatResponse } = parsePlanUpdate(chatResponse);
      if (plan) {
        chatResponse = planChatResponse;

        // Notify about plan update
        callbacks.onProgressEvent?.(createStatusEvent(`Creating ${plan.phases?.length || 0} phases...`));
        console.log(`[PlanAgentService] Plan update detected with ${plan.phases?.length || 0} phases`);
        callbacks.onPlanUpdate({
          phases: plan.phases,
          workingDirectory: plan.workingDirectory || '',
          repositoryUrl: plan.repositoryUrl,
          branch: plan.branch,
          isClone: plan.isClone,
          workspaceId: plan.workspaceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Check for Implementation Plan document update (full replacement)
      // Process independently - can have both plan_update AND impl_plan_update
      console.log(`[PlanAgentService] Checking for impl_plan_update. yjsClient: ${!!this.yjsClient}, documentRoomName: ${documentRoomName}`);
      if (this.yjsClient && documentRoomName) {
        const { content: implPlanContent, chatResponse: implPlanChatResponse } = parseImplPlanUpdate(chatResponse);
        console.log(`[PlanAgentService] parseImplPlanUpdate result: found=${!!implPlanContent}, contentLength=${implPlanContent?.length ?? 0}`);
        if (implPlanContent) {
          chatResponse = implPlanChatResponse;

          try {
            callbacks.onProgressEvent?.(createStatusEvent('Writing design document...'));
            callbacks.onDocumentEditStart?.();
            console.log(`[PlanAgentService] Creating/replacing Implementation Plan document in room ${documentRoomName}, content length: ${implPlanContent.length}`);

            await this.yjsClient.streamReplaceContent(documentRoomName, implPlanContent);
            this.yjsClient.clearCursor(documentRoomName);

            callbacks.onDocumentEditEnd?.();
            console.log(`[PlanAgentService] Implementation Plan document updated successfully`);
          } catch (error) {
            console.error('[PlanAgentService] Error updating Implementation Plan document:', error);
            callbacks.onDocumentEditEnd?.();
          }
        } else {
          console.log(`[PlanAgentService] No impl_plan_update found in response. Response snippet: ${chatResponse.slice(0, 200)}`);
        }
      } else {
        console.log(`[PlanAgentService] Skipping impl_plan_update: yjsClient=${!!this.yjsClient}, documentRoomName=${documentRoomName}`);
      }

      // 3. Check for Implementation Plan document edits (targeted changes)
      // Process independently - impl_plan_edits and impl_plan_update are mutually exclusive
      if (this.yjsClient && documentRoomName) {
        const { edits, chatResponse: editsChatResponse } = parseImplPlanEdits(chatResponse);
        if (edits && edits.length > 0) {
          chatResponse = editsChatResponse;

          try {
            callbacks.onProgressEvent?.(createStatusEvent(`Applying ${edits.length} document edits...`));
            callbacks.onDocumentEditStart?.();
            console.log(`[PlanAgentService] Applying ${edits.length} edits to Implementation Plan in room ${documentRoomName}`);

            const results = await this.yjsClient.applyEdits(documentRoomName, edits);
            const failedEdits = results.filter(r => !r.success);
            if (failedEdits.length > 0) {
              console.warn('[PlanAgentService] Some edits failed:', failedEdits);
            }

            callbacks.onDocumentEditEnd?.();
            console.log(`[PlanAgentService] Edits applied: ${results.filter(r => r.success).length}/${edits.length} successful`);
          } catch (error) {
            console.error('[PlanAgentService] Error applying edits:', error);
            callbacks.onDocumentEditEnd?.();
          }
        }
      }

      // Stream any remaining chat content not yet sent
      if (chatResponse.length > streamedChatLength) {
        callbacks.onTextChunk(chatResponse.slice(streamedChatLength), messageId);
      }

      // Send suggested responses (already parsed at start of final processing)
      if (suggestionsToSend && suggestionsToSend.length > 0) {
        console.log(`[PlanAgentService] Found ${suggestionsToSend.length} suggested responses`);
        callbacks.onSuggestedResponses?.(suggestionsToSend);
      }

      // Save the assistant message (chat portion for display, full response for diagnostics)
      const assistantMessage = await this.chatService.addMessage(
        ideaId,
        userId,
        'assistant',
        chatResponse || 'I apologize, but I was unable to generate a response.',
        fullResponse // Include full raw response with XML blocks for diagnostics
      );

      // Call complete callback
      callbacks.onComplete({
        ...assistantMessage,
        id: messageId,
      });

      // Mark diagnostics request as complete
      diagnosticsService.completeRequest(requestId);

      console.log(`[PlanAgentService] Completed response for idea ${ideaId} (${chatResponse.length} chars streamed)`);

      // Update session status
      session.status = 'idle';
      session.currentAbortController = undefined;

      // Broadcast state change
      this.onSessionStateChange?.(ideaId, 'idle', session.userId, session.workspaceId);
    } catch (error) {
      // Update session status on error
      session.status = 'error';
      session.currentAbortController = undefined;

      // Broadcast state change
      this.onSessionStateChange?.(ideaId, 'error', session.userId, session.workspaceId);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PlanAgentService] Error processing message:', error);

      // Mark diagnostics request as failed
      diagnosticsService.completeRequest(requestId, errorMessage);

      callbacks.onError(errorMessage);
    }
  }

}
