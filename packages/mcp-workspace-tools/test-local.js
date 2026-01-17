#!/usr/bin/env node

// Simple test script to verify the tools work locally
import { WorkspaceTools } from './dist/tools/workspace.js';
import { ProjectTools } from './dist/tools/project.js';
import { PathResolver } from './dist/tools/resolver.js';

async function test() {
  console.log('Testing MCP Workspace Tools...\n');

  const workspaceTools = new WorkspaceTools();
  const projectTools = new ProjectTools();
  const pathResolver = new PathResolver();

  // Test 1: Get workspace info
  console.log('1. Testing getWorkspaceInfo:');
  const workspaceInfo = await workspaceTools.getWorkspaceInfo();
  console.log(`   Found ${workspaceInfo.projects.length} projects`);
  console.log(`   Workspace path: ${workspaceInfo.workspacePath}`);
  if (workspaceInfo.projects.length > 0) {
    console.log(`   First project: ${workspaceInfo.projects[0].name}`);
  }

  // Test 2: Get project info
  if (workspaceInfo.projects.length > 0) {
    const projectName = workspaceInfo.projects[0].name;
    console.log(`\n2. Testing getProjectInfo for "${projectName}":`);
    const projectInfo = await projectTools.getProjectInfo(projectName);
    if (projectInfo) {
      console.log(`   Repos: ${projectInfo.repos.length}`);
      console.log(`   Work items: ${JSON.stringify(projectInfo.workItems)}`);
    }

    // Test 3: Get available repo
    console.log(`\n3. Testing getAvailableRepo for "${projectName}":`);
    const availableRepo = await projectTools.getAvailableRepo(projectName);
    if (availableRepo) {
      console.log(`   Found: ${availableRepo.name}-${availableRepo.number}`);
      console.log(`   Path: ${availableRepo.path}`);
    } else {
      console.log('   No available repo found');
    }
  }

  // Test 4: Path resolution
  console.log('\n4. Testing resolveProjectPath:');
  const testReferences = [
    'workspace',
    'project-mgmt-ux',
    'project-mgmt-ux/repo',
    'project-mgmt-ux/v1'
  ];

  for (const ref of testReferences) {
    const resolved = await pathResolver.resolveProjectPath(ref);
    if (resolved) {
      console.log(`   "${ref}" -> ${resolved.path} (${resolved.type})`);
    } else {
      console.log(`   "${ref}" -> Could not resolve`);
    }
  }

  console.log('\n✅ Tests completed!');
}

test().catch(console.error);