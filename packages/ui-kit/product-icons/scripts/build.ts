import { mkdir, rm, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { generateComponents } from './generate-components';
import { generateMetadata } from './generate-metadata';
import { log } from './utils';
import type { ProductIconInfo } from './utils';

const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

async function build() {
  const startTime = Date.now();

  log('\n========================================', 'cyan');
  log('  @ui-kit/product-icons Build', 'cyan');
  log('========================================\n', 'cyan');

  // Clean dist directory
  log('Cleaning dist directory...', 'blue');
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  // Generate React components from SVGs
  const icons = await generateComponents();

  // Build TypeScript with Vite (Vite cleans the dist folder)
  log('\n=== Building TypeScript ===', 'cyan');

  try {
    execSync('npx vite build', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    log('TypeScript build complete', 'green');
  } catch (error) {
    log('TypeScript build failed', 'yellow');
    throw error;
  }

  // Generate metadata JSON for Storybook and other consumers
  await generateMetadata(icons);

  // Update package.json with explicit exports
  await updatePackageExports(icons);

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log('\n========================================', 'green');
  log(`  Build Complete!`, 'green');
  log(`  ${icons.length} product icons processed`, 'green');
  log(`  Time: ${duration}s`, 'green');
  log('========================================\n', 'green');
}

/**
 * Updates package.json with explicit exports for each icon component.
 * No barrel/index export - each icon must be imported individually.
 */
async function updatePackageExports(icons: ProductIconInfo[]) {
  log('\n=== Updating Package Exports ===', 'cyan');

  const packageJsonPath = join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

  // Build explicit exports object - NO barrel export
  const exports: Record<string, { types: string; import: string } | string> = {
    // Types export for consumers who need type definitions
    './types': {
      types: './dist/types.d.ts',
      import: './dist/types.js',
    },
    // Factory function export (for advanced usage)
    './createProductIcon': {
      types: './dist/createProductIcon.d.ts',
      import: './dist/createProductIcon.js',
    },
  };

  // Add explicit export for each icon (individual imports only)
  for (const icon of icons) {
    exports[`./${icon.componentName}`] = {
      types: `./dist/${icon.componentName}.d.ts`,
      import: `./dist/${icon.componentName}.js`,
    };
  }

  // Add metadata exports
  exports['./metadata/icons.json'] = './dist/metadata/icons.json';
  exports['./metadata/search-index.json'] = './dist/metadata/search-index.json';

  // Add package.json export
  exports['./package.json'] = './package.json';

  packageJson.exports = exports;

  // Remove main/module/types since there's no barrel export
  delete packageJson.main;
  delete packageJson.module;
  delete packageJson.types;

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`Updated package.json with ${icons.length} explicit icon exports (no barrel)`, 'green');
}

build().catch((error) => {
  console.error('\nBuild failed:', error);
  process.exit(1);
});
