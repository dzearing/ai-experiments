// Components
export { Router } from './Router';
export type { RouterProps } from './Router';

export { Route, Routes } from './Route';
export type { RouteProps } from './Route';

export { Outlet } from './Outlet';

export { Link } from './Link';
export type { LinkProps } from './Link';

// Hooks
export {
  useNavigate,
  useParams,
  useLocation,
  useNavigationType,
  useIsActive,
  useRouterContext,
  useNavigateHandler,
  useSearchParams,
} from './hooks';

// Types
export type {
  Location,
  NavigationType,
  NavigateFunction,
  RouterContextValue,
  OutletContextValue,
  RouteMatch,
} from './context';

// Context (for advanced usage like Button integration)
export { RouterContext } from './context';

// Utilities (for advanced usage)
export { matchPath } from './matchPath';
export type { PathMatch } from './matchPath';
export { isPathActive } from './isPathActive';
export { parseUrl } from './parseUrl';
export type { ParsedUrl } from './parseUrl';
