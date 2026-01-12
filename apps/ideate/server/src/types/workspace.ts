/**
 * Workspace types and interfaces.
 * These types are the single source of truth for workspace data structures.
 */

/**
 * Workspace type distinguishes personal from team workspaces.
 * - personal: Auto-created, private, cannot be shared/deleted/renamed
 * - team: User-created, shareable, full CRUD operations
 */
export type WorkspaceType = 'personal' | 'team';

/**
 * Roles within a team workspace.
 * Personal workspaces have no members, so roles don't apply.
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Permissions that can be checked for workspace operations.
 */
export type WorkspacePermission =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'delete_own'
  | 'manage_members'
  | 'delete_workspace';

/**
 * A member of a team workspace with their role.
 */
export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

/**
 * Core workspace metadata stored in the file system.
 */
export interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  ownerId: string;
  members: WorkspaceMember[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Preview information for a workspace (used in share links).
 */
export interface WorkspacePreview {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerName?: string;
}

/**
 * Full workspace data (extends metadata, can include additional computed fields).
 */
export interface Workspace extends WorkspaceMetadata {
  // Additional computed fields can be added here
}

/**
 * Content types that can be copied between workspaces.
 */
export type ContentType = 'topic' | 'idea' | 'document' | 'schema';

/**
 * Request to copy content between workspaces.
 */
export interface CopyContentRequest {
  contentType: ContentType;
  contentId: string;
  targetWorkspaceId: string;
  targetTopicId?: string; // Required when copying ideas
  conflictResolution?: 'replace' | 'rename';
}

/**
 * Error codes for workspace operations.
 */
export type WorkspaceErrorCode =
  | 'WORKSPACE_NOT_FOUND'
  | 'WORKSPACE_ACCESS_DENIED'
  | 'WORKSPACE_LIMIT_REACHED'
  | 'PERSONAL_WORKSPACE_IMMUTABLE'
  | 'MEMBER_LIMIT_REACHED'
  | 'INVALID_ROLE_CHANGE'
  | 'CANNOT_REMOVE_OWNER'
  | 'COPY_TARGET_CONFLICT'
  | 'INVALID_WORKSPACE_TYPE';

/**
 * Structured API error response for workspace operations.
 */
export interface WorkspaceApiError {
  code: WorkspaceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Helper to create a personal workspace ID from a user ID.
 */
export function getPersonalWorkspaceId(userId: string): string {
  return `personal-${userId}`;
}

/**
 * Helper to check if a workspace ID is a personal workspace.
 */
export function isPersonalWorkspaceId(workspaceId: string): boolean {
  return workspaceId.startsWith('personal-');
}

/**
 * Helper to extract user ID from a personal workspace ID.
 */
export function getUserIdFromPersonalWorkspaceId(workspaceId: string): string | null {
  if (!isPersonalWorkspaceId(workspaceId)) {
    return null;
  }

  return workspaceId.slice('personal-'.length);
}
