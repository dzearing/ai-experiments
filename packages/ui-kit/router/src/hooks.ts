import { useContext, useCallback } from 'react';
import { RouterContext, RouteMatchContext } from './context';
import type { Location, NavigationType, NavigateFunction } from './context';
import { isPathActive } from './isPathActive';

/**
 * Get the navigate function for programmatic navigation
 */
export function useNavigate(): NavigateFunction {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useNavigate must be used within a Router');
  }
  return context.navigate;
}

/**
 * Get route parameters from the current matched route
 */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const routeMatch = useContext(RouteMatchContext);
  const routerContext = useContext(RouterContext);

  // Combine params from route match and router context
  const params = {
    ...routerContext?.params,
    ...routeMatch?.params,
  };

  return params as T;
}

/**
 * Get the current location
 */
export function useLocation(): Location {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useLocation must be used within a Router');
  }
  return context.location;
}

/**
 * Get the navigation type of the last navigation
 * Useful for determining animation direction
 */
export function useNavigationType(): NavigationType {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useNavigationType must be used within a Router');
  }
  return context.navigationType;
}

/**
 * Check if a path is currently active
 * @param path The path to check
 * @param exact If true, only exact matches are considered active
 */
export function useIsActive(path: string, exact = false): boolean {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useIsActive must be used within a Router');
  }
  return isPathActive(context.location.pathname, path, exact);
}

/**
 * Get the router context (for internal use and Button integration)
 * Returns null if not inside a Router (doesn't throw)
 */
export function useRouterContext() {
  return useContext(RouterContext);
}

/**
 * Create a click handler for navigation
 * Used by Link and Button components
 */
export function useNavigateHandler(
  to: string,
  options?: { replace?: boolean; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }
) {
  const navigate = useNavigate();

  return useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call original onClick if provided
      options?.onClick?.(e);

      // Don't handle if default was prevented
      if (e.defaultPrevented) return;

      // Don't handle modified clicks (new tab, etc.)
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;

      // Don't handle right clicks
      if (e.button !== 0) return;

      // Prevent default anchor behavior
      e.preventDefault();

      // Navigate
      navigate(to, { replace: options?.replace });
    },
    [navigate, to, options?.replace, options?.onClick]
  );
}
