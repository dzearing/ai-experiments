import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import {
  type ContentBlock,
  type ToolCall,
  type TextBlock,
  type ToolCallsBlock,
  migrateToPartsFormat,
} from './BaseChatTypes.js';

// Re-export shared types for consumers
export type { ContentBlock, ToolCall, TextBlock, ToolCallsBlock };

/**
 * Open question from the agent for user resolution
 */
export interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  selectionType: 'single' | 'multiple';
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  allowCustom?: boolean;
}

/**
 * A message in the idea agent chat
 */
export interface IdeaAgentMessage {
  id: string;
  ideaId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  /** Content blocks in order - maintains text/tool interleaving */
  parts?: ContentBlock[];
  /** @deprecated Use parts instead - kept for backward compatibility */
  content?: string;
  timestamp: number;
  /** @deprecated Use parts instead - kept for backward compatibility */
  toolCalls?: ToolCall[];
  /** Open questions associated with this message (for rehydration on dialog reopen) */
  openQuestions?: OpenQuestion[];
}

/**
 * Metadata for an idea's agent chat
 */
export interface IdeaAgentChatMetadata {
  ideaId: string;
  messageCount: number;
  lastUpdated: string;
  createdAt: string;
}

// Base directory for idea agent chat storage
const IDEA_AGENT_DIR = path.join(homedir(), 'Ideate', 'idea-agent');

/**
 * Service for persisting idea agent chat messages.
 * Uses JSONL format for append-only message storage.
 * Chat history is per-idea (not per-user).
 */
export class IdeaAgentChatService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(IDEA_AGENT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create idea agent directory:', error);
    }
  }

  private getMessagesPath(ideaId: string): string {
    return path.join(IDEA_AGENT_DIR, `${ideaId}.messages.jsonl`);
  }

  private getMetadataPath(ideaId: string): string {
    return path.join(IDEA_AGENT_DIR, `${ideaId}.meta.json`);
  }

  /**
   * Get or create metadata for an idea's agent chat.
   */
  async getOrCreateMetadata(ideaId: string): Promise<IdeaAgentChatMetadata> {
    try {
      const content = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      return JSON.parse(content);
    } catch {
      // Create new metadata
      const now = new Date().toISOString();
      const metadata: IdeaAgentChatMetadata = {
        ideaId,
        messageCount: 0,
        lastUpdated: now,
        createdAt: now,
      };
      await this.saveMetadata(metadata);
      return metadata;
    }
  }

  /**
   * Save metadata for an idea's agent chat.
   */
  private async saveMetadata(metadata: IdeaAgentChatMetadata): Promise<void> {
    await fs.writeFile(
      this.getMetadataPath(metadata.ideaId),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Add a message to the idea's agent chat.
   * @param openQuestions - Optional open questions for rehydration
   * @param toolCalls - Optional tool calls (legacy format, use parts instead)
   * @param parts - Optional content blocks in order (new format, replaces content/toolCalls)
   */
  async addMessage(
    ideaId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    openQuestions?: OpenQuestion[],
    toolCalls?: ToolCall[],
    parts?: ContentBlock[]
  ): Promise<IdeaAgentMessage> {
    const message: IdeaAgentMessage = {
      id: uuidv4(),
      ideaId,
      userId,
      role,
      timestamp: Date.now(),
      ...(openQuestions && openQuestions.length > 0 && { openQuestions }),
    };

    // Use parts if provided (new format), otherwise fall back to content/toolCalls (legacy)
    if (parts && parts.length > 0) {
      message.parts = parts;
    } else {
      // Legacy format - store both content and parts for backward compatibility
      message.content = content;
      message.toolCalls = toolCalls;
      // Also create parts array from legacy format using shared helper
      const legacyParts = migrateToPartsFormat(content, toolCalls);
      if (legacyParts.length > 0) {
        message.parts = legacyParts;
      }
    }

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
   * Get messages for an idea's agent chat.
   * Returns messages in chronological order (oldest first).
   */
  async getMessages(ideaId: string, limit: number = 50): Promise<IdeaAgentMessage[]> {
    try {
      const content = await fs.readFile(this.getMessagesPath(ideaId), 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      const messages: IdeaAgentMessage[] = lines.map((line) => JSON.parse(line));

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
   * Clear all messages for an idea's agent chat.
   */
  async clearMessages(ideaId: string): Promise<void> {
    try {
      await fs.writeFile(this.getMessagesPath(ideaId), '', 'utf-8');

      const metadata = await this.getOrCreateMetadata(ideaId);
      metadata.messageCount = 0;
      metadata.lastUpdated = new Date().toISOString();
      await this.saveMetadata(metadata);
    } catch (error) {
      console.error('Failed to clear idea agent messages:', error);
    }
  }

  /**
   * Check if an idea has existing chat history.
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
   * Migrate chat history from one ID to another.
   * Used when linking a temp session (documentRoomName) to a real idea ID.
   * Renames the messages and metadata files.
   */
  async migrateChatHistory(fromId: string, toId: string): Promise<boolean> {
    const fromMessagesPath = this.getMessagesPath(fromId);
    const fromMetaPath = this.getMetadataPath(fromId);
    const toMessagesPath = this.getMessagesPath(toId);
    const toMetaPath = this.getMetadataPath(toId);

    let migrated = false;

    // Migrate messages file
    try {
      await fs.access(fromMessagesPath);
      await fs.rename(fromMessagesPath, toMessagesPath);
      console.log(`[IdeaAgentChatService] Migrated messages from ${fromId} to ${toId}`);
      migrated = true;
    } catch {
      // Source file doesn't exist, nothing to migrate
    }

    // Migrate metadata file
    try {
      await fs.access(fromMetaPath);
      const metaContent = await fs.readFile(fromMetaPath, 'utf-8');
      const metadata: IdeaAgentChatMetadata = JSON.parse(metaContent);

      // Update the ideaId in metadata
      metadata.ideaId = toId;
      await fs.writeFile(toMetaPath, JSON.stringify(metadata, null, 2), 'utf-8');
      await fs.unlink(fromMetaPath);
      console.log(`[IdeaAgentChatService] Migrated metadata from ${fromId} to ${toId}`);
      migrated = true;
    } catch {
      // Source file doesn't exist, nothing to migrate
    }

    return migrated;
  }
}
