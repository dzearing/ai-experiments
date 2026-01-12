/**
 * Workspace constants for limits and permissions.
 * Single source of truth - never hardcode these values elsewhere.
 */

import type { WorkspaceRole, WorkspacePermission } from '../types/workspace.js';

/**
 * Limits for workspace creation and membership.
 */
export const WORKSPACE_LIMITS = {
  /** Maximum number of team workspaces a user can own */
  maxOwned: 20,
  /** Maximum number of team workspaces a user can be a member of (excluding owned) */
  maxMemberOf: 50,
  /** Maximum number of members per team workspace */
  maxMembersPerWorkspace: 100,
} as const;

/**
 * Permissions granted to each workspace role.
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  owner: ['view', 'create', 'edit', 'delete', 'delete_own', 'manage_members', 'delete_workspace'],
  admin: ['view', 'create', 'edit', 'delete', 'delete_own', 'manage_members'],
  member: ['view', 'create', 'edit', 'delete_own'],
  viewer: ['view'],
};

/**
 * Check if a role has a specific permission.
 */
export function roleHasPermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: WorkspaceRole): WorkspacePermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Role hierarchy for comparison (higher number = more permissions).
 */
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/**
 * Check if one role outranks another.
 */
export function roleOutranks(role: WorkspaceRole, otherRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[otherRole];
}

/**
 * Default role for users joining via share link.
 */
export const DEFAULT_JOIN_ROLE: WorkspaceRole = 'member';

/**
 * Personal workspace constants.
 */
export const PERSONAL_WORKSPACE = {
  /** Name shown for personal workspaces (not editable) */
  name: 'Personal',
  /** Description for personal workspaces */
  description: 'Your private workspace',
} as const;
