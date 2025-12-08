#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const assetsPath = path.join(__dirname, '..', 'assets');
const uiKitDistPath = path.join(__dirname, '..', '..', 'ui-kit-legacy', 'dist');

// Remove existing symlink if it exists
if (fs.existsSync(assetsPath)) {
  try {
    fs.unlinkSync(assetsPath);
  } catch (e) {
    // If it's a directory, remove it
    fs.rmSync(assetsPath, { recursive: true, force: true });
  }
}

// Create symlink
try {
  fs.symlinkSync(uiKitDistPath, assetsPath, 'dir');
  console.log('✅ Assets symlink created: assets -> ../ui-kit/dist');
} catch (error) {
  console.error('❌ Failed to create symlink:', error.message);
  console.log('Falling back to copy method...');
  
  // Fallback: copy files instead of symlinking (for Windows compatibility)
  fs.cpSync(uiKitDistPath, assetsPath, { recursive: true });
  console.log('✅ Assets copied from ui-kit/dist');
}