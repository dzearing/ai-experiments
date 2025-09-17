#!/usr/bin/env node

import { ProjectTools } from './dist/tools/project.js';
import { PathResolver } from './dist/tools/resolver.js';

async function test() {
  const projectTools = new ProjectTools();
  const pathResolver = new PathResolver();

  console.log('Testing project-mgmt-ux specifically...\n');

  // Get project info
  const projectInfo = await projectTools.getProjectInfo('project-mgmt-ux');

  if (projectInfo) {
    console.log('Project:', projectInfo.name);
    console.log('Repos:', projectInfo.repos.length);

    if (projectInfo.repos.length > 0) {
      console.log('\nRepo details:');
      for (const repo of projectInfo.repos) {
        console.log(`  ${repo.name}-${repo.number}:`);
        console.log(`    Available: ${repo.isAvailable}`);
        console.log(`    Path: ${repo.path}`);
        if (repo.packages) {
          console.log(`    Packages: ${repo.packages.length}`);
          for (const pkg of repo.packages) {
            console.log(`      - ${pkg.name} (${pkg.type}) at ${pkg.path}`);
          }
        }
      }
    }
  }

  console.log('\nTesting path resolutions:');
  const refs = [
    'project-mgmt-ux/v1-client',
    'project-mgmt-ux/v1-server',
    'project-mgmt-ux/mcp-workspace-tools'
  ];

  for (const ref of refs) {
    const resolved = await pathResolver.resolveProjectPath(ref);
    if (resolved) {
      console.log(`  "${ref}" -> ${resolved.type} at ${resolved.path}`);
    } else {
      console.log(`  "${ref}" -> Not resolved`);
    }
  }
}

test().catch(console.error);