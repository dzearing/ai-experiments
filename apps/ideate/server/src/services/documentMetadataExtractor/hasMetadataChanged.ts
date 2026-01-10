import type { DocumentMetadata } from './types.js';

/**
 * Compares two metadata objects to determine if meaningful changes occurred.
 *
 * @param oldMetadata The previous metadata.
 * @param newMetadata The new metadata.
 * @returns True if metadata has meaningfully changed.
 */
export function hasMetadataChanged(
  oldMetadata: DocumentMetadata,
  newMetadata: DocumentMetadata,
): boolean {
  // Title changed
  if (oldMetadata.title !== newMetadata.title) {
    return true;
  }

  // Summary changed
  if (oldMetadata.summary !== newMetadata.summary) {
    return true;
  }

  // Tags changed (compare as sets)
  const oldTags = new Set(oldMetadata.tags);
  const newTags = new Set(newMetadata.tags);

  if (oldTags.size !== newTags.size) {
    return true;
  }

  for (const tag of newTags) {
    if (!oldTags.has(tag)) {
      return true;
    }
  }

  return false;
}
