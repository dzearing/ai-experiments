import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

// =========================================================================
// Types
// =========================================================================

export type ThingType = 'category' | 'project' | 'feature' | 'item';

export interface ThingAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;        // For external links
  filePath?: string;   // For uploaded files (relative path)
  createdAt: string;
}

export interface ThingIdeaCounts {
  new: number;
  exploring: number;
  ready: number;
  archived: number;
}

export interface ThingMetadata {
  id: string;
  name: string;
  description?: string;
  type: ThingType;
  tags: string[];
  /** Multiple parents supported - graph model */
  parentIds: string[];
  ownerId: string;
  /** undefined = global (private to user), string = workspace-scoped */
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  attachments: ThingAttachment[];
  /** Cached idea counts (updated when ideas change) */
  ideaCounts?: ThingIdeaCounts;
}

export interface Thing extends ThingMetadata {
  content?: string;    // Extended markdown content from .content.md
}

export interface CreateThingInput {
  name: string;
  description?: string;
  type?: ThingType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
}

export interface UpdateThingInput {
  name?: string;
  description?: string;
  type?: ThingType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
}

export interface ThingFilter {
  searchQuery?: string;
  tags?: string[];
  type?: ThingType;
  parentId?: string;
}

// =========================================================================
// Constants
// =========================================================================

const THINGS_DIR = path.join(homedir(), 'Ideate', 'things');
const ATTACHMENTS_DIR = path.join(THINGS_DIR, 'attachments');

// =========================================================================
// Service
// =========================================================================

export class ThingService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(THINGS_DIR, { recursive: true });
      await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
    } catch (error) {
      console.error('[ThingService] Failed to create things directories:', error);
    }
  }

  private getMetadataPath(id: string): string {
    return path.join(THINGS_DIR, `${id}.meta.json`);
  }

  private getContentPath(id: string): string {
    return path.join(THINGS_DIR, `${id}.content.md`);
  }

  private getAttachmentsDir(id: string): string {
    return path.join(ATTACHMENTS_DIR, id);
  }

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * List things for a user.
   * @param userId - The user requesting things
   * @param workspaceId - Optional filter by workspace (undefined = include global things)
   * @param isWorkspaceMember - Whether user is a workspace member (for access control)
   */
  async listThings(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<ThingMetadata[]> {
    try {
      const files = await fs.readdir(THINGS_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));

      const things: ThingMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(THINGS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: ThingMetadata = JSON.parse(content);

        // Access control
        const isOwner = metadata.ownerId === userId;
        const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId === workspaceId;

        // For global things (no workspaceId), only owner can see
        if (!metadata.workspaceId && !isOwner) continue;

        // For workspace things, owner or workspace member can see
        if (metadata.workspaceId && !isOwner && !hasWorkspaceAccess) continue;

        // Filter by workspaceId if provided
        if (workspaceId !== undefined && metadata.workspaceId !== workspaceId) {
          // Include global things (no workspaceId) + workspace things
          if (metadata.workspaceId && metadata.workspaceId !== workspaceId) continue;
        }

        things.push(metadata);
      }

      // Sort by lastAccessedAt (most recent first), then by name
      things.sort((a, b) => {
        const dateA = new Date(a.lastAccessedAt).getTime();
        const dateB = new Date(b.lastAccessedAt).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return a.name.localeCompare(b.name);
      });

      return things;
    } catch (error) {
      console.error('[ThingService] List things error:', error);
      return [];
    }
  }

  /**
   * Get full graph of things for tree building.
   * Returns all accessible things without filtering.
   */
  async getThingsGraph(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<ThingMetadata[]> {
    return this.listThings(userId, workspaceId, isWorkspaceMember);
  }

  /**
   * Get root things (things with no parents).
   */
  async getRootThings(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<ThingMetadata[]> {
    const allThings = await this.listThings(userId, workspaceId, isWorkspaceMember);
    return allThings.filter(thing => thing.parentIds.length === 0);
  }

  /**
   * Get children of a thing.
   */
  async getChildren(
    parentId: string,
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<ThingMetadata[]> {
    const allThings = await this.listThings(userId, workspaceId, isWorkspaceMember);
    return allThings.filter(thing => thing.parentIds.includes(parentId));
  }

  /**
   * Get recently accessed things.
   */
  async getRecentThings(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false,
    limit: number = 10
  ): Promise<ThingMetadata[]> {
    const allThings = await this.listThings(userId, workspaceId, isWorkspaceMember);
    // Already sorted by lastAccessedAt
    return allThings.slice(0, limit);
  }

  /**
   * Search things by name or tags.
   */
  async searchThings(
    userId: string,
    query: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<ThingMetadata[]> {
    const allThings = await this.listThings(userId, workspaceId, isWorkspaceMember);
    const lowerQuery = query.toLowerCase();

    return allThings.filter(thing => {
      // Search in name
      if (thing.name.toLowerCase().includes(lowerQuery)) return true;

      // Search in description
      if (thing.description?.toLowerCase().includes(lowerQuery)) return true;

      // Search in tags (including #tag format)
      const tagQuery = lowerQuery.startsWith('#') ? lowerQuery.slice(1) : lowerQuery;
      if (thing.tags.some(tag => tag.toLowerCase().includes(tagQuery))) return true;

      return false;
    });
  }

  /**
   * Create a new thing.
   */
  async createThing(userId: string, input: CreateThingInput): Promise<Thing> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: ThingMetadata = {
      id,
      name: input.name,
      description: input.description,
      type: input.type || 'item',
      tags: input.tags || [],
      parentIds: input.parentIds || [],
      ownerId: userId,
      workspaceId: input.workspaceId,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      attachments: [],
    };

    // Save metadata
    await fs.writeFile(
      this.getMetadataPath(id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Save content if provided
    if (input.content) {
      await fs.writeFile(this.getContentPath(id), input.content, 'utf-8');
    }

    return { ...metadata, content: input.content };
  }

  /**
   * Get a thing by ID.
   */
  async getThing(id: string, userId: string, isWorkspaceMember: boolean = false): Promise<Thing | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Access control
      const isOwner = metadata.ownerId === userId;
      const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId;

      if (!isOwner && !hasWorkspaceAccess) {
        return null;
      }

      // Try to read content
      let content: string | undefined;
      try {
        content = await fs.readFile(this.getContentPath(id), 'utf-8');
      } catch {
        // No content file
      }

      return { ...metadata, content };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get thing metadata only (no content).
   * For internal use and bulk operations.
   */
  async getThingInternal(id: string): Promise<ThingMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      return JSON.parse(metaContent);
    } catch {
      return null;
    }
  }

  /**
   * Get things by IDs (for resolving references).
   */
  async getThingsByIds(ids: string[], userId: string, isWorkspaceMember: boolean = false): Promise<Thing[]> {
    const things: Thing[] = [];
    for (const id of ids) {
      const thing = await this.getThing(id, userId, isWorkspaceMember);
      if (thing) {
        things.push(thing);
      }
    }
    return things;
  }

  /**
   * Update a thing.
   */
  async updateThing(
    id: string,
    userId: string,
    updates: UpdateThingInput
  ): Promise<Thing | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: ThingMetadata = {
        ...metadata,
        name: updates.name ?? metadata.name,
        description: updates.description ?? metadata.description,
        type: updates.type ?? metadata.type,
        tags: updates.tags ?? metadata.tags,
        parentIds: updates.parentIds ?? metadata.parentIds,
        workspaceId: 'workspaceId' in updates ? updates.workspaceId : metadata.workspaceId,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Update content if provided
      if (updates.content !== undefined) {
        if (updates.content) {
          await fs.writeFile(this.getContentPath(id), updates.content, 'utf-8');
        } else {
          // Empty string means delete content
          try {
            await fs.unlink(this.getContentPath(id));
          } catch {
            // File didn't exist
          }
        }
      }

      // Read content
      let content: string | undefined;
      try {
        content = await fs.readFile(this.getContentPath(id), 'utf-8');
      } catch {
        // No content file
      }

      return { ...updatedMetadata, content };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a thing.
   */
  async deleteThing(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      // Delete metadata
      await fs.unlink(this.getMetadataPath(id));

      // Delete content if exists
      try {
        await fs.unlink(this.getContentPath(id));
      } catch {
        // File didn't exist
      }

      // Delete attachments folder if exists
      try {
        await fs.rm(this.getAttachmentsDir(id), { recursive: true });
      } catch {
        // Folder didn't exist
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================================
  // Access Tracking
  // =========================================================================

  /**
   * Update lastAccessedAt timestamp.
   */
  async updateLastAccessed(id: string, _userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only update if user has access (owner or workspace member check should be done at route level)
      const now = new Date().toISOString();

      const updatedMetadata: ThingMetadata = {
        ...metadata,
        lastAccessedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Idea Counts
  // =========================================================================

  /**
   * Update cached idea counts for a thing.
   * Called when ideas are created/updated/deleted.
   */
  async updateIdeaCounts(id: string, counts: ThingIdeaCounts): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      const updatedMetadata: ThingMetadata = {
        ...metadata,
        ideaCounts: counts,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Attachments
  // =========================================================================

  /**
   * Add an attachment to a thing.
   */
  async addAttachment(
    thingId: string,
    userId: string,
    attachment: Omit<ThingAttachment, 'id' | 'createdAt'>,
    fileBuffer?: Buffer
  ): Promise<ThingAttachment | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can add attachments
      if (metadata.ownerId !== userId) {
        return null;
      }

      const attachmentId = uuidv4();
      const now = new Date().toISOString();

      const newAttachment: ThingAttachment = {
        id: attachmentId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        url: attachment.url,
        createdAt: now,
      };

      // If file buffer provided, save the file
      if (fileBuffer) {
        const attachmentsDir = this.getAttachmentsDir(thingId);
        await fs.mkdir(attachmentsDir, { recursive: true });

        const filePath = path.join(attachmentsDir, `${attachmentId}-${attachment.filename}`);
        await fs.writeFile(filePath, fileBuffer);
        newAttachment.filePath = `${attachmentId}-${attachment.filename}`;
      }

      metadata.attachments.push(newAttachment);
      metadata.updatedAt = now;

      await fs.writeFile(
        this.getMetadataPath(thingId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return newAttachment;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove an attachment from a thing.
   */
  async removeAttachment(
    thingId: string,
    userId: string,
    attachmentId: string
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can remove attachments
      if (metadata.ownerId !== userId) {
        return false;
      }

      const attachmentIndex = metadata.attachments.findIndex(a => a.id === attachmentId);
      if (attachmentIndex === -1) {
        return false;
      }

      const attachment = metadata.attachments[attachmentIndex];

      // Delete file if it exists
      if (attachment.filePath) {
        try {
          const filePath = path.join(this.getAttachmentsDir(thingId), attachment.filePath);
          await fs.unlink(filePath);
        } catch {
          // File might not exist
        }
      }

      // Remove from metadata
      metadata.attachments.splice(attachmentIndex, 1);
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(thingId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get attachment file path for download.
   */
  async getAttachmentPath(thingId: string, attachmentId: string): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      const attachment = metadata.attachments.find(a => a.id === attachmentId);
      if (!attachment || !attachment.filePath) {
        return null;
      }

      return path.join(this.getAttachmentsDir(thingId), attachment.filePath);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // Bulk Operations (for agent use)
  // =========================================================================

  /**
   * Create multiple things at once.
   */
  async createThingsBulk(userId: string, inputs: CreateThingInput[]): Promise<Thing[]> {
    const results: Thing[] = [];
    for (const input of inputs) {
      const thing = await this.createThing(userId, input);
      results.push(thing);
    }
    return results;
  }

  /**
   * Delete multiple things at once.
   */
  async deleteThingsBulk(userId: string, ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      const success = await this.deleteThing(id, userId);
      if (success) deleted++;
    }
    return deleted;
  }
}
