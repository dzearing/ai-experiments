import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

export interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspacePreview {
  id: string;
  name: string;
  ownerName?: string;
}

export interface Workspace extends WorkspaceMetadata {
  // Additional workspace data can be added here
}

// Base directory for workspace storage
const WORKSPACES_DIR = path.join(homedir(), 'Ideate', 'workspaces');

export class WorkspaceService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(WORKSPACES_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create workspaces directory:', error);
    }
  }

  private getMetadataPath(id: string): string {
    return path.join(WORKSPACES_DIR, `${id}.meta.json`);
  }

  /**
   * List all workspaces for a user (owned or member).
   */
  async listWorkspaces(userId: string): Promise<WorkspaceMetadata[]> {
    try {
      await this.ensureDirectoryExists();

      let files: string[];
      try {
        files = await fs.readdir(WORKSPACES_DIR);
      } catch {
        return [];
      }

      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));
      const workspaces: WorkspaceMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(WORKSPACES_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: WorkspaceMetadata = JSON.parse(content);

        // Include if user is owner or member
        if (
          metadata.ownerId === userId ||
          metadata.memberIds.includes(userId)
        ) {
          workspaces.push(metadata);
        }
      }

      // Sort by updated date, newest first
      workspaces.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return workspaces;
    } catch (error) {
      console.error('List workspaces error:', error);
      return [];
    }
  }

  /**
   * Create a new workspace.
   */
  async createWorkspace(
    userId: string,
    name: string,
    description: string = ''
  ): Promise<Workspace> {
    await this.ensureDirectoryExists();

    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: WorkspaceMetadata = {
      id,
      name,
      description,
      ownerId: userId,
      memberIds: [],
      createdAt: now,
      updatedAt: now,
    };

    // Save metadata
    await fs.writeFile(
      this.getMetadataPath(id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return { ...metadata };
  }

  /**
   * Get a workspace by ID.
   */
  async getWorkspace(id: string, userId: string): Promise<Workspace | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: WorkspaceMetadata = JSON.parse(metaContent);

      // Check access
      if (
        metadata.ownerId !== userId &&
        !metadata.memberIds.includes(userId)
      ) {
        return null;
      }

      return { ...metadata };
    } catch {
      return null;
    }
  }

  /**
   * Update a workspace.
   */
  async updateWorkspace(
    id: string,
    userId: string,
    updates: Partial<Pick<Workspace, 'name' | 'description' | 'memberIds'>>
  ): Promise<Workspace | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: WorkspaceMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      // Update metadata
      const updatedMetadata: WorkspaceMetadata = {
        ...metadata,
        name: updates.name ?? metadata.name,
        description: updates.description ?? metadata.description,
        memberIds: updates.memberIds ?? metadata.memberIds,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return { ...updatedMetadata };
    } catch {
      return null;
    }
  }

  /**
   * Delete a workspace.
   */
  async deleteWorkspace(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: WorkspaceMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      await fs.unlink(this.getMetadataPath(id));

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate or get existing share token for a workspace.
   * Only the owner can generate share tokens.
   */
  async generateShareToken(
    workspaceId: string,
    userId: string,
    regenerate: boolean = false
  ): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(
        this.getMetadataPath(workspaceId),
        'utf-8'
      );
      const metadata: WorkspaceMetadata = JSON.parse(metaContent);

      // Only owner can generate share tokens
      if (metadata.ownerId !== userId) {
        return null;
      }

      // Return existing token if available and not regenerating
      if (metadata.shareToken && !regenerate) {
        return metadata.shareToken;
      }

      // Generate new token
      const shareToken = uuidv4();
      const updatedMetadata: WorkspaceMetadata = {
        ...metadata,
        shareToken,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(
        this.getMetadataPath(workspaceId),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return shareToken;
    } catch {
      return null;
    }
  }

  /**
   * Get the current share token for a workspace.
   * Only the owner can view the share token.
   */
  async getShareToken(
    workspaceId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(
        this.getMetadataPath(workspaceId),
        'utf-8'
      );
      const metadata: WorkspaceMetadata = JSON.parse(metaContent);

      // Only owner can view share token
      if (metadata.ownerId !== userId) {
        return null;
      }

      return metadata.shareToken || null;
    } catch {
      return null;
    }
  }

  /**
   * Get workspace preview by share token (for join page).
   * Does not require authentication.
   */
  async getWorkspaceByShareToken(
    token: string
  ): Promise<WorkspacePreview | null> {
    try {
      await this.ensureDirectoryExists();

      let files: string[];
      try {
        files = await fs.readdir(WORKSPACES_DIR);
      } catch {
        return null;
      }

      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        const metaPath = path.join(WORKSPACES_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: WorkspaceMetadata = JSON.parse(content);

        if (metadata.shareToken === token) {
          return {
            id: metadata.id,
            name: metadata.name,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Join a workspace using a share token.
   * Adds the user to the workspace's memberIds.
   */
  async joinWorkspaceByToken(
    token: string,
    userId: string
  ): Promise<Workspace | null> {
    try {
      await this.ensureDirectoryExists();

      let files: string[];
      try {
        files = await fs.readdir(WORKSPACES_DIR);
      } catch {
        return null;
      }

      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        const metaPath = path.join(WORKSPACES_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: WorkspaceMetadata = JSON.parse(content);

        if (metadata.shareToken === token) {
          // User is already owner
          if (metadata.ownerId === userId) {
            return { ...metadata };
          }

          // User is already a member
          if (metadata.memberIds.includes(userId)) {
            return { ...metadata };
          }

          // Add user to members
          const updatedMetadata: WorkspaceMetadata = {
            ...metadata,
            memberIds: [...metadata.memberIds, userId],
            updatedAt: new Date().toISOString(),
          };

          await fs.writeFile(metaPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');

          return { ...updatedMetadata };
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
