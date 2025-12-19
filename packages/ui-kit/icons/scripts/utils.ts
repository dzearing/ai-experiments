import { readdir, readFile } from 'fs/promises';
import { join, basename, dirname } from 'path';

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
  category: string;
  keywords: string[];
}

/**
 * Get all SVG files from the flat svgs directory
 */
export async function getSvgFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries.filter((entry) => entry.endsWith('.svg')).map((entry) => join(dir, entry));
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
 * Read and parse an SVG file with its JSON metadata
 */
export async function readIconFile(filePath: string, baseDir: string): Promise<IconInfo> {
  const svgString = await readFile(filePath, 'utf-8');
  const svgContent = extractSvgContent(svgString);

  const fileName = basename(filePath, '.svg');
  const jsonPath = join(dirname(filePath), `${fileName}.json`);

  // Read metadata from JSON file
  let metadata: IconJsonMetadata;
  try {
    const jsonContent = await readFile(jsonPath, 'utf-8');
    metadata = JSON.parse(jsonContent);
  } catch {
    // Fallback if JSON doesn't exist
    metadata = {
      name: fileName,
      category: 'misc',
      keywords: [fileName.replace(/-/g, ' ')],
    };
  }

  return {
    name: metadata.name,
    displayName: titleCase(metadata.name),
    category: metadata.category,
    componentName: pascalCase(metadata.name) + 'Icon',
    relativePath: `${fileName}.svg`,
    svgContent,
    keywords: metadata.keywords,
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
