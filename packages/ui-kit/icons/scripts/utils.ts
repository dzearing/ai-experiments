import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, dirname, extname } from 'path';
import yaml from 'js-yaml';

// Cache for icon keywords loaded from YAML
let keywordsCache: Record<string, string[]> | null = null;

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
 * Get all SVG files recursively from a directory
 */
export async function getSvgFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        await walk(fullPath);
      } else if (entry.endsWith('.svg')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files.sort();
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
 * Parse icon name from file path
 */
export function parseIconPath(filePath: string, baseDir: string): {
  name: string;
  category: string;
  componentName: string;
  relativePath: string;
} {
  const relativePath = filePath.replace(baseDir + '/', '');
  const parts = relativePath.split('/');

  // Handle root-level SVGs (like DragHandle.svg)
  const category = parts.length > 1 ? parts[0] : 'misc';
  const fileName = basename(filePath, '.svg');
  const name = fileName.toLowerCase().replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()).replace(/^-/, '');

  return {
    name,
    category,
    componentName: pascalCase(name) + 'Icon',
    relativePath,
  };
}

/**
 * Load icon keywords from YAML file
 */
async function loadIconKeywords(svgsDir: string): Promise<Record<string, string[]>> {
  if (keywordsCache) {
    return keywordsCache;
  }

  try {
    const keywordsPath = join(svgsDir, 'icon-keywords.yaml');
    const content = await readFile(keywordsPath, 'utf-8');
    const parsed = yaml.load(content) as { icons: Record<string, string[]> };
    keywordsCache = parsed.icons || {};
    return keywordsCache;
  } catch {
    // File doesn't exist or is invalid, return empty
    keywordsCache = {};
    return keywordsCache;
  }
}

/**
 * Generate default keywords for an icon based on its name
 */
export async function generateDefaultKeywords(name: string, category: string, svgsDir?: string): Promise<string[]> {
  const words = name.split('-');
  const keywords = new Set<string>();

  // Add the full name
  keywords.add(name.replace(/-/g, ' '));

  // Add individual words
  words.forEach((word) => keywords.add(word));

  // Add category
  keywords.add(category);

  // Load keywords from YAML if svgsDir provided
  if (svgsDir) {
    const yamlKeywords = await loadIconKeywords(svgsDir);
    if (yamlKeywords[name]) {
      yamlKeywords[name].forEach((keyword) => keywords.add(keyword.toLowerCase()));
    }
  }

  return Array.from(keywords);
}

/**
 * Icon info extracted from SVG file
 */
export interface IconInfo {
  name: string;
  displayName: string;
  category: string;
  componentName: string;
  relativePath: string;
  svgContent: string;
  keywords: string[];
}

/**
 * Read and parse an SVG file
 */
export async function readIconFile(filePath: string, baseDir: string): Promise<IconInfo> {
  const svgString = await readFile(filePath, 'utf-8');
  const svgContent = extractSvgContent(svgString);
  const { name, category, componentName, relativePath } = parseIconPath(filePath, baseDir);

  return {
    name,
    displayName: titleCase(name),
    category,
    componentName,
    relativePath,
    svgContent,
    keywords: await generateDefaultKeywords(name, category, baseDir),
  };
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
