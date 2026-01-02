import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

// =========================================================================
// Types
// =========================================================================

export type IdeaStatus = 'new' | 'exploring' | 'executing' | 'archived';
export type IdeaSource = 'user' | 'ai';
export type ExecutionMode = 'all-phases' | 'phase-by-phase';

export interface IdeaAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;        // For external links
  filePath?: string;   // For uploaded files (relative path)
  createdAt: string;
}

// Plan data structures
export interface PlanTask {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
}

export interface PlanPhase {
  id: string;
  title: string;
  description?: string;
  tasks: PlanTask[];
  expanded?: boolean;
}

export interface IdeaPlan {
  phases: PlanPhase[];
  workingDirectory: string;
  repositoryUrl?: string;
  branch?: string;
  isClone?: boolean;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionOptions {
  mode: ExecutionMode;
  startPhaseId?: string;
}

export interface IdeaExecutionState {
  progressPercent: number;       // 0-100
  waitingForFeedback: boolean;
  chatRoomId?: string;           // Linked chat room for discussion
  startedAt?: string;            // When execution started
  currentPhaseId?: string;       // Currently executing phase
  currentTaskId?: string;        // Currently executing task
  mode?: ExecutionMode;          // Execution mode
}

export interface IdeaMetadata {
  id: string;
  title: string;
  summary: string;
  tags: string[];                 // Includes priority tags like 'priority:high'
  rating: 1 | 2 | 3 | 4;
  source: IdeaSource;
  status: IdeaStatus;
  ownerId: string;
  workspaceId?: string;           // undefined = global (user's personal ideas)
  thingIds: string[];             // References to Things (many-to-many)
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  attachments: IdeaAttachment[];
  plan?: IdeaPlan;                // Implementation plan (when status is 'exploring' or later)
  execution?: IdeaExecutionState; // Execution state (when status is 'executing')
}

export interface Idea extends IdeaMetadata {
  description?: string;           // Extended description from .md file
}

export interface CreateIdeaInput {
  title: string;
  summary: string;
  tags?: string[];
  rating?: 1 | 2 | 3 | 4;
  source?: IdeaSource;
  workspaceId?: string;
  thingIds?: string[];
  description?: string;
}

export interface UpdateIdeaInput {
  title?: string;
  summary?: string;
  tags?: string[];
  description?: string;
  workspaceId?: string;
  thingIds?: string[];
}

// =========================================================================
// Constants
// =========================================================================

const IDEAS_DIR = path.join(homedir(), 'Ideate', 'ideas');
const ATTACHMENTS_DIR = path.join(IDEAS_DIR, 'attachments');

// =========================================================================
// Service
// =========================================================================

export class IdeaService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(IDEAS_DIR, { recursive: true });
      await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
    } catch (error) {
      console.error('[IdeaService] Failed to create ideas directories:', error);
    }
  }

  private getMetadataPath(id: string): string {
    return path.join(IDEAS_DIR, `${id}.meta.json`);
  }

  private getDescriptionPath(id: string): string {
    return path.join(IDEAS_DIR, `${id}.description.md`);
  }

  private getAttachmentsDir(id: string): string {
    return path.join(ATTACHMENTS_DIR, id);
  }

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * List ideas for a user.
   * @param userId - The user requesting ideas
   * @param workspaceId - Optional filter by workspace (undefined = all ideas including global)
   * @param status - Optional filter by status
   * @param isWorkspaceMember - Whether user is a workspace member (for access control)
   */
  async listIdeas(
    userId: string,
    workspaceId?: string,
    status?: IdeaStatus,
    isWorkspaceMember: boolean = false
  ): Promise<IdeaMetadata[]> {
    try {
      const files = await fs.readdir(IDEAS_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));

      const ideas: IdeaMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(IDEAS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: IdeaMetadata = JSON.parse(content);

        // Filter by workspaceId if provided
        if (workspaceId !== undefined) {
          if (metadata.workspaceId !== workspaceId) continue;
        }

        // Filter by status if provided
        if (status !== undefined) {
          if (metadata.status !== status) continue;
        }

        // Include if user is owner or workspace member
        const isOwner = metadata.ownerId === userId;
        const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId === workspaceId;

        // For global ideas (no workspaceId), only owner can see
        if (!metadata.workspaceId && !isOwner) continue;

        // For workspace ideas, owner or workspace member can see
        if (metadata.workspaceId && !isOwner && !hasWorkspaceAccess) continue;

        ideas.push(metadata);
      }

      // Sort by rating (highest first), then by updated date
      ideas.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return ideas;
    } catch (error) {
      console.error('[IdeaService] List ideas error:', error);
      return [];
    }
  }

  /**
   * Get ideas grouped by status for kanban view.
   */
  async getIdeasByLane(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<Record<IdeaStatus, IdeaMetadata[]>> {
    const allIdeas = await this.listIdeas(userId, workspaceId, undefined, isWorkspaceMember);

    const grouped: Record<IdeaStatus, IdeaMetadata[]> = {
      new: [],
      exploring: [],
      executing: [],
      archived: [],
    };

    for (const idea of allIdeas) {
      grouped[idea.status].push(idea);
    }

    // Each lane is already sorted by rating from listIdeas
    return grouped;
  }

  /**
   * Get ideas linked to a specific thing.
   */
  async getIdeasByThingId(
    thingId: string,
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<IdeaMetadata[]> {
    const allIdeas = await this.listIdeas(userId, workspaceId, undefined, isWorkspaceMember);
    return allIdeas.filter(idea => idea.thingIds?.includes(thingId));
  }

  /**
   * Get idea counts grouped by status for a thing.
   */
  async getIdeaCountsByThingId(
    thingId: string,
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<{ new: number; exploring: number; executing: number; archived: number }> {
    const ideas = await this.getIdeasByThingId(thingId, userId, workspaceId, isWorkspaceMember);

    const counts = {
      new: 0,
      exploring: 0,
      executing: 0,
      archived: 0,
    };

    for (const idea of ideas) {
      counts[idea.status]++;
    }

    return counts;
  }

  /**
   * Create a new idea.
   */
  async createIdea(userId: string, input: CreateIdeaInput): Promise<Idea> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: IdeaMetadata = {
      id,
      title: input.title,
      summary: input.summary,
      tags: input.tags || [],
      rating: input.rating || 2,
      source: input.source || 'user',
      status: 'new',
      ownerId: userId,
      workspaceId: input.workspaceId,
      thingIds: input.thingIds || [],
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
      attachments: [],
    };

    // Save metadata
    await fs.writeFile(
      this.getMetadataPath(id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Save description if provided
    if (input.description) {
      await fs.writeFile(this.getDescriptionPath(id), input.description, 'utf-8');
    }

    return { ...metadata, description: input.description };
  }

  /**
   * Get an idea by ID.
   */
  async getIdea(id: string, userId: string, isWorkspaceMember: boolean = false): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Access control
      const isOwner = metadata.ownerId === userId;
      const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId;

      if (!isOwner && !hasWorkspaceAccess) {
        return null;
      }

      // Try to read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...metadata, description };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get idea metadata only (no description).
   * For internal use and bulk operations.
   */
  async getIdeaInternal(id: string): Promise<IdeaMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      return JSON.parse(metaContent);
    } catch {
      return null;
    }
  }

  /**
   * Get full idea by ID without auth check.
   * For server-side use only (e.g., Yjs initialization).
   */
  async getIdeaByIdNoAuth(id: string): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Try to read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...metadata, description };
    } catch {
      return null;
    }
  }

  /**
   * Update an idea.
   */
  async updateIdea(
    id: string,
    userId: string,
    updates: UpdateIdeaInput
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        title: updates.title ?? metadata.title,
        summary: updates.summary ?? metadata.summary,
        tags: updates.tags ?? metadata.tags,
        workspaceId: 'workspaceId' in updates ? updates.workspaceId : metadata.workspaceId,
        thingIds: updates.thingIds ?? metadata.thingIds ?? [],
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Update description if provided
      if (updates.description !== undefined) {
        if (updates.description) {
          await fs.writeFile(this.getDescriptionPath(id), updates.description, 'utf-8');
        } else {
          // Empty string means delete description
          try {
            await fs.unlink(this.getDescriptionPath(id));
          } catch {
            // File didn't exist
          }
        }
      }

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete an idea.
   */
  async deleteIdea(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      // Delete metadata
      await fs.unlink(this.getMetadataPath(id));

      // Delete description if exists
      try {
        await fs.unlink(this.getDescriptionPath(id));
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
  // Status Management (Lane Movement)
  // =========================================================================

  /**
   * Move an idea to a new status (lane).
   * Returns the chatRoomId if one was created for executing status.
   */
  async updateStatus(
    id: string,
    userId: string,
    newStatus: IdeaStatus
  ): Promise<{ idea: Idea; chatRoomId?: string } | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update status
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();
      let chatRoomId: string | undefined;

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        status: newStatus,
        updatedAt: now,
        statusChangedAt: now,
      };

      // Initialize execution state when moving to 'executing'
      if (newStatus === 'executing' && !metadata.execution) {
        // Note: Chat room creation is handled by the route layer
        // which has access to ChatRoomService
        updatedMetadata.execution = {
          progressPercent: 0,
          waitingForFeedback: false,
        };
      }

      // Clear execution state when moving away from 'executing'
      if (newStatus !== 'executing' && metadata.execution) {
        updatedMetadata.execution = undefined;
      }

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { idea: { ...updatedMetadata, description }, chatRoomId };
    } catch (error) {
      return null;
    }
  }

  /**
   * Set the chat room ID for an executing idea.
   */
  async setChatRoomId(id: string, chatRoomId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      if (metadata.status !== 'executing' || !metadata.execution) {
        return false;
      }

      metadata.execution.chatRoomId = chatRoomId;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update execution state for an idea in 'executing' status.
   */
  async updateExecutionState(
    id: string,
    userId: string,
    updates: Partial<IdeaExecutionState>
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      // Must be in executing status
      if (metadata.status !== 'executing' || !metadata.execution) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        execution: {
          ...metadata.execution,
          progressPercent: updates.progressPercent ?? metadata.execution.progressPercent,
          waitingForFeedback: updates.waitingForFeedback ?? metadata.execution.waitingForFeedback,
          chatRoomId: updates.chatRoomId ?? metadata.execution.chatRoomId,
        },
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      return null;
    }
  }

  // =========================================================================
  // Rating
  // =========================================================================

  /**
   * Update idea rating (1-4).
   */
  async updateRating(
    id: string,
    userId: string,
    rating: 1 | 2 | 3 | 4
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update rating
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        rating,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      return null;
    }
  }

  // =========================================================================
  // Attachments
  // =========================================================================

  /**
   * Add an attachment to an idea.
   */
  async addAttachment(
    ideaId: string,
    userId: string,
    attachment: Omit<IdeaAttachment, 'id' | 'createdAt'>,
    fileBuffer?: Buffer
  ): Promise<IdeaAttachment | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can add attachments
      if (metadata.ownerId !== userId) {
        return null;
      }

      const attachmentId = uuidv4();
      const now = new Date().toISOString();

      const newAttachment: IdeaAttachment = {
        id: attachmentId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        url: attachment.url,
        createdAt: now,
      };

      // If file buffer provided, save the file
      if (fileBuffer) {
        const attachmentsDir = this.getAttachmentsDir(ideaId);
        await fs.mkdir(attachmentsDir, { recursive: true });

        const filePath = path.join(attachmentsDir, `${attachmentId}-${attachment.filename}`);
        await fs.writeFile(filePath, fileBuffer);
        newAttachment.filePath = `${attachmentId}-${attachment.filename}`;
      }

      metadata.attachments.push(newAttachment);
      metadata.updatedAt = now;

      await fs.writeFile(
        this.getMetadataPath(ideaId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return newAttachment;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove an attachment from an idea.
   */
  async removeAttachment(
    ideaId: string,
    userId: string,
    attachmentId: string
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

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
          const filePath = path.join(this.getAttachmentsDir(ideaId), attachment.filePath);
          await fs.unlink(filePath);
        } catch {
          // File might not exist
        }
      }

      // Remove from metadata
      metadata.attachments.splice(attachmentIndex, 1);
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(ideaId),
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
  async getAttachmentPath(ideaId: string, attachmentId: string): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      const attachment = metadata.attachments.find(a => a.id === attachmentId);
      if (!attachment || !attachment.filePath) {
        return null;
      }

      return path.join(this.getAttachmentsDir(ideaId), attachment.filePath);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // AI Integration
  // =========================================================================

  /**
   * Create an AI-generated idea.
   * Called by AI generation job or Facilitator.
   */
  async createAIIdea(
    ownerId: string,
    data: {
      title: string;
      summary: string;
      tags?: string[];
      workspaceId?: string;
      description?: string;
    }
  ): Promise<Idea> {
    return this.createIdea(ownerId, {
      ...data,
      source: 'ai',
      rating: 2, // Default to medium rating for AI ideas
    });
  }
}
