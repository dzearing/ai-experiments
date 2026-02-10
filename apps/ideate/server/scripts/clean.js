#!/usr/bin/env node

import { rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');

async function main() {
  try {
    await rm(distDir, { recursive: true, force: true });
    console.log('Successfully removed dist directory');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error removing dist directory:', error.message);
      process.exit(1);
    }
    console.log('dist directory does not exist (nothing to clean)');
  }
}

main().catch(console.error);