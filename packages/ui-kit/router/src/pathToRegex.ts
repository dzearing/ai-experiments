export interface PathToRegexResult {
  regex: RegExp;
  paramNames: string[];
}

/**
 * Convert a path pattern to a regex and extract param names
 * Supports:
 * - Static segments: /dashboard
 * - Dynamic segments: /doc/:documentId
 * - Wildcard: /files/*
 */
export function pathToRegex(pattern: string): PathToRegexResult {
  const paramNames: string[] = [];

  let regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    })
    .replace(/\*/g, '(.*)');

  if (!pattern.endsWith('*')) {
    regexStr = `^${regexStr}$`;
  } else {
    regexStr = `^${regexStr}`;
  }

  return { regex: new RegExp(regexStr), paramNames };
}
