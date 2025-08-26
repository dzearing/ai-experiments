import React from 'react';
import type { IconProps } from '../types';

/**
 * Creates a React icon component from SVG content
 * 
 * @param svgContent - The inner SVG content (everything inside <svg> tags)
 * @param displayName - The display name for the component (used in React DevTools)
 * @returns A React component that renders the icon
 */
export function createIcon(
  svgContent: string,
  displayName: string
): React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>> {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, title, width, height, className, ...props }, ref) => {
      // Use explicit width/height if provided, otherwise use size
      const sizeProps = {
        width: width ?? size,
        height: height ?? size,
      };

      return (
        <svg
          ref={ref}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={title ? undefined : true}
          role={title ? 'img' : undefined}
          className={className}
          {...props}
          {...sizeProps}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        >
          {title && <title>{title}</title>}
        </svg>
      );
    }
  );

  Component.displayName = displayName;
  return Component;
}