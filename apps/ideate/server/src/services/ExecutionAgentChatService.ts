import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * Tool call stored with a message
 */
export interface StoredToolCall {
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  /** When the tool started executing (epoch ms) */
  startTime?: number;
  /** When the tool completed (epoch ms) */
  endTime?: number;
  /** Duration in milliseconds (endTime - startTime) */
  duration?: number;
  /** Whether the tool execution is complete */
  completed?: boolean;
}

/**
 * A message in the execution agent chat
 */
export interface ExecutionAgentMessage {
  id: string;
  ideaId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** Message type for filtering/display */
  type?: 'text' | 'tool_use' | 'tool_result' | 'task_complete' | 'phase_complete' | 'blocked' | 'task_update';
  /** Tool name if type is tool_use or tool_result */
  toolName?: string;
  /** Full raw response including XML blocks (for diagnostics) */
  rawResponse?: string;
  /** Associated event data */
  eventData?: Record<string, unknown>;
  /** Tool calls made during this message */
  toolCalls?: StoredToolCall[];
}

/**
 * Metadata for an idea's execution agent chat
 */
export interface ExecutionAgentChatMetadata {
  ideaId: string;
  messageCount: number;
  lastUpdated: string;
  createdAt: string;
  /** Current execution state */
  executionState?: 'idle' | 'running' | 'paused' | 'blocked' | 'completed' | 'error';
  /** Current task being executed */
  currentTaskId?: string;
  /** Current phase being executed */
  currentPhaseId?: string;
  /** IDs of completed tasks */
  completedTaskIds?: string[];
  /** Execution started timestamp */
  startedAt?: string;
}

// Base directory for execution agent chat storage
const EXECUTE_AGENT_DIR = path.join(homedir(), 'Ideate', 'execute-agent');

/**
 * Service for persisting execution agent chat messages and state.
 * Uses JSONL format for append-only message storage.
 * Chat history is per-idea (not per-user).
 */
export class ExecutionAgentChatService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(EXECUTE_AGENT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create execute agent directory:', error);
    }
  }

  private getMessagesPath(ideaId: string): string {
    return path.join(EXECUTE_AGENT_DIR, `${ideaId}.messages.jsonl`);
  }

  private getMetadataPath(ideaId: string): string {
    return path.join(EXECUTE_AGENT_DIR, `${ideaId}.meta.json`);
  }

  /**
   * Get or create metadata for an idea's execution agent chat.
   */
  async getOrCreateMetadata(ideaId: string): Promise<ExecutionAgentChatMetadata> {
    try {
      const content = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      return JSON.parse(content);
    } catch {
      // Create new metadata
      const now = new Date().toISOString();
      const metadata: ExecutionAgentChatMetadata = {
        ideaId,
        messageCount: 0,
        lastUpdated: now,
        createdAt: now,
        executionState: 'idle',
        completedTaskIds: [],
      };
      await this.saveMetadata(metadata);
      return metadata;
    }
  }

  /**
   * Save metadata for an idea's execution agent chat.
   */
  async saveMetadata(metadata: ExecutionAgentChatMetadata): Promise<void> {
    await fs.writeFile(
      this.getMetadataPath(metadata.ideaId),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Add a message to the idea's execution agent chat.
   */
  async addMessage(
    ideaId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    options?: {
      type?: ExecutionAgentMessage['type'];
      toolName?: string;
      rawResponse?: string;
      eventData?: Record<string, unknown>;
      toolCalls?: StoredToolCall[];
    }
  ): Promise<ExecutionAgentMessage> {
    const message: ExecutionAgentMessage = {
      id: uuidv4(),
      ideaId,
      userId,
      role,
      content,
      timestamp: Date.now(),
      ...(options?.type && { type: options.type }),
      ...(options?.toolName && { toolName: options.toolName }),
      ...(options?.rawResponse && { rawResponse: options.rawResponse }),
      ...(options?.eventData && { eventData: options.eventData }),
      ...(options?.toolCalls && options.toolCalls.length > 0 && { toolCalls: options.toolCalls }),
    };

    // Append message to JSONL file
    const line = JSON.stringify(message) + '\n';
    await fs.appendFile(this.getMessagesPath(ideaId), line, 'utf-8');

    // Update metadata
    const metadata = await this.getOrCreateMetadata(ideaId);
    metadata.messageCount++;
    metadata.lastUpdated = new Date().toISOString();
    await this.saveMetadata(metadata);

    return message;
  }

  /**
   * Get messages for an idea's execution agent chat.
   * Returns messages in chronological order (oldest first).
   */
  async getMessages(ideaId: string, limit: number = 100): Promise<ExecutionAgentMessage[]> {
    try {
      const content = await fs.readFile(this.getMessagesPath(ideaId), 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      const messages: ExecutionAgentMessage[] = lines.map((line) => JSON.parse(line));

      // Return the last `limit` messages
      if (messages.length > limit) {
        return messages.slice(-limit);
      }

      return messages;
    } catch {
      return [];
    }
  }

  /**
   * Clear all messages for an idea's execution agent chat.
   * Optionally preserves execution state.
   */
  async clearMessages(ideaId: string, preserveState: boolean = false): Promise<void> {
    try {
      await fs.writeFile(this.getMessagesPath(ideaId), '', 'utf-8');

      const metadata = await this.getOrCreateMetadata(ideaId);
      metadata.messageCount = 0;
      metadata.lastUpdated = new Date().toISOString();

      if (!preserveState) {
        metadata.executionState = 'idle';
        metadata.currentTaskId = undefined;
        metadata.currentPhaseId = undefined;
        metadata.completedTaskIds = [];
        metadata.startedAt = undefined;
      }

      await this.saveMetadata(metadata);
    } catch (error) {
      console.error('Failed to clear execution agent messages:', error);
    }
  }

  /**
   * Check if an idea has existing execution chat history.
   */
  async hasHistory(ideaId: string): Promise<boolean> {
    try {
      const metadata = await this.getOrCreateMetadata(ideaId);
      return metadata.messageCount > 0;
    } catch {
      return false;
    }
  }

  /**
   * Update execution state (task progress, completion, etc.)
   */
  async updateExecutionState(
    ideaId: string,
    updates: Partial<Pick<ExecutionAgentChatMetadata,
      'executionState' | 'currentTaskId' | 'currentPhaseId' | 'completedTaskIds' | 'startedAt'
    >>
  ): Promise<ExecutionAgentChatMetadata> {
    const metadata = await this.getOrCreateMetadata(ideaId);

    if (updates.executionState !== undefined) {
      metadata.executionState = updates.executionState;
    }
    if (updates.currentTaskId !== undefined) {
      metadata.currentTaskId = updates.currentTaskId;
    }
    if (updates.currentPhaseId !== undefined) {
      metadata.currentPhaseId = updates.currentPhaseId;
    }
    if (updates.completedTaskIds !== undefined) {
      metadata.completedTaskIds = updates.completedTaskIds;
    }
    if (updates.startedAt !== undefined) {
      metadata.startedAt = updates.startedAt;
    }

    metadata.lastUpdated = new Date().toISOString();
    await this.saveMetadata(metadata);

    return metadata;
  }

  /**
   * Mark a task as completed
   */
  async markTaskCompleted(ideaId: string, taskId: string): Promise<void> {
    const metadata = await this.getOrCreateMetadata(ideaId);
    const completedTaskIds = metadata.completedTaskIds || [];

    if (!completedTaskIds.includes(taskId)) {
      completedTaskIds.push(taskId);
      await this.updateExecutionState(ideaId, { completedTaskIds });
    }
  }

  /**
   * Delete all chat data for an idea (when idea is deleted).
   */
  async deleteIdeaChat(ideaId: string): Promise<void> {
    try {
      await fs.unlink(this.getMessagesPath(ideaId));
    } catch {
      // File may not exist
    }
    try {
      await fs.unlink(this.getMetadataPath(ideaId));
    } catch {
      // File may not exist
    }
  }

  /**
   * Get the storage directory path (for diagnostics integration)
   */
  static getStorageDirectory(): string {
    return EXECUTE_AGENT_DIR;
  }
}
