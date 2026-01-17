/**
 * Helper functions for safely extracting typed values from Express requests.
 *
 * Express 5 types define params, query, and header values as `string | string[]`
 * which requires explicit handling when functions expect plain strings.
 */

/**
 * Safely extracts a string value from a param/query/header that may be string or string[].
 * If the value is an array, returns the first element.
 * If the value is undefined or empty array, returns undefined.
 */
export function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

/**
 * Safely extracts a required string value.
 * Throws an error if the value is undefined.
 */
export function asRequiredString(value: string | string[] | undefined, fieldName: string): string {
  const result = asString(value);

  if (result === undefined) {
    throw new Error(`${fieldName} is required`);
  }

  return result;
}
