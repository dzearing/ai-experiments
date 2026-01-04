import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * A message in the plan agent chat
 */
export interface PlanAgentMessage {
  id: string;
  ideaId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Full raw response including XML blocks (for diagnostics) */
  rawResponse?: string;
}

/**
 * Metadata for an idea's plan agent chat
 */
export interface PlanAgentChatMetadata {
  ideaId: string;
  messageCount: number;
  lastUpdated: string;
  createdAt: string;
}

// Base directory for plan agent chat storage
const PLAN_AGENT_DIR = path.join(homedir(), 'Ideate', 'plan-agent');

/**
 * Service for persisting plan agent chat messages.
 * Uses JSONL format for append-only message storage.
 * Chat history is per-idea (not per-user).
 */
export class PlanAgentChatService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(PLAN_AGENT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create plan agent directory:', error);
    }
  }

  private getMessagesPath(ideaId: string): string {
    return path.join(PLAN_AGENT_DIR, `${ideaId}.messages.jsonl`);
  }

  private getMetadataPath(ideaId: string): string {
    return path.join(PLAN_AGENT_DIR, `${ideaId}.meta.json`);
  }

  /**
   * Get or create metadata for an idea's plan agent chat.
   */
  async getOrCreateMetadata(ideaId: string): Promise<PlanAgentChatMetadata> {
    try {
      const content = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      return JSON.parse(content);
    } catch {
      // Create new metadata
      const now = new Date().toISOString();
      const metadata: PlanAgentChatMetadata = {
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
   * Save metadata for an idea's plan agent chat.
   */
  private async saveMetadata(metadata: PlanAgentChatMetadata): Promise<void> {
    await fs.writeFile(
      this.getMetadataPath(metadata.ideaId),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Add a message to the idea's plan agent chat.
   */
  async addMessage(
    ideaId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    rawResponse?: string
  ): Promise<PlanAgentMessage> {
    const message: PlanAgentMessage = {
      id: uuidv4(),
      ideaId,
      userId,
      role,
      content,
      timestamp: Date.now(),
      ...(rawResponse && { rawResponse }),
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
   * Get messages for an idea's plan agent chat.
   * Returns messages in chronological order (oldest first).
   */
  async getMessages(ideaId: string, limit: number = 50): Promise<PlanAgentMessage[]> {
    try {
      const content = await fs.readFile(this.getMessagesPath(ideaId), 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      const messages: PlanAgentMessage[] = lines.map((line) => JSON.parse(line));

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
   * Clear all messages for an idea's plan agent chat.
   */
  async clearMessages(ideaId: string): Promise<void> {
    try {
      await fs.writeFile(this.getMessagesPath(ideaId), '', 'utf-8');

      const metadata = await this.getOrCreateMetadata(ideaId);
      metadata.messageCount = 0;
      metadata.lastUpdated = new Date().toISOString();
      await this.saveMetadata(metadata);
    } catch (error) {
      console.error('Failed to clear plan agent messages:', error);
    }
  }

  /**
   * Check if an idea has existing plan chat history.
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
}
