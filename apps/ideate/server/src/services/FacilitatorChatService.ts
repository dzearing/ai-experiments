import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * A message in the facilitator chat
 */
export interface FacilitatorMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Tool calls made during this response */
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
    output?: string;
  }>;
}

/**
 * Metadata for a user's facilitator chat
 */
export interface FacilitatorChatMetadata {
  userId: string;
  messageCount: number;
  lastUpdated: string;
  createdAt: string;
}

// Base directory for facilitator chat storage
const FACILITATOR_DIR = path.join(homedir(), 'Ideate', 'facilitator');

/**
 * Service for persisting facilitator chat messages.
 * Uses JSONL format for append-only message storage.
 */
export class FacilitatorChatService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(FACILITATOR_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create facilitator directory:', error);
    }
  }

  private getMessagesPath(userId: string): string {
    return path.join(FACILITATOR_DIR, `${userId}.messages.jsonl`);
  }

  private getMetadataPath(userId: string): string {
    return path.join(FACILITATOR_DIR, `${userId}.meta.json`);
  }

  /**
   * Get or create metadata for a user's facilitator chat.
   */
  async getOrCreateMetadata(userId: string): Promise<FacilitatorChatMetadata> {
    try {
      const content = await fs.readFile(this.getMetadataPath(userId), 'utf-8');
      return JSON.parse(content);
    } catch {
      // Create new metadata
      const now = new Date().toISOString();
      const metadata: FacilitatorChatMetadata = {
        userId,
        messageCount: 0,
        lastUpdated: now,
        createdAt: now,
      };
      await this.saveMetadata(metadata);
      return metadata;
    }
  }

  /**
   * Save metadata for a user's facilitator chat.
   */
  private async saveMetadata(metadata: FacilitatorChatMetadata): Promise<void> {
    await fs.writeFile(
      this.getMetadataPath(metadata.userId),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Add a message to the user's facilitator chat.
   */
  async addMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    toolCalls?: FacilitatorMessage['toolCalls']
  ): Promise<FacilitatorMessage> {
    const message: FacilitatorMessage = {
      id: uuidv4(),
      userId,
      role,
      content,
      timestamp: Date.now(),
      toolCalls,
    };

    // Append message to JSONL file
    const line = JSON.stringify(message) + '\n';
    await fs.appendFile(this.getMessagesPath(userId), line, 'utf-8');

    // Update metadata
    const metadata = await this.getOrCreateMetadata(userId);
    metadata.messageCount++;
    metadata.lastUpdated = new Date().toISOString();
    await this.saveMetadata(metadata);

    return message;
  }

  /**
   * Update an existing message (e.g., when streaming completes).
   */
  async updateMessage(
    userId: string,
    messageId: string,
    updates: Partial<FacilitatorMessage>
  ): Promise<FacilitatorMessage | null> {
    try {
      const messages = await this.getMessages(userId);
      const index = messages.findIndex((m) => m.id === messageId);

      if (index === -1) {
        return null;
      }

      // Update the message
      const updatedMessage = { ...messages[index], ...updates };
      messages[index] = updatedMessage;

      // Rewrite all messages
      const content = messages.map((m) => JSON.stringify(m)).join('\n') + '\n';
      await fs.writeFile(this.getMessagesPath(userId), content, 'utf-8');

      return updatedMessage;
    } catch (error) {
      console.error('Failed to update message:', error);
      return null;
    }
  }

  /**
   * Get messages for a user's facilitator chat.
   * Returns messages in chronological order (oldest first).
   */
  async getMessages(userId: string, limit: number = 100): Promise<FacilitatorMessage[]> {
    try {
      const content = await fs.readFile(this.getMessagesPath(userId), 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      const messages: FacilitatorMessage[] = lines.map((line) => JSON.parse(line));

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
   * Clear all messages for a user's facilitator chat.
   */
  async clearMessages(userId: string): Promise<void> {
    try {
      await fs.writeFile(this.getMessagesPath(userId), '', 'utf-8');

      const metadata = await this.getOrCreateMetadata(userId);
      metadata.messageCount = 0;
      metadata.lastUpdated = new Date().toISOString();
      await this.saveMetadata(metadata);
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }

  /**
   * Check if a user has existing chat history.
   */
  async hasHistory(userId: string): Promise<boolean> {
    try {
      const metadata = await this.getOrCreateMetadata(userId);
      return metadata.messageCount > 0;
    } catch {
      return false;
    }
  }
}
