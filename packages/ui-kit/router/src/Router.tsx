import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { RouterContext } from './context';
import type { Location, NavigationType, NavigateFunction, RouterContextValue } from './context';
import { generateLocationKey } from './generateLocationKey';
import { parseUrl } from './parseUrl';

export interface RouterProps {
  /** Child routes and components */
  children: ReactNode;
  /** Base path for the router (useful for mounting at sub-paths) */
  basePath?: string;
  /** Disable automatic anchor click interception */
  disableLinkInterception?: boolean;
}

/**
 * Create initial location from current browser URL
 * Uses key from history.state if available (for back/forward navigation),
 * otherwise generates a new key
 */
function createLocation(): Location {
  // Try to get the key from history state (preserved during back/forward nav)
  const stateKey = (window.history.state as { key?: string } | null)?.key;

  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    key: stateKey || generateLocationKey(),
  };
}

/**
 * Check if a URL is internal (same origin, relative path)
 */
function isInternalUrl(href: string): boolean {
  if (!href) return false;

  // Relative URLs are internal
  if (href.startsWith('/')) return true;
  if (href.startsWith('./') || href.startsWith('../')) return true;

  // Check if same origin
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Router provider component
 * Manages navigation state and provides context to child components
 */
export function Router({ children, basePath = '', disableLinkInterception = false }: RouterProps) {
  const [location, setLocation] = useState<Location>(createLocation);
  const [navigationType, setNavigationType] = useState<NavigationType>('PUSH');

  // Store initial location key in history.state if not already present
  // This ensures the key is preserved on page refresh
  useEffect(() => {
    const stateKey = (window.history.state as { key?: string } | null)?.key;
    if (!stateKey) {
      window.history.replaceState({ key: location.key }, '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setNavigationType('POP');
      setLocation(createLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate function
  const navigate = useCallback<NavigateFunction>(
    (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
      // Handle numeric navigation (history.go)
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }

      const { pathname, search, hash } = parseUrl(to);
      const url = `${pathname}${search}${hash}`;
      const key = generateLocationKey();

      // Store the key in history.state so it's preserved during back/forward navigation
      const historyState = { ...((options?.state as object) ?? {}), key };

      if (options?.replace) {
        window.history.replaceState(historyState, '', url);
        setNavigationType('REPLACE');
      } else {
        window.history.pushState(historyState, '', url);
        setNavigationType('PUSH');
      }

      setLocation({
        pathname,
        search,
        hash,
        key,
      });
    },
    []
  );

  // Intercept anchor clicks for client-side navigation
  useEffect(() => {
    if (disableLinkInterception) return;

    const handleClick = (e: MouseEvent) => {
      // Don't handle if already prevented (e.g., by Link component)
      if (e.defaultPrevented) return;

      // Only handle left clicks
      if (e.button !== 0) return;

      // Don't handle modified clicks (new tab, etc.)
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;

      // Find the closest anchor element
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      // Get href
      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip if target is _blank or download
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      // Skip if data-no-router attribute is present
      if (anchor.hasAttribute('data-no-router')) return;

      // Only handle internal URLs
      if (!isInternalUrl(href)) return;

      // Prevent default and navigate
      e.preventDefault();
      navigate(href);
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate, disableLinkInterception]);

  // Memoize context value
  const contextValue = useMemo<RouterContextValue>(
    () => ({
      location,
      navigationType,
      navigate,
      params: {},
      basePath,
    }),
    [location, navigationType, navigate, basePath]
  );

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}
