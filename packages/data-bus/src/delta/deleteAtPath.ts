/**
 * Deletes a value at a nested path, returning a new object.
 * Preserves immutability.
 *
 * @param obj The source object.
 * @param path Array of keys representing the path.
 * @returns A new object with the value deleted at the path.
 */
export function deleteAtPath<T>(obj: T, path: string[]): T {
  if (path.length === 0) {
    return undefined as unknown as T;
  }

  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  const [key, ...rest] = path;

  if (rest.length === 0) {
    delete (result as Record<string, unknown>)[key];
  } else {
    const current = (obj as Record<string, unknown>)[key];

    if (current !== undefined) {
      (result as Record<string, unknown>)[key] = deleteAtPath(current, rest);
    }
  }

  return result as T;
}
