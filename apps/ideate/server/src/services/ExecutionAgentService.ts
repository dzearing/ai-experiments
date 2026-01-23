/**
 * ExecutionAgentService
 *
 * Service for executing implementation plans using Claude Code's full capabilities.
 * Handles phase execution, progress tracking, and real-time updates.
 *
 * Supports server-driven execution where:
 * - Executions continue in background even when client disconnects
 * - Messages are queued and replayed when client reconnects
 * - Multiple ideas can execute simultaneously
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import { query, type SDKAssistantMessage, type SpawnOptions, type SpawnedProcess } from '@anthropic-ai/claude-agent-sdk';
import { buildExecutionAgentSystemPrompt, type ExecutionIdeaContext } from '../prompts/executionAgentPrompt.js';
import { createIdeateMcpServer } from './IdeateMcpTools.js';
import { type IdeaService, type IdeaPlan, validateWorkingDirectory, expandTildePath } from './IdeaService.js';
import { ExecutionAgentChatService, type ExecutionAgentMessage } from './ExecutionAgentChatService.js';
import { factsService } from './FactsService.js';
import {
  type TokenUsage,
  type TaskCompleteEvent,
  type PhaseCompleteEvent,
  type ExecutionBlockedEvent,
  type NewIdeaEvent,
  type TaskUpdateEvent,
  type QueuedMessage,
  type ExecutionSession,
  type ExecutionStreamCallbacks,
  type SessionStateEvent,
} from './ExecutionAgentTypes.js';
import {
  parseAllTaskCompletes,
  parsePhaseComplete,
  parseExecutionBlocked,
  parseNewIdea,
  parseTaskUpdate,
} from './ExecutionAgentParsers.js';

// Re-export types for external consumers
export type {
  TokenUsage,
  TaskCompleteEvent,
  PhaseCompleteEvent,
  ExecutionBlockedEvent,
  NewIdeaEvent,
  TaskUpdateEvent,
  QueuedMessage,
  ExecutionSession,
  ExecutionStreamCallbacks,
  SessionStateEvent,
};

/**
 * Service for executing implementation plans with Claude Code capabilities.
 * Manages background execution sessions that persist independently of client connections.
 */
export class ExecutionAgentService {
  private ideaService: IdeaService;
  private chatService: ExecutionAgentChatService;
  private activeSessions: Map<string, ExecutionSession> = new Map();
  private clientCallbacks: Map<string, ExecutionStreamCallbacks> = new Map();
  /** Callback for broadcasting execution state changes to workspace clients */
  private onExecutionStateChange?: (ideaId: string, idea: unknown) => void;

  constructor(ideaService: IdeaService) {
    this.ideaService = ideaService;
    this.chatService = new ExecutionAgentChatService();
  }

  /**
   * Set a callback to be called when execution state changes.
   * This allows the WebSocket handler to broadcast updates to workspace clients.
   */
  setExecutionStateChangeCallback(callback: (ideaId: string, idea: unknown) => void): void {
    this.onExecutionStateChange = callback;
  }

  /** Get an active execution session for an idea. */
  getSession(ideaId: string): ExecutionSession | undefined {
    return this.activeSessions.get(ideaId);
  }

  /** Check if an idea has an active execution. */
  hasActiveExecution(ideaId: string): boolean {
    const session = this.activeSessions.get(ideaId);
    return session !== undefined && session.status === 'running';
  }

  /**
   * Abort the current execution session for an idea.
   * Called when user presses Escape to explicitly cancel.
   */
  abortSession(ideaId: string): void {
    const session = this.activeSessions.get(ideaId);
    if (session && session.status === 'running') {
      console.log(`[ExecutionAgentService] Aborting session for idea ${ideaId}`);
      session.abortController?.abort();
      session.status = 'idle';
      session.stopReason = 'paused_by_user';
      session.abortController = undefined;

      // Notify clients of the status change
      this.dispatchOrQueue(ideaId, {
        type: 'session_state',
        data: { status: 'idle', stopReason: 'paused_by_user' },
        timestamp: Date.now(),
      });

      // Broadcast state change
      this.broadcastStateChange(ideaId);
    } else {
      console.log(`[ExecutionAgentService] No running session to abort for idea ${ideaId} (status: ${session?.status || 'none'})`);
    }
  }

  /**
   * Broadcast execution state change to workspace clients.
   */
  private async broadcastStateChange(ideaId: string): Promise<void> {
    try {
      const idea = await this.ideaService.getIdeaByIdNoAuth(ideaId);
      if (idea && this.onExecutionStateChange) {
        this.onExecutionStateChange(ideaId, idea);
      }
    } catch (error) {
      console.error(`[ExecutionAgentService] Error broadcasting state change for ${ideaId}:`, error);
    }
  }

  /** Register callbacks for a client connection. Replays any queued messages. */
  registerClient(ideaId: string, callbacks: ExecutionStreamCallbacks): void {
    this.clientCallbacks.set(ideaId, callbacks);
    const session = this.activeSessions.get(ideaId);
    if (session) {
      session.clientConnected = true;
      for (const msg of session.queuedMessages) {
        this.dispatchMessage(msg, callbacks);
      }
      session.queuedMessages = [];
    }
  }

  /** Unregister callbacks when a client disconnects. Execution continues. */
  unregisterClient(ideaId: string): void {
    this.clientCallbacks.delete(ideaId);
    const session = this.activeSessions.get(ideaId);
    if (session) {
      session.clientConnected = false;
    }
  }

  /** Get chat history for an idea. */
  async getChatHistory(ideaId: string, limit?: number): Promise<ExecutionAgentMessage[]> {
    return this.chatService.getMessages(ideaId, limit);
  }

  /** Check if an idea has existing execution chat history. */
  async hasHistory(ideaId: string): Promise<boolean> {
    return this.chatService.hasHistory(ideaId);
  }

  /** Clear chat history for an idea. */
  async clearHistory(ideaId: string): Promise<void> {
    await this.chatService.clearMessages(ideaId);
  }

  /**
   * Start execution of a phase as a background process.
   * Creates a session and begins execution that continues even if client disconnects.
   * @param pauseBetweenPhases - If true, pause after each phase completes. If false, auto-continue.
   */
  async startExecution(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    pauseBetweenPhases: boolean = false
  ): Promise<ExecutionSession> {
    // Create abort controller for cancellation
    const abortController = new AbortController();

    const session: ExecutionSession = {
      ideaId,
      phaseId,
      userId,
      status: 'running',
      startedAt: Date.now(),
      queuedMessages: [],
      clientConnected: this.clientCallbacks.has(ideaId),
      accumulatedResponse: '',
      tokenUsage: { inputTokens: 0, outputTokens: 0 },
      // Store context for reconnection support
      ideaContext,
      plan,
      pendingTools: [],
      processedTaskIds: new Set(),
      completedToolCalls: [],
      messageSegments: [],
      pauseBetweenPhases,
      stopReason: 'running',
      abortController,
    };
    this.activeSessions.set(ideaId, session);

    // Note: We don't add a "Starting execution" message - the agent's response will be the first message

    const updatedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, {
      startedAt: new Date().toISOString(),
      currentPhaseId: phaseId,
      waitingForFeedback: false,
      stopReason: 'running',
      pauseBetweenPhases,
    });

    // Broadcast execution state change to workspace clients
    if (updatedIdea && this.onExecutionStateChange) {
      this.onExecutionStateChange(ideaId, updatedIdea);
    }

    // Start execution in background (don't await)
    this.runExecution(ideaId, ideaContext, plan, phaseId, userId, session, this.buildExecutionPrompt(plan, phaseId));
    return session;
  }

  /**
   * Send a user message to an executing idea.
   * Used for conversation during execution.
   */
  async sendMessage(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    userId: string,
    message: string
  ): Promise<void> {
    const session = this.activeSessions.get(ideaId);
    console.log(`[ExecutionAgentService] sendMessage for idea ${ideaId}, session status: ${session?.status || 'none'}`);
    await this.chatService.addMessage(ideaId, userId, 'user', message);

    if (session?.status === 'blocked') {
      // Resume blocked execution with user feedback
      await this.resumeWithFeedback(ideaId, ideaContext, plan, session.phaseId, userId, message);
    } else if (session?.status === 'running') {
      // Execution is running - message is queued and will be picked up
      // by the running conversation (no additional action needed)
      console.log(`[ExecutionAgentService] Message queued for running session ${ideaId}`);
    } else {
      // No running session or session is completed/idle - start a new conversation
      // Create a session to handle this message
      console.log(`[ExecutionAgentService] Starting new conversation for user message (session was: ${session?.status || 'none'})`);
      // Find the first incomplete phase, or use the last phase if all are complete
      const firstIncompletePhase = plan.phases.find(p => !p.tasks.every(t => t.completed));
      const phaseId = session?.phaseId || firstIncompletePhase?.id || plan.phases[plan.phases.length - 1]?.id || 'default';
      console.log(`[ExecutionAgentService] Determined phaseId for new conversation: ${phaseId} (firstIncomplete: ${firstIncompletePhase?.title || 'none'})`);

      // Create abort controller for cancellation
      const abortController = new AbortController();

      const newSession: ExecutionSession = {
        ideaId,
        phaseId,
        userId,
        status: 'running',
        startedAt: Date.now(),
        queuedMessages: [],
        clientConnected: this.clientCallbacks.has(ideaId),
        accumulatedResponse: '',
        tokenUsage: { inputTokens: 0, outputTokens: 0 },
        ideaContext,
        plan,
        pendingTools: [],
        processedTaskIds: new Set(),
        completedToolCalls: [],
        messageSegments: [],
        pauseBetweenPhases: false, // Default to false for ad-hoc messages
        abortController,
      };
      this.activeSessions.set(ideaId, newSession);

      // Notify client that execution has started
      this.dispatchOrQueue(ideaId, {
        type: 'session_state',
        data: { status: 'running', phaseId, startedAt: newSession.startedAt },
        timestamp: Date.now(),
      });

      // Run the conversation with the user's message
      this.runExecution(ideaId, ideaContext, plan, phaseId, userId, newSession, message);
    }
  }

  /** Execute a phase (legacy callback-based method). */
  async executePhase(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    callbacks: ExecutionStreamCallbacks
  ): Promise<void> {
    this.registerClient(ideaId, callbacks);
    try {
      await this.startExecution(ideaId, ideaContext, plan, phaseId, userId);
      await this.waitForCompletion(ideaId);
    } finally {
      this.unregisterClient(ideaId);
    }
  }

  /** Continue with feedback (legacy callback-based method). */
  async continueWithFeedback(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    feedback: string,
    callbacks: ExecutionStreamCallbacks
  ): Promise<void> {
    this.registerClient(ideaId, callbacks);
    try {
      await this.resumeWithFeedback(ideaId, ideaContext, plan, phaseId, userId, feedback);
      await this.waitForCompletion(ideaId);
    } finally {
      this.unregisterClient(ideaId);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private buildExecutionPrompt(plan: IdeaPlan, phaseId: string): string {
    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) return '';
    const phaseIndex = plan.phases.indexOf(phase) + 1;
    return `Execute Phase ${phaseIndex}: ${phase.title}

Your tasks for this phase:
${phase.tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}

Begin executing these tasks in order. Report progress after each task completion using <task_complete> blocks.`;
  }

  private async resumeWithFeedback(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    feedback: string
  ): Promise<void> {
    const session = this.activeSessions.get(ideaId);
    if (!session) return;

    session.status = 'running';
    session.blockInfo = undefined;
    session.accumulatedResponse = '';

    const updatedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, { waitingForFeedback: false });
    if (updatedIdea && this.onExecutionStateChange) {
      this.onExecutionStateChange(ideaId, updatedIdea);
    }
    this.runExecution(ideaId, ideaContext, plan, phaseId, userId, session, feedback);
  }

  /**
   * Unified execution runner for both initial execution and feedback continuation.
   */
  private async runExecution(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    session: ExecutionSession,
    prompt: string
  ): Promise<void> {
    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) {
      await this.handleError(session, ideaId, `Phase ${phaseId} not found in plan`);
      return;
    }

    // Load remembered facts for this user
    const factsSection = await factsService.formatFactsForPrompt(userId) || undefined;

    const systemPrompt = buildExecutionAgentSystemPrompt(ideaContext, plan, phaseId, factsSection);
    const ideateMcpServer = createIdeateMcpServer(this.ideaService, userId, plan.workspaceId);
    const messageId = `msg-exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    session.currentMessageId = messageId;

    try {
      console.log(`[ExecutionAgentService] Starting execution of phase ${phaseId} for idea ${ideaId}`);

      // Require a valid absolute working directory - don't execute in random locations
      const rawWorkDir = plan.workingDirectory;
      const validationError = validateWorkingDirectory(rawWorkDir);
      if (validationError) {
        throw new Error(validationError);
      }
      // Expand tilde to actual home directory path
      const workDir = expandTildePath(rawWorkDir);
      console.log(`[ExecutionAgentService] Using cwd: ${workDir}`);

      // Create working directory if it doesn't exist (execution agent needs somewhere to work)
      if (!fs.existsSync(workDir)) {
        console.log(`[ExecutionAgentService] Creating working directory: ${workDir}`);
        fs.mkdirSync(workDir, { recursive: true });
      }

      // Custom spawn function to ensure proper environment and use full node path
      const spawnClaudeCodeProcess = (options: SpawnOptions): SpawnedProcess => {
        // Replace 'node' command with the full path to node executable
        // This fixes issues where node isn't in PATH when spawning from different cwd
        const command = options.command === 'node' ? process.execPath : options.command;
        console.log(`[ExecutionAgentService] Spawning: ${command} ${options.args.slice(0, 2).join(' ')}...`);
        console.log(`[ExecutionAgentService] Spawn cwd: ${options.cwd}`);

        const childProcess = spawn(command, options.args, {
          cwd: options.cwd,
          env: options.env as NodeJS.ProcessEnv,
          stdio: ['pipe', 'pipe', 'inherit'], // inherit stderr for debugging
        });

        // Handle spawn errors
        childProcess.on('error', (err) => {
          console.error(`[ExecutionAgentService] Spawn error:`, err);
        });

        return childProcess as SpawnedProcess;
      };

      const response = query({
        prompt,
        options: {
          systemPrompt,
          model: 'claude-opus-4-5-20251101',
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          cwd: workDir,
          maxTurns: 300,
          includePartialMessages: true,
          allowedTools: ['WebSearch'],
          mcpServers: { ideate: ideateMcpServer },
          // Pass through environment to ensure node is findable (needed for nvm setups)
          env: process.env as Record<string, string>,
          // Custom spawn to debug and ensure proper process creation
          spawnClaudeCodeProcess,
        },
      });

      for await (const message of response) {
        // Check abort signal at start of each iteration
        if (session.abortController?.signal.aborted) {
          console.log(`[ExecutionAgentService] Abort detected, breaking out of stream loop`);
          break;
        }
        await this.processStreamMessage(ideaId, session, message, messageId, userId);
      }

      // If aborted, skip all post-processing and clean up
      if (session.abortController?.signal.aborted) {
        console.log(`[ExecutionAgentService] Request was aborted, skipping post-processing`);
        // Status was already broadcast in abortSession(), just return
        return;
      }

      // Save any remaining accumulated content (text or tools not yet saved)
      if (session.accumulatedResponse.trim() || session.messageSegments.length > 0) {
        await this.processStructuredEvents(ideaId, session.accumulatedResponse, userId);
        await this.chatService.addMessage(ideaId, userId, 'assistant', session.accumulatedResponse, {
          rawResponse: session.accumulatedResponse,
          toolCalls: session.completedToolCalls.length > 0 ? session.completedToolCalls : undefined,
          segments: session.messageSegments.length > 0 ? session.messageSegments : undefined,
        });
      }

      if (session.status !== 'blocked') {
        session.status = 'completed';
        this.dispatchOrQueue(ideaId, { type: 'complete', data: null, timestamp: Date.now() });
        // Mark as waiting for feedback so the Kanban card shows the appropriate indicator
        const completedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, { waitingForFeedback: true });
        if (completedIdea && this.onExecutionStateChange) {
          this.onExecutionStateChange(ideaId, completedIdea);
        }
      }

      console.log(`[ExecutionAgentService] Completed execution of phase ${phaseId}`);
    } catch (error) {
      await this.handleError(session, ideaId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async processStreamMessage(
    ideaId: string,
    session: ExecutionSession,
    message: { type: string; subtype?: string; result?: string; message?: { content: unknown; usage?: { input_tokens?: number; output_tokens?: number } } },
    messageId: string,
    userId: string
  ): Promise<void> {
    console.log(`[ExecutionAgentService] processStreamMessage type=${message.type}, subtype=${message.subtype || 'none'}`);
    if (message.type === 'assistant') {
      const assistantMsg = message as SDKAssistantMessage;
      const msgContent = assistantMsg.message.content;
      const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;

      if (usage) {
        this.updateTokenUsage(session, ideaId, usage);
      }

      if (Array.isArray(msgContent)) {
        console.log(`[ExecutionAgentService] Processing ${msgContent.length} content blocks`);
        for (const block of msgContent) {
          if (block.type === 'text') {
            console.log(`[ExecutionAgentService] text block (${block.text.length} chars): ${block.text.slice(0, 100)}...`);

            // Complete any pending tools before processing text
            // (text after tools means the SDK completed them)
            await this.completePendingTools(session, ideaId, messageId, userId);

            // Add paragraph break if this looks like a new thought after tool results
            // This handles cases where text runs together like "...file:Now I'll create..."
            let textToAppend = block.text;
            const prevText = session.accumulatedResponse;
            if (prevText.length > 0) {
              const prevEndsWithPunctuation = /[:.!?]\s*$/.test(prevText);
              const prevEndsWithNewline = /\n\s*$/.test(prevText);
              const newStartsWithCapital = /^\s*[A-Z]/.test(textToAppend);

              // If previous text ends with punctuation (no newline) and new text starts a sentence,
              // add a paragraph break for readability
              if (prevEndsWithPunctuation && !prevEndsWithNewline && newStartsWithCapital) {
                textToAppend = '\n\n' + textToAppend.trimStart();
              }
            }

            session.accumulatedResponse += textToAppend;
            // Add text to segments for ordered persistence
            this.addTextToSegments(session, textToAppend);
            this.dispatchOrQueue(ideaId, { type: 'text_chunk', data: textToAppend, messageId, timestamp: Date.now() });
            await this.processStructuredEvents(ideaId, session.accumulatedResponse, userId);
          } else if (block.type === 'tool_use' || block.type === 'server_tool_use') {
            console.log(`[ExecutionAgentService] ${block.type} block: ${block.name}`);
            // Track this tool as pending with its input for persistence
            const toolInput = block.input as Record<string, unknown> | undefined;
            session.pendingTools.push({ name: block.name, startTime: Date.now(), input: toolInput });
            this.dispatchOrQueue(ideaId, { type: 'tool_start', data: { name: block.name, input: block.input }, messageId, timestamp: Date.now() });
          } else if (block.type === 'tool_result') {
            // Tool result received - mark the tool as complete and store for persistence
            const resultBlock = block as { tool_use_id: string; content: unknown };
            const resultContent = typeof resultBlock.content === 'string'
              ? resultBlock.content
              : JSON.stringify(resultBlock.content);
            console.log(`[ExecutionAgentService] tool_result block (${resultContent.length} chars)`);

            // Remove the first pending tool (assuming order matches)
            const pendingTool = session.pendingTools.shift();
            const toolName = pendingTool?.name ?? 'unknown';
            const endTime = Date.now();
            const startTime = pendingTool?.startTime ?? endTime;

            // Add to segments for ordered persistence
            this.addToolToSegments(session, toolName, pendingTool?.input, resultContent, startTime, endTime);

            // Also add to completedToolCalls for backward compatibility
            session.completedToolCalls.push({
              name: toolName,
              input: pendingTool?.input,
              output: resultContent.length > 500 ? resultContent.slice(0, 500) + '...' : resultContent,
              startTime,
              endTime,
              duration: endTime - startTime,
              completed: true,
            });

            this.dispatchOrQueue(ideaId, { type: 'tool_end', data: { name: toolName, result: '' }, messageId, timestamp: Date.now() });
          } else {
            console.log(`[ExecutionAgentService] unknown block type: ${(block as { type: string }).type}`);
          }
        }
      } else if (typeof msgContent === 'string') {
        console.log(`[ExecutionAgentService] string content (${msgContent.length} chars): ${msgContent.slice(0, 100)}...`);

        // Complete any pending tools before processing text
        await this.completePendingTools(session, ideaId, messageId, userId);

        // Add paragraph break if this looks like a new thought
        let textToAppend = msgContent;
        const prevText = session.accumulatedResponse;
        if (prevText.length > 0) {
          const prevEndsWithPunctuation = /[:.!?]\s*$/.test(prevText);
          const prevEndsWithNewline = /\n\s*$/.test(prevText);
          const newStartsWithCapital = /^\s*[A-Z]/.test(textToAppend);

          if (prevEndsWithPunctuation && !prevEndsWithNewline && newStartsWithCapital) {
            textToAppend = '\n\n' + textToAppend.trimStart();
          }
        }

        session.accumulatedResponse += textToAppend;
        // Add text to segments for ordered persistence
        this.addTextToSegments(session, textToAppend);
        this.dispatchOrQueue(ideaId, { type: 'text_chunk', data: textToAppend, messageId, timestamp: Date.now() });
        await this.processStructuredEvents(ideaId, session.accumulatedResponse, userId);
      } else {
        console.log(`[ExecutionAgentService] unexpected content type:`, typeof msgContent);
      }
    } else if (message.type === 'user') {
      // User message contains tool results (SDK pattern)
      const userMsg = message as { type: 'user'; message: { content: unknown[] } };
      if (Array.isArray(userMsg.message?.content)) {
        for (const block of userMsg.message.content) {
          if ((block as { type?: string }).type === 'tool_result') {
            const toolResult = block as { type: 'tool_result'; tool_use_id?: string; content?: unknown };

            // Extract content
            let resultContent = 'completed';
            if (typeof toolResult.content === 'string') {
              resultContent = toolResult.content;
            } else if (Array.isArray(toolResult.content)) {
              const textBlock = toolResult.content.find((c: unknown) => (c as { type?: string }).type === 'text');
              if (textBlock && typeof (textBlock as { text?: string }).text === 'string') {
                resultContent = (textBlock as { text: string }).text;
              }
            }

            console.log(`[ExecutionAgentService] user tool_result (${resultContent.length} chars)`);

            // Remove the first pending tool (assuming order matches)
            const pendingTool = session.pendingTools.shift();
            const toolName = pendingTool?.name ?? 'unknown';
            const endTime = Date.now();
            const startTime = pendingTool?.startTime ?? endTime;

            // Add to segments for ordered persistence
            this.addToolToSegments(session, toolName, pendingTool?.input, resultContent, startTime, endTime);

            // Also add to completedToolCalls for backward compatibility
            session.completedToolCalls.push({
              name: toolName,
              input: pendingTool?.input,
              output: resultContent.length > 500 ? resultContent.slice(0, 500) + '...' : resultContent,
              startTime,
              endTime,
              duration: endTime - startTime,
              completed: true,
            });

            this.dispatchOrQueue(ideaId, { type: 'tool_end', data: { name: toolName, result: '' }, messageId, timestamp: Date.now() });
          }
        }
      }
    } else if (message.type === 'result') {
      if (message.subtype === 'success' && message.result && !session.accumulatedResponse) {
        session.accumulatedResponse = message.result;
      }
      const resultUsage = (message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
      if (resultUsage) {
        this.updateTokenUsage(session, ideaId, resultUsage);
      }
      if (message.subtype === 'error_during_execution') {
        await this.handleError(session, ideaId, 'An error occurred during execution');
      }
    }
  }

  private updateTokenUsage(session: ExecutionSession, ideaId: string, usage: { input_tokens?: number; output_tokens?: number }): void {
    if (usage.input_tokens) session.tokenUsage.inputTokens = usage.input_tokens;
    if (usage.output_tokens) session.tokenUsage.outputTokens = usage.output_tokens;
    this.dispatchOrQueue(ideaId, { type: 'token_usage', data: session.tokenUsage, timestamp: Date.now() });
  }

  /**
   * Add text to the current message segment.
   * Merges consecutive text into a single segment.
   */
  private addTextToSegments(session: ExecutionSession, text: string): void {
    const lastSegment = session.messageSegments[session.messageSegments.length - 1];

    if (lastSegment?.type === 'text') {
      // Merge with existing text segment
      lastSegment.text = (lastSegment.text || '') + text;
    } else {
      // Create new text segment
      session.messageSegments.push({ type: 'text', text });
    }
  }

  /**
   * Add a completed tool call as a segment.
   */
  private addToolToSegments(
    session: ExecutionSession,
    toolName: string,
    input: Record<string, unknown> | undefined,
    output: string,
    startTime: number,
    endTime: number
  ): void {
    session.messageSegments.push({
      type: 'tool',
      tool: {
        name: toolName,
        input,
        output: output.length > 500 ? output.slice(0, 500) + '...' : output,
        startTime,
        endTime,
        duration: endTime - startTime,
        completed: true,
      },
    });
  }

  /**
   * Complete all pending tools - called when text arrives after tool calls,
   * indicating the SDK has finished executing the tools.
   * Also saves the current message segment (text + tools) before new text arrives.
   */
  private async completePendingTools(
    session: ExecutionSession,
    ideaId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    if (session.pendingTools.length === 0) return;

    // Complete all pending tools and add them as segments
    while (session.pendingTools.length > 0) {
      const tool = session.pendingTools.shift()!;
      const endTime = Date.now();
      const duration = endTime - tool.startTime;
      console.log(`[ExecutionAgentService] Completing tool ${tool.name} (${duration}ms)`);

      // Add to segments for ordered persistence
      this.addToolToSegments(session, tool.name, tool.input, '__complete__', tool.startTime, endTime);

      // Also add to completedToolCalls for backward compatibility
      session.completedToolCalls.push({
        name: tool.name,
        input: tool.input,
        output: '__complete__',
        startTime: tool.startTime,
        endTime,
        duration,
        completed: true,
      });

      this.dispatchOrQueue(ideaId, {
        type: 'tool_end',
        data: { name: tool.name, result: '' },
        messageId,
        timestamp: Date.now(),
      });
    }

    // Save the current message with ordered segments
    // This preserves the interleaved structure when rehydrated
    if (session.accumulatedResponse.trim() || session.messageSegments.length > 0) {
      await this.chatService.addMessage(ideaId, userId, 'assistant', session.accumulatedResponse, {
        rawResponse: session.accumulatedResponse,
        toolCalls: session.completedToolCalls.length > 0 ? [...session.completedToolCalls] : undefined,
        segments: session.messageSegments.length > 0 ? [...session.messageSegments] : undefined,
      });

      // Reset for next segment
      session.accumulatedResponse = '';
      session.completedToolCalls = [];
      session.messageSegments = [];
    }
  }

  private async processStructuredEvents(ideaId: string, text: string, _userId: string): Promise<void> {
    const session = this.activeSessions.get(ideaId);

    // Process ALL task completions, but only ones we haven't seen yet
    const taskCompletions = parseAllTaskCompletes(text);
    for (const taskComplete of taskCompletions) {
      // Skip if we've already processed this task
      if (session?.processedTaskIds.has(taskComplete.taskId)) {
        continue;
      }
      // Mark as processed
      session?.processedTaskIds.add(taskComplete.taskId);

      this.dispatchOrQueue(ideaId, { type: 'task_complete', data: taskComplete, timestamp: Date.now() });
      const updatedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, { currentTaskId: undefined });
      if (updatedIdea && this.onExecutionStateChange) {
        this.onExecutionStateChange(ideaId, updatedIdea);
      }
      await this.chatService.markTaskCompleted(ideaId, taskComplete.taskId);
      // Persist task completion to the plan metadata so it survives dialog close/reopen
      await this.ideaService.markTaskCompleted(ideaId, taskComplete.taskId);
    }

    const phaseComplete = parsePhaseComplete(text);
    if (phaseComplete) {
      this.dispatchOrQueue(ideaId, { type: 'phase_complete', data: phaseComplete, timestamp: Date.now() });

      // Update progress percent when a phase completes and handle auto-continue
      try {
        const idea = await this.ideaService.getIdeaByIdNoAuth(ideaId);
        if (idea?.plan?.phases) {
          const phases = idea.plan.phases;
          const completedPhaseIndex = phases.findIndex(p => p.id === phaseComplete.phaseId);

          if (completedPhaseIndex !== -1) {
            // Calculate progress: (completedPhases / totalPhases) * 100
            const progressPercent = Math.round(((completedPhaseIndex + 1) / phases.length) * 100);

            // Find next phase if there is one
            const nextPhaseId = completedPhaseIndex < phases.length - 1
              ? phases[completedPhaseIndex + 1].id
              : undefined;

            if (nextPhaseId) {
              // There's a next phase
              if (session?.pauseBetweenPhases) {
                // Pause between phases - update state and notify
                console.log(`[ExecutionAgentService] Phase ${phaseComplete.phaseId} complete, pausing before phase ${nextPhaseId}`);
                if (session) {
                  session.status = 'paused';
                  session.stopReason = 'phase_complete';
                }
                const updatedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, {
                  progressPercent,
                  currentPhaseId: nextPhaseId,
                  stopReason: 'phase_complete',
                  nextPhaseId,
                });
                if (updatedIdea && this.onExecutionStateChange) {
                  this.onExecutionStateChange(ideaId, updatedIdea);
                }
                // Notify client of session state change
                this.dispatchOrQueue(ideaId, {
                  type: 'session_state',
                  data: { status: 'paused', stopReason: 'phase_complete', nextPhaseId, phaseId: nextPhaseId },
                  timestamp: Date.now(),
                });
              } else {
                // Auto-continue to next phase
                console.log(`[ExecutionAgentService] Phase ${phaseComplete.phaseId} complete, auto-continuing to phase ${nextPhaseId}`);
                const updatedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, {
                  progressPercent,
                  currentPhaseId: nextPhaseId,
                  stopReason: 'running',
                });
                if (updatedIdea && this.onExecutionStateChange) {
                  this.onExecutionStateChange(ideaId, updatedIdea);
                }
                // Schedule auto-continue (small delay for clean state transition)
                if (session?.ideaContext && session.plan) {
                  setTimeout(() => {
                    this.startExecution(
                      ideaId,
                      session.ideaContext!,
                      session.plan!,
                      nextPhaseId,
                      session.userId,
                      session.pauseBetweenPhases
                    );
                  }, 500);
                }
              }
            } else {
              // No next phase - all phases complete
              console.log(`[ExecutionAgentService] All phases complete for idea ${ideaId}`);
              if (session) {
                session.status = 'completed';
                session.stopReason = 'all_complete';
              }
              const updatedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, {
                progressPercent: 100,
                stopReason: 'all_complete',
              });
              if (updatedIdea && this.onExecutionStateChange) {
                this.onExecutionStateChange(ideaId, updatedIdea);
              }
              // Notify client of completion
              this.dispatchOrQueue(ideaId, {
                type: 'session_state',
                data: { status: 'completed', stopReason: 'all_complete' },
                timestamp: Date.now(),
              });
            }
          }
        }
      } catch (err) {
        console.error('[ExecutionAgentService] Failed to update progress on phase complete:', err);
      }
    }

    const executionBlocked = parseExecutionBlocked(text);
    if (executionBlocked) {
      if (session) {
        session.status = 'blocked';
        session.blockInfo = executionBlocked;
        session.stopReason = 'needs_input';
      }
      this.dispatchOrQueue(ideaId, { type: 'blocked', data: executionBlocked, timestamp: Date.now() });
      const blockedIdea = await this.ideaService.updateExecutionStateInternal(ideaId, {
        waitingForFeedback: true,
        stopReason: 'needs_input',
      });
      if (blockedIdea && this.onExecutionStateChange) {
        this.onExecutionStateChange(ideaId, blockedIdea);
      }
    }

    const newIdea = parseNewIdea(text);
    if (newIdea) {
      this.dispatchOrQueue(ideaId, { type: 'new_idea', data: newIdea, timestamp: Date.now() });
    }

    const taskUpdate = parseTaskUpdate(text);
    if (taskUpdate) {
      this.dispatchOrQueue(ideaId, { type: 'task_update', data: taskUpdate, timestamp: Date.now() });
      // Persist task updates to plan metadata
      if (taskUpdate.task && taskUpdate.action === 'update' && taskUpdate.task.completed !== undefined) {
        await this.ideaService.markTaskCompleted(ideaId, taskUpdate.task.id, taskUpdate.task.completed);
      }
    }
  }

  private async handleError(session: ExecutionSession, ideaId: string, errorMessage: string): Promise<void> {
    console.error('[ExecutionAgentService] Error:', errorMessage);
    session.status = 'error';
    session.errorMessage = errorMessage;
    session.stopReason = 'error';
    this.dispatchOrQueue(ideaId, { type: 'error', data: errorMessage, timestamp: Date.now() });

    // Persist error state
    try {
      await this.ideaService.updateExecutionStateInternal(ideaId, { stopReason: 'error' });
    } catch (err) {
      console.error('[ExecutionAgentService] Failed to persist error state:', err);
    }

    // Persist error message to chat history so it shows when reopening dialog
    try {
      await this.chatService.addMessage(ideaId, session.userId, 'system', `**Error:** ${errorMessage}`);
    } catch (err) {
      console.error('[ExecutionAgentService] Failed to persist error to chat history:', err);
    }

    // Broadcast error state change to workspace clients
    if (this.onExecutionStateChange) {
      try {
        const idea = await this.ideaService.getIdeaByIdNoAuth(ideaId);
        if (idea) {
          this.onExecutionStateChange(ideaId, idea);
        }
      } catch (err) {
        console.error('[ExecutionAgentService] Failed to get idea for error broadcast:', err);
      }
    }
  }

  private dispatchOrQueue(ideaId: string, message: QueuedMessage): void {
    const callbacks = this.clientCallbacks.get(ideaId);
    if (callbacks) {
      this.dispatchMessage(message, callbacks);
    } else {
      const session = this.activeSessions.get(ideaId);
      if (session) {
        session.queuedMessages.push(message);
        if (session.queuedMessages.length > 1000) {
          session.queuedMessages = session.queuedMessages.slice(-500);
        }
      }
    }
  }

  private dispatchMessage(message: QueuedMessage, callbacks: ExecutionStreamCallbacks): void {
    switch (message.type) {
      case 'text_chunk':
        callbacks.onTextChunk(message.data as string, message.messageId || '');
        break;
      case 'task_complete':
        callbacks.onTaskComplete(message.data as TaskCompleteEvent);
        break;
      case 'phase_complete':
        callbacks.onPhaseComplete(message.data as PhaseCompleteEvent);
        break;
      case 'blocked':
        callbacks.onExecutionBlocked(message.data as ExecutionBlockedEvent);
        break;
      case 'new_idea':
        callbacks.onNewIdea(message.data as NewIdeaEvent);
        break;
      case 'task_update':
        callbacks.onTaskUpdate?.(message.data as TaskUpdateEvent);
        break;
      case 'tool_start': {
        const toolData = message.data as { name: string; input: unknown };
        callbacks.onToolUseStart?.(toolData.name, toolData.input, message.messageId || '');
        break;
      }
      case 'tool_end': {
        const toolResult = message.data as { name: string; result: string };
        callbacks.onToolUseEnd?.(toolResult.name, toolResult.result, message.messageId || '');
        break;
      }
      case 'complete':
        callbacks.onComplete();
        break;
      case 'error':
        callbacks.onError(message.data as string);
        break;
      case 'token_usage':
        callbacks.onTokenUsage?.(message.data as TokenUsage);
        break;
      case 'session_state':
        callbacks.onSessionState?.(message.data as SessionStateEvent);
        break;
    }
  }

  private async waitForCompletion(ideaId: string): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        const session = this.activeSessions.get(ideaId);
        if (!session || session.status !== 'running') {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}
