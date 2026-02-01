import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import type { ProductIconSize } from '../src/utils/types';

/**
 * Convert kebab-case to PascalCase
 */
export function pascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convert kebab-case to Title Case
 */
export function titleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Icon metadata from JSON file
 */
interface IconJsonMetadata {
  name: string;
  category: 'microsoft' | 'agents';
  keywords: string[];
}

/**
 * Product icon info with multi-size support
 */
export interface ProductIconInfo {
  /** Base name in kebab-case (e.g., "word", "analyst") */
  name: string;

  /** Display name for UI (e.g., "Word", "Analyst") */
  displayName: string;

  /** Icon category */
  category: 'microsoft' | 'agents';

  /** React component name (e.g., "WordIcon") */
  componentName: string;

  /** Search keywords */
  keywords: string[];

  /** Available sizes with their SVG content */
  sizeContent: Partial<Record<ProductIconSize, string>>;

  /** List of available sizes */
  availableSizes: ProductIconSize[];
}

/**
 * Standard sizes for product icons
 */
const STANDARD_SIZES: ProductIconSize[] = [16, 20, 24, 32, 48];

/**
 * Get all SVG files from a directory (non-recursive)
 */
export async function getSvgFilesInDir(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);

    return entries
      .filter((entry) => entry.endsWith('.svg'))
      .map((entry) => join(dir, entry));
  } catch {
    return [];
  }
}

/**
 * Recursively find all SVG files in src/svgs/{category}/ directories
 */
export async function getAllSvgFiles(svgsDir: string): Promise<{ category: string; files: string[] }[]> {
  const results: { category: string; files: string[] }[] = [];

  try {
    const entries = await readdir(svgsDir);

    for (const entry of entries) {
      const entryPath = join(svgsDir, entry);
      const entryStat = await stat(entryPath);

      if (entryStat.isDirectory()) {
        const svgFiles = await getSvgFilesInDir(entryPath);

        if (svgFiles.length > 0) {
          results.push({ category: entry, files: svgFiles });
        }
      }
    }
  } catch {
    // svgs directory might not exist yet
  }

  return results;
}

/**
 * Parse an SVG filename to extract base name and optional size.
 *
 * Examples:
 * - "word.svg" -> { baseName: "word", size: null }
 * - "word-24.svg" -> { baseName: "word", size: 24 }
 * - "analyst-agent-32.svg" -> { baseName: "analyst-agent", size: 32 }
 */
export function parseSvgFilename(filename: string): { baseName: string; size: ProductIconSize | null } {
  const name = basename(filename, '.svg');

  // Check for size suffix (e.g., "-16", "-24", "-32", "-48")
  for (const standardSize of STANDARD_SIZES) {
    const suffix = `-${standardSize}`;

    if (name.endsWith(suffix)) {
      return {
        baseName: name.slice(0, -suffix.length),
        size: standardSize,
      };
    }
  }

  return { baseName: name, size: null };
}

/**
 * Extract the inner content from an SVG file (everything between <svg> tags)
 */
export function extractSvgContent(svgString: string): string {
  // Remove XML declaration if present
  let content = svgString.replace(/<\?xml[^?]*\?>/gi, '');

  // Extract content between svg tags
  const match = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);

  if (!match) {
    throw new Error('Invalid SVG: Could not find svg element');
  }

  return match[1].trim();
}

/**
 * Read all size variants for icons in a category directory.
 * Groups SVGs by base name and collects all size variants.
 */
export async function readProductIcons(
  categoryDir: string,
  category: 'microsoft' | 'agents'
): Promise<ProductIconInfo[]> {
  const svgFiles = await getSvgFilesInDir(categoryDir);

  // Group files by base name
  const iconGroups = new Map<string, { files: string[]; sizes: (ProductIconSize | null)[] }>();

  for (const file of svgFiles) {
    const { baseName, size } = parseSvgFilename(file);

    if (!iconGroups.has(baseName)) {
      iconGroups.set(baseName, { files: [], sizes: [] });
    }

    const group = iconGroups.get(baseName);

    if (group) {
      group.files.push(file);
      group.sizes.push(size);
    }
  }

  // Process each icon group
  const icons: ProductIconInfo[] = [];

  for (const [baseName, group] of iconGroups) {
    const sizeContent: Partial<Record<ProductIconSize, string>> = {};
    const availableSizes: ProductIconSize[] = [];

    // Check for metadata JSON
    const jsonPath = join(categoryDir, `${baseName}.json`);
    let metadata: IconJsonMetadata | null = null;

    try {
      const jsonContent = await readFile(jsonPath, 'utf-8');
      metadata = JSON.parse(jsonContent);
    } catch {
      // No metadata file, use defaults
    }

    // Read each SVG file
    for (let i = 0; i < group.files.length; i++) {
      const file = group.files[i];
      const size = group.sizes[i];

      const svgString = await readFile(file, 'utf-8');
      const content = extractSvgContent(svgString);

      if (size !== null) {
        // Size-specific variant
        sizeContent[size] = content;
        availableSizes.push(size);
      } else {
        // No size suffix - use for all standard sizes
        for (const standardSize of STANDARD_SIZES) {
          sizeContent[standardSize] = content;
          availableSizes.push(standardSize);
        }
      }
    }

    // Sort and dedupe available sizes
    const uniqueSizes = [...new Set(availableSizes)].sort((a, b) => a - b) as ProductIconSize[];

    icons.push({
      name: baseName,
      displayName: metadata?.name ? titleCase(metadata.name) : titleCase(baseName),
      category,
      componentName: pascalCase(baseName) + 'Icon',
      keywords: metadata?.keywords || [baseName.replace(/-/g, ' ')],
      sizeContent,
      availableSizes: uniqueSizes,
    });
  }

  return icons;
}

/**
 * Colors for console output
 */
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}
