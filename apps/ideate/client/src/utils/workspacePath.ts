/**
 * Shared utilities for parsing workspace-scoped URL paths.
 * Used by AppLayout and WorkspaceSwitcher to maintain consistent navigation behavior.
 */

/** Top-level navigation pivots */
export type Pivot = 'topics' | 'ideas' | 'documents' | 'chat';

/** All valid pivot values for regex matching */
const PIVOT_PATTERN = 'topics|ideas|documents|chat';

/** Regex to match workspace-scoped routes: /:workspaceId/:pivot */
const WORKSPACE_PATH_REGEX = new RegExp(`^/([^/]+)/(${PIVOT_PATTERN})`);

export interface WorkspacePathInfo {
  workspaceId: string | null;
  pivot: Pivot | null;
}

/**
 * Extracts the workspace ID and pivot from a pathname.
 * Returns null values if not on a workspace-scoped route.
 *
 * @example
 * parseWorkspacePath('/personal-123/topics') // { workspaceId: 'personal-123', pivot: 'topics' }
 * parseWorkspacePath('/all/chat') // { workspaceId: 'all', pivot: 'chat' }
 * parseWorkspacePath('/settings') // { workspaceId: null, pivot: null }
 */
export function parseWorkspacePath(pathname: string): WorkspacePathInfo {
  const match = pathname.match(WORKSPACE_PATH_REGEX);

  if (match) {
    return {
      workspaceId: match[1],
      pivot: match[2] as Pivot,
    };
  }

  return { workspaceId: null, pivot: null };
}

/**
 * Extracts just the current pivot from a pathname.
 * Returns 'topics' as the default if not on a workspace-scoped route.
 */
export function getCurrentPivot(pathname: string): Pivot {
  const { pivot } = parseWorkspacePath(pathname);

  return pivot ?? 'topics';
}

/**
 * Extracts just the workspace ID from a pathname.
 * Returns null if not on a workspace-scoped route.
 */
export function getCurrentWorkspaceId(pathname: string): string | null {
  const { workspaceId } = parseWorkspacePath(pathname);

  return workspaceId;
}
