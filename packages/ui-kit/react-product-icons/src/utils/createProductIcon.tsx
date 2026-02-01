import { forwardRef } from 'react';
import type { ProductIconProps, ProductIconSize, SizeMappedContent } from './types';

/**
 * Standard product icon sizes in order for nearest-size lookup.
 */
const STANDARD_SIZES: ProductIconSize[] = [16, 24, 32, 48];

/**
 * Get the nearest available size for a requested size.
 * Falls back to the closest standard size.
 */
function getNearestSize(requestedSize: number, availableSizes: ProductIconSize[]): ProductIconSize {
  if (availableSizes.length === 0) {
    return 24; // Default fallback
  }

  // If exact match exists, use it
  if (availableSizes.includes(requestedSize as ProductIconSize)) {
    return requestedSize as ProductIconSize;
  }

  // Find the nearest available size
  let nearest = availableSizes[0];
  let minDiff = Math.abs(requestedSize - nearest);

  for (const size of availableSizes) {
    const diff = Math.abs(requestedSize - size);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = size;
    }
  }

  return nearest;
}

/**
 * Options for creating a product icon component.
 */
export interface CreateProductIconOptions {
  /** Display name for the component (used in React DevTools) */
  displayName: string;

  /** Default viewBox for the SVG (typically "0 0 {size} {size}") */
  viewBox?: string;

  /** Map of size to SVG inner content */
  content: SizeMappedContent;
}

/**
 * Factory function to create a product icon component.
 *
 * Product icons differ from UI icons in that they:
 * - Preserve multi-color fills (not currentColor)
 * - Support discrete sizes (16, 24, 32, 48) with pixel-perfect variants
 * - May have different SVG content per size
 *
 * @param options - Icon configuration
 * @returns A React component for the product icon
 *
 * @example
 * ```tsx
 * const WordIcon = createProductIcon({
 *   displayName: 'WordIcon',
 *   content: {
 *     16: '<path fill="#185ABD" d="..." />',
 *     24: '<path fill="#185ABD" d="..." />',
 *     32: '<path fill="#185ABD" d="..." />',
 *     48: '<path fill="#185ABD" d="..." />',
 *   },
 * });
 * ```
 */
export function createProductIcon(options: CreateProductIconOptions) {
  const { displayName, content } = options;

  // Get available sizes from the content map
  const availableSizes = STANDARD_SIZES.filter(
    (size) => content[size] !== undefined
  );

  const ProductIcon = forwardRef<SVGSVGElement, ProductIconProps>(
    ({ size = 24, title, className, style, ...props }, ref) => {
      const hasTitle = Boolean(title);

      // Find the best SVG content for the requested size
      const nearestSize = getNearestSize(size, availableSizes);
      const svgContent = content[nearestSize] || '';
      const viewBox = `0 0 ${nearestSize} ${nearestSize}`;

      // Build the inner HTML, optionally including title
      const innerHtml = hasTitle
        ? `<title>${title}</title>${svgContent}`
        : svgContent;

      return (
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          width={size}
          height={size}
          className={className}
          style={style}
          aria-hidden={hasTitle ? undefined : true}
          role={hasTitle ? 'img' : undefined}
          aria-label={hasTitle ? title : undefined}
          {...props}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      );
    }
  );

  ProductIcon.displayName = displayName;

  return ProductIcon;
}
