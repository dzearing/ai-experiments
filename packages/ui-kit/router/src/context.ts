import { createContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Navigation type for history tracking
 * Uses uppercase to be compatible with React Router's format
 */
export type NavigationType = 'PUSH' | 'POP' | 'REPLACE';

/**
 * Location state representing current URL
 */
export interface Location {
  /** Current pathname */
  pathname: string;
  /** Query string including ? */
  search: string;
  /** Hash including # */
  hash: string;
  /** Unique key for this location entry */
  key: string;
}

/**
 * Navigate function signature
 */
export type NavigateFunction = {
  (to: string, options?: { replace?: boolean; state?: unknown }): void;
  (delta: number): void;
};

/**
 * Router context value
 */
export interface RouterContextValue {
  /** Current location */
  location: Location;
  /** Navigation type of the last navigation */
  navigationType: NavigationType;
  /** Navigate to a new location */
  navigate: NavigateFunction;
  /** Route params from the current matched route */
  params: Record<string, string>;
  /** Base path for the router (for nested routers) */
  basePath: string;
}

/**
 * Outlet context for nested routes
 */
export interface OutletContextValue {
  /** The child element to render */
  children: ReactNode;
}

/**
 * Route match info passed down through context
 */
export interface RouteMatch {
  /** The matched path pattern */
  pattern: string;
  /** Extracted route parameters */
  params: Record<string, string>;
}

// Create contexts with null defaults (must be used within providers)
export const RouterContext = createContext<RouterContextValue | null>(null);
RouterContext.displayName = 'RouterContext';

export const OutletContext = createContext<OutletContextValue | null>(null);
OutletContext.displayName = 'OutletContext';

export const RouteMatchContext = createContext<RouteMatch | null>(null);
RouteMatchContext.displayName = 'RouteMatchContext';
