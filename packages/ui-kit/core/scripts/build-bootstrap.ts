/**
 * Build standalone bootstrap.js for browser usage
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building bootstrap.js...');

// Build as IIFE for direct browser usage
await esbuild.build({
  entryPoints: [path.resolve(rootDir, 'src/runtime/bootstrap.ts')],
  outfile: path.resolve(distDir, 'bootstrap.js'),
  bundle: true,
  minify: false,
  format: 'iife',
  globalName: 'UIKitBootstrap',
  target: ['es2015'],
  platform: 'browser',
  banner: {
    js: '/* UIKit Bootstrap - https://github.com/your-org/ui-kit */\n',
  },
});

// Also build minified version
await esbuild.build({
  entryPoints: [path.resolve(rootDir, 'src/runtime/bootstrap.ts')],
  outfile: path.resolve(distDir, 'bootstrap.min.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'UIKitBootstrap',
  target: ['es2015'],
  platform: 'browser',
  banner: {
    js: '/* UIKit Bootstrap */\n',
  },
});

console.log('Bootstrap built!');
console.log('  - dist/bootstrap.js (readable)');
console.log('  - dist/bootstrap.min.js (minified)');
