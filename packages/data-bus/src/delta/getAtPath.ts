/**
 * Gets a value at a nested path in an object.
 *
 * @param obj The object to traverse.
 * @param path Array of keys representing the path.
 * @returns The value at the path, or undefined if not found.
 */
export function getAtPath(obj: unknown, path: string[]): unknown {
  let current = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
