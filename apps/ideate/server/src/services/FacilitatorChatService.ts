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
  getTextFromParts,
  getToolCallsFromParts,
} from './BaseChatTypes.js';

// Re-export shared types for consumers
export type { ContentBlock, ToolCall, TextBlock, ToolCallsBlock };

/**
 * Raw SDK event for diagnostics
 */
export interface RawSDKEvent {
  timestamp: number;
  type: string;
  subtype?: string;
  data: unknown;
}

/**
 * Diagnostics for a message - persisted with the message
 */
export interface MessageDiagnostics {
  iterations?: number;
  durationMs?: number;
  responseLength?: number;
  error?: string;
  // Enhanced diagnostics
  systemPrompt?: string;
  model?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  // Raw SDK events for full diagnostics
  rawEvents?: RawSDKEvent[];
  sessionInfo?: {
    sessionId: string;
    tools: string[];
    mcpServers: { name: string; status: string }[];
  };
  totalCostUsd?: number;
}

/**
 * A message in the facilitator chat
 */
export interface FacilitatorMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  /** Content blocks in order - maintains text/tool interleaving */
  parts?: ContentBlock[];
  /** @deprecated Use parts instead - kept for backward compatibility */
  content?: string;
  timestamp: number;
  /** @deprecated Use parts instead - kept for backward compatibility */
  toolCalls?: ToolCall[];
  /** Diagnostic information (for assistant messages) */
  diagnostics?: MessageDiagnostics;
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
   * @param messageId - Optional custom ID (used for assistant messages to match diagnostics)
   * @param diagnostics - Optional diagnostic information (for assistant messages)
   * @param parts - Optional content blocks in order (new format, replaces content/toolCalls)
   */
  async addMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    toolCalls?: FacilitatorMessage['toolCalls'],
    messageId?: string,
    diagnostics?: MessageDiagnostics,
    parts?: ContentBlock[]
  ): Promise<FacilitatorMessage> {
    const message: FacilitatorMessage = {
      id: messageId || uuidv4(),
      userId,
      role,
      timestamp: Date.now(),
      diagnostics,
    };

    // Use parts if provided (new format), otherwise fall back to content/toolCalls (legacy)
    if (parts && parts.length > 0) {
      message.parts = parts;
      // Use the passed content parameter if provided (it's the clean version without XML blocks),
      // otherwise extract from parts as fallback for backward compatibility
      message.content = content || getTextFromParts(parts);
      // Extract toolCalls from parts for backward compatibility
      const extractedToolCalls = getToolCallsFromParts(parts);
      if (extractedToolCalls.length > 0) {
        message.toolCalls = extractedToolCalls;
      }
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
