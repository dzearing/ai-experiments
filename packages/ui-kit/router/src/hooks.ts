import { useContext, useCallback, useState, useEffect } from 'react';
import { RouterContext, RouteMatchContext } from './context';
import type { Location, NavigationType, NavigateFunction } from './context';
import { isPathActive } from './isPathActive';

type SearchParamsSetter = (
  newParams: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
  options?: { replace?: boolean }
) => void;

/**
 * Hook for reading and writing URL search params without triggering router re-renders.
 *
 * Unlike useLocation(), this hook manages search params independently from the router,
 * allowing you to update the URL without causing component tree re-renders.
 *
 * @example
 * ```tsx
 * const [searchParams, setSearchParams] = useSearchParams();
 * const tab = searchParams.get('tab') || 'default';
 *
 * const handleTabChange = (newTab: string) => {
 *   setSearchParams(params => {
 *     params.set('tab', newTab);
 *     return params;
 *   });
 * };
 * ```
 */
export function useSearchParams(): [URLSearchParams, SearchParamsSetter] {
  // Initialize from current URL
  const [searchParams, setSearchParamsState] = useState(
    () => new URLSearchParams(window.location.search)
  );

  // Listen for popstate events (browser back/forward) to sync state
  useEffect(() => {
    const handlePopState = () => {
      setSearchParamsState(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSearchParams = useCallback<SearchParamsSetter>((newParams, options) => {
    const nextParams = typeof newParams === 'function'
      ? newParams(new URLSearchParams(window.location.search))
      : newParams;

    // Update local state
    setSearchParamsState(nextParams);

    // Update URL without triggering router
    const search = nextParams.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;

    if (options?.replace === false) {
      window.history.pushState(window.history.state, '', newUrl);
    } else {
      // Default to replace to avoid polluting history
      window.history.replaceState(window.history.state, '', newUrl);
    }
  }, []);

  return [searchParams, setSearchParams];
}

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
