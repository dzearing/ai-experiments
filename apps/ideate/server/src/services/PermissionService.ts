/**
 * PermissionService handles role-based access control for workspaces.
 * All permission checks should go through this service - no inline checks.
 */

import type {
  WorkspaceMetadata,
  WorkspaceRole,
  WorkspacePermission,
  WorkspaceErrorCode,
} from '../types/workspace.js';
import {
  roleHasPermission,
  WORKSPACE_LIMITS,
  ROLE_HIERARCHY,
} from '../constants/workspace.js';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  errorCode?: WorkspaceErrorCode;
}

export interface UserWorkspaceRole {
  role: WorkspaceRole;
  isOwner: boolean;
  isMember: boolean;
}

/**
 * Get the user's role within a workspace.
 */
export function getUserRole(workspace: WorkspaceMetadata, userId: string): UserWorkspaceRole | null {
  // Owner always has owner role
  if (workspace.ownerId === userId) {
    return { role: 'owner', isOwner: true, isMember: true };
  }

  // Find in members list
  const member = workspace.members.find((m) => m.userId === userId);

  if (member) {
    return { role: member.role, isOwner: false, isMember: true };
  }

  return null;
}

/**
 * Check if a user has access to a workspace (any role).
 */
export function hasWorkspaceAccess(workspace: WorkspaceMetadata, userId: string): boolean {
  return getUserRole(workspace, userId) !== null;
}

/**
 * Check if a user has a specific permission in a workspace.
 */
export function checkPermission(
  workspace: WorkspaceMetadata,
  userId: string,
  permission: WorkspacePermission
): PermissionCheckResult {
  const userRole = getUserRole(workspace, userId);

  if (!userRole) {
    return {
      allowed: false,
      reason: 'User does not have access to this workspace',
      errorCode: 'WORKSPACE_ACCESS_DENIED',
    };
  }

  if (roleHasPermission(userRole.role, permission)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Role '${userRole.role}' does not have permission '${permission}'`,
    errorCode: 'WORKSPACE_ACCESS_DENIED',
  };
}

/**
 * Check if a user can modify another user's role.
 */
export function canModifyMemberRole(
  workspace: WorkspaceMetadata,
  actorUserId: string,
  targetUserId: string,
  newRole?: WorkspaceRole
): PermissionCheckResult {
  // Cannot modify owner
  if (workspace.ownerId === targetUserId) {
    return {
      allowed: false,
      reason: 'Cannot modify the owner\'s role',
      errorCode: 'CANNOT_REMOVE_OWNER',
    };
  }

  const actorRole = getUserRole(workspace, actorUserId);

  if (!actorRole) {
    return {
      allowed: false,
      reason: 'Actor does not have access to this workspace',
      errorCode: 'WORKSPACE_ACCESS_DENIED',
    };
  }

  // Must have manage_members permission
  if (!roleHasPermission(actorRole.role, 'manage_members')) {
    return {
      allowed: false,
      reason: 'Does not have permission to manage members',
      errorCode: 'WORKSPACE_ACCESS_DENIED',
    };
  }

  // Cannot promote to owner (only owner can transfer ownership)
  if (newRole === 'owner') {
    return {
      allowed: false,
      reason: 'Cannot promote to owner - use transfer ownership instead',
      errorCode: 'INVALID_ROLE_CHANGE',
    };
  }

  // Admins cannot modify other admins
  if (actorRole.role === 'admin') {
    const targetRole = getUserRole(workspace, targetUserId);

    if (targetRole && ROLE_HIERARCHY[targetRole.role] >= ROLE_HIERARCHY['admin']) {
      return {
        allowed: false,
        reason: 'Admins cannot modify other admins',
        errorCode: 'INVALID_ROLE_CHANGE',
      };
    }
  }

  return { allowed: true };
}

/**
 * Check if a user can delete content.
 * Users with 'delete' can delete any content.
 * Users with 'delete_own' can only delete their own content.
 */
export function canDeleteContent(
  workspace: WorkspaceMetadata,
  userId: string,
  contentOwnerId: string
): PermissionCheckResult {
  const userRole = getUserRole(workspace, userId);

  if (!userRole) {
    return {
      allowed: false,
      reason: 'User does not have access to this workspace',
      errorCode: 'WORKSPACE_ACCESS_DENIED',
    };
  }

  // Has full delete permission
  if (roleHasPermission(userRole.role, 'delete')) {
    return { allowed: true };
  }

  // Has delete_own and is the owner
  if (roleHasPermission(userRole.role, 'delete_own') && contentOwnerId === userId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Does not have permission to delete this content',
    errorCode: 'WORKSPACE_ACCESS_DENIED',
  };
}

/**
 * Check workspace creation limits.
 */
export function checkWorkspaceCreationLimit(
  ownedCount: number,
  _memberOfCount: number
): PermissionCheckResult {
  if (ownedCount >= WORKSPACE_LIMITS.maxOwned) {
    return {
      allowed: false,
      reason: `Maximum owned workspaces limit reached (${WORKSPACE_LIMITS.maxOwned})`,
      errorCode: 'WORKSPACE_LIMIT_REACHED',
    };
  }

  return { allowed: true };
}

/**
 * Check member addition limits.
 */
export function checkMemberAdditionLimit(
  currentMemberCount: number
): PermissionCheckResult {
  if (currentMemberCount >= WORKSPACE_LIMITS.maxMembersPerWorkspace) {
    return {
      allowed: false,
      reason: `Maximum members limit reached (${WORKSPACE_LIMITS.maxMembersPerWorkspace})`,
      errorCode: 'MEMBER_LIMIT_REACHED',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can join more workspaces.
 */
export function checkMembershipLimit(
  currentMembershipCount: number
): PermissionCheckResult {
  if (currentMembershipCount >= WORKSPACE_LIMITS.maxMemberOf) {
    return {
      allowed: false,
      reason: `Maximum workspace membership limit reached (${WORKSPACE_LIMITS.maxMemberOf})`,
      errorCode: 'WORKSPACE_LIMIT_REACHED',
    };
  }

  return { allowed: true };
}

/**
 * Check if a personal workspace operation is allowed.
 * Personal workspaces cannot be renamed, shared, deleted, or have members.
 */
export function checkPersonalWorkspaceConstraint(
  workspace: WorkspaceMetadata,
  operation: 'rename' | 'share' | 'delete' | 'add_member'
): PermissionCheckResult {
  if (workspace.type !== 'personal') {
    return { allowed: true };
  }

  const operationMessages: Record<typeof operation, string> = {
    rename: 'Personal workspaces cannot be renamed',
    share: 'Personal workspaces cannot be shared',
    delete: 'Personal workspaces cannot be deleted',
    add_member: 'Personal workspaces cannot have members',
  };

  return {
    allowed: false,
    reason: operationMessages[operation],
    errorCode: 'PERSONAL_WORKSPACE_IMMUTABLE',
  };
}
