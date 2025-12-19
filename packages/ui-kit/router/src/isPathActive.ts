/**
 * Check if a pathname starts with a given path (for active detection)
 */
export function isPathActive(currentPath: string, targetPath: string, exact = false): boolean {
  const normalize = (p: string) => (p === '/' ? p : p.replace(/\/$/, ''));
  const current = normalize(currentPath);
  const target = normalize(targetPath);

  if (exact) {
    return current === target;
  }

  if (current === target) {
    return true;
  }

  return current.startsWith(target + '/');
}
