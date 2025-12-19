/**
 * Generate a unique key for location tracking
 */
export function generateLocationKey(): string {
  return Math.random().toString(36).substring(2, 10);
}
