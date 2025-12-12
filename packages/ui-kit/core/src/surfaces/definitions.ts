/**
 * Token role and surface definitions
 *
 * This module provides:
 * 1. Token role definitions (e.g., "page", "control", "success") - from theme-rules.json
 * 2. Surface type definitions (e.g., "raised", "sunken", "inverted") - tonal surfaces
 *
 * Roles are semantic categories in token names (--page-bg, --control-text).
 * Surfaces are CSS classes that reset and override tokens (.surface.raised).
 */

import type {
  Surface,
  SurfaceType,
  TonalSurface,
  ContainerSurface,
  ControlSurface,
  ControlRole,
  FeedbackSurface,
} from './types';
import themeRules from '../themes/schema/theme-rules.json';

// ============================================================================
// TONAL SURFACES (new system)
// ============================================================================

/**
 * All tonal surface types
 */
export const tonalSurfaces: readonly TonalSurface[] = [
  'base',
  'raised',
  'sunken',
  'soft',
  'softer',
  'strong',
  'stronger',
  'inverted',
  'primary',
] as const;

/**
 * All surface types (tonal + feedback)
 */
export const surfaceTypes: readonly SurfaceType[] = [
  ...tonalSurfaces,
  'success',
  'warning',
  'danger',
  'info',
] as const;

/**
 * Check if a value is a valid surface type
 */
export function isSurfaceType(value: string): value is SurfaceType {
  return surfaceTypes.includes(value as SurfaceType);
}

/**
 * Check if a value is a tonal surface
 */
export function isTonalSurface(value: string): value is TonalSurface {
  return tonalSurfaces.includes(value as TonalSurface);
}

// ============================================================================
// TOKEN ROLES (existing system - from theme-rules.json)
// ============================================================================

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
 *
 * New system: Returns "surface {modifier}" for use with the .surface base class
 * Example: surfaceClassName('raised') => 'surface raised'
 *
 * For feedback surfaces, also supports the new format:
 * Example: surfaceClassName('success') => 'surface success'
 *
 * @deprecated For new code, use the class pattern directly: className="surface raised"
 */
export function surfaceClassName(name: string): string {
  // New tonal/feedback surfaces use "surface {name}" format
  if (isSurfaceType(name)) {
    return `surface ${name}`;
  }
  // Legacy container surfaces use "surface-{name}" format
  return `surface-${name}`;
}

/**
 * Get CSS classes for a surface (new system)
 * Returns an object for use with classnames libraries or template strings
 *
 * Example: getSurfaceClasses('raised') => { surface: true, raised: true }
 */
export function getSurfaceClasses(surface: SurfaceType): Record<string, boolean> {
  return {
    surface: true,
    [surface]: true,
  };
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
