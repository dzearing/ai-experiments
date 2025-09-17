#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { WorkspaceTools } from './tools/workspace.js';
import { ProjectTools } from './tools/project.js';
import { PathResolver } from './tools/resolver.js';

// Initialize tools
const workspacePath = process.env.WORKSPACE_PATH;
const workspaceTools = new WorkspaceTools(workspacePath);
const projectTools = new ProjectTools(workspacePath);
const pathResolver = new PathResolver(workspacePath);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'getWorkspaceInfo',
    description: 'Get workspace root path and list all projects',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getProjectInfo',
    description: 'Get detailed information about a specific project including repos and work items',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Name of the project (e.g., "project-mgmt-ux")'
        }
      },
      required: ['projectName']
    }
  },
  {
    name: 'resolveProjectPath',
    description: 'Resolve a project/package reference to a filesystem path',
    inputSchema: {
      type: 'object',
      properties: {
        reference: {
          type: 'string',
          description: 'Reference to resolve (e.g., "project-mgmt-ux", "project-mgmt-ux/v1-client", "workspace")'
        }
      },
      required: ['reference']
    }
  },
  {
    name: 'getAvailableRepo',
    description: 'Find an available repo clone for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Name of the project'
        }
      },
      required: ['projectName']
    }
  },
  {
    name: 'getWorkItemInfo',
    description: 'Get information about a specific work item in a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Name of the project'
        },
        workItemName: {
          type: 'string',
          description: 'Name of the work item (without .md extension)'
        }
      },
      required: ['projectName', 'workItemName']
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'mcp-workspace-tools',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'getWorkspaceInfo': {
        const result = await workspaceTools.getWorkspaceInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'getProjectInfo': {
        const projectName = args?.projectName as string;
        if (!projectName) {
          throw new Error('projectName is required');
        }

        const result = await projectTools.getProjectInfo(projectName);
        if (!result) {
          throw new Error(`Project not found: ${projectName}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'resolveProjectPath': {
        const reference = args?.reference as string;
        if (!reference) {
          throw new Error('reference is required');
        }

        const result = await pathResolver.resolveProjectPath(reference);
        if (!result) {
          throw new Error(`Could not resolve: ${reference}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'getAvailableRepo': {
        const projectName = args?.projectName as string;
        if (!projectName) {
          throw new Error('projectName is required');
        }

        const result = await projectTools.getAvailableRepo(projectName);
        if (!result) {
          throw new Error(`No available repo found for project: ${projectName}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'getWorkItemInfo': {
        const projectName = args?.projectName as string;
        const workItemName = args?.workItemName as string;

        if (!projectName || !workItemName) {
          throw new Error('projectName and workItemName are required');
        }

        const result = await projectTools.getWorkItemInfo(projectName, workItemName);
        if (!result) {
          throw new Error(`Work item not found: ${workItemName} in project ${projectName}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Workspace Tools server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});