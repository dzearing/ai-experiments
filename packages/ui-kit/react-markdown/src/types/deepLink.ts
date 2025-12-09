/**
 * Deep link types for hash-based navigation
 *
 * Supported formats:
 * - #L10 - Single line
 * - #L10-L20 - Line range
 * - #heading-slug - Heading anchor
 */

export type DeepLinkType = 'line' | 'line-range' | 'heading';

export interface DeepLink {
  /** Type of deep link */
  type: DeepLinkType;
  /** Original hash string (without #) */
  hash: string;
  /** Start line (for line/line-range types) */
  startLine?: number;
  /** End line (for line-range type) */
  endLine?: number;
  /** Heading slug (for heading type) */
  slug?: string;
}

export interface DeepLinkOptions {
  /** Callback when hash changes */
  onHashChange?: (link: DeepLink | null) => void;
  /** Duration of highlight animation in ms */
  highlightDuration?: number;
  /** Scroll offset from top in px */
  scrollOffset?: number;
  /** Enable smooth scrolling */
  smoothScroll?: boolean;
}

export interface DeepLinkState {
  /** Currently active deep link */
  activeLink: DeepLink | null;
  /** Whether currently highlighting */
  isHighlighting: boolean;
}
