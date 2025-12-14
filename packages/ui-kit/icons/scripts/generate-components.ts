import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { optimize } from 'svgo';
import { getSvgFiles, readIconFile, pascalCase, log, colors, type IconInfo } from './utils';

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

  return `import { forwardRef } from 'react';
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
 * Generate index barrel file
 */
function generateIndexFile(icons: IconInfo[]): string {
  const exports = icons
    .sort((a, b) => a.componentName.localeCompare(b.componentName))
    .map((icon) => `export { ${icon.componentName} } from './components/${icon.componentName}';`)
    .join('\n');

  return `// Auto-generated file - do not edit manually
// Run 'pnpm build' to regenerate

${exports}

// Types
export type { IconProps, IconMetadata, CategoryMetadata, IconLibraryMetadata } from './utils/types';
`;
}

/**
 * Main function to generate all components
 */
export async function generateComponents(): Promise<IconInfo[]> {
  log('\n=== Generating React Components ===', 'cyan');

  // Ensure components directory exists
  await mkdir(COMPONENTS_DIR, { recursive: true });

  // Get all SVG files
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

  // Generate index file
  const indexContent = generateIndexFile(icons);
  await writeFile(join(ROOT_DIR, 'src/index.ts'), indexContent);
  log(`\nGenerated index.ts with ${icons.length} exports`, 'green');

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
