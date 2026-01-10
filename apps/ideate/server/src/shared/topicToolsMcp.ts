/**
 * Topic Tools MCP Server
 *
 * Creates an MCP server for topic-related tools that can be shared across agents.
 * This enables the Idea Agent and Plan Agent to look up and modify Topics.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { MCPToolsService } from '../services/MCPToolsService.js';

/**
 * Create an MCP server with topic tools for use by agents.
 *
 * @param userId - The user ID for access control
 * @param workspaceId - Optional workspace ID for filtering
 */
export function createTopicToolsMcpServer(userId: string, workspaceId?: string) {
  const toolsService = new MCPToolsService();

  return createSdkMcpServer({
    name: 'topic-tools',
    version: '1.0.0',
    tools: [
      // topic_search - Find topics by name/query
      tool(
        'topic_search',
        'Search for Topics by name, tags, or description. Use this when the user mentions a Topic by name.',
        {
          query: z.string().describe('Search query to find in Topic names, descriptions, and tags'),
          workspaceId: z.string().optional().describe('Optional workspace ID to limit search scope'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'topic_search',
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

      // topic_get - Get full details about a Topic
      tool(
        'topic_get',
        'Get full details about a Topic including its properties, links, and documents.',
        {
          topicId: z.string().describe('The ID of the Topic to retrieve'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_get', { topicId: args.topicId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // topic_list - List all Topics
      tool(
        'topic_list',
        'List all Topics accessible to the user. Returns a hierarchical view.',
        {
          workspaceId: z.string().optional().describe('Optional workspace ID to filter Topics'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'topic_list',
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

      // topic_read_linked_files - Read file contents linked to a Topic
      tool(
        'topic_read_linked_files',
        'Read the contents of local files linked to a Topic. Returns file contents for all file-type links.',
        {
          topicId: z.string().describe('The ID of the Topic whose linked files to read'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'topic_read_linked_files',
            { topicId: args.topicId },
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

      // topic_create - Create a new Topic
      tool(
        'topic_create',
        'Create a new Topic (project, feature, category, item, etc).',
        {
          name: z.string().describe('Name of the Topic'),
          type: z.string().optional().describe('Type of the Topic (e.g., category, project, feature, item)'),
          description: z.string().optional().describe('Optional description of the Topic'),
          parentId: z.string().optional().describe('ID of the parent Topic. If not provided, creates at root level.'),
          tags: z.string().optional().describe('Comma-separated list of tags'),
          icon: z.string().optional().describe('Icon identifier (folder, file, code, gear, package, etc.)'),
          color: z.string().optional().describe('Color identifier (blue, green, purple, orange, red, teal, pink, yellow, gray)'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'topic_create',
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

      // topic_update - Update an existing Topic
      tool(
        'topic_update',
        'Update an existing Topic. Only update fields that need to change.',
        {
          topicId: z.string().describe('The ID of the Topic to update'),
          name: z.string().optional().describe('New name for the Topic'),
          type: z.string().optional().describe('New type for the Topic'),
          description: z.string().optional().describe('New description for the Topic'),
          tags: z.string().optional().describe('Comma-separated list of tags (replaces existing tags)'),
          icon: z.string().optional().describe('New icon identifier'),
          color: z.string().optional().describe('New color identifier'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'topic_update',
            {
              topicId: args.topicId,
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

      // topic_add_link - Add a link to a Topic
      tool(
        'topic_add_link',
        'Add a link to a Topic. Links can be files, URLs, GitHub repos, or packages.',
        {
          topicId: z.string().describe('The ID of the Topic to add the link to'),
          type: z.enum(['file', 'url', 'github', 'package']).describe('Type of link'),
          label: z.string().describe('Display label for the link'),
          target: z.string().describe('The link target (file path, URL, repo name, or package name)'),
        },
        async (args) => {
          const result = await toolsService.executeTool(
            'topic_add_link',
            {
              topicId: args.topicId,
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
 * Prompt section describing topic tools.
 * Include this in agent system prompts that have access to topic tools.
 */
export const TOPIC_TOOLS_PROMPT = `
## Topic Tools

You have access to tools for working with Topics (projects, features, components, etc.):

### Reading Topics
- **topic_search**: Search for Topics by name. Use this when the user mentions a Topic by name (e.g., "under the api-server").
- **topic_get**: Get full details about a specific Topic including its links and properties.
- **topic_list**: List all Topics to see the hierarchy.
- **topic_read_linked_files**: Read the contents of files linked to a Topic.

### Modifying Topics
- **topic_create**: Create a new Topic (project, feature, etc.)
- **topic_update**: Update a Topic's name, description, type, or tags
- **topic_add_link**: Add a file, URL, GitHub repo, or package link to a Topic

### When to Use Topic Tools
- When the user mentions a Topic by name (e.g., "under the api-server topic"), use **topic_search** first to find its ID
- When you need to understand what a Topic contains, use **topic_get** to see its full details
- When you need to read code or files associated with a Topic, use **topic_read_linked_files**
- When creating or modifying structure, use the appropriate write tools

### Important
- Always use **topic_search** when the user references a Topic by name - never assume you know its ID
- Topic IDs are opaque strings - don't try to construct them
`;
