#!/usr/bin/env node

/**
 * Migration script to move existing logs, sessions, and feedback to the new temp directory structure
 */

const fs = require('fs');
const path = require('path');
const PATHS = require('./paths');

console.log('Starting migration to temp directory structure...\n');

// Define old paths
const oldPaths = {
  logs: path.join(__dirname, 'logs'),
  sessions: path.join(__dirname, 'sessions'),
  feedback: path.join(__dirname, '..', 'feedback'),
};

// Migration function
async function migrateDirectory(oldPath, newPath, description) {
  if (!fs.existsSync(oldPath)) {
    console.log(`✓ ${description}: No old directory found at ${oldPath}`);
    return;
  }

  console.log(`Migrating ${description} from ${oldPath} to ${newPath}`);

  try {
    // Read all files from old directory
    const files = fs.readdirSync(oldPath);
    let migratedCount = 0;

    for (const file of files) {
      const oldFilePath = path.join(oldPath, file);
      const newFilePath = path.join(newPath, file);

      // Skip if it's a directory (unless it's feedback subdirectories)
      const stats = fs.statSync(oldFilePath);
      if (stats.isDirectory() && description !== 'feedback') {
        continue;
      }

      // Copy file to new location
      if (stats.isFile()) {
        fs.copyFileSync(oldFilePath, newFilePath);
        migratedCount++;
      } else if (stats.isDirectory() && description === 'feedback') {
        // Handle feedback subdirectories (screenshots, reports)
        const subFiles = fs.readdirSync(oldFilePath);
        for (const subFile of subFiles) {
          const oldSubFilePath = path.join(oldFilePath, subFile);
          const newSubPath = path.join(newPath, file);
          if (!fs.existsSync(newSubPath)) {
            fs.mkdirSync(newSubPath, { recursive: true });
          }
          const newSubFilePath = path.join(newSubPath, subFile);
          fs.copyFileSync(oldSubFilePath, newSubFilePath);
          migratedCount++;
        }
      }
    }

    console.log(`✓ Migrated ${migratedCount} files`);

    // Ask user if they want to delete old files
    console.log(`\nOld ${description} directory still exists at: ${oldPath}`);
    console.log('You can manually delete it after verifying the migration was successful.');
  } catch (error) {
    console.error(`✗ Error migrating ${description}:`, error.message);
  }
}

// Run migrations
async function runMigration() {
  // Migrate logs
  await migrateDirectory(oldPaths.logs, PATHS.logsDir, 'logs');

  // Migrate sessions
  await migrateDirectory(oldPaths.sessions, PATHS.sessionsDir, 'sessions');

  // Migrate feedback
  await migrateDirectory(oldPaths.feedback, PATHS.feedbackDir, 'feedback');

  console.log('\nMigration complete!');
  console.log('\nNew directory structure:');
  console.log(`  Logs: ${PATHS.logsDir}`);
  console.log(`  Sessions: ${PATHS.sessionsDir}`);
  console.log(`  Feedback: ${PATHS.feedbackDir}`);
  console.log('\nRemember to:');
  console.log('1. Verify all data was migrated correctly');
  console.log('2. Delete old directories manually:');
  console.log(`   - rm -rf ${oldPaths.logs}`);
  console.log(`   - rm -rf ${oldPaths.sessions}`);
  console.log(`   - rm -rf ${oldPaths.feedback}`);
  console.log('3. Restart the server to use the new paths');
}

// Run the migration
runMigration().catch(console.error);
