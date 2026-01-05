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
  type: 'text' | 'url' | 'path' | 'thing-ref';
  /** If thing-ref, what types can be referenced */
  refTypes?: string[];
  /** Is this required for the type? */
  required?: boolean;
  /** For path properties: inherit from parent thing and join with this property */
  inheritPath?: {
    /** Property name containing the parent thing ID */
    fromProperty: string;
    /** Property name to append to parent's localPath */
    joinWith?: string;
  };
}

/** Type schema with all metadata in one place */
export interface ThingTypeSchema {
  /** Display label for the type */
  displayLabel: string;
  /** Icon name for the type */
  icon?: ThingIcon;
  /** Key properties that define this type - shown prominently in UI */
  keyProperties: Record<string, PropertyDef>;
  /** Can this type provide execution context for code work? */
  providesExecutionContext?: boolean;
}

/** Resolved key properties from a thing and its ancestors */
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
  /** Parent thing ID that provides context */
  contextThingId?: string;
  /** Parent thing name */
  contextThingName?: string;
}

/** Type schemas defining key properties and resolution rules for each thing type */
export const THING_TYPE_SCHEMAS: Record<string, ThingTypeSchema> = {
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
      remoteUrl: { label: 'Remote URL', type: 'url' },
      localPath: { label: 'Local Path', type: 'path' },
      defaultBranch: { label: 'Default Branch', type: 'text' },
    },
  },
  'git-package': {
    displayLabel: 'Package',
    icon: 'package',
    providesExecutionContext: true,
    keyProperties: {
      repoThingId: {
        label: 'Repository',
        type: 'thing-ref',
        refTypes: ['git-repo'],
        required: true,
      },
      relativePath: { label: 'Path in Repo', type: 'text' },
      localPath: {
        label: 'Full Path',
        type: 'path',
        inheritPath: { fromProperty: 'repoThingId', joinWith: 'relativePath' },
      },
    },
  },
  feature: {
    displayLabel: 'Feature',
    icon: 'star',
    providesExecutionContext: true,
    keyProperties: {
      packageThingId: {
        label: 'Package',
        type: 'thing-ref',
        refTypes: ['git-package'],
        required: true,
      },
      entryFile: { label: 'Entry File', type: 'text' },
      localPath: {
        label: 'Path',
        type: 'path',
        inheritPath: { fromProperty: 'packageThingId' },
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

/** Predefined thing types (for suggestions) */
export const PREDEFINED_THING_TYPES = [
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

/** Thing type classification - allows custom string values */
export type ThingType = string;

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

/** Link types for Thing links */
export type ThingLinkType = 'file' | 'url' | 'github' | 'package';

/** A link attached to a Thing */
export interface ThingLink {
  id: string;
  type: ThingLinkType;
  /** Display label for the link */
  label: string;
  /** The URL, file path, or identifier */
  target: string;
  /** Optional description */
  description?: string;
  createdAt: string;
}

/** Inline document stored with a Thing */
export interface ThingDocument {
  id: string;
  title: string;
  /** Markdown content */
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Curated icon set for Things */
export type ThingIcon =
  | 'folder' | 'file' | 'code' | 'gear' | 'star' | 'heart'
  | 'home' | 'calendar' | 'chat' | 'user' | 'users' | 'bell'
  | 'link' | 'image' | 'clock' | 'check-circle' | 'warning'
  | 'info' | 'table' | 'list-task' | 'package' | 'globe';

/** Color palette for Things */
export type ThingColor =
  | 'default' | 'blue' | 'green' | 'purple' | 'orange'
  | 'red' | 'teal' | 'pink' | 'yellow' | 'gray';

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
  /** Sort order for stable positioning (lower = earlier in list) */
  order?: number;
  attachments: ThingAttachment[];
  /** Cached idea counts (updated when ideas change) */
  ideaCounts?: ThingIdeaCounts;
  /** Links to external resources (files, URLs, GitHub repos, packages) */
  links?: ThingLink[];
  /** Custom key-value properties */
  properties?: Record<string, string>;
  /** Icon identifier for display */
  icon?: ThingIcon;
  /** Background color for chips/badges */
  color?: ThingColor;
}

export interface Thing extends ThingMetadata {
  content?: string;    // Extended markdown content from .content.md
  /** Inline documents stored with the Thing */
  documents?: ThingDocument[];
}

export interface CreateThingInput {
  name: string;
  description?: string;
  type?: ThingType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
  /** Insert after this thing ID (used to calculate order) */
  insertAfterId?: string;
  /** Initial links */
  links?: Omit<ThingLink, 'id' | 'createdAt'>[];
  /** Initial properties */
  properties?: Record<string, string>;
  /** Initial icon */
  icon?: ThingIcon;
  /** Initial color */
  color?: ThingColor;
}

export interface UpdateThingInput {
  name?: string;
  description?: string;
  type?: ThingType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
  /** Update links (replaces all links) */
  links?: ThingLink[];
  /** Update properties (replaces all properties) */
  properties?: Record<string, string>;
  /** Update icon */
  icon?: ThingIcon | null;
  /** Update color */
  color?: ThingColor | null;
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
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
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

  private getDocumentsPath(id: string): string {
    return path.join(THINGS_DIR, `${id}.documents.json`);
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
   * Returns all accessible things with stable sort order (by createdAt, then name).
   * This ensures the tree doesn't reorder when items are accessed.
   */
  async getThingsGraph(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<ThingMetadata[]> {
    const things = await this.listThings(userId, workspaceId, isWorkspaceMember);

    // Sort by order field for stable insertion-based ordering
    // Fallback to createdAt for things without order (legacy data)
    things.sort((a, b) => {
      const orderA = a.order ?? new Date(a.createdAt).getTime();
      const orderB = b.order ?? new Date(b.createdAt).getTime();
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return things;
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

    // Build initial links with IDs and timestamps
    const links: ThingLink[] = input.links?.map(link => ({
      ...link,
      id: uuidv4(),
      createdAt: now,
    })) || [];

    // Calculate order based on insertAfterId
    const order = await this.calculateOrder(userId, input.parentIds || [], input.insertAfterId);

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
   * Calculate the order value for a new thing based on insertion position.
   */
  private async calculateOrder(
    userId: string,
    parentIds: string[],
    insertAfterId?: string
  ): Promise<number> {
    try {
      // Get all things to find siblings
      const allThings = await this.listThingsInternal(userId);

      // Find siblings (things with same first parent, or root things if no parent)
      const parentId = parentIds[0] || null;
      const siblings = allThings
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

      // Find the thing we're inserting after
      const afterIndex = siblings.findIndex(t => t.id === insertAfterId);
      if (afterIndex === -1) {
        // Target not found among siblings, insert at end
        const maxOrder = siblings[siblings.length - 1].order ?? 0;
        return maxOrder + 1;
      }

      const afterThing = siblings[afterIndex];
      const afterOrder = afterThing.order ?? 0;

      if (afterIndex === siblings.length - 1) {
        // Inserting after the last sibling
        return afterOrder + 1;
      }

      // Insert between afterThing and the next sibling
      const nextThing = siblings[afterIndex + 1];
      const nextOrder = nextThing.order ?? afterOrder + 2;

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
  private async listThingsInternal(userId: string): Promise<ThingMetadata[]> {
    try {
      const files = await fs.readdir(THINGS_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      const things: ThingMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(THINGS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: ThingMetadata = JSON.parse(content);

        // Only include user's own things for order calculation
        if (metadata.ownerId === userId) {
          things.push(metadata);
        }
      }

      return things;
    } catch {
      return [];
    }
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

      // Try to read documents
      let documents: ThingDocument[] | undefined;
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
      let documents: ThingDocument[] | undefined;
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
   * Delete a thing and all its children (cascade delete).
   */
  async deleteThing(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      // First, recursively delete all children
      const children = await this.getChildren(id, userId, metadata.workspaceId, true);
      for (const child of children) {
        await this.deleteThing(child.id, userId);
      }

      // Delete associated standalone documents (cascade delete)
      await this.documentService.deleteDocumentsByThingId(id);

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

  // =========================================================================
  // Links
  // =========================================================================

  /**
   * Add a link to a thing.
   */
  async addLink(
    thingId: string,
    userId: string,
    link: Omit<ThingLink, 'id' | 'createdAt'>
  ): Promise<ThingLink | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can add links
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();
      const newLink: ThingLink = {
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
        this.getMetadataPath(thingId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return newLink;
    } catch {
      return null;
    }
  }

  /**
   * Update a link on a thing.
   */
  async updateLink(
    thingId: string,
    userId: string,
    linkId: string,
    updates: Partial<Omit<ThingLink, 'id' | 'createdAt'>>
  ): Promise<ThingLink | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can update links
      if (metadata.ownerId !== userId) {
        return null;
      }

      const linkIndex = metadata.links?.findIndex(l => l.id === linkId) ?? -1;
      if (linkIndex === -1 || !metadata.links) {
        return null;
      }

      const updatedLink: ThingLink = {
        ...metadata.links[linkIndex],
        ...updates,
      };
      metadata.links[linkIndex] = updatedLink;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(thingId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return updatedLink;
    } catch {
      return null;
    }
  }

  /**
   * Remove a link from a thing.
   */
  async removeLink(
    thingId: string,
    userId: string,
    linkId: string
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

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
        this.getMetadataPath(thingId),
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
   * Set properties for a thing (replaces all properties).
   */
  async setProperties(
    thingId: string,
    userId: string,
    properties: Record<string, string> | null
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can update properties
      if (metadata.ownerId !== userId) {
        return false;
      }

      metadata.properties = properties ?? undefined;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(thingId),
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
   * Get documents for a thing.
   */
  async getDocuments(thingId: string, userId: string): Promise<ThingDocument[]> {
    try {
      // Verify access
      const metadata = await this.getThingInternal(thingId);
      if (!metadata || metadata.ownerId !== userId) {
        return [];
      }

      const docsContent = await fs.readFile(this.getDocumentsPath(thingId), 'utf-8');
      return JSON.parse(docsContent);
    } catch {
      return [];
    }
  }

  /**
   * Add a document to a thing.
   */
  async addDocument(
    thingId: string,
    userId: string,
    doc: Omit<ThingDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ThingDocument | null> {
    try {
      // Verify ownership
      const metadata = await this.getThingInternal(thingId);
      if (!metadata || metadata.ownerId !== userId) {
        return null;
      }

      // Load existing documents
      let documents: ThingDocument[] = [];
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(thingId), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        // No documents file yet
      }

      const now = new Date().toISOString();
      const newDoc: ThingDocument = {
        ...doc,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      documents.push(newDoc);

      await fs.writeFile(
        this.getDocumentsPath(thingId),
        JSON.stringify(documents, null, 2),
        'utf-8'
      );

      // Update thing's updatedAt
      await this.touchThing(thingId);

      return newDoc;
    } catch {
      return null;
    }
  }

  /**
   * Update a document on a thing.
   */
  async updateDocument(
    thingId: string,
    userId: string,
    docId: string,
    updates: Partial<Omit<ThingDocument, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ThingDocument | null> {
    try {
      // Verify ownership
      const metadata = await this.getThingInternal(thingId);
      if (!metadata || metadata.ownerId !== userId) {
        return null;
      }

      // Load documents
      let documents: ThingDocument[] = [];
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(thingId), 'utf-8');
        documents = JSON.parse(docsContent);
      } catch {
        return null; // No documents file
      }

      const docIndex = documents.findIndex(d => d.id === docId);
      if (docIndex === -1) {
        return null;
      }

      const updatedDoc: ThingDocument = {
        ...documents[docIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      documents[docIndex] = updatedDoc;

      await fs.writeFile(
        this.getDocumentsPath(thingId),
        JSON.stringify(documents, null, 2),
        'utf-8'
      );

      // Update thing's updatedAt
      await this.touchThing(thingId);

      return updatedDoc;
    } catch {
      return null;
    }
  }

  /**
   * Remove a document from a thing.
   */
  async removeDocument(
    thingId: string,
    userId: string,
    docId: string
  ): Promise<boolean> {
    try {
      // Verify ownership
      const metadata = await this.getThingInternal(thingId);
      if (!metadata || metadata.ownerId !== userId) {
        return false;
      }

      // Load documents
      let documents: ThingDocument[] = [];
      try {
        const docsContent = await fs.readFile(this.getDocumentsPath(thingId), 'utf-8');
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
          await fs.unlink(this.getDocumentsPath(thingId));
        } catch {
          // Ignore
        }
      } else {
        await fs.writeFile(
          this.getDocumentsPath(thingId),
          JSON.stringify(documents, null, 2),
          'utf-8'
        );
      }

      // Update thing's updatedAt
      await this.touchThing(thingId);

      return true;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Visual (icon, color)
  // =========================================================================

  /**
   * Set icon for a thing.
   */
  async setIcon(
    thingId: string,
    userId: string,
    icon: ThingIcon | null
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can update icon
      if (metadata.ownerId !== userId) {
        return false;
      }

      metadata.icon = icon ?? undefined;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(thingId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set color for a thing.
   */
  async setColor(
    thingId: string,
    userId: string,
    color: ThingColor | null
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);

      // Only owner can update color
      if (metadata.ownerId !== userId) {
        return false;
      }

      metadata.color = color ?? undefined;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(thingId),
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
   * Generic key property resolution driven by THING_TYPE_SCHEMAS.
   * Handles inheritance chains automatically based on schema metadata.
   * @param thingId - The thing to resolve properties for
   * @param userId - The user requesting resolution
   * @param visited - Set of already visited thing IDs (for cycle prevention)
   */
  async resolveKeyProperties(
    thingId: string,
    userId: string,
    visited: Set<string> = new Set()
  ): Promise<ResolvedKeyProperties> {
    // Prevent cycles
    if (visited.has(thingId)) {
      return {};
    }
    visited.add(thingId);

    const thing = await this.getThing(thingId, userId, true);
    if (!thing) {
      return {};
    }

    const schema = THING_TYPE_SCHEMAS[thing.type];
    if (!schema) {
      // Unknown type - just return raw properties that match common keys
      const props = thing.properties || {};
      return {
        localPath: props.localPath,
        remoteUrl: props.remoteUrl,
        branch: props.branch || props.defaultBranch,
        url: props.url,
      };
    }

    const props = thing.properties || {};
    const resolved: ResolvedKeyProperties = {};

    // Process each key property defined in schema
    for (const [propName, propDef] of Object.entries(schema.keyProperties)) {
      // Direct value from thing's properties
      if (props[propName] !== undefined) {
        (resolved as Record<string, unknown>)[propName] = props[propName];
      }

      // Handle inherited/derived properties
      if (propDef.inheritPath) {
        const { fromProperty, joinWith } = propDef.inheritPath;
        const parentThingId = props[fromProperty];

        if (parentThingId) {
          // Recursively resolve parent thing's properties
          const parentResolved = await this.resolveKeyProperties(
            parentThingId,
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

          // Track context (the thing that provides physical location)
          const parentThing = await this.getThingInternal(parentThingId);
          if (parentThing) {
            resolved.contextThingId = parentThingId;
            resolved.contextThingName = parentThing.name;
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
  private async touchThing(thingId: string): Promise<void> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(thingId), 'utf-8');
      const metadata: ThingMetadata = JSON.parse(metaContent);
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(
        this.getMetadataPath(thingId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );
    } catch {
      // Ignore errors
    }
  }
}
