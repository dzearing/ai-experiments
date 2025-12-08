/**
 * Build static tokens CSS
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { staticTokens } from '../src/tokens/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Generate tokens.css
const lines = [
  '/* @ui-kit/core - Static Tokens */',
  '/* These tokens do not change between themes */',
  '',
  ':root {',
];

for (const [name, value] of Object.entries(staticTokens)) {
  lines.push(`  ${name}: ${value};`);
}

lines.push('}');
lines.push('');

const css = lines.join('\n');
const outputPath = path.resolve(distDir, 'tokens.css');

fs.writeFileSync(outputPath, css, 'utf-8');
console.log(`Generated ${outputPath}`);
