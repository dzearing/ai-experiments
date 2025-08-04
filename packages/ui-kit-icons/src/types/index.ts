import type { SVGProps } from 'react';

/**
 * Props for icon components
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'fill'> {
  /**
   * The size of the icon. Can be a number (pixels) or a string with units.
   * When a number is provided, it applies to both width and height.
   * @default 24
   */
  size?: number | string;
  
  /**
   * Accessible title for the icon. When provided, the icon becomes
   * an img with proper semantics instead of being decorative.
   */
  title?: string;
}