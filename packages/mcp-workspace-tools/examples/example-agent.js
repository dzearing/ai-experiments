#!/usr/bin/env node

/**
 * Example agent that uses MCP workspace tools
 * This demonstrates how an agent can discover and navigate projects
 */

import { spawn } from 'child_process';

// Simple MCP client implementation
class MCPClient {
  async call(server, tool, params = {}) {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would communicate with the MCP server
      // For now, we'll just simulate the call by directly using the tools
      console.log(`Calling ${server}.${tool} with params:`, params);

      // Simulate the response based on the tool
      setTimeout(() => {
        switch (tool) {
          case 'getWorkspaceInfo':
            resolve({
              workspacePath: process.env.WORKSPACE_PATH || '/Users/dzearing/workspace',
              projects: [
                { name: 'project-mgmt-ux', path: '/Users/dzearing/workspace/projects/project-mgmt-ux' }
              ]
            });
            break;
          case 'resolveProjectPath':
            resolve({
              path: '/resolved/path',
              type: 'project'
            });
            break;
          default:
            reject(new Error(`Unknown tool: ${tool}`));
        }
      }, 100);
    });
  }
}

async function main() {
  console.log('Example Agent Started');
  console.log('Current working directory:', process.cwd());
  console.log('');

  const mcp = new MCPClient();

  try {
    // Example 1: Get workspace information
    console.log('1. Getting workspace information...');
    const workspace = await mcp.call('workspace-tools', 'getWorkspaceInfo');
    console.log(`   Workspace path: ${workspace.workspacePath}`);
    console.log(`   Projects found: ${workspace.projects.length}`);
    console.log('');

    // Example 2: Resolve a project path
    console.log('2. Resolving project path...');
    const resolved = await mcp.call('workspace-tools', 'resolveProjectPath', {
      reference: 'project-mgmt-ux/v1-client'
    });
    console.log(`   Resolved to: ${resolved.path} (${resolved.type})`);
    console.log('');

    // Example 3: Demonstrate working in the resolved directory
    console.log('3. Working in resolved directory...');
    console.log(`   Would change to: ${resolved.path}`);
    console.log(`   Would perform tasks here...`);
    console.log('');

    console.log('✅ Agent task completed successfully!');
  } catch (error) {
    console.error('❌ Agent error:', error);
    process.exit(1);
  }
}

// Run the agent
main().catch(console.error);