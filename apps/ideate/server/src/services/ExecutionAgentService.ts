/**
 * ExecutionAgentService
 *
 * Service for executing implementation plans using Claude Code's full capabilities.
 * Handles phase execution, progress tracking, and real-time updates.
 */

import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { buildExecutionAgentSystemPrompt, type ExecutionIdeaContext } from '../prompts/executionAgentPrompt.js';
import { createIdeateMcpServer } from './IdeateMcpTools.js';
import type { IdeaService, IdeaPlan } from './IdeaService.js';

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Task completion event
 */
export interface TaskCompleteEvent {
  taskId: string;
  phaseId: string;
  summary?: string;
}

/**
 * Phase completion event
 */
export interface PhaseCompleteEvent {
  phaseId: string;
  summary?: string;
}

/**
 * Execution blocked event
 */
export interface ExecutionBlockedEvent {
  taskId?: string;
  phaseId?: string;
  issue: string;
  attempted?: string[];
  needsUserInput: boolean;
}

/**
 * New idea discovered during execution
 */
export interface NewIdeaEvent {
  title: string;
  summary: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Callbacks for streaming execution responses
 */
export interface ExecutionStreamCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when a task is completed */
  onTaskComplete: (event: TaskCompleteEvent) => void;
  /** Called when a phase is completed */
  onPhaseComplete: (event: PhaseCompleteEvent) => void;
  /** Called when execution is blocked */
  onExecutionBlocked: (event: ExecutionBlockedEvent) => void;
  /** Called when a new idea is discovered */
  onNewIdea: (event: NewIdeaEvent) => void;
  /** Called when tool use starts */
  onToolUseStart?: (toolName: string, toolInput: unknown) => void;
  /** Called when tool use ends */
  onToolUseEnd?: (toolName: string, result: string) => void;
  /** Called when the execution is complete */
  onComplete: () => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called with token usage updates during streaming */
  onTokenUsage?: (usage: TokenUsage) => void;
}

/**
 * Parse task_complete blocks from response
 */
function parseTaskComplete(text: string): TaskCompleteEvent | null {
  const match = text.match(/<task_complete>\s*([\s\S]*?)\s*<\/task_complete>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as TaskCompleteEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse task_complete JSON');
    return null;
  }
}

/**
 * Parse phase_complete blocks from response
 */
function parsePhaseComplete(text: string): PhaseCompleteEvent | null {
  const match = text.match(/<phase_complete>\s*([\s\S]*?)\s*<\/phase_complete>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as PhaseCompleteEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse phase_complete JSON');
    return null;
  }
}

/**
 * Parse execution_blocked blocks from response
 */
function parseExecutionBlocked(text: string): ExecutionBlockedEvent | null {
  const match = text.match(/<execution_blocked>\s*([\s\S]*?)\s*<\/execution_blocked>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as ExecutionBlockedEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse execution_blocked JSON');
    return null;
  }
}

/**
 * Parse new_idea blocks from response
 */
function parseNewIdea(text: string): NewIdeaEvent | null {
  const match = text.match(/<new_idea>\s*([\s\S]*?)\s*<\/new_idea>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as NewIdeaEvent;
  } catch {
    console.error('[ExecutionAgentService] Failed to parse new_idea JSON');
    return null;
  }
}

/**
 * Service for executing implementation plans with Claude Code capabilities.
 */
export class ExecutionAgentService {
  private ideaService: IdeaService;

  constructor(ideaService: IdeaService) {
    this.ideaService = ideaService;
  }

  /**
   * Execute a specific phase of a plan.
   * Uses Claude Code's full tool capabilities to perform the work.
   */
  async executePhase(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    callbacks: ExecutionStreamCallbacks
  ): Promise<void> {
    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) {
      callbacks.onError(`Phase ${phaseId} not found in plan`);
      return;
    }

    // Build the system prompt with execution context
    const systemPrompt = buildExecutionAgentSystemPrompt(ideaContext, plan, phaseId);

    // Create Ideate MCP server for idea management during execution
    const ideateMcpServer = createIdeateMcpServer(
      this.ideaService,
      userId,
      plan.workspaceId
    );

    // Build execution prompt
    const executionPrompt = `Execute Phase ${plan.phases.indexOf(phase) + 1}: ${phase.title}

Your tasks for this phase:
${phase.tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}

Begin executing these tasks in order. Report progress after each task completion using <task_complete> blocks.`;

    // Generate message ID for tracking
    const messageId = `msg-exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let fullResponse = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      console.log(`[ExecutionAgentService] Starting execution of phase ${phaseId} for idea ${ideaId}`);

      // Use query with Claude Code's full capabilities
      const response = query({
        prompt: executionPrompt,
        options: {
          systemPrompt,
          model: 'claude-sonnet-4-5-20250929',
          permissionMode: 'acceptEdits', // Auto-accept file edits
          allowDangerouslySkipPermissions: true,
          cwd: plan.workingDirectory,
          maxTurns: 50, // Allow many iterations for complex work
          includePartialMessages: true,
          // Include Ideate MCP tools for idea management
          mcpServers: { ideate: ideateMcpServer },
          // Don't pass tools: [] to enable Claude Code's built-in tools
        },
      });

      // Process streaming messages
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
              callbacks.onTokenUsage?.({
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
              });
            }
          }

          // Process content blocks
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                fullResponse += block.text;
                callbacks.onTextChunk(block.text, messageId);

                // Check for structured events in the text
                this.processStructuredEvents(fullResponse, callbacks);
              } else if (block.type === 'tool_use') {
                callbacks.onToolUseStart?.(block.name, block.input);
              }
            }
          } else if (typeof msgContent === 'string') {
            fullResponse += msgContent;
            callbacks.onTextChunk(msgContent, messageId);
            this.processStructuredEvents(fullResponse, callbacks);
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
            callbacks.onError('An error occurred during execution');
            return;
          }
        }
      }

      // Final check for any remaining structured events
      this.processStructuredEvents(fullResponse, callbacks);

      callbacks.onComplete();
      console.log(`[ExecutionAgentService] Completed execution of phase ${phaseId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ExecutionAgentService] Error during execution:', error);
      callbacks.onError(errorMessage);
    }
  }

  /**
   * Process structured events from the response text.
   */
  private processStructuredEvents(text: string, callbacks: ExecutionStreamCallbacks): void {
    // Check for task completion
    const taskComplete = parseTaskComplete(text);
    if (taskComplete) {
      callbacks.onTaskComplete(taskComplete);
    }

    // Check for phase completion
    const phaseComplete = parsePhaseComplete(text);
    if (phaseComplete) {
      callbacks.onPhaseComplete(phaseComplete);
    }

    // Check for execution blocked
    const executionBlocked = parseExecutionBlocked(text);
    if (executionBlocked) {
      callbacks.onExecutionBlocked(executionBlocked);
    }

    // Check for new idea discovered
    const newIdea = parseNewIdea(text);
    if (newIdea) {
      callbacks.onNewIdea(newIdea);
    }
  }

  /**
   * Continue execution with user feedback.
   * Used when execution was blocked and user provided input.
   */
  async continueWithFeedback(
    ideaId: string,
    ideaContext: ExecutionIdeaContext,
    plan: IdeaPlan,
    phaseId: string,
    userId: string,
    feedback: string,
    callbacks: ExecutionStreamCallbacks
  ): Promise<void> {
    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) {
      callbacks.onError(`Phase ${phaseId} not found in plan`);
      return;
    }

    // Build the system prompt with execution context
    const systemPrompt = buildExecutionAgentSystemPrompt(ideaContext, plan, phaseId);

    // Create Ideate MCP server for idea management during execution
    const ideateMcpServer = createIdeateMcpServer(
      this.ideaService,
      userId,
      plan.workspaceId
    );

    // Generate message ID for tracking
    const messageId = `msg-exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let fullResponse = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      console.log(`[ExecutionAgentService] Continuing execution with feedback for idea ${ideaId}, phase ${phaseId}`);

      // Use query with Claude Code's full capabilities
      const response = query({
        prompt: feedback,
        options: {
          systemPrompt,
          model: 'claude-sonnet-4-5-20250929',
          permissionMode: 'acceptEdits',
          allowDangerouslySkipPermissions: true,
          cwd: plan.workingDirectory,
          maxTurns: 50,
          includePartialMessages: true,
          mcpServers: { ideate: ideateMcpServer },
        },
      });

      // Process streaming messages (same as executePhase)
      for await (const message of response) {
        if (message.type === 'assistant') {
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

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

          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                fullResponse += block.text;
                callbacks.onTextChunk(block.text, messageId);
                this.processStructuredEvents(fullResponse, callbacks);
              } else if (block.type === 'tool_use') {
                callbacks.onToolUseStart?.(block.name, block.input);
              }
            }
          } else if (typeof msgContent === 'string') {
            fullResponse += msgContent;
            callbacks.onTextChunk(msgContent, messageId);
            this.processStructuredEvents(fullResponse, callbacks);
          }
        } else if (message.type === 'result') {
          if (message.subtype === 'success' && message.result) {
            if (!fullResponse) {
              fullResponse = message.result;
            }
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
            callbacks.onError('An error occurred during execution');
            return;
          }
        }
      }

      this.processStructuredEvents(fullResponse, callbacks);
      callbacks.onComplete();
      console.log(`[ExecutionAgentService] Completed feedback handling for phase ${phaseId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ExecutionAgentService] Error during feedback handling:', error);
      callbacks.onError(errorMessage);
    }
  }
}
