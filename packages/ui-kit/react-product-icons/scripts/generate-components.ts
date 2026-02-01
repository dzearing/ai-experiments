import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { optimize } from 'svgo';
import {
  readProductIcons,
  log,
  colors,
  type ProductIconInfo,
} from './utils';
import type { ProductIconSize } from '../src/utils/types';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const SVGS_DIR = join(ROOT_DIR, 'src/svgs');
const COMPONENTS_DIR = join(ROOT_DIR, 'src/components');

/**
 * SVGO optimization configuration for product icons.
 * Unlike UI icons, product icons preserve fill/stroke colors.
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
    // Note: NOT removing fill/stroke - product icons need their colors
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
 * Optimize SVG content with SVGO
 */
function optimizeSvgContent(content: string, size: number): string {
  // Wrap content in SVG for optimization
  const wrapped = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

  const optimized = optimize(wrapped, svgoConfig);

  // Extract inner content
  return optimized.data
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
}

/**
 * Generate component code for a product icon
 */
function generateComponentCode(icon: ProductIconInfo): string {
  // Build the content map as a JavaScript object
  const contentEntries: string[] = [];

  for (const size of icon.availableSizes) {
    const content = icon.sizeContent[size];

    if (content) {
      // Optimize the content for this size
      const optimized = optimizeSvgContent(content, size);

      // Escape backticks and ${} for template literal
      const escaped = optimized
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');

      contentEntries.push(`  ${size}: \`${escaped}\`,`);
    }
  }

  const contentMap = `{\n${contentEntries.join('\n')}\n}`;

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * This file was automatically generated from src/svgs/${icon.category}/${icon.name}.svg
 * To add or modify icons, see README.md at the root of this package.
 */
import { createProductIcon } from '../utils/createProductIcon';

/**
 * ${icon.displayName} icon
 * @category ${icon.category}
 */
export const ${icon.componentName} = createProductIcon({
  displayName: '${icon.componentName}',
  content: ${contentMap},
});
`;
}

/**
 * Main function to generate all product icon components
 */
export async function generateComponents(): Promise<ProductIconInfo[]> {
  log('\n=== Generating Product Icon Components ===', 'cyan');

  // Ensure components directory exists
  await mkdir(COMPONENTS_DIR, { recursive: true });

  const allIcons: ProductIconInfo[] = [];

  // Process Microsoft icons
  const microsoftDir = join(SVGS_DIR, 'microsoft');
  const microsoftIcons = await readProductIcons(microsoftDir, 'microsoft');

  if (microsoftIcons.length > 0) {
    log(`Found ${microsoftIcons.length} Microsoft icons`, 'blue');

    for (const icon of microsoftIcons) {
      const componentCode = generateComponentCode(icon);
      const componentPath = join(COMPONENTS_DIR, `${icon.componentName}.tsx`);

      await writeFile(componentPath, componentCode);
      allIcons.push(icon);
      log(`  ${colors.green}+${colors.reset} ${icon.componentName} (sizes: ${icon.availableSizes.join(', ')})`, 'reset');
    }
  }

  // Process Agent icons
  const agentsDir = join(SVGS_DIR, 'agents');
  const agentIcons = await readProductIcons(agentsDir, 'agents');

  if (agentIcons.length > 0) {
    log(`Found ${agentIcons.length} Agent icons`, 'blue');

    for (const icon of agentIcons) {
      const componentCode = generateComponentCode(icon);
      const componentPath = join(COMPONENTS_DIR, `${icon.componentName}.tsx`);

      await writeFile(componentPath, componentCode);
      allIcons.push(icon);
      log(`  ${colors.green}+${colors.reset} ${icon.componentName} (sizes: ${icon.availableSizes.join(', ')})`, 'reset');
    }
  }

  if (allIcons.length === 0) {
    log('No icons found. Add SVGs to src/svgs/microsoft/ or src/svgs/agents/', 'yellow');
  } else {
    log(`\nGenerated ${allIcons.length} components`, 'green');
  }

  return allIcons;
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
