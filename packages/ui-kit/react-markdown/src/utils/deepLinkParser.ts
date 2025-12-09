/**
 * Deep link parser utilities
 *
 * Parses and generates hash-based deep links for markdown content.
 * Supports line numbers (#L10, #L10-L20) and heading slugs (#heading-slug).
 */

import type { DeepLink } from '../types/deepLink';

// Regex patterns for deep link formats
const LINE_SINGLE_PATTERN = /^L(\d+)$/;
const LINE_RANGE_PATTERN = /^L(\d+)-L?(\d+)$/;
const HEADING_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/**
 * Parse a hash string into a DeepLink object
 * @param hash - Hash string without the # prefix
 * @returns DeepLink object or null if invalid
 */
export function parseDeepLink(hash: string): DeepLink | null {
  if (!hash) return null;

  // Try single line format: #L10
  const singleMatch = hash.match(LINE_SINGLE_PATTERN);
  if (singleMatch) {
    const line = parseInt(singleMatch[1], 10);
    return {
      type: 'line',
      hash,
      startLine: line,
      endLine: line,
    };
  }

  // Try line range format: #L10-L20 or #L10-20
  const rangeMatch = hash.match(LINE_RANGE_PATTERN);
  if (rangeMatch) {
    const startLine = parseInt(rangeMatch[1], 10);
    const endLine = parseInt(rangeMatch[2], 10);
    return {
      type: 'line-range',
      hash,
      startLine: Math.min(startLine, endLine),
      endLine: Math.max(startLine, endLine),
    };
  }

  // Try heading slug format: #getting-started
  if (HEADING_PATTERN.test(hash)) {
    return {
      type: 'heading',
      hash,
      slug: hash,
    };
  }

  return null;
}

/**
 * Create a hash string from a DeepLink object
 * @param link - DeepLink object
 * @returns Hash string without the # prefix
 */
export function createDeepLink(link: DeepLink): string {
  switch (link.type) {
    case 'line':
      return `L${link.startLine}`;
    case 'line-range':
      return `L${link.startLine}-L${link.endLine}`;
    case 'heading':
      return link.slug || '';
    default:
      return '';
  }
}

/**
 * Generate a URL-safe slug from text (GitHub-compatible)
 * @param text - Text to convert to slug
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse the current URL hash
 * @returns DeepLink object or null
 */
export function parseCurrentHash(): DeepLink | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.slice(1);
  return parseDeepLink(hash);
}

/**
 * Update the URL hash without triggering navigation
 * @param link - DeepLink to set, or null to clear
 */
export function setUrlHash(link: DeepLink | null): void {
  if (typeof window === 'undefined') return;

  if (link) {
    const hash = createDeepLink(link);
    window.history.replaceState(null, '', `#${hash}`);
  } else {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

/**
 * Navigate to a hash (triggers hashchange event)
 * @param link - DeepLink to navigate to
 */
export function navigateToHash(link: DeepLink): void {
  if (typeof window === 'undefined') return;
  window.location.hash = createDeepLink(link);
}

/**
 * Check if a line number is within a deep link range
 * @param lineNumber - Line number to check
 * @param link - DeepLink to check against
 * @returns true if line is within the link's range
 */
export function isLineInRange(lineNumber: number, link: DeepLink | null): boolean {
  if (!link) return false;
  if (link.type === 'heading') return false;

  const start = link.startLine ?? 0;
  const end = link.endLine ?? start;

  return lineNumber >= start && lineNumber <= end;
}
