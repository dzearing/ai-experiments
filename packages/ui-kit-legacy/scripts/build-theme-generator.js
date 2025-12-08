/**
 * Build the theme generator as a standalone module
 */

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build the theme generator
await build({
  entryPoints: [resolve(__dirname, 'src/theme-generator/cli.ts')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/theme-generator.js'),
  platform: 'node',
  format: 'esm',
  target: 'node16',
  external: ['node:*'],
});

console.log('✓ Theme generator built successfully');
