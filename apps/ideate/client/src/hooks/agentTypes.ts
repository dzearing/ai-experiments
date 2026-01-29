/**
 * Shared types for all agent hooks.
 *
 * These types are used by useAgentSocket and all agent-specific wrappers.
 * The goal is to have ONE definition of each concept, not three.
 */

import type { OpenQuestion } from '@ui-kit/react-chat';

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Tool call information for agent messages.
 * Unified across all agents - no more IdeaAgentToolCall, ExecutionToolCall, PlanAgentToolCall.
 */
export interface AgentToolCall {
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  /** When the tool call started (epoch ms) */
  startTime?: number;
  /** When the tool call completed (epoch ms) */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Whether the tool execution is complete */
  completed?: boolean;
  /** Whether the tool execution was cancelled */
  cancelled?: boolean;
}

/**
 * A text content block within a message (for parts array)
 */
export interface AgentTextBlock {
  type: 'text';
  text: string;
}

/**
 * A tool calls content block within a message (for parts array)
 */
export interface AgentToolCallsBlock {
  type: 'tool_calls';
  calls: AgentToolCall[];
}

/**
 * A component content block within a message (for rendering custom UI components)
 */
export interface AgentComponentBlock {
  type: 'component';
  componentType: 'context' | string;
  data: Record<string, unknown>;
}

/**
 * Content block for preserving text/tool interleaving in messages
 */
export type AgentContentBlock = AgentTextBlock | AgentToolCallsBlock | AgentComponentBlock;

/**
 * Base message interface for all agents.
 * Agent-specific wrappers can extend this with additional fields.
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  /** Open questions associated with this message (for rehydration on dialog reopen) */
  openQuestions?: OpenQuestion[];
  /** Tool calls made during this message */
  toolCalls?: AgentToolCall[];
  /** Content blocks in order - maintains text/tool interleaving */
  parts?: AgentContentBlock[];
}

/**
 * Idea context to send to any agent.
 * All agents work with ideas and need this context.
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
 * Topic context for ideas linked to topics
 */
export interface TopicContext {
  id: string;
  name: string;
  type: string;
  description?: string;
  /** Local file system path if this is a local folder/repo/package */
  localPath?: string;
}

/**
 * Parent topic context for plan agent (includes children)
 */
export interface ParentTopicContext extends TopicContext {
  children?: Array<{
    id: string;
    name: string;
    type: string;
    localPath?: string;
  }>;
}

// ============================================================================
// Execution-specific types (only used by useExecutionAgent)
// ============================================================================

/**
 * Execution session state from the server
 */
export interface ExecutionSessionState {
  status: 'running' | 'paused' | 'blocked' | 'completed' | 'error' | 'idle';
  phaseId?: string;
  startedAt?: number;
  errorMessage?: string;
}

/**
 * Task update event (add/remove/modify tasks during execution)
 */
export interface TaskUpdateEvent {
  action: 'add' | 'remove' | 'update';
  taskId: string;
  phaseId: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
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
 * Extended message type for execution agent with event field
 */
export interface ExecutionAgentMessage extends AgentMessage {
  /** Message type for special execution events */
  type?: 'text' | 'tool_use' | 'tool_result' | 'task_complete' | 'phase_complete' | 'blocked' | 'new_idea' | 'task_update';
  /** Tool name when type is tool_use or tool_result */
  toolName?: string;
  /** Event data for special message types */
  event?: TaskCompleteEvent | PhaseCompleteEvent | ExecutionBlockedEvent | NewIdeaEvent | TaskUpdateEvent;
}
