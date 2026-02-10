#!/usr/bin/env node

import { copyFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function copyFiles(pattern, srcDir, destDir) {
  await ensureDir(destDir);
  
  try {
    const files = await readdir(srcDir);
    const matchingFiles = files.filter(file => file.endsWith('.md'));
    
    for (const file of matchingFiles) {
      const srcFile = join(srcDir, file);
      const destFile = join(destDir, file);
      await copyFile(srcFile, destFile);
      console.log(`Copied: ${file}`);
    }
  } catch (error) {
    console.warn(`Warning: Could not copy from ${srcDir}: ${error.message}`);
  }
}

async function main() {
  console.log('Copying markdown files...');
  
  // Copy prompts
  await copyFiles('*.md', 
    join(projectRoot, 'src/prompts'), 
    join(projectRoot, 'dist/prompts')
  );
  
  // Copy personas
  await copyFiles('*.md', 
    join(projectRoot, 'src/personas'), 
    join(projectRoot, 'dist/personas')
  );
  
  // Copy persona presets
  await copyFiles('*.md', 
    join(projectRoot, 'src/personas/presets'), 
    join(projectRoot, 'dist/personas/presets')
  );
  
  console.log('Build copy completed successfully!');
}

main().catch(console.error);