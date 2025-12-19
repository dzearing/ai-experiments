import { pathToRegex } from './pathToRegex';

export interface PathMatch {
  pattern: string;
  pathname: string;
  params: Record<string, string>;
}

/**
 * Match a pathname against a path pattern
 */
export function matchPath(pattern: string, pathname: string): PathMatch | null {
  const { regex, paramNames } = pathToRegex(pattern);
  const match = pathname.match(regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1] || '';
  });

  return { pattern, pathname, params };
}
