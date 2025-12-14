import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import type { IconProps } from './types';

/**
 * Creates a React icon component from SVG content
 *
 * @param svgContent - Inner SVG content (everything inside the <svg> tags)
 * @param displayName - Component display name for React DevTools
 * @returns A React component that renders the icon
 */
export function createIcon(
  svgContent: string,
  displayName: string
): ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>> {
  const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, title, className, style, ...props }, ref) => {
      const hasTitle = Boolean(title);

      return (
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          width={size}
          height={size}
          className={className}
          style={style}
          aria-hidden={hasTitle ? undefined : true}
          role={hasTitle ? 'img' : undefined}
          aria-label={hasTitle ? title : undefined}
          {...props}
          dangerouslySetInnerHTML={{ __html: title ? `<title>${title}</title>${svgContent}` : svgContent }}
        />
      );
    }
  );

  Icon.displayName = displayName;

  return Icon;
}

export type { IconProps };
