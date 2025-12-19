import { useContext, useMemo } from 'react';
import type { ReactNode, ComponentType } from 'react';
import { RouterContext, OutletContext, RouteMatchContext } from './context';
import { matchPath } from './matchPath';

export interface RouteProps {
  /** Path pattern to match (e.g., "/dashboard", "/doc/:documentId") */
  path?: string;
  /** Component to render when route matches */
  component?: ComponentType;
  /** Alternative to component - render children directly */
  children?: ReactNode;
}

/**
 * Route component for defining routes
 *
 * Usage:
 * ```tsx
 * <Route path="/dashboard" component={Dashboard} />
 * <Route path="/doc/:documentId" component={DocumentEditor} />
 *
 * // Layout routes (no path, wraps children)
 * <Route component={AppLayout}>
 *   <Route path="/dashboard" component={Dashboard} />
 * </Route>
 * ```
 */
export function Route({ path, component: Component, children }: RouteProps) {
  const routerContext = useContext(RouterContext);

  if (!routerContext) {
    throw new Error('Route must be used within a Router');
  }

  const { location } = routerContext;

  // Match the path (null if no path provided - layout route)
  const match = path ? matchPath(path, location.pathname) : null;

  // Create route match context value - always call useMemo to respect hooks rules
  const routeMatchValue = useMemo(
    () =>
      match
        ? {
            pattern: match.pattern,
            params: match.params,
          }
        : null,
    [match?.pattern, match?.params]
  );

  // If no path, this is a layout route - render component with children as outlet
  if (!path) {
    if (Component) {
      return (
        <OutletContext.Provider value={{ children }}>
          <Component />
        </OutletContext.Provider>
      );
    }
    // No path and no component - just render children
    return <>{children}</>;
  }

  // No match - don't render anything
  if (!match || !routeMatchValue) {
    return null;
  }

  // Render matched route
  const content = Component ? <Component /> : children;

  return (
    <RouteMatchContext.Provider value={routeMatchValue}>
      {content}
    </RouteMatchContext.Provider>
  );
}

/**
 * Routes component - renders the first matching child Route
 *
 * Usage:
 * ```tsx
 * <Routes>
 *   <Route path="/" component={Home} />
 *   <Route path="/about" component={About} />
 *   <Route path="*" component={NotFound} />
 * </Routes>
 * ```
 */
export function Routes({ children }: { children: ReactNode }) {
  const routerContext = useContext(RouterContext);

  if (!routerContext) {
    throw new Error('Routes must be used within a Router');
  }

  const { location } = routerContext;

  // Convert children to array and find first match
  const childArray = Array.isArray(children) ? children : [children];

  for (const child of childArray) {
    if (!child || typeof child !== 'object' || !('props' in child)) {
      continue;
    }

    const { path, children: routeChildren } = child.props as RouteProps;

    // Layout route (no path) - always matches, check children
    if (!path) {
      // If it's a layout route with children, recursively check children
      if (routeChildren) {
        const routeChildArray = Array.isArray(routeChildren) ? routeChildren : [routeChildren];
        for (const routeChild of routeChildArray) {
          if (!routeChild || typeof routeChild !== 'object' || !('props' in routeChild)) {
            continue;
          }
          const childProps = routeChild.props as RouteProps;
          if (childProps.path && matchPath(childProps.path, location.pathname)) {
            // Found a matching child route - render the layout
            return child;
          }
        }
      }
      continue;
    }

    // Check if path matches
    if (matchPath(path, location.pathname)) {
      return child;
    }
  }

  return null;
}
