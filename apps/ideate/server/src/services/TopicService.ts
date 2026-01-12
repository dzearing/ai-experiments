import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import { DocumentService } from './DocumentService.js';

// =========================================================================
// Types
// =========================================================================

// =========================================================================
// Type Schema Definitions
// =========================================================================

/** Property definition with resolution rules for type schemas */
export interface PropertyDef {
  /** Display label for UI */
  label: string;
  /** Property type for input rendering */
  type: 'text' | 'url' | 'path' | 'topic-ref';
  /** If topic-ref, what types can be referenced */
  refTypes?: string[];
  /** Is this required for the type? */
  required?: boolean;
  /** For path properties: inherit from parent topic and join with this property */
  inheritPath?: {
    /** Property name containing the parent topic ID */
    fromProperty: string;
    /** Property name to append to parent's localPath */
    joinWith?: string;
  };
}

/** Type schema with all metadata in one place */
export interface TopicTypeSchema {
  /** Display label for the type */
  displayLabel: string;
  /** Icon name for the type */
  icon?: TopicIcon;
  /** Key properties that define this type - shown prominently in UI */
  keyProperties: Record<string, PropertyDef>;
  /** Can this type provide execution context for code work? */
  providesExecutionContext?: boolean;
}

/** Resolved key properties from a topic and its ancestors */
export interface ResolvedKeyProperties {
  /** Absolute local path on disk */
  localPath?: string;
  /** Git remote URL */
  remoteUrl?: string;
  /** Git branch */
  branch?: string;
  /** URL for web resources */
  url?: string;
  /** True if remote-only repo that needs cloning */
  requiresClone?: boolean;
  /** Parent topic ID that provides context */
  contextTopicId?: string;
  /** Parent topic name */
  contextTopicName?: string;
}

/** Type schemas defining key properties and resolution rules for each topic type */
export const TOPIC_TYPE_SCHEMAS: Record<string, TopicTypeSchema> = {
  folder: {
    displayLabel: 'Local Folder',
    icon: 'folder',
    providesExecutionContext: true,
    keyProperties: {
      localPath: { label: 'Path', type: 'path', required: true },
    },
  },
  'git-repo': {
    displayLabel: 'Git Repository',
    icon: 'code',
    providesExecutionContext: true,
    keyProperties: {
      localPath: { label: 'Local Path', type: 'path' },
      remoteUrl: { label: 'Remote URL', type: 'url' },
    },
  },
  'git-package': {
    displayLabel: 'Package',
    icon: 'package',
    providesExecutionContext: true,
    keyProperties: {
      repoTopicId: {
        label: 'Repository',
        type: 'topic-ref',
        refTypes: ['git-repo'],
        required: true,
      },
      relativePath: { label: 'Path in Repo', type: 'text' },
      localPath: {
        label: 'Full Path',
        type: 'path',
        inheritPath: { fromProperty: 'repoTopicId', joinWith: 'relativePath' },
      },
      remoteUrl: {
        label: 'Remote URL',
        type: 'url',
        inheritPath: { fromProperty: 'repoTopicId' },
      },
    },
  },
  feature: {
    displayLabel: 'Feature',
    icon: 'star',
    providesExecutionContext: true,
    keyProperties: {
      packageTopicId: {
        label: 'Package',
        type: 'topic-ref',
        refTypes: ['git-package'],
        required: true,
      },
      entryFile: { label: 'Entry File', type: 'text' },
      localPath: {
        label: 'Path',
        type: 'path',
        inheritPath: { fromProperty: 'packageTopicId' },
      },
    },
  },
  'web-resource': {
    displayLabel: 'Web Resource',
    icon: 'globe',
    keyProperties: {
      url: { label: 'URL', type: 'url', required: true },
    },
  },
  collection: {
    displayLabel: 'Collection',
    icon: 'folder',
    keyProperties: {},
  },
  category: {
    displayLabel: 'Category',
    icon: 'folder',
    keyProperties: {},
  },
  project: {
    displayLabel: 'Project',
    icon: 'code',
    providesExecutionContext: true,
    keyProperties: {
      localPath: { label: 'Path', type: 'path' },
      remoteUrl: { label: 'Repository URL', type: 'url' },
    },
  },
  item: {
    displayLabel: 'Item',
    keyProperties: {},
  },
};

/** Predefined topic types (for suggestions) */
export const PREDEFINED_TOPIC_TYPES = [
  'folder',
  'git-repo',
  'git-package',
  'feature',
  'web-resource',
  'collection',
  'category',
  'project',
  'item',
] as const;

/** Topic type classification - allows custom string values */
export type TopicType = string;

export interface TopicAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;        // For external links
  filePath?: string;   // For uploaded files (relative path)
  createdAt: string;
}

export interface TopicIdeaCounts {
  new: number;
  exploring: number;
  ready: number;
  archived: number;
}

/** Link types for Topic links */
export type TopicLinkType = 'file' | 'url' | 'github' | 'package';

/** A link attached to a Topic */
export interface TopicLink {
  id: string;
  type: TopicLinkType;
  /** Display label for the link */
  label: string;
  /** The URL, file path, or identifier */
  target: string;
  /** Optional description */
  description?: string;
  createdAt: string;
}

/** Inline document stored with a Topic */
export interface TopicDocument {
  id: string;
  title: string;
  /** Markdown content */
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Curated icon set for Topics */
export type TopicIcon =
  | 'folder' | 'file' | 'code' | 'gear' | 'star' | 'heart'
  | 'home' | 'calendar' | 'chat' | 'user' | 'users' | 'bell'
  | 'link' | 'image' | 'clock' | 'check-circle' | 'warning'
  | 'info' | 'table' | 'list-task' | 'package' | 'globe';

/** Color palette for Topics */
export type TopicColor =
  | 'default' | 'blue' | 'green' | 'purple' | 'orange'
  | 'red' | 'teal' | 'pink' | 'yellow' | 'gray';

export interface TopicMetadata {
  id: string;
  name: string;
  description?: string;
  type: TopicType;
  tags: string[];
  /** Multiple parents supported - graph model */
  parentIds: string[];
  ownerId: string;
  /** undefined = global (private to user), string = workspace-scoped */
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  /** Sort order for stable positioning (lower = earlier in list) */
  order?: number;
  attachments: TopicAttachment[];
  /** Cached idea counts (updated when ideas change) */
  ideaCounts?: TopicIdeaCounts;
  /** Links to external resources (files, URLs, GitHub repos, packages) */
  links?: TopicLink[];
  /** Custom key-value properties */
  properties?: Record<string, string>;
  /** Icon identifier for display */
  icon?: TopicIcon;
  /** Background color for chips/badges */
  color?: TopicColor;
}

export interface Topic extends TopicMetadata {
  content?: string;    // Extended markdown content from .content.md
  /** Inline documents stored with the Topic */
  documents?: TopicDocument[];
}

export interface CreateTopicInput {
  name: string;
  description?: string;
  type?: TopicType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
  /** Insert after this topic ID (used to calculate order) */
  insertAfterId?: string;
  /** Initial links */
  links?: Omit<TopicLink, 'id' | 'createdAt'>[];
  /** Initial properties */
  properties?: Record<string, string>;
  /** Initial icon */
  icon?: TopicIcon;
  /** Initial color */
  color?: TopicColor;
}

export interface UpdateTopicInput {
  name?: string;
  description?: string;
  type?: TopicType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
  /** Update links (replaces all links) */
  links?: TopicLink[];
  /** Update properties (replaces all properties) */
  properties?: Record<string, string>;
  /** Update icon */
  icon?: TopicIcon | null;
  /** Update color */
  color?: TopicColor | null;
}

export interface TopicFilter {
  searchQuery?: string;
  tags?: string[];
  type?: TopicType;
  parentId?: string;
}

// =========================================================================
// Constants
// =========================================================================

const TOPICS_DIR = path.join(homedir(), 'Ideate', 'topics');
const ATTACHMENTS_DIR = path.join(TOPICS_DIR, 'attachments');

// =========================================================================
// Service
// =========================================================================

export class TopicService {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(TOPICS_DIR, { recursive: true });
      await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
    } catch (error) {
      console.error('[TopicService] Failed to create topics directories:', error);
    }
  }

  private getMetadataPath(id: string): string {
    return path.join(TOPICS_DIR, `${id}.meta.json`);
  }

  private getContentPath(id: string): string {
    return path.join(TOPICS_DIR, `${id}.content.md`);
  }

  private getDocumentsPath(id: string): string {
    return path.join(TOPICS_DIR, `${id}.documents.json`);
  }

  private getAttachmentsDir(id: string): string {
    return path.join(ATTACHMENTS_DIR, id);
  }

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * List topics for a user.
   * @param userId - The user requesting topics
   * @param workspaceId - Optional filter by workspace (undefined = include global topics)
   * @param isWorkspaceMember - Whether user is a workspace member (for access control)
   */
  async listTopics(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<TopicMetadata[]> {
    try {
      const files = await fs.readdir(TOPICS_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));

      const topics: TopicMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(TOPICS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: TopicMetadata = JSON.parse(content);

        // Access control
        const isOwner = metadata.ownerId === userId;
        const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId === workspaceId;

        // For global topics (no workspaceId), only owner can see
        if (!metadata.workspaceId && !isOwner) continue;

        // For workspace topics, owner or workspace member can see
        if (metadata.workspaceId && !isOwner && !hasWorkspaceAccess) continue;

        // Filter by workspaceId if provided - only show topics that belong to that workspace
        if (workspaceId !== undefined && metadata.workspaceId !== workspaceId) {
          continue;
        }

        topics.push(metadata);
      }

      // Sort by lastAccessedAt (most recent first), then by name
      topics.sort((a, b) => {
        const dateA = new Date(a.lastAccessedAt).getTime();
        const dateB = new Date(b.lastAccessedAt).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return a.name.localeCompare(b.name);
      });

      return topics;
    } catch (error) {
      console.error('[TopicService] List topics error:', error);
      return [];
    }
  }

  /**
   * Get full graph of topics for tree building.
   * Returns all accessible topics with stable sort order (by createdAt, then name).
   * This ensures the tree doesn't reorder when items are accessed.
   */
  async getTopicsGraph(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<TopicMetadata[]> {
    const topics = await this.listTopics(userId, workspaceId, isWorkspaceMember);

    // Sort by order field for stable insertion-based ordering
    // Fallback to createdAt for topics without order (legacy data)
    topics.sort((a, b) => {
      const orderA = a.order ?? new Date(a.createdAt).getTime();
      const orderB = b.order ?? new Date(b.createdAt).getTime();
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return topics;
  }

  /**
   * Get root topics (topics with no parents).
   */
  async getRootTopics(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<TopicMetadata[]> {
    const allTopics = await this.listTopics(userId, workspaceId, isWorkspaceMember);
    return allTopics.filter(topic => topic.parentIds.length === 0);
  }

  /**
   * Get children of a topic.
   */
  async getChildren(
    parentId: string,
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<TopicMetadata[]> {
    const allTopics = await this.listTopics(userId, workspaceId, isWorkspaceMember);
    return allTopics.filter(topic => topic.parentIds.includes(parentId));
  }

  /**
   * Get recently accessed topics.
   */
  async getRecentTopics(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false,
    limit: number = 10
  ): Promise<TopicMetadata[]> {
    const allTopics = await this.listTopics(userId, workspaceId, isWorkspaceMember);
    // Already sorted by lastAccessedAt
    return allTopics.slice(0, limit);
  }

  /**
   * Search topics by name or tags.
   */
  async searchTopics(
    userId: string,
    query: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<TopicMetadata[]> {
    const allTopics = await this.listTopics(userId, workspaceId, isWorkspaceMember);
    const lowerQuery = query.toLowerCase();

    return allTopics.filter(topic => {
      // Search in name
      if (topic.name.toLowerCase().includes(lowerQuery)) return true;

      // Search in description
      if (topic.description?.toLowerCase().includes(lowerQuery)) return true;

      // Search in tags (including #tag format)
      const tagQuery = lowerQuery.startsWith('#') ? lowerQuery.slice(1) : lowerQuery;
      if (topic.tags.some(tag => tag.toLowerCase().includes(tagQuery))) return true;

      return false;
    });
  }

  /**
   * Create a new topic.
   */
  async createTopic(userId: string, input: CreateTopicInput): Promise<Topic> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Build initial links with IDs and timestamps
    const links: TopicLink[] = input.links?.map(link => ({
      ...link,
      id: uuidv4(),
      createdAt: now,
    })) || [];

    // Calculate order based on insertAfterId
    const order = await this.calculateOrder(userId, input.parentIds || [], input.insertAfterId);

    const metadata: TopicMetadata = {
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
      order,
      attachments: [],
      links: links.length > 0 ? links : undefined,
      properties: input.properties,
      icon: input.icon,
      color: input.color,
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
   * Calculate the order value for a new topic based on insertion position.
   */
  private async calculateOrder(
    userId: string,
    parentIds: string[],
    insertAfterId?: string
  ): Promise<number> {
    try {
      // Get all topics to find siblings
      const allTopics = await this.listTopicsInternal(userId);

      // Find siblings (topics with same first parent, or root topics if no parent)
      const parentId = parentIds[0] || null;
      const siblings = allTopics
        .filter(t => {
          if (parentId === null) {
            return t.parentIds.length === 0;
          }
          return t.parentIds.includes(parentId);
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (siblings.length === 0) {
        // No siblings, start at 0
        return 0;
      }

      if (!insertAfterId) {
        // Insert at beginning - use order smaller than smallest
        const minOrder = siblings[0].order ?? 0;
        return minOrder - 1;
      }

      // Find the topic we're inserting after
      const afterIndex = siblings.findIndex(t => t.id === insertAfterId);
      if (afterIndex === -1) {
        // Target not found among siblings, insert at end
        const maxOrder = siblings[siblings.length - 1].order ?? 0;
        return maxOrder + 1;
      }

      const afterTopic = siblings[afterIndex];
      const afterOrder = afterTopic.order ?? 0;

      if (afterIndex === siblings.length - 1) {
        // Inserting after the last sibling
        return afterOrder + 1;
      }

      // Insert between afterTopic and the next sibling
      const nextTopic = siblings[afterIndex + 1];
      const nextOrder = nextTopic.order ?? afterOrder + 2;

      // Use midpoint for fractional ordering
      return (afterOrder + nextOrder) / 2;
    } catch {
      // Fallback to timestamp-based order
      return Date.now();
    }
  }

  /**
   * Internal list without access control (for order calculation).
   */
  private async listTopicsInternal(userId: string): Promise<TopicMetadata[]> {
    try {
      const files = await fs.readdir(TOPICS_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      const topics: TopicMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(TOPICS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: TopicMetadata = JSON.parse(content);

        // Only include user's own topics for order calculation
        if (metadata.ownerId === userId) {
          topics.push(metadata);
        }
      }

      return topics;
    } catch {
      return [];
    }
  }

  /**
   * Get a topic by ID.
   */
  async getTopic(id: string, userId: string, isWorkspaceMember: boolean = false): Promise<Topic | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

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

      // Try to read documents
      let documents: TopicDocument[] | undefined;
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(id), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        // No documents file
      }

      return { ...metadata, content, documents };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get topic metadata only (no content).
   * For internal use and bulk operations.
   */
  async getTopicInternal(id: string): Promise<TopicMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      return JSON.parse(metaContent);
    } catch {
      return null;
    }
  }

  /**
   * Get topics by IDs (for resolving references).
   */
  async getTopicsByIds(ids: string[], userId: string, isWorkspaceMember: boolean = false): Promise<Topic[]> {
    const topics: Topic[] = [];
    for (const id of ids) {
      const topic = await this.getTopic(id, userId, isWorkspaceMember);
      if (topic) {
        topics.push(topic);
      }
    }
    return topics;
  }

  /**
   * Update a topic.
   */
  async updateTopic(
    id: string,
    userId: string,
    updates: UpdateTopicInput
  ): Promise<Topic | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: TopicMetadata = {
        ...metadata,
        name: updates.name ?? metadata.name,
        description: updates.description ?? metadata.description,
        type: updates.type ?? metadata.type,
        tags: updates.tags ?? metadata.tags,
        parentIds: updates.parentIds ?? metadata.parentIds,
        workspaceId: 'workspaceId' in updates ? updates.workspaceId : metadata.workspaceId,
        updatedAt: now,
        // Handle links (replace all)
        links: 'links' in updates ? updates.links : metadata.links,
        // Handle properties (replace all)
        properties: 'properties' in updates ? updates.properties : metadata.properties,
        // Handle icon (null = remove)
        icon: 'icon' in updates ? (updates.icon ?? undefined) : metadata.icon,
        // Handle color (null = remove)
        color: 'color' in updates ? (updates.color ?? undefined) : metadata.color,
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

      // Read documents
      let documents: TopicDocument[] | undefined;
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(id), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        // No documents file
      }

      return { ...updatedMetadata, content, documents };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a topic and all its children (cascade delete).
   */
  async deleteTopic(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      // First, recursively delete all children
      const children = await this.getChildren(id, userId, metadata.workspaceId, true);
      for (const child of children) {
        await this.deleteTopic(child.id, userId);
      }

      // Delete associated standalone documents (cascade delete)
      await this.documentService.deleteDocumentsByTopicId(id);

      // Delete metadata
      await fs.unlink(this.getMetadataPath(id));

      // Delete content if exists
      try {
        await fs.unlink(this.getContentPath(id));
      } catch {
        // File didn't exist
      }

      // Delete documents if exists
      try {
        await fs.unlink(this.getDocumentsPath(id));
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
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only update if user has access (owner or workspace member check should be done at route level)
      const now = new Date().toISOString();

      const updatedMetadata: TopicMetadata = {
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
   * Update cached idea counts for a topic.
   * Called when ideas are created/updated/deleted.
   */
  async updateIdeaCounts(id: string, counts: TopicIdeaCounts): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      const updatedMetadata: TopicMetadata = {
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
   * Add an attachment to a topic.
   */
  async addAttachment(
    topicId: string,
    userId: string,
    attachment: Omit<TopicAttachment, 'id' | 'createdAt'>,
    fileBuffer?: Buffer
  ): Promise<TopicAttachment | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can add attachments
      if (metadata.ownerId !== userId) {
        return null;
      }

      const attachmentId = uuidv4();
      const now = new Date().toISOString();

      const newAttachment: TopicAttachment = {
        id: attachmentId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        url: attachment.url,
        createdAt: now,
      };

      // If file buffer provided, save the file
      if (fileBuffer) {
        const attachmentsDir = this.getAttachmentsDir(topicId);
        await fs.mkdir(attachmentsDir, { recursive: true });

        const filePath = path.join(attachmentsDir, `${attachmentId}-${attachment.filename}`);
        await fs.writeFile(filePath, fileBuffer);
        newAttachment.filePath = `${attachmentId}-${attachment.filename}`;
      }

      metadata.attachments.push(newAttachment);
      metadata.updatedAt = now;

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return newAttachment;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove an attachment from a topic.
   */
  async removeAttachment(
    topicId: string,
    userId: string,
    attachmentId: string
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

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
          const filePath = path.join(this.getAttachmentsDir(topicId), attachment.filePath);
          await fs.unlink(filePath);
        } catch {
          // File might not exist
        }
      }

      // Remove from metadata
      metadata.attachments.splice(attachmentIndex, 1);
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(topicId),
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
  async getAttachmentPath(topicId: string, attachmentId: string): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      const attachment = metadata.attachments.find(a => a.id === attachmentId);
      if (!attachment || !attachment.filePath) {
        return null;
      }

      return path.join(this.getAttachmentsDir(topicId), attachment.filePath);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // Bulk Operations (for agent use)
  // =========================================================================

  /**
   * Create multiple topics at once.
   */
  async createTopicsBulk(userId: string, inputs: CreateTopicInput[]): Promise<Topic[]> {
    const results: Topic[] = [];
    for (const input of inputs) {
      const topic = await this.createTopic(userId, input);
      results.push(topic);
    }
    return results;
  }

  /**
   * Delete multiple topics at once.
   */
  async deleteTopicsBulk(userId: string, ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      const success = await this.deleteTopic(id, userId);
      if (success) deleted++;
    }
    return deleted;
  }

  // =========================================================================
  // Links
  // =========================================================================

  /**
   * Add a link to a topic.
   */
  async addLink(
    topicId: string,
    userId: string,
    link: Omit<TopicLink, 'id' | 'createdAt'>
  ): Promise<TopicLink | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can add links
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();
      const newLink: TopicLink = {
        ...link,
        id: uuidv4(),
        createdAt: now,
      };

      // Initialize links array if needed
      if (!metadata.links) {
        metadata.links = [];
      }
      metadata.links.push(newLink);
      metadata.updatedAt = now;

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return newLink;
    } catch {
      return null;
    }
  }

  /**
   * Update a link on a topic.
   */
  async updateLink(
    topicId: string,
    userId: string,
    linkId: string,
    updates: Partial<Omit<TopicLink, 'id' | 'createdAt'>>
  ): Promise<TopicLink | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can update links
      if (metadata.ownerId !== userId) {
        return null;
      }

      const linkIndex = metadata.links?.findIndex(l => l.id === linkId) ?? -1;
      if (linkIndex === -1 || !metadata.links) {
        return null;
      }

      const updatedLink: TopicLink = {
        ...metadata.links[linkIndex],
        ...updates,
      };
      metadata.links[linkIndex] = updatedLink;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return updatedLink;
    } catch {
      return null;
    }
  }

  /**
   * Remove a link from a topic.
   */
  async removeLink(
    topicId: string,
    userId: string,
    linkId: string
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can remove links
      if (metadata.ownerId !== userId) {
        return false;
      }

      const linkIndex = metadata.links?.findIndex(l => l.id === linkId) ?? -1;
      if (linkIndex === -1 || !metadata.links) {
        return false;
      }

      metadata.links.splice(linkIndex, 1);
      // Clean up empty array
      if (metadata.links.length === 0) {
        metadata.links = undefined;
      }
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Properties
  // =========================================================================

  /**
   * Set properties for a topic (replaces all properties).
   */
  async setProperties(
    topicId: string,
    userId: string,
    properties: Record<string, string> | null
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can update properties
      if (metadata.ownerId !== userId) {
        return false;
      }

      metadata.properties = properties ?? undefined;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Documents (stored in {id}.documents.json)
  // =========================================================================

  /**
   * Get documents for a topic.
   */
  async getDocuments(topicId: string, userId: string): Promise<TopicDocument[]> {
    try {
      // Verify access
      const metadata = await this.getTopicInternal(topicId);
      if (!metadata || metadata.ownerId !== userId) {
        return [];
      }

      const docsContent = await fs.readFile(this.getDocumentsPath(topicId), 'utf-8');
      return JSON.parse(docsContent);
    } catch {
      return [];
    }
  }

  /**
   * Add a document to a topic.
   */
  async addDocument(
    topicId: string,
    userId: string,
    doc: Omit<TopicDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TopicDocument | null> {
    try {
      // Verify ownership
      const metadata = await this.getTopicInternal(topicId);
      if (!metadata || metadata.ownerId !== userId) {
        return null;
      }

      // Load existing documents
      let documents: TopicDocument[] = [];
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(topicId), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        // No documents file yet
      }

      const now = new Date().toISOString();
      const newDoc: TopicDocument = {
        ...doc,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      documents.push(newDoc);

      await fs.writeFile(
        this.getDocumentsPath(topicId),
        JSON.stringify(documents, null, 2),
        'utf-8'
      );

      // Update topic's updatedAt
      await this.touchTopic(topicId);

      return newDoc;
    } catch {
      return null;
    }
  }

  /**
   * Update a document on a topic.
   */
  async updateDocument(
    topicId: string,
    userId: string,
    docId: string,
    updates: Partial<Omit<TopicDocument, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<TopicDocument | null> {
    try {
      // Verify ownership
      const metadata = await this.getTopicInternal(topicId);
      if (!metadata || metadata.ownerId !== userId) {
        return null;
      }

      // Load documents
      let documents: TopicDocument[] = [];
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(topicId), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        return null; // No documents file
      }

      const docIndex = documents.findIndex(d => d.id === docId);
      if (docIndex === -1) {
        return null;
      }

      const updatedDoc: TopicDocument = {
        ...documents[docIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      documents[docIndex] = updatedDoc;

      await fs.writeFile(
        this.getDocumentsPath(topicId),
        JSON.stringify(documents, null, 2),
        'utf-8'
      );

      // Update topic's updatedAt
      await this.touchTopic(topicId);

      return updatedDoc;
    } catch {
      return null;
    }
  }

  /**
   * Remove a document from a topic.
   */
  async removeDocument(
    topicId: string,
    userId: string,
    docId: string
  ): Promise<boolean> {
    try {
      // Verify ownership
      const metadata = await this.getTopicInternal(topicId);
      if (!metadata || metadata.ownerId !== userId) {
        return false;
      }

      // Load documents
      let documents: TopicDocument[] = [];
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(topicId), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        return false; // No documents file
      }

      const docIndex = documents.findIndex(d => d.id === docId);
      if (docIndex === -1) {
        return false;
      }

      documents.splice(docIndex, 1);

      if (documents.length === 0) {
        // Delete file if no documents left
        try {
          await fs.unlink(this.getDocumentsPath(topicId));
        } catch {
          // Ignore
        }
      } else {
        await fs.writeFile(
          this.getDocumentsPath(topicId),
          JSON.stringify(documents, null, 2),
          'utf-8'
        );
      }

      // Update topic's updatedAt
      await this.touchTopic(topicId);

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Visual (icon, color)
  // =========================================================================

  /**
   * Set icon for a topic.
   */
  async setIcon(
    topicId: string,
    userId: string,
    icon: TopicIcon | null
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can update icon
      if (metadata.ownerId !== userId) {
        return false;
      }

      metadata.icon = icon ?? undefined;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set color for a topic.
   */
  async setColor(
    topicId: string,
    userId: string,
    color: TopicColor | null
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);

      // Only owner can update color
      if (metadata.ownerId !== userId) {
        return false;
      }

      metadata.color = color ?? undefined;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Key Property Resolution
  // =========================================================================

  /**
   * Generic key property resolution driven by TOPIC_TYPE_SCHEMAS.
   * Handles inheritance chains automatically based on schema metadata.
   * @param topicId - The topic to resolve properties for
   * @param userId - The user requesting resolution
   * @param visited - Set of already visited topic IDs (for cycle prevention)
   */
  async resolveKeyProperties(
    topicId: string,
    userId: string,
    visited: Set<string> = new Set()
  ): Promise<ResolvedKeyProperties> {
    // Prevent cycles
    if (visited.has(topicId)) {
      return {};
    }
    visited.add(topicId);

    const topic = await this.getTopic(topicId, userId, true);
    if (!topic) {
      return {};
    }

    const schema = TOPIC_TYPE_SCHEMAS[topic.type];
    if (!schema) {
      // Unknown type - just return raw properties that match common keys
      const props = topic.properties || {};
      return {
        localPath: props.localPath,
        remoteUrl: props.remoteUrl,
        branch: props.branch || props.defaultBranch,
        url: props.url,
      };
    }

    const props = topic.properties || {};
    const resolved: ResolvedKeyProperties = {};

    // Process each key property defined in schema
    for (const [propName, propDef] of Object.entries(schema.keyProperties)) {
      // Direct value from topic's properties
      if (props[propName] !== undefined) {
        (resolved as Record<string, unknown>)[propName] = props[propName];
      }

      // Handle inherited/derived properties
      if (propDef.inheritPath) {
        const { fromProperty, joinWith } = propDef.inheritPath;
        const parentTopicId = props[fromProperty];

        if (parentTopicId) {
          // Recursively resolve parent topic's properties
          const parentResolved = await this.resolveKeyProperties(
            parentTopicId,
            userId,
            visited
          );

          if (parentResolved.localPath) {
            // If joinWith specified, append that property to parent's path
            const suffix = joinWith ? (props[joinWith] || '') : '';
            (resolved as Record<string, unknown>)[propName] = suffix
              ? path.join(parentResolved.localPath, suffix)
              : parentResolved.localPath;
          }

          // Inherit other useful properties from parent
          if (parentResolved.remoteUrl && !resolved.remoteUrl) {
            resolved.remoteUrl = parentResolved.remoteUrl;
          }
          if (parentResolved.branch && !resolved.branch) {
            resolved.branch = parentResolved.branch;
          }

          // Track context (the topic that provides physical location)
          const parentTopic = await this.getTopicInternal(parentTopicId);
          if (parentTopic) {
            resolved.contextTopicId = parentTopicId;
            resolved.contextTopicName = parentTopic.name;
          }
        }
      }
    }

    // Handle default branch (might be stored as 'defaultBranch')
    if (props.defaultBranch && !resolved.branch) {
      resolved.branch = props.defaultBranch;
    }

    // Determine if this needs cloning (has remoteUrl but no localPath)
    if (resolved.remoteUrl && !resolved.localPath) {
      resolved.requiresClone = true;
    }

    return resolved;
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  /**
   * Update updatedAt timestamp without other changes.
   */
  private async touchTopic(topicId: string): Promise<void> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(topicId), 'utf-8');
      const metadata: TopicMetadata = JSON.parse(metaContent);
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(
        this.getMetadataPath(topicId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );
    } catch {
      // Ignore errors
    }
  }
}
