/**
 * Token role definitions - derived from theme-rules.json
 *
 * This module reads token role definitions from the theme rules configuration,
 * ensuring a single source of truth for all role types and their tokens.
 *
 * NOTE: "Role" is the semantic category in token names (e.g., "page" in --page-bg).
 * "Surface" is a CSS class that redefines tokens in a scoped area (e.g., .surface-sidebar).
 * This file defines ROLES, not surfaces.
 */

import type { Surface, ContainerSurface, ControlSurface, FeedbackSurface } from './types';
import themeRules from '../themes/schema/theme-rules.json';

// Extract role names from theme-rules.json
const containerTypes = themeRules.roles.container.types;
const controlTypes = themeRules.roles.control.types;
const feedbackTypes = themeRules.roles.feedback.types;

/**
 * All container roles (from theme-rules.json)
 */
export const containerRoles: readonly ContainerSurface[] =
  Object.keys(containerTypes) as ContainerSurface[];

/**
 * All control roles (from theme-rules.json)
 */
export const controlRoles: readonly ControlSurface[] =
  Object.keys(controlTypes) as ControlSurface[];

/**
 * All feedback roles (from theme-rules.json)
 */
export const feedbackRoles: readonly FeedbackSurface[] =
  Object.keys(feedbackTypes) as FeedbackSurface[];

/**
 * All token roles
 */
export const roles: readonly Surface[] = [
  ...containerRoles,
  ...controlRoles,
  ...feedbackRoles,
] as const;

// Legacy aliases for backwards compatibility
export const containerSurfaces = containerRoles;
export const controlSurfaces = controlRoles;
export const feedbackSurfaces = feedbackRoles;
export const surfaces = roles;

/**
 * Get the role configuration from theme-rules.json
 */
function getRoleConfig(role: Surface): { tokens: string[] } | undefined {
  if (role in containerTypes) {
    return containerTypes[role as keyof typeof containerTypes] as { tokens: string[] };
  }
  if (role in controlTypes) {
    return controlTypes[role as keyof typeof controlTypes] as { tokens: string[] };
  }
  if (role in feedbackTypes) {
    return feedbackTypes[role as keyof typeof feedbackTypes] as { tokens: string[] };
  }
  return undefined;
}

/**
 * Get token names for a role (from theme-rules.json)
 */
export function getTokenNamesForRole(role: Surface): readonly string[] {
  const config = getRoleConfig(role);
  return config?.tokens ?? [];
}

// Legacy alias
export const getTokenNamesForSurface = getTokenNamesForRole;

/**
 * Generate CSS variable name for a role token
 */
export function roleTokenName(role: Surface, property: string): string {
  return `--${role}-${property}`;
}

// Legacy alias
export const surfaceTokenName = roleTokenName;

/**
 * CSS class name for a surface (used to scope token overrides)
 * Note: This creates actual surface classes, not role references
 */
export function surfaceClassName(name: string): string {
  return `surface-${name}`;
}

/**
 * Check if a string is a valid role
 */
export function isRole(value: string): value is Surface {
  return roles.includes(value as Surface);
}

// Legacy alias
export const isSurface = isRole;

/**
 * Get role description from theme-rules.json
 */
export function getRoleDescription(role: Surface): string | undefined {
  const config = getRoleConfig(role);
  return (config as { description?: string })?.description;
}

// Legacy alias
export const getSurfaceDescription = getRoleDescription;

/**
 * Get all role metadata from theme-rules.json
 */
export function getRoleMetadata(): Array<{
  name: Surface;
  category: 'container' | 'control' | 'feedback';
  description?: string;
  tokens: string[];
}> {
  const result: Array<{
    name: Surface;
    category: 'container' | 'control' | 'feedback';
    description?: string;
    tokens: string[];
  }> = [];

  for (const [name, config] of Object.entries(containerTypes)) {
    const c = config as { description?: string; tokens: string[] };
    result.push({
      name: name as Surface,
      category: 'container',
      description: c.description,
      tokens: c.tokens,
    });
  }

  for (const [name, config] of Object.entries(controlTypes)) {
    const c = config as { description?: string; tokens: string[] };
    result.push({
      name: name as Surface,
      category: 'control',
      description: c.description,
      tokens: c.tokens,
    });
  }

  for (const [name, config] of Object.entries(feedbackTypes)) {
    const c = config as { description?: string; tokens: string[] };
    result.push({
      name: name as Surface,
      category: 'feedback',
      description: c.description,
      tokens: c.tokens,
    });
  }

  return result;
}

// Legacy alias
export const getSurfaceMetadata = getRoleMetadata;
