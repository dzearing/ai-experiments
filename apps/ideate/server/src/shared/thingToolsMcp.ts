/**
 * Thing Tools MCP Server
 *
 * Creates an MCP server for thing-related tools that can be shared across agents.
 * This enables the Idea Agent and Plan Agent to look up and modify Things.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { MCPToolsService } from '../services/MCPToolsService.js';

/**
 * Create an MCP server with thing tools for use by agents.
 *
 * @param userId - The user ID for access control
 * @param workspaceId - Optional workspace ID for filtering
 */
export function createThingToolsMcpServer(userId: string, workspaceId?: string) {
  const toolsService = new MCPToolsService();

  return createSdkMcpServer({
    name: 'thing-tools',
    version: '1.0.0',
    tools: [
      // thing_search - Find things by name/query
      tool(
        'thing_search',
        'Search for Things by name, tags, or description. Use this when the user mentions a Thing by name.',
        {
          query: z.string().describe('Search query to find in Thing names, descriptions, and tags'),
          workspaceId: z.string().optional().describe('Optional workspace ID to limit search scope'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'thing_search',
            { query: args.query, workspaceId: args.workspaceId || workspaceId },
            userId
          );
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // thing_get - Get full details about a Thing
      tool(
        'thing_get',
        'Get full details about a Thing including its properties, links, and documents.',
        {
          thingId: z.string().describe('The ID of the Thing to retrieve'),
        },
        async (args) => {
          const result = await toolsService.executeTool('thing_get', { thingId: args.thingId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // thing_list - List all Things
      tool(
        'thing_list',
        'List all Things accessible to the user. Returns a hierarchical view.',
        {
          workspaceId: z.string().optional().describe('Optional workspace ID to filter Things'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'thing_list',
            { workspaceId: args.workspaceId || workspaceId },
            userId
          );
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // thing_read_linked_files - Read file contents linked to a Thing
      tool(
        'thing_read_linked_files',
        'Read the contents of local files linked to a Thing. Returns file contents for all file-type links.',
        {
          thingId: z.string().describe('The ID of the Thing whose linked files to read'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'thing_read_linked_files',
            { thingId: args.thingId },
            userId
          );
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // thing_create - Create a new Thing
      tool(
        'thing_create',
        'Create a new Thing (project, feature, category, item, etc).',
        {
          name: z.string().describe('Name of the Thing'),
          type: z.string().optional().describe('Type of the Thing (e.g., category, project, feature, item)'),
          description: z.string().optional().describe('Optional description of the Thing'),
          parentId: z.string().optional().describe('ID of the parent Thing. If not provided, creates at root level.'),
          tags: z.string().optional().describe('Comma-separated list of tags'),
          icon: z.string().optional().describe('Icon identifier (folder, file, code, gear, package, etc.)'),
          color: z.string().optional().describe('Color identifier (blue, green, purple, orange, red, teal, pink, yellow, gray)'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'thing_create',
            {
              name: args.name,
              type: args.type,
              description: args.description,
              parentId: args.parentId,
              workspaceId: workspaceId,
              tags: args.tags,
              icon: args.icon,
              color: args.color,
            },
            userId
          );
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // thing_update - Update an existing Thing
      tool(
        'thing_update',
        'Update an existing Thing. Only update fields that need to change.',
        {
          thingId: z.string().describe('The ID of the Thing to update'),
          name: z.string().optional().describe('New name for the Thing'),
          type: z.string().optional().describe('New type for the Thing'),
          description: z.string().optional().describe('New description for the Thing'),
          tags: z.string().optional().describe('Comma-separated list of tags (replaces existing tags)'),
          icon: z.string().optional().describe('New icon identifier'),
          color: z.string().optional().describe('New color identifier'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'thing_update',
            {
              thingId: args.thingId,
              name: args.name,
              type: args.type,
              description: args.description,
              tags: args.tags,
              icon: args.icon,
              color: args.color,
            },
            userId
          );
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // thing_add_link - Add a link to a Thing
      tool(
        'thing_add_link',
        'Add a link to a Thing. Links can be files, URLs, GitHub repos, or packages.',
        {
          thingId: z.string().describe('The ID of the Thing to add the link to'),
          type: z.enum(['file', 'url', 'github', 'package']).describe('Type of link'),
          label: z.string().describe('Display label for the link'),
          target: z.string().describe('The link target (file path, URL, repo name, or package name)'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'thing_add_link',
            {
              thingId: args.thingId,
              type: args.type,
              label: args.label,
              target: args.target,
            },
            userId
          );
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),
    ],
  });
}

/**
 * Prompt section describing thing tools.
 * Include this in agent system prompts that have access to thing tools.
 */
export const THING_TOOLS_PROMPT = `
## Thing Tools

You have access to tools for working with Things (projects, features, components, etc.):

### Reading Things
- **thing_search**: Search for Things by name. Use this when the user mentions a Thing by name (e.g., "under the api-server").
- **thing_get**: Get full details about a specific Thing including its links and properties.
- **thing_list**: List all Things to see the hierarchy.
- **thing_read_linked_files**: Read the contents of files linked to a Thing.

### Modifying Things
- **thing_create**: Create a new Thing (project, feature, etc.)
- **thing_update**: Update a Thing's name, description, type, or tags
- **thing_add_link**: Add a file, URL, GitHub repo, or package link to a Thing

### When to Use Thing Tools
- When the user mentions a Thing by name (e.g., "under the api-server thing"), use **thing_search** first to find its ID
- When you need to understand what a Thing contains, use **thing_get** to see its full details
- When you need to read code or files associated with a Thing, use **thing_read_linked_files**
- When creating or modifying structure, use the appropriate write tools

### Important
- Always use **thing_search** when the user references a Thing by name - never assume you know its ID
- Thing IDs are opaque strings - don't try to construct them
`;
