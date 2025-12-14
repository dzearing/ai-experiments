import type { SVGProps } from 'react';

/**
 * Props for icon components
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'fill'> {
  /**
   * Icon size in pixels (applied to both width and height)
   * @default 24
   */
  size?: number | string;

  /**
   * Accessible title for the icon
   * When provided, icon is treated as meaningful content (role="img")
   * When omitted, icon is decorative (aria-hidden="true")
   */
  title?: string;
}

/**
 * Metadata for a single icon
 */
export interface IconMetadata {
  /** Icon identifier (kebab-case, e.g., "arrow-up") */
  name: string;

  /** Human-readable name (e.g., "Arrow Up") */
  displayName: string;

  /** Icon category */
  category: string;

  /** Search keywords for finding this icon */
  keywords: string[];

  /** Related icon names */
  related?: string[];

  /** Component name (PascalCase with Icon suffix, e.g., "ArrowUpIcon") */
  componentName: string;

  /** File path relative to svgs directory */
  filePath: string;
}

/**
 * Category metadata
 */
export interface CategoryMetadata {
  /** Category identifier */
  id: string;

  /** Human-readable name */
  displayName: string;

  /** Description of the category */
  description: string;

  /** Sort order */
  order: number;

  /** Subcategories */
  subcategories?: string[];
}

/**
 * Complete metadata for the icon library
 */
export interface IconLibraryMetadata {
  /** All icons */
  icons: IconMetadata[];

  /** Category definitions */
  categories: CategoryMetadata[];

  /** Total icon count */
  count: number;

  /** Build timestamp */
  buildTime: string;
}
