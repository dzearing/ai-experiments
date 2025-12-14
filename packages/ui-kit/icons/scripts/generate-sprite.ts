import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { optimize } from 'svgo';
import { getSvgFiles, readIconFile, log, colors, type IconInfo } from './utils';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const SVGS_DIR = join(ROOT_DIR, 'src/svgs');
const DIST_DIR = join(ROOT_DIR, 'dist');
const SPRITE_DIR = join(DIST_DIR, 'sprite');

/**
 * Generate SVG sprite sheet
 */
export async function generateSprite(icons?: IconInfo[]): Promise<void> {
  log('\n=== Generating SVG Sprite ===', 'cyan');

  // Ensure sprite directory exists
  await mkdir(SPRITE_DIR, { recursive: true });

  // If icons not provided, read from SVG files
  if (!icons) {
    const svgFiles = await getSvgFiles(SVGS_DIR);
    icons = await Promise.all(svgFiles.map((f) => readIconFile(f, SVGS_DIR)));
  }

  // Build sprite symbols
  const symbols = icons
    .map((icon) => {
      // Optimize the SVG content
      const optimized = optimize(`<svg viewBox="0 0 24 24">${icon.svgContent}</svg>`, {
        plugins: [
          'removeDoctype',
          'removeXMLProcInst',
          'removeComments',
          'removeMetadata',
          'removeEditorsNSData',
          'cleanupAttrs',
          'cleanupNumericValues',
          'removeUselessDefs',
          'removeEmptyAttrs',
          'removeEmptyContainers',
          'mergePaths',
          'removeUnusedNS',
          'removeTitle',
          'removeDesc',
        ],
      });

      const content = optimized.data.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();

      return `  <symbol id="${icon.name}" viewBox="0 0 24 24">\n    ${content}\n  </symbol>`;
    })
    .join('\n');

  // Build complete sprite
  const sprite = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
${symbols}
</svg>
`;

  // Write sprite file
  await writeFile(join(SPRITE_DIR, 'sprite.svg'), sprite);
  log(`  ${colors.green}+${colors.reset} sprite.svg (${icons.length} symbols)`, 'reset');

  // Generate sprite usage helper for TypeScript/React
  const spriteUsage = `// Auto-generated sprite utilities
// Usage: <SpriteIcon name="save" size={24} />

import { forwardRef } from 'react';
import type { SVGProps } from 'react';

export interface SpriteIconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'fill'> {
  name: string;
  size?: number | string;
  title?: string;
}

export const SpriteIcon = forwardRef<SVGSVGElement, SpriteIconProps>(
  ({ name, size = 24, title, className, ...props }, ref) => {
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
        aria-hidden={hasTitle ? undefined : true}
        role={hasTitle ? 'img' : undefined}
        aria-label={hasTitle ? title : undefined}
        {...props}
      >
        {title && <title>{title}</title>}
        <use href={\`#\${name}\`} />
      </svg>
    );
  }
);

SpriteIcon.displayName = 'SpriteIcon';

// Available icon names
export const iconNames = [
${icons.map((i) => `  '${i.name}'`).join(',\n')}
] as const;

export type IconName = typeof iconNames[number];
`;

  await writeFile(join(SPRITE_DIR, 'index.ts'), spriteUsage);
  log(`  ${colors.green}+${colors.reset} sprite/index.ts (SpriteIcon component)`, 'reset');

  log(`\nSprite generation complete`, 'green');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSprite()
    .then(() => {
      log(`\n${colors.green}Sprite generation successful${colors.reset}\n`, 'reset');
    })
    .catch((error) => {
      console.error('Error generating sprite:', error);
      process.exit(1);
    });
}
