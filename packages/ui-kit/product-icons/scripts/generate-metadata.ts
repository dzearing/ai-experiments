import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { log, colors, readProductIcons } from './utils';
import type { ProductIconInfo } from './utils';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const SVGS_DIR = join(ROOT_DIR, 'src/svgs');
const DIST_DIR = join(ROOT_DIR, 'dist');
const METADATA_DIR = join(DIST_DIR, 'metadata');

/**
 * Category definitions for product icons
 */
const CATEGORIES = {
  microsoft: { displayName: 'Microsoft', description: 'Microsoft 365 app icons', order: 1 },
  agents: { displayName: 'Agents', description: 'AI agent icons', order: 2 },
};

/**
 * Build search index for fast keyword lookup
 */
function buildSearchIndex(icons: ProductIconInfo[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  for (const icon of icons) {
    // Index by keywords
    for (const keyword of icon.keywords) {
      const key = keyword.toLowerCase();

      if (!index[key]) {
        index[key] = [];
      }

      if (!index[key].includes(icon.name)) {
        index[key].push(icon.name);
      }
    }

    // Index by name parts
    const nameParts = icon.name.split('-');

    for (const part of nameParts) {
      const key = part.toLowerCase();

      if (!index[key]) {
        index[key] = [];
      }

      if (!index[key].includes(icon.name)) {
        index[key].push(icon.name);
      }
    }

    // Index by category
    const categoryKey = icon.category.toLowerCase();

    if (!index[categoryKey]) {
      index[categoryKey] = [];
    }

    if (!index[categoryKey].includes(icon.name)) {
      index[categoryKey].push(icon.name);
    }
  }

  return index;
}

/**
 * Generate metadata JSON files for product icons
 */
export async function generateMetadata(icons?: ProductIconInfo[]): Promise<void> {
  log('\n=== Generating Metadata ===', 'cyan');

  // Ensure metadata directory exists
  await mkdir(METADATA_DIR, { recursive: true });

  // If icons not provided, read from SVG files
  if (!icons) {
    const microsoftIcons = await readProductIcons(join(SVGS_DIR, 'microsoft'), 'microsoft');
    const agentIcons = await readProductIcons(join(SVGS_DIR, 'agents'), 'agents');
    icons = [...microsoftIcons, ...agentIcons];
  }

  // Build icon metadata (without the sizeContent which is too large)
  const iconMetadata = icons.map((icon) => ({
    name: icon.name,
    displayName: icon.displayName,
    category: icon.category,
    keywords: icon.keywords,
    componentName: icon.componentName,
    availableSizes: icon.availableSizes,
  }));

  // Build category metadata
  const categoryMetadata = Object.entries(CATEGORIES).map(([id, def]) => ({
    id,
    displayName: def.displayName,
    description: def.description,
    order: def.order,
    iconCount: icons!.filter((i) => i.category === id).length,
  }));

  // Build search index
  const searchIndex = buildSearchIndex(icons);

  // Write icons.json
  const iconsJson = {
    icons: iconMetadata,
    categories: categoryMetadata.sort((a, b) => a.order - b.order),
    count: icons.length,
    buildTime: new Date().toISOString(),
  };

  await writeFile(join(METADATA_DIR, 'icons.json'), JSON.stringify(iconsJson, null, 2));
  log(`  ${colors.green}+${colors.reset} icons.json (${icons.length} icons)`, 'reset');

  // Write search-index.json
  await writeFile(join(METADATA_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2));
  log(`  ${colors.green}+${colors.reset} search-index.json (${Object.keys(searchIndex).length} keywords)`, 'reset');

  log(`\nMetadata generation complete`, 'green');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMetadata()
    .then(() => {
      log(`\n${colors.green}Metadata generation successful${colors.reset}\n`, 'reset');
    })
    .catch((error) => {
      console.error('Error generating metadata:', error);
      process.exit(1);
    });
}
