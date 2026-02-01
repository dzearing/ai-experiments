import type { SVGProps } from 'react';

/**
 * Supported discrete sizes for product icons.
 * These sizes have pixel-perfect SVG variants when available.
 */
export type ProductIconSize = 16 | 24 | 32 | 48;

/**
 * Props for product icon components.
 * Product icons support multi-color fills (not currentColor) and discrete sizes.
 */
export interface ProductIconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  /**
   * Icon size in pixels. Product icons support specific sizes
   * for pixel-perfect rendering: 16, 24, 32, 48.
   * Non-standard sizes will use the nearest available size.
   * @default 24
   */
  size?: ProductIconSize | number;

  /**
   * Accessible title for the icon.
   * When provided, icon is treated as meaningful content (role="img")
   * When omitted, icon is decorative (aria-hidden="true")
   */
  title?: string;
}

/**
 * Metadata for a product icon.
 * Used during build and for documentation/search.
 */
export interface ProductIconMetadata {
  /** Icon name in kebab-case (e.g., "word", "analyst-agent") */
  name: string;

  /** Display name for UI (e.g., "Word", "Analyst Agent") */
  displayName: string;

  /** Icon category */
  category: 'microsoft' | 'agents';

  /** Search keywords */
  keywords: string[];

  /** React component name (e.g., "WordIcon", "AnalystAgentIcon") */
  componentName: string;

  /** Available sizes for this icon (16, 24, 32, 48) */
  sizes: ProductIconSize[];
}

/**
 * Internal type for size-mapped SVG content.
 * Maps each available size to its SVG inner content.
 */
export type SizeMappedContent = Partial<Record<ProductIconSize, string>>;
