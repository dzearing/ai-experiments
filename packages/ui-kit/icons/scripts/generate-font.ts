import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { getSvgFiles, readIconFile, log, colors, type IconInfo } from './utils';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const SVGS_DIR = join(ROOT_DIR, 'src/svgs');
const DIST_DIR = join(ROOT_DIR, 'dist');
const FONT_DIR = join(DIST_DIR, 'font');

// Start Unicode in Private Use Area
const UNICODE_START = 0xe001;

/**
 * Generate icon font CSS and metadata (font file generation requires additional native dependencies)
 *
 * Note: Full WOFF2 generation requires native dependencies (svgicons2svgfont, svg2ttf, ttf2woff2)
 * that have complex build requirements. For now, we generate:
 * - CSS class definitions
 * - TypeScript types
 * - Icon map for future font generation
 *
 * To generate actual WOFF2 fonts, use external tools like:
 * - fantasticon
 * - webfont-generator
 * - IcoMoon
 */
export async function generateFont(icons?: IconInfo[]): Promise<void> {
  log('\n=== Generating Icon Font Assets ===', 'cyan');

  // Ensure font directory exists
  await mkdir(FONT_DIR, { recursive: true });

  // If icons not provided, read from SVG files
  if (!icons) {
    const svgFiles = await getSvgFiles(SVGS_DIR);
    icons = await Promise.all(svgFiles.map((f) => readIconFile(f, SVGS_DIR)));
  }

  // Sort icons alphabetically for consistent unicode assignment
  icons = icons.sort((a, b) => a.name.localeCompare(b.name));

  // Generate CSS file (placeholder for font reference)
  const cssRules = icons.map((icon, index) => {
    const unicode = (UNICODE_START + index).toString(16);
    return `.icon-${icon.name}::before { content: "\\${unicode}"; }`;
  });

  const css = `/* UI Kit Icons - Icon Font */
/* Auto-generated - do not edit manually */

/*
 * Note: The icons.woff2 font file needs to be generated using external tools.
 * Run: npx fantasticon ./src/svgs -o ./dist/font --name icons
 * Or use the Font Subset Generator in Storybook to create custom subsets.
 */

@font-face {
  font-family: 'ui-kit-icons';
  src: url('./icons.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.icon {
  font-family: 'ui-kit-icons' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Icon classes */
${cssRules.join('\n')}
`;

  await writeFile(join(FONT_DIR, 'icons.css'), css);
  log(`  ${colors.green}+${colors.reset} icons.css (${icons.length} classes)`, 'reset');

  // Generate TypeScript types for icon names
  const tsContent = `// Auto-generated icon font types
// Usage: <i className={\`icon icon-\${iconName}\`} />

export const fontIconNames = [
${icons.map((i) => `  '${i.name}'`).join(',\n')}
] as const;

export type FontIconName = typeof fontIconNames[number];

/**
 * Get the unicode codepoint for an icon
 */
export function getIconUnicode(name: FontIconName): string {
  const index = fontIconNames.indexOf(name);
  if (index === -1) return '';
  return String.fromCharCode(0x${UNICODE_START.toString(16)} + index);
}

/**
 * Get the CSS content value for an icon
 */
export function getIconCssContent(name: FontIconName): string {
  const index = fontIconNames.indexOf(name);
  if (index === -1) return '';
  return \`\\\\${(UNICODE_START).toString(16)}\` + index.toString(16);
}
`;

  await writeFile(join(FONT_DIR, 'index.ts'), tsContent);
  log(`  ${colors.green}+${colors.reset} font/index.ts (TypeScript types)`, 'reset');

  // Generate icon map for subset generation
  const iconMap = icons.reduce(
    (acc, icon, index) => {
      acc[icon.name] = {
        unicode: UNICODE_START + index,
        svgContent: icon.svgContent,
      };
      return acc;
    },
    {} as Record<string, { unicode: number; svgContent: string }>
  );

  await writeFile(join(FONT_DIR, 'icon-map.json'), JSON.stringify(iconMap, null, 2));
  log(`  ${colors.green}+${colors.reset} icon-map.json (for subset generation)`, 'reset');

  log(`\nFont asset generation complete`, 'green');
  log(`  Note: Run 'npx fantasticon' to generate the actual WOFF2 font file`, 'yellow');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateFont()
    .then(() => {
      log(`\n${colors.green}Font asset generation successful${colors.reset}\n`, 'reset');
    })
    .catch((error) => {
      console.error('Error generating font assets:', error);
      process.exit(1);
    });
}
