/**
 * Sets a value at a nested path in an object, returning a new object.
 * Creates intermediate objects as needed. Preserves immutability.
 *
 * @param obj The source object.
 * @param path Array of keys representing the path.
 * @param value The value to set.
 * @returns A new object with the value set at the path.
 */
export function setAtPath<T>(obj: T, path: string[], value: unknown): T {
  if (path.length === 0) {
    return value as T;
  }

  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  const [key, ...rest] = path;

  if (rest.length === 0) {
    (result as Record<string, unknown>)[key] = value;
  } else {
    const current = (obj as Record<string, unknown>)[key] ?? {};

    (result as Record<string, unknown>)[key] = setAtPath(current, rest, value);
  }

  return result as T;
}
