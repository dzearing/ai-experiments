import {
  query,
  type SDKAssistantMessage,
  type SDKSystemMessage,
  type SDKResultMessage,
  type SDKPartialAssistantMessage,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import type { AgentProgressCallbacks, AgentProgressEvent } from '../shared/agentProgress.js';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { PersonaService, type Persona } from './PersonaService.js';
import { FacilitatorChatService, type FacilitatorMessage } from './FacilitatorChatService.js';
import { MCPToolsService, type ToolDefinition } from './MCPToolsService.js';
import { TopicService } from './TopicService.js';
import { factsService } from './FactsService.js';
import { buildFacilitatorPrompt, buildContextSection } from '../prompts/facilitatorPrompt.js';
import { createFacilitatorMcpServer } from './FacilitatorMcpTools.js';
import { getClaudeDiagnosticsService } from '../routes/diagnostics.js';

/**
 * Open question type for user clarification
 */
export interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  selectionType: 'single' | 'multiple';
  options: Array<{ id: string; label: string; description?: string }>;
  allowCustom: boolean;
}

/**
 * Queued message for replay when client reconnects
 */
export interface FacilitatorQueuedMessage {
  type: 'text_chunk' | 'tool_use' | 'tool_result' | 'message_complete' | 'error' | 'open_questions' | 'agent_progress';
  data: unknown;
  timestamp: number;
  messageId?: string;
}

/**
 * Session state for a user's facilitator chat
 */
export interface FacilitatorSession {
  userId: string;
  status: 'idle' | 'running' | 'error';
  startedAt?: number;
  queuedMessages: FacilitatorQueuedMessage[];
  clientConnected: boolean;
  /** Current abort controller for the running operation */
  currentAbortController?: AbortController;
}

/**
 * Cache entry for pre-generated greetings
 */
interface GreetingCache {
  greetings: string[];
  usedIndices: Set<number>;
}

/**
 * Navigation context - where the user is in the app
 */
export interface NavigationContext {
  workspaceId?: string;
  workspaceName?: string;
  documentId?: string;
  documentTitle?: string;
  chatRoomId?: string;
  chatRoomName?: string;
  currentPage?: string;
  /** Active Topic ID (if viewing/selected a Topic) */
  activeTopicId?: string;
  /** Active Topic name */
  activeTopicName?: string;
  /** Referenced Topic IDs from ^topic-name references in message */
  referencedTopicIds?: string[];
}

/**
 * Callbacks for streaming Claude responses
 */
export interface StreamCallbacks extends AgentProgressCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when a tool is being invoked */
  onToolUse: (info: { name: string; input: Record<string, unknown>; messageId: string }) => void;
  /** Called when a tool returns a result */
  onToolResult: (info: { name: string; output: string; messageId: string }) => void;
  /** Called when the response is complete */
  onComplete: (message: FacilitatorMessage) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called when open questions are available for user clarification */
  onOpenQuestions?: (questions: OpenQuestion[]) => void;
  /** Called when thinking progress is available (optional) */
  onThinking?: (text: string, messageId: string) => void;
  /** Called when system init event is received (optional) */
  onSystemInit?: (info: {
    model: string;
    tools: string[];
    mcpServers: { name: string; status: string }[];
  }) => void;
  /** Called for raw SDK events for diagnostics (optional) */
  onRawEvent?: (event: SDKMessage) => void;
}

/**
 * Service for orchestrating facilitator chat with Claude.
 * Handles message processing, streaming responses, and tool integration.
 */
/** Raw SDK event for diagnostics */
export interface RawSDKEvent {
  timestamp: number;
  type: string;
  subtype?: string;
  data: unknown;
}

/** Diagnostic entry for a request */
interface DiagnosticEntry {
  timestamp: string;
  messageId: string;
  userMessage: string;
  iterations: number;
  toolCalls: Array<{ name: string; input: Record<string, unknown>; output?: string }>;
  responseLength: number;
  durationMs: number;
  error?: string;
  // Enhanced diagnostics (P0)
  systemPrompt?: string;
  model?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  // Raw SDK events for full diagnostics
  rawEvents?: RawSDKEvent[];
  // Session init info
  sessionInfo?: {
    sessionId: string;
    tools: string[];
    mcpServers: { name: string; status: string }[];
  };
  // Cost info
  totalCostUsd?: number;
}

/**
 * Parse open questions from Claude response.
 * Questions are in <open_questions> JSON blocks.
 */
function parseOpenQuestions(response: string): { questions: OpenQuestion[] | null; responseWithoutQuestions: string } {
  const questionsMatch = response.match(/<open_questions>\s*([\s\S]*?)\s*<\/open_questions>/);

  if (!questionsMatch) {
    return { questions: null, responseWithoutQuestions: response };
  }

  try {
    const rawQuestions = JSON.parse(questionsMatch[1]) as OpenQuestion[];
    // Default allowCustom to true so users can always provide custom answers
    const questions = rawQuestions.map(q => ({
      ...q,
      allowCustom: q.allowCustom !== false, // Default to true unless explicitly false
    }));
    // Remove the questions block from the response
    const responseWithoutQuestions = response.replace(/<open_questions>[\s\S]*?<\/open_questions>/, '').trim();
    return { questions, responseWithoutQuestions };
  } catch {
    console.error('[FacilitatorService] Failed to parse open questions JSON');
    return { questions: null, responseWithoutQuestions: response };
  }
}

export class FacilitatorService {
  private personaService: PersonaService;
  private chatService: FacilitatorChatService;
  private toolsService: MCPToolsService;
  private topicService: TopicService;
  private persona: Persona | null = null;

  // Diagnostic tracking (keep last 50 entries)
  private diagnosticLog: DiagnosticEntry[] = [];
  private static MAX_DIAGNOSTIC_ENTRIES = 50;

  // Greeting cache: key = hash of (displayName + persona systemPrompt)
  private greetingCache: Map<string, GreetingCache> = new Map();
  private static GREETINGS_PER_PERSONA = 20;

  // Isolated working directory to prevent loading CLAUDE.md from monorepo
  private static ISOLATED_CWD = tmpdir();

  // Session management for background execution
  private activeSessions = new Map<string, FacilitatorSession>();
  private clientCallbacks = new Map<string, StreamCallbacks>();
  private static MAX_QUEUED_MESSAGES = 500;

  constructor() {
    this.personaService = new PersonaService();
    this.chatService = new FacilitatorChatService();
    this.toolsService = new MCPToolsService();
    this.topicService = new TopicService();
  }

  /**
   * Register a client to receive streaming callbacks.
   * Replays any queued messages from background execution.
   */
  registerClient(userId: string, callbacks: StreamCallbacks): void {
    this.clientCallbacks.set(userId, callbacks);
    const session = this.activeSessions.get(userId);
    if (session) {
      session.clientConnected = true;
      // Replay queued messages
      for (const msg of session.queuedMessages) {
        this.dispatchMessage(msg, callbacks);
      }
      session.queuedMessages = [];
    }
  }

  /**
   * Unregister a client (e.g., on disconnect).
   * The session continues running - messages are queued for later replay.
   */
  unregisterClient(userId: string): void {
    this.clientCallbacks.delete(userId);
    const session = this.activeSessions.get(userId);
    if (session) {
      session.clientConnected = false;
    }
  }

  /**
   * Get the current session for a user, if any.
   */
  getSession(userId: string): FacilitatorSession | undefined {
    return this.activeSessions.get(userId);
  }

  /**
   * Abort the current operation for a user.
   * Called when user presses Escape to explicitly cancel.
   */
  abortSession(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session?.currentAbortController) {
      console.log(`[FacilitatorService] Aborting session for user ${userId}`);
      session.currentAbortController.abort();
      session.currentAbortController = undefined;
      session.status = 'idle';
    }
  }

  /**
   * Dispatch a message to client if connected, or queue for later replay.
   */
  private dispatchOrQueue(userId: string, message: FacilitatorQueuedMessage): void {
    const callbacks = this.clientCallbacks.get(userId);
    if (callbacks) {
      this.dispatchMessage(message, callbacks);
    } else {
      const session = this.activeSessions.get(userId);
      if (session) {
        session.queuedMessages.push(message);
        // Prevent unbounded memory growth
        if (session.queuedMessages.length > FacilitatorService.MAX_QUEUED_MESSAGES * 2) {
          session.queuedMessages = session.queuedMessages.slice(-FacilitatorService.MAX_QUEUED_MESSAGES);
        }
      }
    }
  }

  /**
   * Dispatch a queued message to the client callbacks.
   */
  private dispatchMessage(message: FacilitatorQueuedMessage, callbacks: StreamCallbacks): void {
    switch (message.type) {
      case 'text_chunk': {
        const data = message.data as { text: string; messageId: string };
        callbacks.onTextChunk(data.text, data.messageId);
        break;
      }
      case 'tool_use': {
        const data = message.data as { name: string; input: Record<string, unknown>; messageId: string };
        callbacks.onToolUse({ name: data.name, input: data.input, messageId: data.messageId });
        break;
      }
      case 'tool_result': {
        const data = message.data as { name: string; output: string; messageId: string };
        callbacks.onToolResult({ name: data.name, output: data.output, messageId: data.messageId });
        break;
      }
      case 'message_complete': {
        const data = message.data as FacilitatorMessage;
        callbacks.onComplete(data);
        break;
      }
      case 'error': {
        const data = message.data as string;
        callbacks.onError(data);
        break;
      }
      case 'open_questions': {
        const data = message.data as OpenQuestion[];
        callbacks.onOpenQuestions?.(data);
        break;
      }
      case 'agent_progress': {
        const data = message.data as AgentProgressEvent;
        callbacks.onProgressEvent?.(data);
        break;
      }
    }
  }

  /**
   * Generate a cache key for greetings based on display name and persona.
   */
  private getGreetingCacheKey(displayName: string, persona: Persona): string {
    const hash = createHash('sha256')
      .update(displayName + persona.systemPrompt)
      .digest('hex')
      .slice(0, 16);
    return `${displayName}-${hash}`;
  }

  /**
   * Get diagnostic log for debugging.
   */
  getDiagnostics(): DiagnosticEntry[] {
    return [...this.diagnosticLog];
  }

  private addDiagnosticEntry(entry: DiagnosticEntry): void {
    this.diagnosticLog.push(entry);
    if (this.diagnosticLog.length > FacilitatorService.MAX_DIAGNOSTIC_ENTRIES) {
      this.diagnosticLog.shift();
    }
  }

  /**
   * Get tool definitions for Claude.
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.toolsService.getToolDefinitions();
  }

  /**
   * Initialize the service by loading the facilitator persona.
   */
  initialize(): void {
    this.persona = this.personaService.getFacilitatorPersona();
    console.log(`[FacilitatorService] Loaded persona: ${this.persona.name}`);
  }

  /**
   * Reload the persona from disk/settings.
   * Call this when the user changes their persona selection.
   */
  reloadPersona(): Persona {
    this.personaService.reloadPersona();
    this.persona = this.personaService.getFacilitatorPersona();
    console.log(`[FacilitatorService] Reloaded persona: ${this.persona.name}`);
    return this.persona;
  }

  /**
   * Set the persona by preset ID.
   * This loads the preset directly without requiring a user file.
   */
  setPersonaByPreset(presetId: string): Persona {
    const preset = this.personaService.getPreset(presetId);
    if (preset) {
      this.persona = preset;
      console.log(`[FacilitatorService] Set persona from preset: ${this.persona.name} (${presetId})`);
    } else {
      // Fallback to default facilitator persona
      this.persona = this.personaService.getFacilitatorPersona();
      console.log(`[FacilitatorService] Preset "${presetId}" not found, using default: ${this.persona.name}`);
    }
    return this.persona;
  }

  /**
   * Set a custom persona (from user file).
   */
  setCustomPersona(): Persona {
    const userPersona = this.personaService.getUserPersona();
    if (userPersona) {
      this.persona = userPersona;
      console.log(`[FacilitatorService] Set custom user persona: ${this.persona.name}`);
    } else {
      this.persona = this.personaService.getFacilitatorPersona();
      console.log(`[FacilitatorService] No custom persona found, using default: ${this.persona.name}`);
    }
    return this.persona;
  }

  /**
   * Get the current persona name.
   */
  getPersonaName(): string {
    return this.getPersona().name;
  }

  /**
   * Generate a greeting message using the current persona.
   * Uses cached greetings when available for instant response.
   * On first request for a persona, generates 20 greetings in batch and caches them.
   * @param userName - The user's name
   * @param displayName - Optional display name to use instead of persona.name (from settings)
   */
  async generateGreeting(userName: string, displayName?: string): Promise<string> {
    const persona = this.getPersona();
    const botName = displayName || persona.name;
    const cacheKey = this.getGreetingCacheKey(botName, persona);

    console.log(`[FacilitatorService] generateGreeting: botName="${botName}", persona="${persona.name}", cacheKey="${cacheKey}"`);
    console.log(`[FacilitatorService] Cache has ${this.greetingCache.size} entries, keys: [${Array.from(this.greetingCache.keys()).join(', ')}]`);

    // Check cache first
    const cached = this.greetingCache.get(cacheKey);
    if (cached && cached.greetings.length > 0) {
      const greeting = this.pickRandomGreeting(cached);
      if (greeting) {
        console.log(`[FacilitatorService] CACHE HIT! Using cached greeting (${cached.greetings.length - cached.usedIndices.size} remaining)`);
        return greeting;
      }
    }

    // No cache or all greetings used - generate batch and return first one
    console.log(`[FacilitatorService] CACHE MISS - Generating ${FacilitatorService.GREETINGS_PER_PERSONA} greetings for cache...`);
    const greetings = await this.generateGreetingBatch(userName, botName, persona);

    if (greetings.length > 0) {
      // Cache the greetings
      const newCache: GreetingCache = {
        greetings,
        usedIndices: new Set([0]), // Mark first one as used
      };
      this.greetingCache.set(cacheKey, newCache);
      console.log(`[FacilitatorService] Cached ${greetings.length} greetings for key: ${cacheKey}`);
      return greetings[0];
    }

    // Fallback if batch generation fails
    return `Hello ${userName}! I'm ${botName}. How can I help you today?`;
  }

  /**
   * Get a random greeting from the cache without making an API call.
   * Used for /clear command to show a new greeting instantly.
   * @param _userName - The user's name (unused, kept for API consistency)
   * @param displayName - Optional display name to use instead of persona.name
   * @returns A greeting from cache, or null if no cached greetings available
   */
  getRandomCachedGreeting(_userName: string, displayName?: string): string | null {
    const persona = this.getPersona();
    const botName = displayName || persona.name;
    const cacheKey = this.getGreetingCacheKey(botName, persona);

    const cached = this.greetingCache.get(cacheKey);
    if (!cached || cached.greetings.length === 0) {
      return null;
    }

    return this.pickRandomGreeting(cached);
  }

  /**
   * Pick a random greeting from the cache that hasn't been used yet.
   * If all greetings have been used, resets the used indices and picks again.
   */
  private pickRandomGreeting(cache: GreetingCache): string | null {
    if (cache.greetings.length === 0) return null;

    // If all greetings used, reset
    if (cache.usedIndices.size >= cache.greetings.length) {
      console.log('[FacilitatorService] All greetings used, resetting cache');
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
   * Generate a batch of greetings for caching.
   */
  private async generateGreetingBatch(userName: string, botName: string, persona: Persona): Promise<string[]> {
    const count = FacilitatorService.GREETINGS_PER_PERSONA;

    // Prompt that asks for multiple greetings in a structured format
    const batchPrompt = `You are "${botName}", an AI assistant. Here is your personality:

${persona.systemPrompt}

A user named "${userName}" will open a chat with you. Generate ${count} different greeting messages, each 1-2 sentences. Stay fully in character. Each greeting should:
- Introduce yourself by name ("${botName}")
- Be warm and welcoming
- Offer to help
- Be unique and varied (different wording, tone variations)

Output ONLY the greetings, one per line, numbered 1-${count}. No other text.

Example format:
1. Hello ${userName}! I'm ${botName}, ready to assist you today.
2. Welcome, ${userName}! ${botName} here - what can I help you with?
...and so on`;

    try {
      const response = query({
        prompt: batchPrompt,
        options: {
          permissionMode: 'bypassPermissions',
          maxTurns: 1,
          cwd: FacilitatorService.ISOLATED_CWD, // Prevent loading CLAUDE.md from monorepo
        },
      });

      let fullResponse = '';
      for await (const message of response) {
        if (message.type === 'assistant') {
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                fullResponse += block.text;
              }
            }
          } else if (typeof msgContent === 'string') {
            fullResponse += msgContent;
          }
        } else if (message.type === 'result' && message.subtype === 'success' && message.result) {
          if (!fullResponse) {
            fullResponse = message.result;
          }
        }
      }

      // Parse the numbered list
      const greetings = this.parseGreetingBatch(fullResponse);
      console.log(`[FacilitatorService] Parsed ${greetings.length} greetings from batch response`);
      return greetings;
    } catch (error) {
      console.error('[FacilitatorService] Error generating greeting batch:', error);
      return [];
    }
  }

  /**
   * Parse numbered greetings from the batch response.
   */
  private parseGreetingBatch(response: string): string[] {
    const greetings: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      // Match lines starting with number + period or number + parenthesis
      const match = line.match(/^\s*\d+[\.\)]\s*(.+)/);
      if (match && match[1]) {
        const greeting = match[1].trim();
        if (greeting.length > 10) { // Sanity check for valid greeting
          greetings.push(greeting);
        }
      }
    }

    return greetings;
  }

  /**
   * Get the persona (load if not already loaded).
   */
  private getPersona(): Persona {
    if (!this.persona) {
      this.persona = this.personaService.getFacilitatorPersona();
    }
    return this.persona;
  }

  /**
   * Get message history for a user.
   */
  async getHistory(userId: string): Promise<FacilitatorMessage[]> {
    return this.chatService.getMessages(userId);
  }

  /**
   * Clear message history for a user.
   */
  async clearHistory(userId: string): Promise<void> {
    return this.chatService.clearMessages(userId);
  }

  /**
   * Process a user message and stream the response via registered callbacks.
   * Uses dispatchOrQueue to support background execution - if client disconnects,
   * messages are queued and replayed when client reconnects.
   * @param displayName - Optional display name to use instead of persona.name (from settings)
   * @param modelId - Optional model ID to use (defaults to claude-sonnet-4-5-20250929)
   */
  async processMessage(
    userId: string,
    userName: string,
    content: string,
    navigationContext: NavigationContext,
    displayName?: string,
    modelId?: string
  ): Promise<void> {
    // Create or get session
    let session = this.activeSessions.get(userId);
    if (!session) {
      session = {
        userId,
        status: 'idle',
        queuedMessages: [],
        clientConnected: this.clientCallbacks.has(userId),
      };
      this.activeSessions.set(userId, session);
    }

    // Create abort controller for this operation
    const abortController = new AbortController();
    session.currentAbortController = abortController;
    session.status = 'running';
    session.startedAt = Date.now();

    // Save the user message
    await this.chatService.addMessage(userId, 'user', content);

    // Create local callbacks wrapper that dispatches via dispatchOrQueue
    // This allows messages to be queued if client disconnects during execution
    const callbacks: StreamCallbacks = {
      onTextChunk: (text: string, msgId: string) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'text_chunk', data: { text, messageId: msgId }, timestamp: Date.now(), messageId: msgId });
      },
      onToolUse: ({ name, input, messageId: msgId }) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'tool_use', data: { name, input, messageId: msgId }, timestamp: Date.now(), messageId: msgId });
      },
      onToolResult: ({ name, output, messageId: msgId }) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'tool_result', data: { name, output, messageId: msgId }, timestamp: Date.now(), messageId: msgId });
      },
      onComplete: (message: FacilitatorMessage) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'message_complete', data: message, timestamp: Date.now(), messageId: message.id });
      },
      onError: (error: string) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'error', data: error, timestamp: Date.now() });
      },
      onOpenQuestions: (questions: OpenQuestion[]) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'open_questions', data: questions, timestamp: Date.now() });
      },
      onThinking: (text: string, msgId: string) => {
        // Thinking is not queued - it's real-time only
        const cbs = this.clientCallbacks.get(userId);
        if (cbs?.onThinking && !abortController.signal.aborted) {
          cbs.onThinking(text, msgId);
        }
      },
      onRawEvent: (event: SDKMessage) => {
        // Raw events are not queued - they're for diagnostics only
        const cbs = this.clientCallbacks.get(userId);
        if (cbs?.onRawEvent && !abortController.signal.aborted) {
          cbs.onRawEvent(event);
        }
      },
      onSystemInit: (info) => {
        // System init is not queued - it's real-time only
        const cbs = this.clientCallbacks.get(userId);
        if (cbs?.onSystemInit && !abortController.signal.aborted) {
          cbs.onSystemInit(info);
        }
      },
      onProgressEvent: (event: AgentProgressEvent) => {
        if (abortController.signal.aborted) return;
        this.dispatchOrQueue(userId, { type: 'agent_progress', data: event, timestamp: Date.now() });
      },
    };

    // Start timing for diagnostics
    const startTime = Date.now();

    // Track in-flight request for diagnostics UI
    const diagnosticsService = getClaudeDiagnosticsService();
    const requestId = diagnosticsService.startRequest('facilitator', userId, content.slice(0, 100));

    // Get persona and history
    const persona = this.getPersona();
    const history = await this.chatService.getMessages(userId);

    // Build the system prompt with navigation context (includes Topic context for referenced Topics)
    const systemPrompt = await this.buildSystemPrompt(persona, userName, navigationContext, userId, displayName);

    // Create the MCP server with native tools for proper streaming
    // Pass workspaceId from navigation context so tools auto-inject it when creating resources
    const mcpServer = createFacilitatorMcpServer(this.toolsService, userId, navigationContext.workspaceId);

    // Build the full prompt with conversation history
    const conversationHistory = this.buildConversationHistory(history.slice(0, -1)); // Exclude the just-added user message
    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let fullResponse = '';
    let pendingBuffer = ''; // Buffer for potential open_questions blocks
    const toolCalls: FacilitatorMessage['toolCalls'] = [];
    let hasStartedStreaming = false; // Track if we've started streaming
    let questionsSent = false; // Track if open questions have been sent

    // Token usage tracking for diagnostics
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    // Use provided model or default to sonnet
    const effectiveModel = modelId || 'claude-sonnet-4-5-20250929';
    let detectedModel = effectiveModel; // Track the model used (will be updated from system init)
    console.log(`[FacilitatorService] Using model: ${effectiveModel}`);

    // Track raw SDK events for diagnostics
    const rawEvents: RawSDKEvent[] = [];
    let sessionInfo: DiagnosticEntry['sessionInfo'] | undefined;

    // Diagnostic logging for debugging
    console.log(`[FacilitatorService] Starting response for message: "${content.slice(0, 50)}..."`);

    try {
      // Check if aborted before starting
      if (abortController.signal.aborted) {
        console.log(`[FacilitatorService] Operation aborted before start`);
        const abortError = new Error('Operation aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }

      // Use the query function from @anthropic-ai/claude-agent-sdk
      // With native MCP tools, the SDK handles tool iterations automatically
      const response = query({
        prompt: fullPrompt,
        options: {
          systemPrompt: systemPrompt,
          model: effectiveModel,
          permissionMode: 'bypassPermissions', // Auto-accept for server-side use
          allowDangerouslySkipPermissions: true, // Required for bypassPermissions
          cwd: FacilitatorService.ISOLATED_CWD, // Prevent loading CLAUDE.md from monorepo
          includePartialMessages: true, // Enable streaming events for thinking, etc.
          maxThinkingTokens: 8000, // Enable extended thinking
          tools: ['WebSearch'],
          mcpServers: { facilitator: mcpServer }, // Native MCP tools for proper streaming
          maxTurns: 20, // Allow up to 20 tool iterations
        },
      });

      // Process streaming messages
      // With native MCP tools, the SDK handles tool calls/results automatically
      for await (const message of response) {
        // Check if aborted during streaming
        if (abortController.signal.aborted) {
          console.log(`[FacilitatorService] Operation aborted during streaming`);
          const abortError = new Error('Operation aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }

        // Store raw event for diagnostics
        rawEvents.push({
          timestamp: Date.now(),
          type: message.type,
          subtype: 'subtype' in message ? (message as { subtype?: string }).subtype : undefined,
          data: message,
        });

        // Call raw event callback if provided
        callbacks.onRawEvent?.(message);

        if (message.type === 'system' && 'subtype' in message && message.subtype === 'init') {
          // System init message - capture model, tools, MCP servers
          const systemMsg = message as SDKSystemMessage;
          detectedModel = systemMsg.model;
          sessionInfo = {
            sessionId: systemMsg.session_id,
            tools: systemMsg.tools,
            mcpServers: systemMsg.mcp_servers,
          };
          console.log(`[FacilitatorService] Session initialized: model=${detectedModel}, tools=${systemMsg.tools.length}, mcp=${systemMsg.mcp_servers.length}`);

          // Call system init callback if provided
          callbacks.onSystemInit?.({
            model: systemMsg.model,
            tools: systemMsg.tools,
            mcpServers: systemMsg.mcp_servers,
          });
        } else if (message.type === 'stream_event') {
          // Partial message - includes thinking blocks and text deltas during streaming
          const partialMsg = message as SDKPartialAssistantMessage;
          const event = partialMsg.event;

          // Update in-flight status to streaming on first stream event
          if (!hasStartedStreaming) {
            hasStartedStreaming = true;
            diagnosticsService.updateRequest(requestId, { status: 'streaming' });
          }

          // Handle streaming content
          if (event.type === 'content_block_delta' && 'delta' in event) {
            const delta = event.delta as { type: string; thinking?: string; text?: string };
            if (delta.type === 'thinking_delta' && delta.thinking) {
              // Streaming thinking content
              callbacks.onThinking?.(delta.thinking, messageId);
            } else if (delta.type === 'text_delta' && delta.text) {
              // Buffer text to prevent streaming <open_questions> markup to the client
              pendingBuffer += delta.text;

              // Check if we're inside an open_questions block
              const hasOpenTag = pendingBuffer.includes('<open_questions>');
              const hasCloseTag = pendingBuffer.includes('</open_questions>');

              if (hasOpenTag && hasCloseTag) {
                // Complete block received - parse and strip it before sending
                const { questions, responseWithoutQuestions } = parseOpenQuestions(pendingBuffer);
                if (questions && questions.length > 0 && !questionsSent) {
                  callbacks.onOpenQuestions?.(questions);
                  questionsSent = true;
                  console.log(`[FacilitatorService] Sent ${questions.length} open questions`);
                }
                // Send the cleaned response
                if (responseWithoutQuestions) {
                  fullResponse += responseWithoutQuestions;
                  callbacks.onTextChunk(responseWithoutQuestions, messageId);
                }
                pendingBuffer = '';
              } else if (hasOpenTag && !hasCloseTag) {
                // Still collecting open_questions block - don't send anything yet
                // Keep buffering
              } else {
                // No open_questions block - safe to send
                fullResponse += pendingBuffer;
                callbacks.onTextChunk(pendingBuffer, messageId);
                pendingBuffer = '';
              }
            }
          }
        } else if (message.type === 'assistant') {
          // Handle assistant message - contains tool_use blocks for MCP tools
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

          // Extract usage info if available
          const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
          if (usage) {
            if (usage.input_tokens) totalInputTokens = usage.input_tokens;
            if (usage.output_tokens) totalOutputTokens = usage.output_tokens;
          }

          // Process content blocks
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                // Text content (may already be streamed via text_delta)
                let text = block.text;
                // Strip open_questions if present (shouldn't happen if streaming worked, but safety)
                if (text.includes('<open_questions>') && text.includes('</open_questions>')) {
                  const { questions, responseWithoutQuestions } = parseOpenQuestions(text);
                  if (questions && questions.length > 0 && !questionsSent) {
                    callbacks.onOpenQuestions?.(questions);
                    questionsSent = true;
                    console.log(`[FacilitatorService] Sent ${questions.length} open questions (from assistant block)`);
                  }
                  text = responseWithoutQuestions;
                }
                // Only add if not already streamed (check if fullResponse doesn't end with this text)
                if (text && !fullResponse.endsWith(text)) {
                  fullResponse += text;
                  callbacks.onTextChunk(text, messageId);
                }
              } else if (block.type === 'thinking') {
                // Thinking block in final response
                const thinkingBlock = block as { type: 'thinking'; thinking: string };
                callbacks.onThinking?.(thinkingBlock.thinking, messageId);
              } else if (block.type === 'tool_use' || block.type === 'server_tool_use') {
                // MCP, SDK native tool use, or server-side tools (WebSearch, WebFetch)
                const sdkToolCall = block as { type: 'tool_use' | 'server_tool_use'; name: string; input: Record<string, unknown> };
                console.log(`[FacilitatorService] Tool use (${block.type}): ${sdkToolCall.name}`, sdkToolCall.input);
                callbacks.onToolUse({
                  name: sdkToolCall.name,
                  input: sdkToolCall.input || {},
                  messageId,
                });
                toolCalls.push({
                  name: sdkToolCall.name,
                  input: sdkToolCall.input || {},
                });
              }
            }
          } else if (typeof msgContent === 'string') {
            let text = msgContent;
            // Strip open_questions if present
            if (text.includes('<open_questions>') && text.includes('</open_questions>')) {
              const { questions, responseWithoutQuestions } = parseOpenQuestions(text);
              if (questions && questions.length > 0 && !questionsSent) {
                callbacks.onOpenQuestions?.(questions);
                questionsSent = true;
              }
              text = responseWithoutQuestions;
            }
            if (text && !fullResponse.endsWith(text)) {
              fullResponse += text;
              callbacks.onTextChunk(text, messageId);
            }
          }
        } else if (message.type === 'user') {
          // User message (tool result from SDK/MCP)
          const userMsg = message as { type: 'user'; message: { content: unknown[] } };
          if (Array.isArray(userMsg.message?.content)) {
            for (const block of userMsg.message.content) {
              if ((block as { type?: string }).type === 'tool_result') {
                const toolResult = block as { type: 'tool_result'; tool_use_id?: string; content?: unknown };
                // Find matching tool call and mark complete
                const lastPendingTool = toolCalls.find(tc => !tc.output);
                if (lastPendingTool) {
                  // Handle MCP tool result content which might be an array of content blocks
                  let outputContent = 'completed';
                  if (typeof toolResult.content === 'string') {
                    outputContent = toolResult.content;
                  } else if (Array.isArray(toolResult.content)) {
                    // Extract text from content array (MCP format)
                    const textBlock = toolResult.content.find((c: unknown) => (c as { type?: string }).type === 'text');
                    if (textBlock && typeof (textBlock as { text?: string }).text === 'string') {
                      outputContent = (textBlock as { text: string }).text;
                    }
                  }
                  lastPendingTool.output = outputContent;
                  console.log(`[FacilitatorService] Tool result: ${lastPendingTool.name}, output type: ${typeof toolResult.content}, isArray: ${Array.isArray(toolResult.content)}`);
                  callbacks.onToolResult({
                    name: lastPendingTool.name,
                    output: lastPendingTool.output,
                    messageId,
                  });
                }
              }
            }
          }
        } else if (message.type === 'result') {
          // Final result message - contains full usage stats
          const resultMsg = message as SDKResultMessage;

          // Extract usage from result
          if (resultMsg.usage) {
            totalInputTokens = resultMsg.usage.input_tokens ?? 0;
            totalOutputTokens = resultMsg.usage.output_tokens ?? 0;
          }

          // Extract cost
          if ('total_cost_usd' in resultMsg) {
            totalCostUsd = resultMsg.total_cost_usd;
          }

          if (resultMsg.subtype === 'success' && 'result' in resultMsg) {
            // If we haven't received streaming content, use the final result
            if (!fullResponse) {
              let text = resultMsg.result;
              // Strip open_questions if present
              if (text.includes('<open_questions>') && text.includes('</open_questions>')) {
                const { questions, responseWithoutQuestions } = parseOpenQuestions(text);
                if (questions && questions.length > 0 && !questionsSent) {
                  callbacks.onOpenQuestions?.(questions);
                  questionsSent = true;
                }
                text = responseWithoutQuestions;
              }
              fullResponse = text;
              if (text) {
                callbacks.onTextChunk(text, messageId);
              }
            }
          } else if (resultMsg.subtype === 'error_during_execution') {
            const errors = 'errors' in resultMsg ? (resultMsg.errors as string[]).join(', ') : 'Unknown error';
            callbacks.onError(`An error occurred during processing: ${errors}`);
            return;
          } else if (resultMsg.subtype === 'error_max_turns') {
            console.log(`[FacilitatorService] Max turns reached`);
            const warningMsg = '\n\n*I\'ve reached my action limit for this request. Let me know if you need me to continue.*';
            fullResponse += warningMsg;
            callbacks.onTextChunk(warningMsg, messageId);
          }
        }
      }

      // Flush any remaining pending buffer
      if (pendingBuffer) {
        // Check for open_questions in remaining buffer
        if (pendingBuffer.includes('<open_questions>') && pendingBuffer.includes('</open_questions>')) {
          const { questions, responseWithoutQuestions } = parseOpenQuestions(pendingBuffer);
          if (questions && questions.length > 0 && !questionsSent) {
            callbacks.onOpenQuestions?.(questions);
            questionsSent = true;
          }
          if (responseWithoutQuestions) {
            fullResponse += responseWithoutQuestions;
            callbacks.onTextChunk(responseWithoutQuestions, messageId);
          }
        } else {
          // No complete open_questions block - just send the remaining text
          fullResponse += pendingBuffer;
          callbacks.onTextChunk(pendingBuffer, messageId);
        }
        pendingBuffer = '';
      }

      console.log(`[FacilitatorService] Final response (${fullResponse.length} chars): "${fullResponse.slice(0, 100)}..."`);

      // Build diagnostics to persist with the message
      const durationMs = Date.now() - startTime;
      const messageDiagnostics = {
        iterations: toolCalls.length + 1,
        durationMs,
        responseLength: fullResponse.length,
        systemPrompt,
        model: detectedModel,
        tokenUsage: totalInputTokens > 0 || totalOutputTokens > 0
          ? { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
          : undefined,
        rawEvents: rawEvents.length > 0 ? rawEvents : undefined,
        sessionInfo,
        totalCostUsd: totalCostUsd > 0 ? totalCostUsd : undefined,
      };

      // Save the assistant message with diagnostics for persistence
      const assistantMessage = await this.chatService.addMessage(
        userId,
        'assistant',
        fullResponse || 'I apologize, but I was unable to generate a response.',
        toolCalls.length > 0 ? toolCalls : undefined,
        messageId,
        messageDiagnostics // Pass diagnostics to persist with the message
      );

      // Call complete callback
      callbacks.onComplete(assistantMessage);

      // Mark in-flight request as completed
      diagnosticsService.completeRequest(requestId);

      // Add diagnostic entry with enhanced data including raw SDK events
      this.addDiagnosticEntry({
        timestamp: new Date().toISOString(),
        messageId,
        userMessage: content.slice(0, 200),
        iterations: toolCalls.length + 1, // Approximate iterations based on tool calls
        toolCalls: toolCalls.map(tc => ({ name: tc.name, input: tc.input || {}, output: tc.output })),
        responseLength: fullResponse.length,
        durationMs: Date.now() - startTime,
        // Enhanced diagnostics (P0)
        systemPrompt,
        model: detectedModel,
        tokenUsage: totalInputTokens > 0 || totalOutputTokens > 0
          ? { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
          : undefined,
        // Full diagnostics with raw SDK events
        rawEvents: rawEvents.length > 0 ? rawEvents : undefined,
        sessionInfo,
        totalCostUsd: totalCostUsd > 0 ? totalCostUsd : undefined,
      });

      // Update session status to idle (operation complete)
      session.status = 'idle';
      session.currentAbortController = undefined;
    } catch (error) {
      // Re-throw abort errors without logging
      if (error instanceof Error && error.name === 'AbortError') {
        diagnosticsService.completeRequest(requestId, 'Aborted');
        session.status = 'idle';
        session.currentAbortController = undefined;
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[FacilitatorService] Error processing message:', error);
      callbacks.onError(errorMessage);

      // Mark in-flight request as failed
      diagnosticsService.completeRequest(requestId, errorMessage);

      // Add diagnostic entry for error with enhanced data including raw SDK events
      this.addDiagnosticEntry({
        timestamp: new Date().toISOString(),
        messageId,
        userMessage: content.slice(0, 200),
        iterations: toolCalls.length + 1, // Approximate iterations based on tool calls
        toolCalls: toolCalls.map(tc => ({ name: tc.name, input: tc.input || {}, output: tc.output })),
        responseLength: fullResponse.length,
        durationMs: Date.now() - startTime,
        error: errorMessage,
        // Enhanced diagnostics (P0)
        systemPrompt,
        model: detectedModel,
        tokenUsage: totalInputTokens > 0 || totalOutputTokens > 0
          ? { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
          : undefined,
        // Full diagnostics with raw SDK events
        rawEvents: rawEvents.length > 0 ? rawEvents : undefined,
        sessionInfo,
        totalCostUsd: totalCostUsd > 0 ? totalCostUsd : undefined,
      });

      // Update session status to error
      session.status = 'error';
      session.currentAbortController = undefined;
    }
  }

  /**
   * Build the system prompt with persona, user context, and available tools.
   * @param displayName - Optional display name to use instead of persona.name (from settings)
   */
  private async buildSystemPrompt(
    persona: Persona,
    userName: string,
    navigationContext: NavigationContext,
    userId: string,
    displayName?: string
  ): Promise<string> {
    const toolDefinitions = this.toolsService.getToolDefinitions();

    const toolsDescription = toolDefinitions.map((tool) => {
      const params = Object.entries(tool.input_schema.properties || {})
        .map(([name, def]) => `  - ${name}: ${def.description}${tool.input_schema.required?.includes(name) ? ' (required)' : ''}`)
        .join('\n');
      return `**${tool.name}**: ${tool.description}${params ? '\nParameters:\n' + params : ''}`;
    }).join('\n\n');

    // Build current context description
    const contextParts: string[] = [];
    if (navigationContext.currentPage) {
      contextParts.push(`Current page: ${navigationContext.currentPage}`);
    }
    if (navigationContext.workspaceName && navigationContext.workspaceId) {
      contextParts.push(`Current workspace: "${navigationContext.workspaceName}" (ID: ${navigationContext.workspaceId})`);
    }
    if (navigationContext.documentTitle && navigationContext.documentId) {
      contextParts.push(`Current document: "${navigationContext.documentTitle}" (ID: ${navigationContext.documentId})`);
    }
    if (navigationContext.chatRoomName && navigationContext.chatRoomId) {
      contextParts.push(`Current chat room: "${navigationContext.chatRoomName}" (ID: ${navigationContext.chatRoomId})`);
    }
    if (navigationContext.activeTopicName && navigationContext.activeTopicId) {
      contextParts.push(`Active Topic: "${navigationContext.activeTopicName}" (ID: ${navigationContext.activeTopicId})`);
    }

    // Build Topic context for referenced Topics
    let topicContext = '';
    if (navigationContext.referencedTopicIds && navigationContext.referencedTopicIds.length > 0) {
      topicContext = await this.buildTopicContext(navigationContext.referencedTopicIds, userId);
      if (topicContext) {
        contextParts.push(`\n--- Referenced Topics Context ---\n${topicContext}`);
      }
    }

    // Add display name instruction to persona prompt if different from persona name
    let personaPrompt = persona.systemPrompt;
    if (displayName && displayName !== persona.name) {
      personaPrompt = `Your name is "${displayName}". Always refer to yourself as "${displayName}". ${personaPrompt}`;
    }

    // Load remembered facts for this user
    const factsSection = await factsService.formatFactsForPrompt(userId) || '';

    return buildFacilitatorPrompt({
      personaPrompt,
      userName,
      contextSection: buildContextSection(contextParts),
      factsSection,
      toolsDescription,
    });
  }

  /**
   * Build context string for referenced Topics.
   * Includes Topic metadata, properties, documents, and linked file contents.
   */
  private async buildTopicContext(topicIds: string[], userId: string): Promise<string> {
    const contextParts: string[] = [];

    for (const topicId of topicIds) {
      try {
        const topic = await this.topicService.getTopic(topicId, userId);
        if (!topic) continue;

        // Build path hierarchy
        const pathNames: string[] = [];
        if (topic.parentIds.length > 0) {
          let currentParentId: string | undefined = topic.parentIds[0];
          const visited = new Set<string>();
          while (currentParentId && !visited.has(currentParentId)) {
            visited.add(currentParentId);
            const parent = await this.topicService.getTopic(currentParentId, userId);
            if (parent) {
              pathNames.unshift(parent.name);
              currentParentId = parent.parentIds[0];
            } else {
              break;
            }
          }
        }
        const pathString = pathNames.length > 0 ? pathNames.join(' > ') : '(root)';

        const parts: string[] = [];
        parts.push(`## Topic: ${topic.name}`);
        parts.push(`- ID: ${topic.id}`);
        parts.push(`- Path: ${pathString}`);
        parts.push(`- Type: ${topic.type}`);
        if (topic.description) {
          parts.push(`- Description: ${topic.description}`);
        }
        if (topic.tags.length > 0) {
          parts.push(`- Tags: ${topic.tags.join(', ')}`);
        }

        // Include properties
        if (topic.properties && Object.keys(topic.properties).length > 0) {
          parts.push(`\n### Properties:`);
          for (const [key, value] of Object.entries(topic.properties)) {
            parts.push(`- ${key}: ${value}`);
          }
        }

        // Include links summary
        if (topic.links && topic.links.length > 0) {
          parts.push(`\n### Links:`);
          for (const link of topic.links) {
            parts.push(`- [${link.type}] ${link.label}: ${link.target}${link.description ? ` - ${link.description}` : ''}`);
          }
        }

        // Include inline documents
        if (topic.documents && topic.documents.length > 0) {
          parts.push(`\n### Documents:`);
          for (const doc of topic.documents) {
            parts.push(`#### ${doc.title}`);
            parts.push(doc.content || '(empty)');
          }
        }

        // Read linked local files
        const fileLinks = (topic.links || []).filter(link => link.type === 'file');
        if (fileLinks.length > 0) {
          parts.push(`\n### Linked File Contents:`);
          for (const link of fileLinks) {
            const filePath = link.target;
            try {
              if (existsSync(filePath)) {
                const content = await readFile(filePath, 'utf-8');
                // Truncate very large files
                const truncatedContent = content.length > 10000
                  ? content.slice(0, 10000) + '\n... (truncated)'
                  : content;
                parts.push(`\n#### ${link.label} (${filePath}):`);
                parts.push('```');
                parts.push(truncatedContent);
                parts.push('```');
              } else {
                parts.push(`\n#### ${link.label}: File not found at ${filePath}`);
              }
            } catch (err) {
              parts.push(`\n#### ${link.label}: Error reading file - ${err instanceof Error ? err.message : 'unknown error'}`);
            }
          }
        }

        contextParts.push(parts.join('\n'));
      } catch (err) {
        console.error(`[FacilitatorService] Error building context for Topic ${topicId}:`, err);
      }
    }

    return contextParts.join('\n\n');
  }

  /**
   * Build conversation history string from messages.
   */
  private buildConversationHistory(messages: FacilitatorMessage[]): string {
    // Take last 20 messages to keep context manageable
    const recentMessages = messages.slice(-20);

    return recentMessages
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }
}
