import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { optimize } from 'svgo';
import { getSvgFiles, readIconFile, log, colors, type IconInfo } from './utils';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const SVGS_DIR = join(ROOT_DIR, 'src/svgs');
const COMPONENTS_DIR = join(ROOT_DIR, 'src/components');

/**
 * SVGO optimization configuration
 */
const svgoConfig = {
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'mergeStyles',
    'inlineStyles',
    'removeUselessDefs',
    'cleanupNumericValues',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'cleanupEnableBackground',
    'removeHiddenElems',
    'removeEmptyText',
    'convertShapeToPath',
    'convertEllipseToCircle',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'convertPathData',
    'convertTransform',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'mergePaths',
    'removeUnusedNS',
    'sortDefsChildren',
    'removeTitle',
    'removeDesc',
  ],
};

/**
 * Generate a React component file from icon info
 */
function generateComponentCode(icon: IconInfo, optimizedContent: string): string {
  // Escape backticks and ${} in SVG content for template literal
  const escapedContent = optimizedContent
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * This file was automatically generated from src/svgs/${icon.name}.svg
 * To add or modify icons, see ICON_GUIDE.md at the root of this package.
 */
import { forwardRef } from 'react';
import type { IconProps } from '../utils/types';

const svgContent = \`${escapedContent}\`;

/**
 * ${icon.displayName} icon
 * @category ${icon.category}
 */
export const ${icon.componentName} = forwardRef<SVGSVGElement, IconProps>(
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
        dangerouslySetInnerHTML={{ __html: title ? \`<title>\${title}</title>\${svgContent}\` : svgContent }}
      />
    );
  }
);

${icon.componentName}.displayName = '${icon.componentName}';
`;
}

/**
 * Main function to generate all components
 */
export async function generateComponents(): Promise<IconInfo[]> {
  log('\n=== Generating React Components ===', 'cyan');

  // Ensure components directory exists
  await mkdir(COMPONENTS_DIR, { recursive: true });

  // Get all SVG files from flat directory
  const svgFiles = await getSvgFiles(SVGS_DIR);
  log(`Found ${svgFiles.length} SVG files`, 'blue');

  const icons: IconInfo[] = [];

  // Process each SVG file
  for (const svgFile of svgFiles) {
    try {
      const icon = await readIconFile(svgFile, SVGS_DIR);

      // Optimize SVG content
      const optimized = optimize(`<svg viewBox="0 0 24 24">${icon.svgContent}</svg>`, svgoConfig);
      const optimizedContent = optimized.data
        .replace(/<svg[^>]*>/, '')
        .replace(/<\/svg>/, '')
        .trim();

      // Generate component code
      const componentCode = generateComponentCode(icon, optimizedContent);

      // Write component file
      const componentPath = join(COMPONENTS_DIR, `${icon.componentName}.tsx`);
      await writeFile(componentPath, componentCode);

      icons.push({ ...icon, svgContent: optimizedContent });

      log(`  ${colors.green}+${colors.reset} ${icon.componentName}`, 'reset');
    } catch (error) {
      log(`  ${colors.yellow}!${colors.reset} Error processing ${svgFile}: ${error}`, 'reset');
    }
  }

  log(`\nGenerated ${icons.length} components`, 'green');

  return icons;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComponents()
    .then((icons) => {
      log(`\n${colors.green}Successfully generated ${icons.length} components${colors.reset}\n`, 'reset');
    })
    .catch((error) => {
      console.error('Error generating components:', error);
      process.exit(1);
    });
}
