/**
 * Creates a path key from a path array.
 *
 * @param path Array of path segments.
 * @returns A string key for the path.
 */
export function createPathKey(path: string[]): string {
  return path.join('/');
}
