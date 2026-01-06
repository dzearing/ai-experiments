/**
 * ExecutionAgentTypes
 *
 * Type definitions for the execution agent service.
 * Extracted to keep ExecutionAgentService under 500 lines.
 */

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
 * Task update event for modifying the task list
 */
export interface TaskUpdateEvent {
  action: 'add' | 'update' | 'delete' | 'reorder';
  phaseId: string;
  task?: {
    id: string;
    title: string;
    completed?: boolean;
  };
  taskIds?: string[]; // For reorder action
}

/**
 * Queued message for replay when client reconnects
 */
export interface QueuedMessage {
  type: 'text_chunk' | 'task_complete' | 'phase_complete' | 'blocked' | 'new_idea' | 'tool_start' | 'tool_end' | 'complete' | 'error' | 'token_usage' | 'task_update' | 'session_state';
  data: unknown;
  timestamp: number;
  messageId?: string;
}

import type { ExecutionIdeaContext } from '../prompts/executionAgentPrompt.js';
import type { IdeaPlan } from './IdeaService.js';

/**
 * Pending tool call awaiting completion
 */
export interface PendingToolCall {
  name: string;
  startTime: number;
  input?: Record<string, unknown>;
}

/**
 * Active execution session
 */
export interface ExecutionSession {
  ideaId: string;
  phaseId: string;
  userId: string;
  status: 'running' | 'paused' | 'blocked' | 'completed' | 'error';
  startedAt: number;
  /** Messages to replay when client reconnects */
  queuedMessages: QueuedMessage[];
  /** Whether a client is currently connected */
  clientConnected: boolean;
  /** Current message being streamed */
  currentMessageId?: string;
  /** Accumulated response text */
  accumulatedResponse: string;
  /** Token usage */
  tokenUsage: TokenUsage;
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Block info if status is 'blocked' */
  blockInfo?: ExecutionBlockedEvent;
  /** Idea context for continued execution (stored at session start) */
  ideaContext?: ExecutionIdeaContext;
  /** Plan for continued execution (stored at session start) */
  plan?: IdeaPlan;
  /** Pending tool calls that haven't completed yet */
  pendingTools: PendingToolCall[];
  /** Task IDs that have already been processed (to avoid duplicates) */
  processedTaskIds: Set<string>;
  /** Completed tool calls to persist with the message */
  completedToolCalls: Array<{
    name: string;
    input?: Record<string, unknown>;
    output?: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
    completed?: boolean;
  }>;
}

/**
 * Callbacks for streaming execution responses
 */
/**
 * Session state for client notification
 */
export interface SessionStateEvent {
  status: 'running' | 'paused' | 'blocked' | 'completed' | 'error' | 'idle';
  phaseId?: string;
  startedAt?: number;
  errorMessage?: string;
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
  /** Called when a task update is requested */
  onTaskUpdate?: (event: TaskUpdateEvent) => void;
  /** Called when tool use starts (messageId used to group with current message) */
  onToolUseStart?: (toolName: string, toolInput: unknown, messageId: string) => void;
  /** Called when tool use ends (messageId used to group with current message) */
  onToolUseEnd?: (toolName: string, result: string, messageId: string) => void;
  /** Called when the execution is complete */
  onComplete: () => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called with token usage updates during streaming */
  onTokenUsage?: (usage: TokenUsage) => void;
  /** Called when session state changes */
  onSessionState?: (event: SessionStateEvent) => void;
}
