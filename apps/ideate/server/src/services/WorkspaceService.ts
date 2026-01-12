import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

import type {
  WorkspaceMetadata,
  WorkspacePreview,
  Workspace,
  WorkspaceRole,
  WorkspaceMember,
  WorkspaceApiError,
} from '../types/workspace.js';
import { getPersonalWorkspaceId, isPersonalWorkspaceId } from '../types/workspace.js';
import {
  DEFAULT_JOIN_ROLE,
  PERSONAL_WORKSPACE,
} from '../constants/workspace.js';
import {
  getUserRole,
  hasWorkspaceAccess,
  checkPermission,
  checkPersonalWorkspaceConstraint,
  checkWorkspaceCreationLimit,
  checkMemberAdditionLimit,
  checkMembershipLimit,
  canModifyMemberRole,
} from './PermissionService.js';

// Re-export types for backward compatibility during migration
export type { WorkspaceMetadata, WorkspacePreview, Workspace };

// Base directory for workspace storage
const WORKSPACES_DIR = path.join(homedir(), 'Ideate', 'workspaces');

export interface WorkspaceOperationResult<T> {
  success: boolean;
  data?: T;
  error?: WorkspaceApiError;
}

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

  private async readWorkspaceMetadata(id: string): Promise<WorkspaceMetadata | null> {
    try {
      const content = await fs.readFile(this.getMetadataPath(id), 'utf-8');

      return JSON.parse(content) as WorkspaceMetadata;
    } catch {
      return null;
    }
  }

  private async writeWorkspaceMetadata(metadata: WorkspaceMetadata): Promise<void> {
    await fs.writeFile(
      this.getMetadataPath(metadata.id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Get or create the personal workspace for a user.
   * Personal workspaces are auto-created on first access.
   */
  async getOrCreatePersonalWorkspace(userId: string): Promise<Workspace> {
    const personalId = getPersonalWorkspaceId(userId);
    const existing = await this.readWorkspaceMetadata(personalId);

    if (existing) {
      return { ...existing };
    }

    // Create personal workspace
    const now = new Date().toISOString();
    const metadata: WorkspaceMetadata = {
      id: personalId,
      name: PERSONAL_WORKSPACE.name,
      description: PERSONAL_WORKSPACE.description,
      type: 'personal',
      ownerId: userId,
      members: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.ensureDirectoryExists();
    await this.writeWorkspaceMetadata(metadata);

    return { ...metadata };
  }

  /**
   * List all workspaces for a user (personal + team workspaces they own or are a member of).
   * Ensures personal workspace exists.
   */
  async listWorkspaces(userId: string): Promise<WorkspaceMetadata[]> {
    try {
      await this.ensureDirectoryExists();

      // Ensure personal workspace exists
      await this.getOrCreatePersonalWorkspace(userId);

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

        // Include if user has access
        if (hasWorkspaceAccess(metadata, userId)) {
          workspaces.push(metadata);
        }
      }

      // Sort: personal first, then by updatedAt descending
      workspaces.sort((a, b) => {
        // Personal workspace always first
        if (a.type === 'personal' && b.type !== 'personal') return -1;
        if (a.type !== 'personal' && b.type === 'personal') return 1;

        // Then by updated date
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return workspaces;
    } catch (error) {
      console.error('List workspaces error:', error);

      return [];
    }
  }

  /**
   * Count workspaces owned by and memberships for a user.
   */
  async countUserWorkspaces(userId: string): Promise<{ owned: number; memberOf: number }> {
    try {
      await this.ensureDirectoryExists();

      let files: string[];

      try {
        files = await fs.readdir(WORKSPACES_DIR);
      } catch {
        return { owned: 0, memberOf: 0 };
      }

      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));
      let owned = 0;
      let memberOf = 0;

      for (const file of metaFiles) {
        const metaPath = path.join(WORKSPACES_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: WorkspaceMetadata = JSON.parse(content);

        // Only count team workspaces (personal doesn't count toward limits)
        if (metadata.type === 'team') {
          if (metadata.ownerId === userId) {
            owned++;
          } else if (metadata.members.some((m) => m.userId === userId)) {
            memberOf++;
          }
        }
      }

      return { owned, memberOf };
    } catch (error) {
      console.error('Count workspaces error:', error);

      return { owned: 0, memberOf: 0 };
    }
  }

  /**
   * Create a new team workspace.
   */
  async createWorkspace(
    userId: string,
    name: string,
    description: string = ''
  ): Promise<WorkspaceOperationResult<Workspace>> {
    // Check limits
    const counts = await this.countUserWorkspaces(userId);
    const limitCheck = checkWorkspaceCreationLimit(counts.owned, counts.memberOf);

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: {
          code: limitCheck.errorCode!,
          message: limitCheck.reason!,
        },
      };
    }

    await this.ensureDirectoryExists();

    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: WorkspaceMetadata = {
      id,
      name,
      description,
      type: 'team',
      ownerId: userId,
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await this.writeWorkspaceMetadata(metadata);

    return { success: true, data: { ...metadata } };
  }

  /**
   * Get a workspace by ID.
   */
  async getWorkspace(id: string, userId: string): Promise<Workspace | null> {
    // For personal workspace, ensure it exists
    if (isPersonalWorkspaceId(id)) {
      const personalUserId = id.slice('personal-'.length);

      if (personalUserId === userId) {
        return this.getOrCreatePersonalWorkspace(userId);
      }

      // Cannot access another user's personal workspace
      return null;
    }

    const metadata = await this.readWorkspaceMetadata(id);

    if (!metadata) {
      return null;
    }

    // Check access
    if (!hasWorkspaceAccess(metadata, userId)) {
      return null;
    }

    return { ...metadata };
  }

  /**
   * Update a workspace.
   */
  async updateWorkspace(
    id: string,
    userId: string,
    updates: Partial<Pick<Workspace, 'name' | 'description'>>
  ): Promise<WorkspaceOperationResult<Workspace>> {
    const metadata = await this.readWorkspaceMetadata(id);

    if (!metadata) {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      };
    }

    // Check rename constraint for personal workspace
    if (updates.name !== undefined) {
      const constraint = checkPersonalWorkspaceConstraint(metadata, 'rename');

      if (!constraint.allowed) {
        return {
          success: false,
          error: { code: constraint.errorCode!, message: constraint.reason! },
        };
      }
    }

    // Check permission (owner or admin can update)
    const permCheck = checkPermission(metadata, userId, 'edit');

    if (!permCheck.allowed) {
      return {
        success: false,
        error: { code: permCheck.errorCode!, message: permCheck.reason! },
      };
    }

    // Only owner can update name
    const userRole = getUserRole(metadata, userId);

    if (updates.name !== undefined && userRole?.role !== 'owner') {
      return {
        success: false,
        error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'Only owner can rename workspace' },
      };
    }

    const now = new Date().toISOString();
    const updatedMetadata: WorkspaceMetadata = {
      ...metadata,
      name: updates.name ?? metadata.name,
      description: updates.description ?? metadata.description,
      updatedAt: now,
    };

    await this.writeWorkspaceMetadata(updatedMetadata);

    return { success: true, data: { ...updatedMetadata } };
  }

  /**
   * Delete a workspace.
   */
  async deleteWorkspace(id: string, userId: string): Promise<WorkspaceOperationResult<void>> {
    const metadata = await this.readWorkspaceMetadata(id);

    if (!metadata) {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      };
    }

    // Check personal workspace constraint
    const constraint = checkPersonalWorkspaceConstraint(metadata, 'delete');

    if (!constraint.allowed) {
      return {
        success: false,
        error: { code: constraint.errorCode!, message: constraint.reason! },
      };
    }

    // Only owner can delete
    if (metadata.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'Only owner can delete workspace' },
      };
    }

    try {
      await fs.unlink(this.getMetadataPath(id));

      return { success: true };
    } catch {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Failed to delete workspace' },
      };
    }
  }

  /**
   * Add a member to a workspace.
   */
  async addMember(
    workspaceId: string,
    actorUserId: string,
    newMemberUserId: string,
    role: WorkspaceRole = DEFAULT_JOIN_ROLE
  ): Promise<WorkspaceOperationResult<Workspace>> {
    const metadata = await this.readWorkspaceMetadata(workspaceId);

    if (!metadata) {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      };
    }

    // Check personal workspace constraint
    const constraint = checkPersonalWorkspaceConstraint(metadata, 'add_member');

    if (!constraint.allowed) {
      return {
        success: false,
        error: { code: constraint.errorCode!, message: constraint.reason! },
      };
    }

    // Check permission to manage members
    const permCheck = checkPermission(metadata, actorUserId, 'manage_members');

    if (!permCheck.allowed) {
      return {
        success: false,
        error: { code: permCheck.errorCode!, message: permCheck.reason! },
      };
    }

    // Check member limit
    const limitCheck = checkMemberAdditionLimit(metadata.members.length);

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: { code: limitCheck.errorCode!, message: limitCheck.reason! },
      };
    }

    // Check if already a member
    if (metadata.members.some((m) => m.userId === newMemberUserId)) {
      return {
        success: false,
        error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'User is already a member' },
      };
    }

    // Cannot assign owner role
    if (role === 'owner') {
      return {
        success: false,
        error: { code: 'INVALID_ROLE_CHANGE', message: 'Cannot assign owner role' },
      };
    }

    const now = new Date().toISOString();
    const newMember: WorkspaceMember = {
      userId: newMemberUserId,
      role,
      joinedAt: now,
    };

    const updatedMetadata: WorkspaceMetadata = {
      ...metadata,
      members: [...metadata.members, newMember],
      updatedAt: now,
    };

    await this.writeWorkspaceMetadata(updatedMetadata);

    return { success: true, data: { ...updatedMetadata } };
  }

  /**
   * Remove a member from a workspace.
   */
  async removeMember(
    workspaceId: string,
    actorUserId: string,
    memberUserId: string
  ): Promise<WorkspaceOperationResult<Workspace>> {
    const metadata = await this.readWorkspaceMetadata(workspaceId);

    if (!metadata) {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      };
    }

    // Check permission to modify this member
    const modifyCheck = canModifyMemberRole(metadata, actorUserId, memberUserId);

    if (!modifyCheck.allowed) {
      return {
        success: false,
        error: { code: modifyCheck.errorCode!, message: modifyCheck.reason! },
      };
    }

    const now = new Date().toISOString();
    const updatedMetadata: WorkspaceMetadata = {
      ...metadata,
      members: metadata.members.filter((m) => m.userId !== memberUserId),
      updatedAt: now,
    };

    await this.writeWorkspaceMetadata(updatedMetadata);

    return { success: true, data: { ...updatedMetadata } };
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    workspaceId: string,
    actorUserId: string,
    memberUserId: string,
    newRole: WorkspaceRole
  ): Promise<WorkspaceOperationResult<Workspace>> {
    const metadata = await this.readWorkspaceMetadata(workspaceId);

    if (!metadata) {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      };
    }

    // Check permission to modify this member's role
    const modifyCheck = canModifyMemberRole(metadata, actorUserId, memberUserId, newRole);

    if (!modifyCheck.allowed) {
      return {
        success: false,
        error: { code: modifyCheck.errorCode!, message: modifyCheck.reason! },
      };
    }

    const now = new Date().toISOString();
    const updatedMetadata: WorkspaceMetadata = {
      ...metadata,
      members: metadata.members.map((m) =>
        m.userId === memberUserId ? { ...m, role: newRole } : m
      ),
      updatedAt: now,
    };

    await this.writeWorkspaceMetadata(updatedMetadata);

    return { success: true, data: { ...updatedMetadata } };
  }

  /**
   * Generate or get existing share token for a workspace.
   */
  async generateShareToken(
    workspaceId: string,
    userId: string,
    regenerate: boolean = false
  ): Promise<WorkspaceOperationResult<string>> {
    const metadata = await this.readWorkspaceMetadata(workspaceId);

    if (!metadata) {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      };
    }

    // Check personal workspace constraint
    const constraint = checkPersonalWorkspaceConstraint(metadata, 'share');

    if (!constraint.allowed) {
      return {
        success: false,
        error: { code: constraint.errorCode!, message: constraint.reason! },
      };
    }

    // Only owner can generate share tokens
    if (metadata.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'Only owner can generate share token' },
      };
    }

    // Return existing token if available and not regenerating
    if (metadata.shareToken && !regenerate) {
      return { success: true, data: metadata.shareToken };
    }

    // Generate new token
    const shareToken = uuidv4();
    const updatedMetadata: WorkspaceMetadata = {
      ...metadata,
      shareToken,
      updatedAt: new Date().toISOString(),
    };

    await this.writeWorkspaceMetadata(updatedMetadata);

    return { success: true, data: shareToken };
  }

  /**
   * Get the current share token for a workspace.
   */
  async getShareToken(
    workspaceId: string,
    userId: string
  ): Promise<string | null> {
    const metadata = await this.readWorkspaceMetadata(workspaceId);

    if (!metadata) {
      return null;
    }

    // Only owner can view share token
    if (metadata.ownerId !== userId) {
      return null;
    }

    return metadata.shareToken || null;
  }

  /**
   * Get workspace preview by share token (for join page).
   */
  async getWorkspaceByShareToken(token: string): Promise<WorkspacePreview | null> {
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
            type: metadata.type,
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
   */
  async joinWorkspaceByToken(
    token: string,
    userId: string
  ): Promise<WorkspaceOperationResult<Workspace>> {
    try {
      await this.ensureDirectoryExists();

      // Check user's membership limit
      const counts = await this.countUserWorkspaces(userId);
      const limitCheck = checkMembershipLimit(counts.memberOf);

      if (!limitCheck.allowed) {
        return {
          success: false,
          error: { code: limitCheck.errorCode!, message: limitCheck.reason! },
        };
      }

      let files: string[];

      try {
        files = await fs.readdir(WORKSPACES_DIR);
      } catch {
        return {
          success: false,
          error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        };
      }

      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        const metaPath = path.join(WORKSPACES_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: WorkspaceMetadata = JSON.parse(content);

        if (metadata.shareToken === token) {
          // User is already owner
          if (metadata.ownerId === userId) {
            return { success: true, data: { ...metadata } };
          }

          // User is already a member
          if (metadata.members.some((m) => m.userId === userId)) {
            return { success: true, data: { ...metadata } };
          }

          // Check member limit
          const memberLimitCheck = checkMemberAdditionLimit(metadata.members.length);

          if (!memberLimitCheck.allowed) {
            return {
              success: false,
              error: { code: memberLimitCheck.errorCode!, message: memberLimitCheck.reason! },
            };
          }

          // Add user to members with default role
          const now = new Date().toISOString();
          const newMember: WorkspaceMember = {
            userId,
            role: DEFAULT_JOIN_ROLE,
            joinedAt: now,
          };

          const updatedMetadata: WorkspaceMetadata = {
            ...metadata,
            members: [...metadata.members, newMember],
            updatedAt: now,
          };

          await fs.writeFile(metaPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');

          return { success: true, data: { ...updatedMetadata } };
        }
      }

      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Invalid share token' },
      };
    } catch {
      return {
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Failed to join workspace' },
      };
    }
  }
}
