import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * A message in an import agent session
 */
export interface ImportAgentMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  diagnostics?: {
    model?: string;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
    durationMs?: number;
  };
}

/**
 * Metadata for an import agent session
 */
export interface ImportAgentSessionMetadata {
  sessionId: string;
  userId: string;
  sourceType: 'git' | 'local';
  sourcePath: string;
  targetThingId: string;
  messageCount: number;
  createdAt: string;
  lastUpdated: string;
  status: 'running' | 'completed' | 'error';
  error?: string;
  thingsCreated?: number;
}

// Base directory for import agent storage
const IMPORT_AGENT_DIR = path.join(homedir(), 'Ideate', 'import-agent');

/**
 * Service for persisting import agent sessions.
 * Uses JSONL format for append-only message storage.
 */
export class ImportAgentChatService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(IMPORT_AGENT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create import agent directory:', error);
    }
  }

  private getMessagesPath(sessionId: string): string {
    return path.join(IMPORT_AGENT_DIR, `${sessionId}.messages.jsonl`);
  }

  private getMetadataPath(sessionId: string): string {
    return path.join(IMPORT_AGENT_DIR, `${sessionId}.meta.json`);
  }

  /**
   * Create a new import session
   */
  async createSession(
    userId: string,
    sourceType: 'git' | 'local',
    sourcePath: string,
    targetThingId: string
  ): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const metadata: ImportAgentSessionMetadata = {
      sessionId,
      userId,
      sourceType,
      sourcePath,
      targetThingId,
      messageCount: 0,
      createdAt: now,
      lastUpdated: now,
      status: 'running',
    };

    await this.saveMetadata(metadata);
    return sessionId;
  }

  /**
   * Save metadata for a session
   */
  private async saveMetadata(metadata: ImportAgentSessionMetadata): Promise<void> {
    await fs.writeFile(
      this.getMetadataPath(metadata.sessionId),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Get metadata for a session
   */
  async getMetadata(sessionId: string): Promise<ImportAgentSessionMetadata | null> {
    try {
      const content = await fs.readFile(this.getMetadataPath(sessionId), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Add a message to the session
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    diagnostics?: ImportAgentMessage['diagnostics']
  ): Promise<ImportAgentMessage> {
    const message: ImportAgentMessage = {
      id: uuidv4(),
      sessionId,
      role,
      content,
      timestamp: Date.now(),
      diagnostics,
    };

    // Append message to JSONL file
    const line = JSON.stringify(message) + '\n';
    await fs.appendFile(this.getMessagesPath(sessionId), line, 'utf-8');

    // Update metadata
    const metadata = await this.getMetadata(sessionId);
    if (metadata) {
      metadata.messageCount++;
      metadata.lastUpdated = new Date().toISOString();
      await this.saveMetadata(metadata);
    }

    return message;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'completed' | 'error',
    details?: { thingsCreated?: number; error?: string }
  ): Promise<void> {
    const metadata = await this.getMetadata(sessionId);
    if (metadata) {
      metadata.status = status;
      metadata.lastUpdated = new Date().toISOString();
      if (details?.thingsCreated !== undefined) {
        metadata.thingsCreated = details.thingsCreated;
      }
      if (details?.error) {
        metadata.error = details.error;
      }
      await this.saveMetadata(metadata);
    }
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, limit: number = 100): Promise<ImportAgentMessage[]> {
    try {
      const content = await fs.readFile(this.getMessagesPath(sessionId), 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      const messages: ImportAgentMessage[] = lines.map((line) => JSON.parse(line));

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
   * List all sessions
   */
  async listSessions(): Promise<ImportAgentSessionMetadata[]> {
    const sessions: ImportAgentSessionMetadata[] = [];

    try {
      const files = await fs.readdir(IMPORT_AGENT_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        try {
          const metaPath = path.join(IMPORT_AGENT_DIR, file);
          const content = await fs.readFile(metaPath, 'utf-8');
          sessions.push(JSON.parse(content));
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Directory might not exist yet
    }

    return sessions;
  }

  /**
   * Clear all import agent sessions (deletes all .meta.json and .messages.jsonl files)
   */
  async clearAllSessions(): Promise<void> {
    try {
      const files = await fs.readdir(IMPORT_AGENT_DIR);
      for (const file of files) {
        if (file.endsWith('.meta.json') || file.endsWith('.messages.jsonl')) {
          await fs.unlink(path.join(IMPORT_AGENT_DIR, file));
        }
      }
      console.log('[ImportAgentChatService] Cleared all sessions');
    } catch {
      // Directory might not exist yet
    }
  }
}

// Singleton instance
let importAgentChatService: ImportAgentChatService | null = null;

export function getImportAgentChatService(): ImportAgentChatService {
  if (!importAgentChatService) {
    importAgentChatService = new ImportAgentChatService();
  }
  return importAgentChatService;
}
