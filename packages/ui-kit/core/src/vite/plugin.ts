import type { Plugin, ResolvedConfig } from 'vite';
import { resolve, dirname } from 'path';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { getInlineBootstrap } from '../build/inline-bootstrap.js';

export interface UIKitPluginOptions {
  /**
   * Base path where theme CSS files will be served from.
   * @default '/themes'
   */
  themesPath?: string;

  /**
   * Default theme to use when no preference is stored.
   * @default 'default'
   */
  defaultTheme?: string;

  /**
   * Default background colors for immediate flash prevention.
   * @default { light: '#fafafa', dark: '#0f0f0f' }
   */
  defaultBg?: { light: string; dark: string };

  /**
   * Whether to copy theme CSS files to the public directory.
   * Set to false if you're serving themes from a CDN or different location.
   * @default true
   */
  copyThemes?: boolean;

  /**
   * Directory to copy theme CSS files to (relative to project root).
   * @default 'public/themes'
   */
  themesOutputDir?: string;

  /**
   * Glob patterns for HTML files to inject the bootstrap into.
   * Supports multiple entry points.
   * @default ['index.html', '*.html']
   */
  include?: string | string[];

  /**
   * Glob patterns for HTML files to exclude from injection.
   * @default []
   */
  exclude?: string | string[];
}

/**
 * Vite plugin for UI-Kit that provides zero-flash theme loading.
 *
 * Features:
 * - Injects inline bootstrap script into HTML for instant theme detection
 * - Copies theme CSS files to public directory
 * - Supports multiple HTML entry points
 * - Auto-detects system light/dark preference
 * - Persists user theme preferences to localStorage
 *
 * @example Basic usage
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { uikit } from '@ui-kit/core/vite';
 *
 * export default defineConfig({
 *   plugins: [uikit()]
 * });
 * ```
 *
 * @example With options
 * ```ts
 * import { uikit } from '@ui-kit/core/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     uikit({
 *       defaultTheme: 'github',
 *       themesPath: '/assets/themes',
 *       themesOutputDir: 'public/assets/themes',
 *     })
 *   ]
 * });
 * ```
 *
 * @example Serving themes from CDN (skip copying)
 * ```ts
 * import { uikit } from '@ui-kit/core/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     uikit({
 *       themesPath: 'https://cdn.example.com/themes',
 *       copyThemes: false,
 *     })
 *   ]
 * });
 * ```
 */
export function uikit(options: UIKitPluginOptions = {}): Plugin {
  const {
    themesPath = '/themes',
    defaultTheme = 'default',
    defaultBg = { light: '#fafafa', dark: '#0f0f0f' },
    copyThemes = true,
    themesOutputDir = 'public/themes',
    include = ['**/*.html'],
    exclude = [],
  } = options;

  let config: ResolvedConfig;
  let themesSourceDir: string | null = null;

  // Convert include/exclude to arrays
  const includePatterns = Array.isArray(include) ? include : [include];
  const excludePatterns = Array.isArray(exclude) ? exclude : [exclude];

  /**
   * Check if a file path matches the include/exclude patterns
   */
  function shouldProcessFile(filePath: string): boolean {
    const fileName = filePath.split('/').pop() || '';

    // Check excludes first
    for (const pattern of excludePatterns) {
      if (matchPattern(filePath, fileName, pattern)) {
        return false;
      }
    }

    // Check includes
    for (const pattern of includePatterns) {
      if (matchPattern(filePath, fileName, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob pattern matching
   * Matches against both full path and filename
   */
  function matchPattern(fullPath: string, fileName: string, pattern: string): boolean {
    // Simple cases
    if (pattern === '*.html') {
      return fileName.endsWith('.html');
    }
    if (pattern === '**/*.html') {
      return fileName.endsWith('.html');
    }

    // Exact filename match
    if (!pattern.includes('*')) {
      return fileName === pattern || fullPath.endsWith(pattern);
    }

    // Convert glob to regex for complex patterns
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    return new RegExp(`${regexPattern}$`).test(fullPath);
  }

  /**
   * Find the themes directory from @ui-kit/core
   */
  function findThemesDir(root: string): string | null {
    // Try common locations
    const candidates = [
      // Monorepo sibling
      resolve(root, '../core/dist/themes'),
      // Node modules
      resolve(root, 'node_modules/@ui-kit/core/dist/themes'),
      // Parent node modules (monorepo hoisting)
      resolve(root, '../../node_modules/@ui-kit/core/dist/themes'),
      resolve(root, '../../../node_modules/@ui-kit/core/dist/themes'),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Find the theme definitions directory from @ui-kit/core source
   */
  function findThemeDefinitionsDir(root: string): string | null {
    // Try common locations
    const candidates = [
      // Monorepo sibling - source definitions
      resolve(root, '../core/src/themes/definitions'),
      // Node modules (not typically available in node_modules)
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  return {
    name: 'vite-plugin-uikit',

    configResolved(resolvedConfig) {
      config = resolvedConfig;

      if (copyThemes) {
        themesSourceDir = findThemesDir(config.root);
        if (!themesSourceDir) {
          console.warn('[vite-plugin-uikit] Could not find @ui-kit/core/dist/themes. Theme files will not be copied.');
        }
      }
    },

    buildStart() {
      if (!copyThemes || !themesSourceDir) {
        return;
      }

      const outputDir = resolve(config.root, themesOutputDir);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Copy theme CSS files
      const cssFiles = readdirSync(themesSourceDir).filter(f => f.endsWith('.css'));
      let copied = 0;

      for (const file of cssFiles) {
        const src = resolve(themesSourceDir, file);
        const dest = resolve(outputDir, file);
        cpSync(src, dest);
        copied++;
      }

      // Also copy theme definition JSON files (for theme designer)
      const definitionsDir = findThemeDefinitionsDir(config.root);
      if (definitionsDir) {
        const jsonFiles = readdirSync(definitionsDir).filter(f => f.endsWith('.json'));
        for (const file of jsonFiles) {
          const src = resolve(definitionsDir, file);
          const dest = resolve(outputDir, file);
          cpSync(src, dest);
          copied++;
        }
      }

      if (copied > 0) {
        config.logger.info(`[vite-plugin-uikit] Copied ${copied} theme files to ${themesOutputDir}`);
      }
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Generate the inline bootstrap (CSS + JS)
        const inlineBootstrap = getInlineBootstrap({
          basePath: themesPath,
          defaultTheme,
          defaultColors: {
            light: { pageBg: defaultBg.light, pageText: '#171717' },
            dark: { pageBg: defaultBg.dark, pageText: '#e5e5e5' },
          },
        });

        // Inject right after opening <head> tag (before any other content)
        const headMatch = html.match(/<head[^>]*>/i);
        if (!headMatch) {
          return html;
        }

        const insertPos = headMatch.index! + headMatch[0].length;
        const bootstrap = `\n    <!-- UIKit zero-flash bootstrap -->\n    ${inlineBootstrap}`;

        return html.slice(0, insertPos) + bootstrap + html.slice(insertPos);
      },
    },
  };
}

// Also export as default for convenient importing
export default uikit;
