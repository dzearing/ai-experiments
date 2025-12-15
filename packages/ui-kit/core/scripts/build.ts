/**
 * Build script for @ui-kit/core
 */

import { execSync } from 'child_process';
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

console.log('Building @ui-kit/core...');

// Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc', { cwd: rootDir, stdio: 'inherit' });

// Build themes
console.log('Building themes...');
execSync('npx tsx scripts/build-themes.ts', { cwd: rootDir, stdio: 'inherit' });

// Build static tokens CSS
console.log('Building tokens CSS...');
execSync('npx tsx scripts/build-tokens.ts', { cwd: rootDir, stdio: 'inherit' });

// Build standalone bootstrap.js
console.log('Building bootstrap.js...');
execSync('npx tsx scripts/build-bootstrap.ts', { cwd: rootDir, stdio: 'inherit' });

console.log('Build complete!');
