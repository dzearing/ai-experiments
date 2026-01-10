import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { IdeaAgentChatService, type IdeaAgentMessage } from './IdeaAgentChatService.js';
import { IdeaAgentYjsClient } from './IdeaAgentYjsClient.js';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';
import type { ResourceEventBus } from './resourceEventBus/ResourceEventBus.js';
import { buildIdeaAgentSystemPrompt } from '../prompts/ideaAgentPrompt.js';
import type { AgentProgressCallbacks, AgentProgressEvent } from '../shared/agentProgress.js';
import { createToolStartEvent, createToolCompleteEvent } from '../shared/sdkStreamProcessor.js';
import { createStatusEvent } from '../shared/agentProgressUtils.js';
import { createTopicToolsMcpServer } from '../shared/topicToolsMcp.js';
import { factsService } from './FactsService.js';
// Re-export shared types for backwards compatibility
export type { OpenQuestion, SuggestedResponse, TokenUsage } from '../shared/agentResponseTypes.js';
import type { OpenQuestion, SuggestedResponse, TokenUsage } from '../shared/agentResponseTypes.js';
import {
  parseOpenQuestions,
  parseSuggestedResponses,
  findBlockStart,
  findSafeStreamEnd,
  IDEA_AGENT_BLOCK_TAGS,
  IDEA_AGENT_SAFE_STREAM_TAGS,
} from '../shared/agentResponseParsers.js';
import { buildConversationHistory, generateMessageId, MAX_QUEUED_MESSAGES } from '../shared/agentSessionUtils.js';

/**
 * Cache entry for pre-generated greetings
 */
interface GreetingCache {
  greetings: string[];
  usedIndices: Set<number>;
}

/**
 * Queued message for replay when client reconnects
 */
export interface IdeaAgentQueuedMessage {
  type: 'text_chunk' | 'message_complete' | 'error' | 'document_edit_start' | 'document_edit_end' | 'token_usage' | 'open_questions' | 'suggested_responses' | 'agent_progress';
  data: unknown;
  timestamp: number;
  messageId?: string;
}

/**
 * Session state for an idea's agent chat
 */
export interface IdeaAgentSession {
  ideaId: string;
  userId: string;
  status: 'idle' | 'running' | 'error';
  startedAt?: number;
  queuedMessages: IdeaAgentQueuedMessage[];
  clientConnected: boolean;
  /** Current abort controller for the running operation */
  currentAbortController?: AbortController;
  /** Workspace ID for broadcasting state changes */
  workspaceId?: string;
}

/**
 * Topic context for contextual greetings
 */
export interface TopicContext {
  id: string;
  name: string;
  type: string;
  description?: string;
}

/**
 * Idea context provided to the agent
 */
export interface IdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
  tags: string[];
  status: string;
  /** Optional Topic context when creating an idea linked to a Topic */
  topicContext?: TopicContext;
}

/**
 * Structured idea update from the agent (for new ideas)
 */
export interface IdeaUpdate {
  title?: string;
  summary?: string;
  description?: string;
  tags?: string[];
}

/**
 * Text-anchored edit operation types for modifying existing documents.
 * Uses text strings to reliably find edit locations (positions are approximate hints).
 *
 * - `start`: Approximate character position (hint for faster search)
 * - `startText`: Unique text string that marks the START of the edit range
 * - `endText`: Text string that marks the END of the edit range (last content before end)
 * - `text`: New content (for replace/insert)
 */
export type DocumentEdit =
  | { action: 'replace'; start: number; startText: string; endText: string; text: string }
  | { action: 'insert'; start: number; afterText: string; text: string }
  | { action: 'delete'; start: number; startText: string; endText: string };

/**
 * Callbacks for streaming agent responses
 */
export interface StreamCallbacks extends AgentProgressCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when the response is complete */
  onComplete: (message: IdeaAgentMessage) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called when document editing starts */
  onDocumentEditStart?: () => void;
  /** Called when document editing ends */
  onDocumentEditEnd?: () => void;
  /** Called with token usage updates during streaming */
  onTokenUsage?: (usage: TokenUsage) => void;
  /** Called when open questions are extracted from the response */
  onOpenQuestions?: (questions: OpenQuestion[]) => void;
  /** Called when suggested responses are extracted from the response */
  onSuggestedResponses?: (suggestions: SuggestedResponse[]) => void;
}

/**
 * Suggestion from the agent for updating the idea
 */
export interface IdeaSuggestion {
  type: 'title' | 'summary' | 'description' | 'tags';
  value: string | string[];
  reason?: string;
}

/**
 * Build markdown content from idea fields
 */
function buildMarkdownContent(update: IdeaUpdate): string {
  const parts: string[] = [];

  // Title as H1
  parts.push(`# ${update.title || 'Untitled Idea'}`);
  parts.push('');

  // Summary as H2
  parts.push('## Summary');
  parts.push(update.summary || '_Add a brief summary of your idea..._');
  parts.push('');

  // Tags
  if (update.tags && update.tags.length > 0) {
    parts.push(`Tags: ${update.tags.join(', ')}`);
  } else {
    parts.push('Tags: _none_');
  }
  parts.push('');

  // Separator and description
  parts.push('---');
  parts.push('');
  parts.push(update.description || '_Describe your idea in detail..._');

  return parts.join('\n');
}

/**
 * Parse idea update from agent response (for new ideas)
 * Chat response comes FIRST (before the tag), update block at END
 */
function parseIdeaUpdate(response: string): { update: IdeaUpdate | null; chatResponse: string } {
  const updateMatch = response.match(/<idea_update>\s*([\s\S]*?)\s*<\/idea_update>/);

  if (!updateMatch) {
    return { update: null, chatResponse: response };
  }

  try {
    const update = JSON.parse(updateMatch[1]) as IdeaUpdate;
    // Chat response is everytopic BEFORE the update block (new format)
    const chatResponse = response.slice(0, response.indexOf('<idea_update>')).trim() || "I've created the document for you.";
    return { update, chatResponse };
  } catch {
    console.error('[IdeaAgentService] Failed to parse idea update JSON');
    return { update: null, chatResponse: response };
  }
}

/**
 * Parse document edits from agent response (for existing ideas)
 * Chat response comes FIRST (before the tag), edits block at END
 */
function parseDocumentEdits(response: string): { edits: DocumentEdit[] | null; chatResponse: string } {
  const editsMatch = response.match(/<document_edits>\s*([\s\S]*?)\s*<\/document_edits>/);

  if (!editsMatch) {
    return { edits: null, chatResponse: response };
  }

  try {
    const edits = JSON.parse(editsMatch[1]) as DocumentEdit[];
    // Chat response is everytopic BEFORE the edits block (new format)
    const chatResponse = response.slice(0, response.indexOf('<document_edits>')).trim() || "I've made the changes to your document.";
    return { edits, chatResponse };
  } catch {
    console.error('[IdeaAgentService] Failed to parse document edits JSON');
    return { edits: null, chatResponse: response };
  }
}

/**
 * Check if a partial response contains the start of an edit block
 */
function findEditBlockStart(text: string): number {
  return findBlockStart(text, IDEA_AGENT_BLOCK_TAGS);
}

/**
 * Service for orchestrating idea agent chat with Claude.
 * Handles message processing and streaming responses for idea development.
 * Supports background execution - agents continue running when client disconnects.
 */
export class IdeaAgentService {
  private chatService: IdeaAgentChatService;
  private yjsClient: IdeaAgentYjsClient | null = null;
  private yjsHandler: YjsCollaborationHandler | null = null;
  private resourceEventBus: ResourceEventBus | null = null;

  // Greeting cache for new ideas
  private newIdeaGreetingCache: GreetingCache | null = null;

  // Session management for background execution
  private activeSessions = new Map<string, IdeaAgentSession>();
  private clientCallbacks = new Map<string, StreamCallbacks>();
  /** Mapping from old chatId to new chatId for session transfers */
  private sessionTransfers = new Map<string, string>();
  /** Pending links to apply when a session is created (documentRoomName -> {realIdeaId, workspaceId}) */
  private pendingLinks = new Map<string, { realIdeaId: string; workspaceId?: string }>();
  /** Callback for broadcasting session state changes to clients */
  private onSessionStateChange?: (
    ideaId: string,
    status: 'idle' | 'running' | 'error',
    userId: string,
    workspaceId?: string,
    agentStartedAt?: string,
    agentFinishedAt?: string
  ) => void;
  /** Callback for broadcasting metadata updates to clients */
  private onMetadataUpdate?: (ideaId: string, metadata: { title: string; summary: string; tags: string[]; description: string }, userId: string, workspaceId?: string) => void;

  constructor(yjsHandler?: YjsCollaborationHandler, resourceEventBus?: ResourceEventBus) {
    this.chatService = new IdeaAgentChatService();
    if (yjsHandler) {
      this.yjsHandler = yjsHandler;
      this.yjsClient = new IdeaAgentYjsClient(yjsHandler);
    }
    if (resourceEventBus) {
      this.resourceEventBus = resourceEventBus;
    }
  }

  /**
   * Set a callback to be called when session state changes.
   * This allows the WebSocket handler to broadcast updates to clients.
   * @param callback - Callback with timestamps:
   *   - agentStartedAt: ISO string when status is 'running' (for duration display)
   *   - agentFinishedAt: ISO string when status is 'idle' or 'error' (for relative time display)
   */
  setSessionStateChangeCallback(callback: (
    ideaId: string,
    status: 'idle' | 'running' | 'error',
    userId: string,
    workspaceId?: string,
    agentStartedAt?: string,
    agentFinishedAt?: string
  ) => void): void {
    this.onSessionStateChange = callback;
  }

  /**
   * Set a callback to be called when idea metadata is updated.
   * This allows the WebSocket handler to broadcast metadata updates to clients.
   */
  setMetadataUpdateCallback(callback: (ideaId: string, metadata: { title: string; summary: string; tags: string[]; description: string }, userId: string, workspaceId?: string) => void): void {
    this.onMetadataUpdate = callback;
  }

  /**
   * Register a client's callbacks for receiving messages.
   * Replays any queued messages from background execution.
   * If transferFromChatId is provided, transfers the session from the old chatId to the new one.
   * @returns true if a session was transferred (caller should skip sending history/greeting)
   */
  registerClient(ideaId: string, callbacks: StreamCallbacks, workspaceId?: string, transferFromChatId?: string): boolean {
    this.clientCallbacks.set(ideaId, callbacks);

    // Check if we need to transfer a session from a previous chatId (e.g., temp room name → real ideaId)
    if (transferFromChatId) {
      const oldSession = this.activeSessions.get(transferFromChatId);
      if (oldSession) {
        console.log(`[IdeaAgentService] Transferring session from ${transferFromChatId} to ${ideaId}, status=${oldSession.status}`);

        // Transfer the session to the new ideaId
        oldSession.ideaId = ideaId;
        if (workspaceId) {
          oldSession.workspaceId = workspaceId;
        }
        oldSession.clientConnected = true;

        // Move the session to the new key
        this.activeSessions.delete(transferFromChatId);
        this.activeSessions.set(ideaId, oldSession);

        // Store transfer mapping so in-flight dispatches can follow
        this.sessionTransfers.set(transferFromChatId, ideaId);

        // Also move callbacks from old key if any
        this.clientCallbacks.delete(transferFromChatId);

        // If session was running, broadcast the status with the correct ideaId now
        if (oldSession.status === 'running') {
          console.log(`[IdeaAgentService] Session still running, broadcasting status for ${ideaId}`);
          const agentStartedAt = oldSession.startedAt ? new Date(oldSession.startedAt).toISOString() : undefined;

          this.onSessionStateChange?.(ideaId, 'running', oldSession.userId, oldSession.workspaceId, agentStartedAt);
        }

        // Replay any queued messages
        console.log(`[IdeaAgentService] Replaying ${oldSession.queuedMessages.length} queued messages for ${ideaId}`);
        for (const msg of oldSession.queuedMessages) {
          this.dispatchMessage(msg, callbacks);
        }
        oldSession.queuedMessages = [];
        // Return true to indicate session was transferred - caller should skip sending history/greeting
        return true;
      } else {
        console.log(`[IdeaAgentService] No session found at ${transferFromChatId} to transfer`);
      }
    }

    let session = this.activeSessions.get(ideaId);
    if (session) {
      session.clientConnected = true;
      // Update workspaceId if provided (needed for broadcasts)
      if (workspaceId) {
        session.workspaceId = workspaceId;
      }
      // Replay any queued messages
      console.log(`[IdeaAgentService] Client connected to idea ${ideaId}, replaying ${session.queuedMessages.length} queued messages`);
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

    // No session was transferred
    return false;
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
      console.log(`[IdeaAgentService] Client disconnected from idea ${ideaId}, session continues in background`);
    }
  }

  /**
   * Get the current session for an idea (if any).
   */
  getSession(ideaId: string): IdeaAgentSession | undefined {
    return this.activeSessions.get(ideaId);
  }

  /**
   * Abort the current session for an idea.
   * Called when user presses Escape to explicitly cancel.
   */
  abortSession(ideaId: string): void {
    const session = this.activeSessions.get(ideaId);
    if (session?.currentAbortController) {
      console.log(`[IdeaAgentService] Aborting session for idea ${ideaId}`);
      session.currentAbortController.abort();
      session.status = 'idle';
      session.currentAbortController = undefined;
    }
  }

  /**
   * Dispatch a message to the client or queue it for later.
   * Follows session transfers to find the correct target.
   */
  private dispatchOrQueue(ideaId: string, message: IdeaAgentQueuedMessage): void {
    // Follow any session transfer to find the current ideaId
    const effectiveId = this.sessionTransfers.get(ideaId) || ideaId;

    const callbacks = this.clientCallbacks.get(effectiveId);
    if (callbacks) {
      this.dispatchMessage(message, callbacks);
    } else {
      const session = this.activeSessions.get(effectiveId);
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
  private dispatchMessage(message: IdeaAgentQueuedMessage, callbacks: StreamCallbacks): void {
    switch (message.type) {
      case 'text_chunk': {
        const { text, messageId } = message.data as { text: string; messageId: string };
        callbacks.onTextChunk(text, messageId);
        break;
      }
      case 'message_complete':
        callbacks.onComplete(message.data as IdeaAgentMessage);
        break;
      case 'error':
        callbacks.onError(message.data as string);
        break;
      case 'document_edit_start':
        callbacks.onDocumentEditStart?.();
        break;
      case 'document_edit_end':
        callbacks.onDocumentEditEnd?.();
        break;
      case 'token_usage':
        callbacks.onTokenUsage?.(message.data as TokenUsage);
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
   * Initialize the service by pre-generating greetings.
   * Call this on server startup for instant greetings.
   */
  async initialize(): Promise<void> {
    console.log('[IdeaAgentService] Initializing greeting cache...');
    await this.ensureGreetingsGenerated();
    console.log('[IdeaAgentService] Greeting cache ready');
  }

  /**
   * Get message history for an idea.
   */
  async getHistory(ideaId: string): Promise<IdeaAgentMessage[]> {
    return this.chatService.getMessages(ideaId);
  }

  /**
   * Clear message history for an idea.
   */
  async clearHistory(ideaId: string): Promise<void> {
    return this.chatService.clearMessages(ideaId);
  }

  /**
   * Delete all chat data for an idea.
   */
  async deleteIdeaChat(ideaId: string): Promise<void> {
    return this.chatService.deleteIdeaChat(ideaId);
  }

  /**
   * Save a greeting message to chat history.
   * Used to prevent duplicate greetings from race conditions.
   */
  async saveGreeting(ideaId: string, greeting: string): Promise<void> {
    await this.chatService.addMessage(ideaId, 'system', 'assistant', greeting);
  }

  /**
   * Process a user message and stream the response via callbacks.
   * Streams chat text in real-time, buffers edit blocks, then applies edits.
   * Uses session management for background execution support.
   */
  async processMessage(
    ideaId: string,
    userId: string,
    content: string,
    ideaContext: IdeaContext,
    documentRoomName?: string,
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

      // Check for pending link (idea was created via REST API before message was sent)
      const pendingLink = this.pendingLinks.get(ideaId);
      if (pendingLink) {
        console.log(`[IdeaAgentService] Applying pending link: ${ideaId} -> ${pendingLink.realIdeaId}`);
        this.pendingLinks.delete(ideaId);

        // Update the session with the real ideaId
        session.ideaId = pendingLink.realIdeaId;
        if (pendingLink.workspaceId) {
          session.workspaceId = pendingLink.workspaceId;
        }

        // Move the session to the new key
        this.activeSessions.delete(ideaId);
        this.activeSessions.set(pendingLink.realIdeaId, session);

        // Also move callbacks if registered under old id
        const callbacks = this.clientCallbacks.get(ideaId);
        if (callbacks) {
          this.clientCallbacks.delete(ideaId);
          this.clientCallbacks.set(pendingLink.realIdeaId, callbacks);
        }
      }
    }

    // Create abort controller for this operation
    const abortController = new AbortController();
    session.currentAbortController = abortController;
    session.status = 'running';
    session.startedAt = Date.now();

    // Mark agent active in Yjs room to prevent room destruction while processing
    if (this.yjsHandler && documentRoomName) {
      this.yjsHandler.markAgentActive(documentRoomName, userId);
    }

    // Broadcast state change (use session.ideaId which is updated on transfer)
    const agentStartedAt = new Date(session.startedAt).toISOString();

    console.log(`[IdeaAgentService] Broadcasting state change: idea=${session.ideaId}, status=running, userId=${session.userId}, workspaceId=${session.workspaceId}, startedAt=${agentStartedAt}`);
    this.onSessionStateChange?.(session.ideaId, 'running', session.userId, session.workspaceId, agentStartedAt);

    // Create local callbacks wrapper that uses dispatchOrQueue
    // This allows messages to be queued if client disconnects during execution
    const callbacks: StreamCallbacks = {
      onTextChunk: (text: string, msgId: string) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'text_chunk', data: { text, messageId: msgId }, timestamp: Date.now(), messageId: msgId });
      },
      onComplete: (message: IdeaAgentMessage) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'message_complete', data: message, timestamp: Date.now(), messageId: message.id });
      },
      onError: (error: string) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'error', data: error, timestamp: Date.now() });
      },
      onDocumentEditStart: () => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'document_edit_start', data: null, timestamp: Date.now() });
      },
      onDocumentEditEnd: () => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'document_edit_end', data: null, timestamp: Date.now() });
      },
      onTokenUsage: (usage: TokenUsage) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(ideaId, { type: 'token_usage', data: usage, timestamp: Date.now() });
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

    // Save the user message
    await this.chatService.addMessage(ideaId, userId, 'user', content);

    // Get history for context
    const history = await this.chatService.getMessages(ideaId);

    // Get current document content first (we need this to determine if it's a new idea)
    let documentContent: string | null = null;
    if (this.yjsClient && documentRoomName) {
      try {
        await this.yjsClient.connect(documentRoomName);
        documentContent = this.yjsClient.getContent(documentRoomName);
      } catch (error) {
        console.error('[IdeaAgentService] Error fetching document content:', error);
      }
    }

    // Determine if this is a new idea based on DOCUMENT CONTENT, not just ideaContext.id
    // The document is "new" if it has no content or only has placeholder content
    const placeholderContent = '# Untitled Idea\n\n## Summary\n_Add a brief summary of your idea..._\n\nTags: _none_\n\n---\n\n_Describe your idea in detail..._';
    const hasPlaceholderSummary =
      documentContent?.includes('_Add a brief summary of your idea..._') ||
      documentContent?.includes('Processing...');
    const hasRealContent = documentContent &&
                           documentContent.trim().length > 0 &&
                           documentContent.trim() !== placeholderContent.trim() &&
                           !hasPlaceholderSummary;

    const isNewIdea = !hasRealContent;

    console.log(`[IdeaAgentService] isNewIdea=${isNewIdea}, hasRealContent=${hasRealContent}, docLength=${documentContent?.length || 0}`);

    // Load remembered facts for this user
    const factsSection = await factsService.formatFactsForPrompt(userId) || undefined;

    // Build the system prompt with idea context and document content
    const systemPrompt = buildIdeaAgentSystemPrompt(isNewIdea, documentContent, ideaContext.topicContext, factsSection);

    // Build the full prompt with conversation history
    const conversationHistory = buildConversationHistory(history.slice(0, -1));
    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = generateMessageId();

    // Streaming state
    let fullResponse = '';
    let streamedChatLength = 0; // How much we've already streamed to the client
    let foundEditBlock = false; // Have we hit an edit block?
    let questionsSent = false; // Have we sent open questions?
    let questionCount = 0; // Number of questions (for fixing link text)
    let questionsToSave: OpenQuestion[] | undefined; // Questions to persist with the message
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Track tool calls for matching results
    const pendingToolCalls: Array<{ id: string; name: string; input: Record<string, unknown>; output?: string }> = [];

    try {
      console.log(`[IdeaAgentService] Processing message for idea ${ideaId} (new: ${isNewIdea}): "${content.slice(0, 50)}..."`);

      // Use the query function from @anthropic-ai/claude-agent-sdk
      const effectiveModel = modelId || 'claude-sonnet-4-5-20250929';
      console.log(`[IdeaAgentService] Using model: ${effectiveModel}`);

      // Create MCP server for topic tools so the agent can look up and modify Topics
      const topicToolsServer = createTopicToolsMcpServer(userId);

      const response = query({
        prompt: fullPrompt,
        options: {
          systemPrompt,
          model: effectiveModel,
          tools: [], // No built-in tools, only MCP tools
          mcpServers: { 'topic-tools': topicToolsServer },
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          maxTurns: 5, // Allow tool iterations for looking up Topics
        },
      });

      // Stream response in real-time
      for await (const message of response) {
        if (message.type === 'assistant') {
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

          // Extract usage info if available
          const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
          if (usage) {
            if (usage.input_tokens) totalInputTokens = usage.input_tokens;
            if (usage.output_tokens) {
              totalOutputTokens = usage.output_tokens;
              // Report token usage during streaming
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
                console.log(`[IdeaAgentService] Tool use: ${toolUseBlock.name}`);
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
            // This should happen FIRST, before any text chunks
            if (!questionsSent && fullResponse.includes('</open_questions>')) {
              const { questions, responseWithoutQuestions } = parseOpenQuestions(fullResponse);
              if (questions && questions.length > 0) {
                console.log(`[IdeaAgentService] Found ${questions.length} open questions, sending to client`);
                callbacks.onOpenQuestions?.(questions);
                questionsSent = true;
                questionCount = questions.length;
                questionsToSave = questions; // Save for persisting with the message
                // Update fullResponse to exclude the questions block
                fullResponse = responseWithoutQuestions;
              }
            }

            // Fix question count in link if agent got it wrong
            if (questionCount > 0) {
              fullResponse = fullResponse.replace(
                /\[resolve \d+ open questions?\]/gi,
                `[resolve ${questionCount} open question${questionCount === 1 ? '' : 's'}]`
              );
            }

            // Stream chat text until we hit an edit block
            if (!foundEditBlock) {
              const editBlockStart = findEditBlockStart(fullResponse);

              if (editBlockStart >= 0) {
                // Found start of edit block - stream up to it, then stop streaming
                foundEditBlock = true;
                const chatPortion = fullResponse.slice(streamedChatLength, editBlockStart).trim();
                if (chatPortion) {
                  callbacks.onTextChunk(chatPortion, messageId);
                  streamedChatLength = editBlockStart;
                }
              } else {
                // No edit block yet - stream new content
                // But be careful: don't stream partial tags like "<idea" or "<doc"
                // Stream up to the last safe point (before any potential tag start)
                const safeEnd = findSafeStreamEnd(fullResponse, IDEA_AGENT_SAFE_STREAM_TAGS);
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
                  console.log(`[IdeaAgentService] Tool result: ${pendingTool.name}`);
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

      // Parse suggested responses FIRST (before any streaming of remaining content)
      // This ensures the <suggested_responses> block never gets streamed to the client
      const { suggestions, responseWithoutSuggestions: fullResponseClean } = parseSuggestedResponses(fullResponse);
      let suggestionsToSend = suggestions;

      // Final parse to get chat response and handle document updates
      let chatResponse = fullResponseClean;

      if (this.yjsClient && documentRoomName) {
        if (isNewIdea) {
          // For new ideas: parse <idea_update> and create full document
          const { update, chatResponse: updateChatResponse } = parseIdeaUpdate(fullResponseClean);
          if (update) {
            chatResponse = updateChatResponse;

            // Stream any remaining chat content not yet sent
            if (chatResponse.length > streamedChatLength) {
              callbacks.onTextChunk(chatResponse.slice(streamedChatLength), messageId);
            }

            try {
              callbacks.onDocumentEditStart?.();
              callbacks.onProgressEvent?.(createStatusEvent('Creating idea document...'));
              console.log(`[IdeaAgentService] Creating new document in room ${documentRoomName}`);

              const markdownContent = buildMarkdownContent(update);
              await this.yjsClient.streamReplaceContent(documentRoomName, markdownContent);

              this.yjsClient.clearCursor(documentRoomName);
              callbacks.onDocumentEditEnd?.();
              callbacks.onProgressEvent?.({
                type: 'tool_complete',
                timestamp: Date.now(),
                displayText: 'Created idea document',
                success: true,
              });
              console.log(`[IdeaAgentService] New document created`);

              // Extract and publish metadata after document creation
              // Use session.ideaId which has the linked real ideaId if applicable
              await this.extractAndPublishMetadata(documentRoomName, session.ideaId, userId, session.workspaceId);
            } catch (error) {
              console.error('[IdeaAgentService] Error creating document:', error);
            }
          } else {
            // No update block - stream any remaining content
            if (fullResponseClean.length > streamedChatLength) {
              callbacks.onTextChunk(fullResponseClean.slice(streamedChatLength), messageId);
            }
          }
        } else {
          // For existing ideas: parse <document_edits> and apply targeted edits
          const { edits, chatResponse: editsChatResponse } = parseDocumentEdits(fullResponseClean);
          if (edits && edits.length > 0) {
            chatResponse = editsChatResponse;

            // Stream any remaining chat content not yet sent
            if (chatResponse.length > streamedChatLength) {
              callbacks.onTextChunk(chatResponse.slice(streamedChatLength), messageId);
            }

            try {
              callbacks.onDocumentEditStart?.();
              callbacks.onProgressEvent?.(createStatusEvent(`Applying ${edits.length} edit${edits.length === 1 ? '' : 's'}...`));
              console.log(`[IdeaAgentService] Applying ${edits.length} position-based edits to room ${documentRoomName}`);

              const results = await this.yjsClient.applyEdits(documentRoomName, edits);
              const failedEdits = results.filter(r => !r.success);
              if (failedEdits.length > 0) {
                console.warn('[IdeaAgentService] Some edits failed:', failedEdits);
              }

              callbacks.onDocumentEditEnd?.();
              const successCount = results.filter(r => r.success).length;
              callbacks.onProgressEvent?.({
                type: 'tool_complete',
                timestamp: Date.now(),
                displayText: `Updated idea document (${successCount} edit${successCount === 1 ? '' : 's'})`,
                success: failedEdits.length === 0,
              });
              console.log(`[IdeaAgentService] Edits applied: ${successCount}/${edits.length} successful`);

              // Extract and publish metadata after document edits
              // Use session.ideaId which has the linked real ideaId if applicable
              await this.extractAndPublishMetadata(documentRoomName, session.ideaId, userId, session.workspaceId);
            } catch (error) {
              console.error('[IdeaAgentService] Error applying edits:', error);
            }
          } else {
            // No edits - stream any remaining content
            if (fullResponseClean.length > streamedChatLength) {
              callbacks.onTextChunk(fullResponseClean.slice(streamedChatLength), messageId);
            }
          }
        }
      } else {
        // No Yjs client - just stream remaining content
        if (fullResponseClean.length > streamedChatLength) {
          callbacks.onTextChunk(fullResponseClean.slice(streamedChatLength), messageId);
        }
      }

      // Send suggested responses (already parsed at start of final processing)
      if (suggestionsToSend && suggestionsToSend.length > 0) {
        console.log(`[IdeaAgentService] Found ${suggestionsToSend.length} suggested responses, sending to client`);
        callbacks.onSuggestedResponses?.(suggestionsToSend);
      }

      // Save the assistant message (chat portion only, without suggestion blocks)
      // Include openQuestions so they can be rehydrated when dialog reopens
      const assistantMessage = await this.chatService.addMessage(
        ideaId,
        userId,
        'assistant',
        chatResponse || 'I apologize, but I was unable to generate a response.',
        questionsToSave
      );

      // Call complete callback
      callbacks.onComplete({
        ...assistantMessage,
        id: messageId,
      });

      console.log(`[IdeaAgentService] Completed response for idea ${ideaId} (${chatResponse.length} chars streamed)`);

      // Update session status
      session.status = 'idle';
      session.currentAbortController = undefined;

      // Mark agent inactive in Yjs room (allows room to be cleaned up if no clients)
      if (this.yjsHandler && documentRoomName) {
        this.yjsHandler.markAgentInactive(documentRoomName);
      }

      // Broadcast state change (use session.ideaId which is updated on transfer)
      const agentFinishedAt = new Date().toISOString();

      console.log(`[IdeaAgentService] Broadcasting state change: idea=${session.ideaId}, status=idle, userId=${session.userId}, workspaceId=${session.workspaceId}, finishedAt=${agentFinishedAt}`);
      this.onSessionStateChange?.(session.ideaId, 'idle', session.userId, session.workspaceId, undefined, agentFinishedAt);
    } catch (error) {
      // Update session status on error
      session.status = 'error';
      session.currentAbortController = undefined;

      // Mark agent inactive in Yjs room (allows room to be cleaned up if no clients)
      if (this.yjsHandler && documentRoomName) {
        this.yjsHandler.markAgentInactive(documentRoomName);
      }

      // Broadcast state change (use session.ideaId which is updated on transfer)
      const agentFinishedAt = new Date().toISOString();

      console.log(`[IdeaAgentService] Broadcasting state change: idea=${session.ideaId}, status=error, userId=${session.userId}, workspaceId=${session.workspaceId}, finishedAt=${agentFinishedAt}`);
      this.onSessionStateChange?.(session.ideaId, 'error', session.userId, session.workspaceId, undefined, agentFinishedAt);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[IdeaAgentService] Error processing message:', error);
      callbacks.onError(errorMessage);
    }
  }

  /**
   * Generate an initial greeting/prompt for a new idea chat.
   * For new ideas (no real content yet), uses cached general greetings.
   * For existing ideas with content, generates a context-specific greeting.
   * For ideas linked to a Topic, generates contextual greetings based on Topic type.
   */
  generateGreeting(ideaContext: IdeaContext | null): string {
    // For new ideas or ideas without meaningful content
    if (!ideaContext ||
        ideaContext.id === 'new' ||
        !ideaContext.title.trim() ||
        ideaContext.title === 'Untitled Idea') {

      // If this is a new idea linked to a Topic, generate a Topic-specific greeting
      if (ideaContext?.topicContext) {
        return this.generateTopicContextGreeting(ideaContext.topicContext);
      }
      return this.getNewIdeaGreeting();
    }

    const hasDescription = ideaContext.description && ideaContext.description.trim().length > 0;

    if (hasDescription) {
      return `I see you're working on **"${ideaContext.title}"**. I've read through your description and I'm ready to help you develop this idea further.\n\nWhat would you like to explore? I can help you:\n- Brainstorm features or variations\n- Refine the concept\n- Identify potential challenges\n- Suggest improvements to the title, summary, or tags`;
    } else {
      return `I see you're working on **"${ideaContext.title}"**.\n\n> ${ideaContext.summary}\n\nLet's develop this idea together! You can start by telling me more about what you have in mind, or I can help you:\n- Expand on the concept\n- Explore different angles\n- Add a detailed description\n- Refine the title or summary`;
    }
  }

  /**
   * Generate a contextual greeting when creating an idea for a specific Topic.
   * The greeting is tailored based on the Topic's type and description.
   */
  private generateTopicContextGreeting(topicContext: TopicContext): string {
    const { name, type, description } = topicContext;

    // Determine contextual prompts based on Topic type
    const typeContexts: Record<string, { activity: string; examples: string }> = {
      // Development-related types
      'project': {
        activity: 'adding a new feature or improvement',
        examples: 'a new capability, enhancement, bug fix, or architectural change'
      },
      'feature': {
        activity: 'developing or enhancing',
        examples: 'implementation details, edge cases, user interactions, or refinements'
      },
      'component': {
        activity: 'designing or building',
        examples: 'a new component variant, prop, behavior, or visual treatment'
      },
      'category': {
        activity: 'organizing or expanding',
        examples: 'a new sub-category, item, or organizational structure'
      },
      'item': {
        activity: 'developing or refining',
        examples: 'an enhancement, variation, or related concept'
      },
      // Content-related types
      'book': {
        activity: 'writing content for',
        examples: 'a new chapter, section, appendix, or revision'
      },
      'chapter': {
        activity: 'adding content to',
        examples: 'a new section, scene, concept, or revision'
      },
      'article': {
        activity: 'writing or expanding',
        examples: 'a new section, point, example, or revision'
      },
      'documentation': {
        activity: 'improving',
        examples: 'a new guide, example, clarification, or restructuring'
      },
      // Design-related types
      'design': {
        activity: 'creating or refining',
        examples: 'a new visual treatment, layout, or design pattern'
      },
      'library': {
        activity: 'adding to',
        examples: 'a new utility, component, helper, or enhancement'
      },
      'package': {
        activity: 'extending',
        examples: 'a new export, feature, or capability'
      },
      'ui-kit': {
        activity: 'designing components for',
        examples: 'a new component, variant, or design pattern'
      },
      // Application types
      'app': {
        activity: 'adding features to',
        examples: 'a new screen, workflow, feature, or enhancement'
      },
      'application': {
        activity: 'adding features to',
        examples: 'a new screen, workflow, feature, or enhancement'
      },
      'service': {
        activity: 'extending',
        examples: 'a new endpoint, capability, or integration'
      },
      'api': {
        activity: 'designing endpoints for',
        examples: 'a new route, method, or data model'
      },
    };

    // Get context for this type (case-insensitive match)
    const normalizedType = type.toLowerCase().replace(/[^a-z]/g, '');
    const context = typeContexts[normalizedType] || {
      activity: 'developing ideas for',
      examples: 'a new concept, enhancement, or related idea'
    };

    // Build the greeting with Topic context
    const descriptionHint = description
      ? `\n\n*${description}*`
      : '';

    return `So what's on your mind regarding **${name}**?${descriptionHint}

Share your idea for ${context.activity} **${name}** - whether it's ${context.examples}. I'll help you develop it into a complete idea.`;
  }

  /**
   * Get a greeting for a new idea.
   * Uses cached greetings for instant response.
   */
  getNewIdeaGreeting(): string {
    this.ensureGreetingsGenerated();

    if (this.newIdeaGreetingCache && this.newIdeaGreetingCache.greetings.length > 0) {
      const greeting = this.pickRandomGreeting(this.newIdeaGreetingCache);
      if (greeting) {
        return greeting;
      }
    }

    // Fallback greeting
    return `What's your idea? Share it with me here and I'll draft the full document for you - title, summary, description, and tags. Or type directly in the editor if you prefer.`;
  }

  /**
   * Get a random cached greeting without API call.
   * Returns null if no cached greetings available.
   */
  getRandomCachedGreeting(): string | null {
    if (!this.newIdeaGreetingCache || this.newIdeaGreetingCache.greetings.length === 0) {
      return null;
    }
    return this.pickRandomGreeting(this.newIdeaGreetingCache);
  }

  /**
   * Ensure greetings cache is populated.
   * Uses static fallback greetings to avoid expensive API calls on startup.
   */
  private ensureGreetingsGenerated(): void {
    if (this.newIdeaGreetingCache && this.newIdeaGreetingCache.greetings.length > 0) {
      return;
    }

    // Use static fallback greetings instead of making expensive API call
    this.newIdeaGreetingCache = {
      greetings: this.getFallbackGreetings(),
      usedIndices: new Set(),
    };
  }

  /**
   * Pick a random greeting from the cache that hasn't been used yet.
   */
  private pickRandomGreeting(cache: GreetingCache): string | null {
    if (cache.greetings.length === 0) return null;

    // If all greetings used, reset
    if (cache.usedIndices.size >= cache.greetings.length) {
      console.log('[IdeaAgentService] All greetings used, resetting cache');
      cache.usedIndices.clear();
    }

    // Find unused indices
    const unusedIndices: number[] = [];
    for (let i = 0; i < cache.greetings.length; i++) {
      if (!cache.usedIndices.has(i)) {
        unusedIndices.push(i);
      }
    }

    if (unusedIndices.length === 0) return null;

    // Pick random unused index
    const randomIdx = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
    cache.usedIndices.add(randomIdx);
    return cache.greetings[randomIdx];
  }

  /**
   * Get fallback greetings if batch generation fails.
   */
  private getFallbackGreetings(): string[] {
    return [
      "What's your idea? Give me a quick description and I'll help you develop it fully.",
      "Share your idea with me! I'll turn your brief into a complete title, summary, and description.",
      "Tell me about your idea! I'll extrapolate it into a fully fleshed out concept.",
      "Got an idea? Describe it briefly and I'll help you flesh it out.",
      "What are you thinking? Share your concept and I'll write up the title, summary, and tags.",
      "Drop your idea here! I'll expand it into a complete concept you can refine.",
      "Pitch me your idea! I'll turn it into a structured idea with all the pieces.",
      "What's on your mind? Tell me your idea and I'll help you develop the details.",
      "Share your concept! I'll extrapolate it into a fully developed idea.",
      "Let's capture your idea! Describe it briefly and I'll help you write it up.",
    ];
  }

  /**
   * Extract metadata from document and broadcast to clients.
   * This allows clients to receive real-time updates when
   * the agent modifies document content (title, summary, tags).
   */
  private async extractAndPublishMetadata(
    documentRoomName: string,
    ideaId: string,
    userId: string,
    workspaceId?: string,
  ): Promise<void> {
    if (!this.yjsHandler) {
      return;
    }

    try {
      const metadata = await this.yjsHandler.flushAndExtractMetadata(documentRoomName);

      if (metadata) {
        // Broadcast metadata via callback (for notifyIdeaUpdate broadcast)
        this.onMetadataUpdate?.(
          ideaId,
          {
            title: metadata.title,
            summary: metadata.summary,
            tags: metadata.tags,
            description: metadata.description,
          },
          userId,
          workspaceId,
        );

        // Also publish to ResourceEventBus for delta protocol subscribers
        if (this.resourceEventBus) {
          this.resourceEventBus.setState(
            'idea',
            ideaId,
            {
              id: ideaId,
              title: metadata.title,
              summary: metadata.summary,
              tags: metadata.tags,
              description: metadata.description,
            },
            userId,
            workspaceId,
          );
        }

        console.log(`[IdeaAgentService] Broadcast metadata for idea ${ideaId}: "${metadata.title}"`);
      }
    } catch (error) {
      console.error(`[IdeaAgentService] Error extracting/publishing metadata for idea ${ideaId}:`, error);
    }
  }

  /**
   * Link an agent session from a document room name to a real ideaId.
   * This is called when an idea is created via REST API while the agent is running.
   * It updates the session's ideaId and re-broadcasts the status to ensure
   * IdeaCards receive the correct status updates.
   *
   * If no session exists yet (message hasn't been sent), stores a pending link
   * that will be applied when the session is created.
   */
  linkSessionToIdea(documentRoomName: string, realIdeaId: string, workspaceId?: string): boolean {
    const session = this.activeSessions.get(documentRoomName);

    if (!session) {
      // No session yet - store as pending link to apply when session is created
      console.log(`[IdeaAgentService] No session at ${documentRoomName}, storing pending link to ${realIdeaId}`);
      this.pendingLinks.set(documentRoomName, { realIdeaId, workspaceId });
      // Also store the transfer mapping so it's ready when the session does get created
      this.sessionTransfers.set(documentRoomName, realIdeaId);

      return true; // Return true since we stored the pending link
    }

    console.log(`[IdeaAgentService] Linking session from ${documentRoomName} to ${realIdeaId}, status=${session.status}`);

    // Update session ideaId
    const oldIdeaId = session.ideaId;
    session.ideaId = realIdeaId;

    if (workspaceId) {
      session.workspaceId = workspaceId;
    }

    // Move the session to the new key
    this.activeSessions.delete(documentRoomName);
    this.activeSessions.set(realIdeaId, session);

    // Store transfer mapping so in-flight dispatches can follow
    this.sessionTransfers.set(documentRoomName, realIdeaId);

    // Also move callbacks if any
    const callbacks = this.clientCallbacks.get(documentRoomName);

    if (callbacks) {
      this.clientCallbacks.delete(documentRoomName);
      this.clientCallbacks.set(realIdeaId, callbacks);
    }

    // Re-broadcast the current status with the correct ideaId, including appropriate timestamp
    const agentStartedAt = session.status === 'running' && session.startedAt
      ? new Date(session.startedAt).toISOString()
      : undefined;
    const agentFinishedAt = session.status !== 'running'
      ? new Date().toISOString()
      : undefined;

    console.log(`[IdeaAgentService] Re-broadcasting status=${session.status} for ${realIdeaId} (was ${oldIdeaId})`);
    this.onSessionStateChange?.(realIdeaId, session.status, session.userId, session.workspaceId, agentStartedAt, agentFinishedAt);

    return true;
  }
}
