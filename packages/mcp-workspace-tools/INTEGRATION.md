# MCP Workspace Tools - Integration Guide

## Overview

This guide explains how to integrate the MCP Workspace Tools with Claude Code and how to create agents that can dynamically discover and navigate to project directories.

## Installation and setup

### 1. Build the package

```bash
cd packages/mcp-workspace-tools
npm run build
```

### 2. Configure Claude Code

Add the MCP server to your Claude Code configuration. The configuration location depends on your platform:

- macOS: `~/Library/Application Support/Claude/claude-config.json`
- Windows: `%APPDATA%\Claude\claude-config.json`
- Linux: `~/.config/claude/claude-config.json`

Add the following to the configuration:

```json
{
  "mcpServers": {
    "workspace-tools": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-workspace-tools/dist/index.js"
      ],
      "env": {
        "WORKSPACE_PATH": "/Users/username/workspace"
      }
    }
  }
}
```

### 3. Restart Claude Code

After adding the configuration, restart Claude Code to load the MCP server.

## Using MCP tools in agents

### Basic usage

Agents can call the MCP tools to discover projects and navigate the workspace:

```javascript
// In your agent code
const workspace = await mcp.call('workspace-tools', 'getWorkspaceInfo');
console.log('Available projects:', workspace.projects);

const projectInfo = await mcp.call('workspace-tools', 'getProjectInfo', {
  projectName: 'project-mgmt-ux'
});
console.log('Project repos:', projectInfo.repos);
```

### Path resolution

Resolve project references to filesystem paths:

```javascript
const resolved = await mcp.call('workspace-tools', 'resolveProjectPath', {
  reference: 'project-mgmt-ux/v1-client'
});

// Change to the resolved directory
process.chdir(resolved.path);
console.log('Now working in:', process.cwd());
```

## Agent initialization with dynamic CWD

### Agent configuration format

Create an agent configuration file (e.g., `agent-config.json`):

```json
{
  "name": "my-project-agent",
  "description": "Agent for working on my project",
  "initialization": {
    "cwd": {
      "type": "reference",
      "value": "project-name/package-name"
    }
  }
}
```

### CWD configuration options

#### 1. Reference-based (recommended)

Uses the path resolver to find directories:

```json
{
  "cwd": {
    "type": "reference",
    "value": "project-mgmt-ux/v1-client"
  }
}
```

Reference formats:
- `"workspace"` - Workspace root
- `"project-name"` - Project root
- `"project-name/repo"` - First available repo
- `"project-name/repo-name-1"` - Specific repo clone
- `"project-name/package-name"` - Package within project

#### 2. Absolute path

Uses an absolute filesystem path:

```json
{
  "cwd": {
    "type": "path",
    "value": "/Users/username/workspace/projects/my-project"
  }
}
```

#### 3. No configuration

If no CWD is configured, the agent starts in its current directory.

### Launching agents with the helper

Use the `agent-helper` command to launch agents with automatic CWD initialization:

```bash
# Launch an agent with configuration
npx agent-helper agent-config.json node my-agent.js

# With additional arguments
npx agent-helper agent-config.json node my-agent.js --verbose --debug
```

The helper will:
1. Read the agent configuration
2. Resolve the CWD reference
3. Change to the resolved directory
4. Launch the agent with MCP tools available

### Programmatic usage

You can also use the AgentHelper class programmatically:

```javascript
import { AgentHelper } from '@claudeflow/mcp-workspace-tools/agent-helper';

const helper = new AgentHelper();

// Initialize agent CWD only
await helper.initializeAgent('agent-config.json');

// Or launch with command
await helper.launchAgent('agent-config.json', 'node', ['my-agent.js']);
```

## Example agents

### Workspace discovery agent

```javascript
// workspace-discovery-agent.js
async function discoverWorkspace() {
  const mcp = getMCPClient();

  const workspace = await mcp.call('workspace-tools', 'getWorkspaceInfo');

  for (const project of workspace.projects) {
    console.log(`Project: ${project.name}`);

    const details = await mcp.call('workspace-tools', 'getProjectInfo', {
      projectName: project.name
    });

    console.log(`  Repos: ${details.repos.length}`);
    console.log(`  Active work items: ${details.workItems.active}`);
  }
}
```

### Project-focused agent

Configuration (`project-agent-config.json`):
```json
{
  "name": "project-mgmt-ux-agent",
  "initialization": {
    "cwd": {
      "type": "reference",
      "value": "project-mgmt-ux/v1-client"
    }
  }
}
```

Agent code:
```javascript
// project-agent.js
console.log('Working in:', process.cwd());
// Will output: /path/to/project-mgmt-ux/repos/project-mgmt-ux-1/apps/v1/client

// Agent can now work directly with the project files
const files = fs.readdirSync('.');
console.log('Project files:', files);
```

### Multi-project agent

```javascript
// multi-project-agent.js
async function workOnAllProjects() {
  const mcp = getMCPClient();
  const workspace = await mcp.call('workspace-tools', 'getWorkspaceInfo');

  for (const project of workspace.projects) {
    // Get available repo for each project
    const repo = await mcp.call('workspace-tools', 'getAvailableRepo', {
      projectName: project.name
    });

    if (repo) {
      process.chdir(repo.path);
      console.log(`Working on ${project.name} in ${repo.path}`);

      // Perform project-specific tasks
      await performProjectTasks();
    }
  }
}
```

## Best practices

1. **Use references over paths**: References are portable and don't break when the workspace moves.

2. **Check resolution results**: Always verify that path resolution succeeded before using the path.

3. **Handle missing projects gracefully**: Projects might not exist or might not have repos.

4. **Cache workspace info**: If making multiple queries, cache the workspace info to reduce calls.

5. **Document agent requirements**: Clearly document which projects/packages your agent expects.

## Troubleshooting

### MCP server not found

If Claude Code can't find the MCP server:
1. Verify the path in the configuration is absolute
2. Check that the package is built (`dist/index.js` exists)
3. Ensure Node.js is in your PATH

### Path resolution fails

If path resolution returns null:
1. Check that the project exists
2. Verify the reference format is correct
3. For packages, ensure they have a `package.json`

### Agent starts in wrong directory

If the agent doesn't start in the expected directory:
1. Check the agent configuration JSON syntax
2. Verify the reference resolves correctly using the test scripts
3. Ensure the resolved path exists and is accessible

## Testing

Use the provided test scripts to verify functionality:

```bash
# Test basic functionality
node test-local.js

# Test project-specific features
node test-project.js

# Test agent initialization
node dist/agent-helper.js test-agent-config.json pwd
```