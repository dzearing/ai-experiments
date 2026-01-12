/**
 * Migration script to update existing workspaces to the new schema.
 *
 * Changes:
 * 1. Adds `type: 'team'` to all existing workspaces
 * 2. Converts `memberIds: string[]` to `members: WorkspaceMember[]`
 * 3. Creates personal workspaces for all users found in existing workspaces
 *
 * Run with: npx ts-node src/scripts/migrateWorkspaces.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

import type { WorkspaceMember } from '../types/workspace.js';
import { PERSONAL_WORKSPACE } from '../constants/workspace.js';

const WORKSPACES_DIR = path.join(homedir(), 'Ideate', 'workspaces');
const BACKUP_DIR = path.join(homedir(), 'Ideate', 'workspaces-backup');

interface OldWorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
  type?: 'personal' | 'team';
  members?: WorkspaceMember[];
}

interface NewWorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'team';
  ownerId: string;
  members: WorkspaceMember[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

async function backupWorkspaces(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${BACKUP_DIR}-${timestamp}`;

  console.log(`Creating backup at: ${backupPath}`);

  try {
    await fs.mkdir(backupPath, { recursive: true });

    const files = await fs.readdir(WORKSPACES_DIR);
    const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

    for (const file of metaFiles) {
      const src = path.join(WORKSPACES_DIR, file);
      const dest = path.join(backupPath, file);

      await fs.copyFile(src, dest);
    }

    console.log(`Backed up ${metaFiles.length} workspace files`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('No existing workspaces to backup');
    } else {
      throw error;
    }
  }
}

async function migrateWorkspace(filePath: string): Promise<{ migrated: boolean; userId?: string }> {
  const content = await fs.readFile(filePath, 'utf-8');
  const oldWorkspace: OldWorkspaceMetadata = JSON.parse(content);

  // Already migrated
  if (oldWorkspace.type && oldWorkspace.members) {
    console.log(`  Skipping ${oldWorkspace.name} (already migrated)`);

    return { migrated: false };
  }

  // Convert memberIds to members with roles
  const members: WorkspaceMember[] = [];

  // Add owner first
  members.push({
    userId: oldWorkspace.ownerId,
    role: 'owner',
    joinedAt: oldWorkspace.createdAt,
  });

  // Add other members
  if (oldWorkspace.memberIds) {
    for (const memberId of oldWorkspace.memberIds) {
      if (memberId !== oldWorkspace.ownerId) {
        members.push({
          userId: memberId,
          role: 'member',
          joinedAt: oldWorkspace.createdAt,
        });
      }
    }
  }

  const newWorkspace: NewWorkspaceMetadata = {
    id: oldWorkspace.id,
    name: oldWorkspace.name,
    description: oldWorkspace.description,
    type: 'team',
    ownerId: oldWorkspace.ownerId,
    members,
    createdAt: oldWorkspace.createdAt,
    updatedAt: oldWorkspace.updatedAt,
  };

  if (oldWorkspace.shareToken) {
    newWorkspace.shareToken = oldWorkspace.shareToken;
  }

  await fs.writeFile(filePath, JSON.stringify(newWorkspace, null, 2), 'utf-8');
  console.log(`  Migrated ${oldWorkspace.name} (${members.length} members)`);

  return { migrated: true, userId: oldWorkspace.ownerId };
}

async function createPersonalWorkspace(userId: string): Promise<boolean> {
  const personalId = `personal-${userId}`;
  const filePath = path.join(WORKSPACES_DIR, `${personalId}.meta.json`);

  try {
    await fs.access(filePath);
    console.log(`  Personal workspace for ${userId} already exists`);

    return false;
  } catch {
    // File doesn't exist, create it
  }

  const now = new Date().toISOString();
  const workspace: NewWorkspaceMetadata = {
    id: personalId,
    name: PERSONAL_WORKSPACE.name,
    description: PERSONAL_WORKSPACE.description,
    type: 'personal',
    ownerId: userId,
    members: [],
    createdAt: now,
    updatedAt: now,
  };

  await fs.writeFile(filePath, JSON.stringify(workspace, null, 2), 'utf-8');
  console.log(`  Created personal workspace for ${userId}`);

  return true;
}

async function migrate(): Promise<void> {
  console.log('Starting workspace migration...\n');

  // Create backup first
  await backupWorkspaces();
  console.log('');

  // Ensure workspaces directory exists
  try {
    await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }

  // Get all workspace files
  let files: string[];

  try {
    files = await fs.readdir(WORKSPACES_DIR);
  } catch {
    console.log('No workspaces directory found, creating empty one');
    await fs.mkdir(WORKSPACES_DIR, { recursive: true });
    files = [];
  }

  const metaFiles = files.filter((f) => f.endsWith('.meta.json'));
  console.log(`Found ${metaFiles.length} workspace files\n`);

  // Collect all unique user IDs
  const userIds = new Set<string>();
  let migratedCount = 0;

  // Migrate existing workspaces
  console.log('Migrating team workspaces:');

  for (const file of metaFiles) {
    const filePath = path.join(WORKSPACES_DIR, file);
    const result = await migrateWorkspace(filePath);

    if (result.migrated) {
      migratedCount++;
    }

    if (result.userId) {
      userIds.add(result.userId);
    }

    // Also collect member IDs
    const content = await fs.readFile(filePath, 'utf-8');
    const workspace = JSON.parse(content);

    if (workspace.members) {
      for (const member of workspace.members) {
        userIds.add(member.userId);
      }
    }
  }

  console.log(`\nMigrated ${migratedCount} workspaces`);

  // Create personal workspaces for all users
  console.log(`\nCreating personal workspaces for ${userIds.size} users:`);
  let createdCount = 0;

  for (const userId of userIds) {
    const created = await createPersonalWorkspace(userId);

    if (created) {
      createdCount++;
    }
  }

  console.log(`\nCreated ${createdCount} personal workspaces`);
  console.log('\nMigration complete!');
}

// Run migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
