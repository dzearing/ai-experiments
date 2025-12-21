import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  content: string;
  createdAt: string;
}

export interface ChatRoomMetadata {
  id: string;
  name: string;
  workspaceId: string;
  ownerId: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Base directory for chat room storage
const CHATROOMS_DIR = path.join(homedir(), 'Ideate', 'chatrooms');

export class ChatRoomService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(CHATROOMS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create chatrooms directory:', error);
    }
  }

  private getMetadataPath(id: string): string {
    return path.join(CHATROOMS_DIR, `${id}.meta.json`);
  }

  private getMessagesPath(id: string): string {
    return path.join(CHATROOMS_DIR, `${id}.messages.jsonl`);
  }

  /**
   * List all chat rooms for a user in a workspace.
   * If isWorkspaceMember is true, include all chat rooms in the workspace.
   */
  async listChatRooms(userId: string, workspaceId: string, isWorkspaceMember: boolean = false): Promise<ChatRoomMetadata[]> {
    try {
      const files = await fs.readdir(CHATROOMS_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      const chatRooms: ChatRoomMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(CHATROOMS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: ChatRoomMetadata = JSON.parse(content);

        // Filter by workspaceId
        if (metadata.workspaceId !== workspaceId) continue;

        // Include if user is owner, participant, or workspace member
        const hasDirectAccess = metadata.ownerId === userId ||
          metadata.participantIds.includes(userId);
        const hasWorkspaceAccess = isWorkspaceMember;

        if (!hasDirectAccess && !hasWorkspaceAccess) continue;

        chatRooms.push(metadata);
      }

      // Sort by updated date, newest first
      chatRooms.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return chatRooms;
    } catch (error) {
      console.error('List chat rooms error:', error);
      return [];
    }
  }

  /**
   * Create a new chat room.
   */
  async createChatRoom(userId: string, name: string, workspaceId: string): Promise<ChatRoomMetadata> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: ChatRoomMetadata = {
      id,
      name,
      workspaceId,
      ownerId: userId,
      participantIds: [],
      createdAt: now,
      updatedAt: now,
    };

    // Save metadata
    await fs.writeFile(
      this.getMetadataPath(id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Create empty messages file
    await fs.writeFile(this.getMessagesPath(id), '', 'utf-8');

    return metadata;
  }

  /**
   * Get a chat room by ID.
   * If isWorkspaceMember is true, the user has access to all chat rooms in the workspace.
   */
  async getChatRoom(id: string, userId: string, isWorkspaceMember: boolean = false): Promise<ChatRoomMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ChatRoomMetadata = JSON.parse(metaContent);

      // Check access: owner, participant, or workspace member
      const hasDirectAccess = metadata.ownerId === userId ||
        metadata.participantIds.includes(userId);
      const hasWorkspaceAccess = isWorkspaceMember;

      if (!hasDirectAccess && !hasWorkspaceAccess) {
        return null;
      }

      return metadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get a chat room by ID (no auth check - for internal use).
   */
  async getChatRoomInternal(id: string): Promise<ChatRoomMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      return JSON.parse(metaContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a chat room.
   */
  async updateChatRoom(
    id: string,
    userId: string,
    updates: Partial<ChatRoomMetadata>
  ): Promise<ChatRoomMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ChatRoomMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      // Update metadata
      const updatedMetadata: ChatRoomMetadata = {
        ...metadata,
        name: updates.name ?? metadata.name,
        participantIds: updates.participantIds ?? metadata.participantIds,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return updatedMetadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a chat room.
   */
  async deleteChatRoom(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ChatRoomMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      await fs.unlink(this.getMetadataPath(id));

      // Delete messages file if it exists
      try {
        await fs.unlink(this.getMessagesPath(id));
      } catch {
        // Ignore if messages file doesn't exist
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add a message to a chat room.
   */
  async addMessage(
    chatRoomId: string,
    senderId: string,
    senderName: string,
    senderColor: string,
    content: string
  ): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: uuidv4(),
      chatRoomId,
      senderId,
      senderName,
      senderColor,
      content,
      createdAt: new Date().toISOString(),
    };

    // Append message to JSONL file
    const line = JSON.stringify(message) + '\n';
    await fs.appendFile(this.getMessagesPath(chatRoomId), line, 'utf-8');

    // Update chat room timestamp
    try {
      const metaPath = this.getMetadataPath(chatRoomId);
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const metadata: ChatRoomMetadata = JSON.parse(metaContent);
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch {
      // Metadata update is optional
    }

    return message;
  }

  /**
   * Get messages from a chat room.
   * Returns messages in chronological order (oldest first).
   * Supports pagination with limit and before (message ID).
   */
  async getMessages(
    chatRoomId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      const content = await fs.readFile(this.getMessagesPath(chatRoomId), 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);

      let messages: ChatMessage[] = lines.map(line => JSON.parse(line));

      // If "before" is specified, find that message and get messages before it
      if (before) {
        const beforeIndex = messages.findIndex(m => m.id === before);
        if (beforeIndex > 0) {
          messages = messages.slice(0, beforeIndex);
        }
      }

      // Return the last `limit` messages (most recent)
      if (messages.length > limit) {
        messages = messages.slice(-limit);
      }

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Add a participant to a chat room.
   */
  async addParticipant(chatRoomId: string, userId: string): Promise<boolean> {
    try {
      const metaPath = this.getMetadataPath(chatRoomId);
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const metadata: ChatRoomMetadata = JSON.parse(metaContent);

      if (!metadata.participantIds.includes(userId) && metadata.ownerId !== userId) {
        metadata.participantIds.push(userId);
        metadata.updatedAt = new Date().toISOString();
        await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove a participant from a chat room.
   */
  async removeParticipant(chatRoomId: string, userId: string, requesterId: string): Promise<boolean> {
    try {
      const metaPath = this.getMetadataPath(chatRoomId);
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const metadata: ChatRoomMetadata = JSON.parse(metaContent);

      // Only owner can remove others, or users can remove themselves
      if (requesterId !== metadata.ownerId && requesterId !== userId) {
        return false;
      }

      metadata.participantIds = metadata.participantIds.filter(id => id !== userId);
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

      return true;
    } catch (error) {
      return false;
    }
  }
}
