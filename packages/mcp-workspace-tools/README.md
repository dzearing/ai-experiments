# MCP Workspace Tools

MCP server providing workspace discovery and navigation tools for Claude Flow agents.

## Overview

This package provides an MCP (Model Context Protocol) server that exposes tools for:
- Discovering projects in the Claude Flow workspace
- Getting information about projects, repos, and work items
- Resolving project/package references to filesystem paths
- Finding available repository clones for work

## Available tools

### getWorkspaceInfo
Get workspace root path and list all projects.

**Returns:**
```json
{
  "workspacePath": "/Users/username/workspace",
  "projects": [
    {
      "name": "project-mgmt-ux",
      "path": "/Users/username/workspace/projects/project-mgmt-ux",
      "description": "Claude Flow project management UI",
      "hasRepos": true
    }
  ]
}
```

### getProjectInfo
Get detailed information about a specific project.

**Parameters:**
- `projectName` (string): Name of the project

**Returns:**
```json
{
  "name": "project-mgmt-ux",
  "path": "/Users/username/workspace/projects/project-mgmt-ux",
  "description": "Claude Flow project management UI",
  "repos": [
    {
      "name": "project-mgmt-ux",
      "number": 1,
      "path": "/Users/username/workspace/projects/project-mgmt-ux/repos/project-mgmt-ux-1",
      "isAvailable": true,
      "packages": [
        {
          "name": "v1",
          "path": "/Users/username/workspace/projects/project-mgmt-ux/repos/project-mgmt-ux-1/apps/v1",
          "type": "app"
        }
      ]
    }
  ],
  "workItems": {
    "ideas": 2,
    "planned": 5,
    "active": 1,
    "completed": 10
  }
}
```

### resolveProjectPath
Resolve a project/package reference to a filesystem path.

**Parameters:**
- `reference` (string): Reference to resolve

**Examples:**
- `"workspace"` → workspace root
- `"project-mgmt-ux"` → project root
- `"project-mgmt-ux/repo"` → first available repo
- `"project-mgmt-ux/project-mgmt-ux-1"` → specific repo clone
- `"project-mgmt-ux/v1-client"` → package within project

**Returns:**
```json
{
  "path": "/Users/username/workspace/projects/project-mgmt-ux",
  "type": "project",
  "project": "project-mgmt-ux"
}
```

### getAvailableRepo
Find an available repository clone for a project.

**Parameters:**
- `projectName` (string): Name of the project

**Returns:**
```json
{
  "name": "project-mgmt-ux",
  "number": 1,
  "path": "/Users/username/workspace/projects/project-mgmt-ux/repos/project-mgmt-ux-1",
  "isAvailable": true
}
```

### getWorkItemInfo
Get information about a specific work item.

**Parameters:**
- `projectName` (string): Name of the project
- `workItemName` (string): Name of the work item (without .md extension)

**Returns:**
```json
{
  "name": "implement-feature-x",
  "path": "/Users/username/workspace/projects/project-mgmt-ux/plans/active/implement-feature-x.md",
  "status": "active",
  "project": "project-mgmt-ux",
  "content": "# Implement Feature X..."
}
```

## Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build
```

## Usage with Claude Code

### Configuration

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "workspace-tools": {
      "command": "node",
      "args": ["/path/to/mcp-workspace-tools/dist/index.js"],
      "env": {
        "WORKSPACE_PATH": "/Users/username/workspace"
      }
    }
  }
}
```

### Using in agents

Agents can call these tools to discover projects and navigate the workspace:

```typescript
// Get all projects
const workspace = await mcp.call('workspace-tools', 'getWorkspaceInfo');

// Get specific project info
const project = await mcp.call('workspace-tools', 'getProjectInfo', {
  projectName: 'project-mgmt-ux'
});

// Resolve a path reference
const resolved = await mcp.call('workspace-tools', 'resolveProjectPath', {
  reference: 'project-mgmt-ux/v1-client'
});

// Change to resolved directory
process.chdir(resolved.path);
```

## Agent initialization

Agents can be configured to start in a specific directory:

```yaml
name: "project-mgmt-ux-agent"
description: "Agent for Claude Flow development"
initialization:
  cwd:
    type: "reference"
    value: "project-mgmt-ux/v1-client"
```

The agent launcher will:
1. Call `resolveProjectPath` with the reference
2. Change to the resolved directory
3. Start the agent task

## Development

```bash
# Watch for changes
pnpm dev

# Run tests (when implemented)
pnpm test
```