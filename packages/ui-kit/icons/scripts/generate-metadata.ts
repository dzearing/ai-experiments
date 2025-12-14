import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import { getSvgFiles, readIconFile, log, colors, type IconInfo } from './utils';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const SVGS_DIR = join(ROOT_DIR, 'src/svgs');
const DIST_DIR = join(ROOT_DIR, 'dist');
const METADATA_DIR = join(DIST_DIR, 'metadata');

interface CategoryDef {
  displayName: string;
  description: string;
  order: number;
  subcategories?: string[];
}

interface CategoriesYaml {
  categories: Record<string, CategoryDef>;
}

/**
 * Load categories from YAML file
 */
async function loadCategories(): Promise<CategoriesYaml['categories']> {
  try {
    const categoriesPath = join(SVGS_DIR, 'categories.yaml');
    const content = await readFile(categoriesPath, 'utf-8');
    const parsed = yaml.load(content) as CategoriesYaml;
    return parsed.categories || {};
  } catch {
    log('Warning: Could not load categories.yaml, using defaults', 'yellow');
    return {
      actions: { displayName: 'Actions', description: 'Action icons', order: 1 },
      navigation: { displayName: 'Navigation', description: 'Navigation icons', order: 2 },
      status: { displayName: 'Status', description: 'Status icons', order: 3 },
      editor: { displayName: 'Editor', description: 'Editor icons', order: 4 },
      misc: { displayName: 'Miscellaneous', description: 'Miscellaneous icons', order: 5 },
    };
  }
}

/**
 * Build search index for fast keyword lookup
 */
function buildSearchIndex(icons: IconInfo[]): Record<string, string[]> {
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
 * Generate metadata JSON files
 */
export async function generateMetadata(icons?: IconInfo[]): Promise<void> {
  log('\n=== Generating Metadata ===', 'cyan');

  // Ensure metadata directory exists
  await mkdir(METADATA_DIR, { recursive: true });

  // Load categories
  const categoriesDef = await loadCategories();

  // If icons not provided, read from SVG files
  if (!icons) {
    const svgFiles = await getSvgFiles(SVGS_DIR);
    icons = await Promise.all(svgFiles.map((f) => readIconFile(f, SVGS_DIR)));
  }

  // Build icon metadata
  const iconMetadata = icons.map((icon) => ({
    name: icon.name,
    displayName: icon.displayName,
    category: icon.category,
    keywords: icon.keywords,
    componentName: icon.componentName,
    filePath: icon.relativePath,
  }));

  // Build category metadata
  const categoryMetadata = Object.entries(categoriesDef).map(([id, def]) => ({
    id,
    displayName: def.displayName,
    description: def.description,
    order: def.order,
    subcategories: def.subcategories,
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
