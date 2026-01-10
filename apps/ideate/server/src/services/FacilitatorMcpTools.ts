/**
 * FacilitatorMcpTools
 *
 * Native MCP tools for the Facilitator service.
 * These are registered as SDK MCP tools for proper streaming support.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { MCPToolsService } from './MCPToolsService.js';

/**
 * Create the facilitator MCP server with custom tools.
 * Pass `userId` at creation time so tools know which user's data to access.
 * Pass `workspaceId` to automatically inject into resource creation when not explicitly provided.
 */
export function createFacilitatorMcpServer(toolsService: MCPToolsService, userId: string, workspaceId?: string) {
  return createSdkMcpServer({
    name: 'facilitator',
    version: '1.0.0',
    tools: [
      // === Topic Tools ===
      tool(
        'topic_list',
        'List all Topics accessible to the user. Optionally filter by workspace.',
        {
          workspaceId: z.string().optional().describe('Optional workspace ID to filter Topics'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_list', { workspaceId: args.workspaceId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_search',
        'Search for Topics by name, tags, or description.',
        {
          query: z.string().describe('Search query to find in Topic names, descriptions, and tags'),
          workspaceId: z.string().optional().describe('Optional workspace ID to limit search scope'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_search', { query: args.query, workspaceId: args.workspaceId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_get',
        'Get detailed information about a specific Topic by ID. Use this when you already have the Topic ID (e.g., from a ^topic reference).',
        {
          topicId: z.string().describe('The ID of the Topic to retrieve'),
          name: z.string().optional().describe('The name of the Topic (for display purposes only)'),
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

      tool(
        'topic_create',
        'Create a new Topic. Automatically navigates user to the created Topic.',
        {
          name: z.string().describe('Name of the Topic'),
          type: z.string().optional().describe('Type of the Topic (category, project, feature, or item)'),
          description: z.string().optional().describe('Description of the Topic'),
          parentId: z.string().optional().describe('ID of the parent Topic (for hierarchy)'),
          workspaceId: z.string().optional().describe('Workspace ID to associate the Topic with (defaults to current workspace)'),
          tags: z.string().optional().describe('Comma-separated list of tags'),
          icon: z.string().optional().describe('Icon name for the Topic'),
          color: z.string().optional().describe('Color name for the Topic'),
        },
        async (args) => {
          // Auto-inject workspaceId from context if not explicitly provided
          const toolArgs = {
            ...args,
            workspaceId: args.workspaceId || workspaceId,
          };
          const result = await toolsService.executeTool('topic_create', toolArgs, userId);

          // If creation succeeded, include navigate action to take user to the Topic
          const data = result.data as { topic?: { id?: string } } | undefined;
          if (data?.topic?.id) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  ...data,
                  __action: 'navigate',
                  target: 'topic',
                  topicId: data.topic.id,
                }, null, 2),
              }],
            };
          }

          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_update',
        'Update an existing Topic.',
        {
          topicId: z.string().describe('The ID of the Topic to update'),
          name: z.string().optional().describe('New name'),
          description: z.string().optional().describe('New description'),
          tags: z.string().optional().describe('New comma-separated list of tags'),
          icon: z.string().optional().describe('New icon name'),
          color: z.string().optional().describe('New color name'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_update', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_delete',
        'Delete a Topic.',
        {
          topicId: z.string().describe('The ID of the Topic to delete'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_delete', { topicId: args.topicId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_read_linked_files',
        'Read the contents of local files linked to a Topic. Returns file contents for all file-type links. Use this when you need to see the actual content of files referenced by a Topic.',
        {
          topicId: z.string().describe('The ID of the Topic whose linked files to read'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_read_linked_files', { topicId: args.topicId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_add_link',
        'Add a link to a Topic. Links can be URLs, file paths, or references to other Topics.',
        {
          topicId: z.string().describe('The ID of the Topic to add a link to'),
          type: z.enum(['url', 'path', 'topic-ref']).describe('Type of link: url (web URL), path (local file/folder), or topic-ref (reference to another Topic)'),
          label: z.string().describe('Display label for the link'),
          target: z.string().describe('The link target: URL for url type, file path for path type, or Topic ID for topic-ref type'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_add_link', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'topic_remove_link',
        'Remove a link from a Topic.',
        {
          topicId: z.string().describe('The ID of the Topic to remove a link from'),
          linkId: z.string().describe('The ID of the link to remove'),
        },
        async (args) => {
          const result = await toolsService.executeTool('topic_remove_link', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // === Document Tools ===
      tool(
        'document_list',
        'List documents. If workspaceId is provided, lists documents in that workspace. Otherwise lists documents in global scope.',
        {
          workspaceId: z.string().optional().describe('Optional workspace ID to list documents from'),
        },
        async (args) => {
          const result = await toolsService.executeTool('document_list', { workspaceId: args.workspaceId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'document_get',
        'Get a document by ID, including its full content.',
        {
          documentId: z.string().describe('The ID of the document to retrieve'),
        },
        async (args) => {
          const result = await toolsService.executeTool('document_get', { documentId: args.documentId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'document_create',
        'Create a new document.',
        {
          title: z.string().describe('Title of the document'),
          content: z.string().optional().describe('Initial content of the document (markdown)'),
          workspaceId: z.string().optional().describe('Workspace ID to create the document in (defaults to current workspace)'),
        },
        async (args) => {
          // Auto-inject workspaceId from context if not explicitly provided
          const toolArgs = {
            ...args,
            workspaceId: args.workspaceId || workspaceId,
          };
          const result = await toolsService.executeTool('document_create', toolArgs, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'document_update',
        'Update an existing document.',
        {
          documentId: z.string().describe('The ID of the document to update'),
          title: z.string().optional().describe('New title'),
          content: z.string().optional().describe('New content (replaces existing)'),
        },
        async (args) => {
          const result = await toolsService.executeTool('document_update', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'document_delete',
        'Delete a document.',
        {
          documentId: z.string().describe('The ID of the document to delete'),
        },
        async (args) => {
          const result = await toolsService.executeTool('document_delete', { documentId: args.documentId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'document_move',
        'Move a document to a different workspace.',
        {
          documentId: z.string().describe('The ID of the document to move'),
          workspaceId: z.string().optional().describe('Target workspace ID (omit for global scope)'),
        },
        async (args) => {
          const result = await toolsService.executeTool('document_move', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // === Workspace Tools ===
      tool(
        'workspace_list',
        'List all workspaces accessible to the user.',
        {},
        async () => {
          const result = await toolsService.executeTool('workspace_list', {}, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'workspace_get',
        'Get detailed information about a workspace.',
        {
          workspaceId: z.string().describe('The ID of the workspace to retrieve'),
        },
        async (args) => {
          const result = await toolsService.executeTool('workspace_get', { workspaceId: args.workspaceId }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'workspace_create',
        'Create a new workspace.',
        {
          name: z.string().describe('Name of the workspace'),
          description: z.string().optional().describe('Description of the workspace'),
        },
        async (args) => {
          const result = await toolsService.executeTool('workspace_create', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // === Search Tools ===
      tool(
        'search_documents',
        'Search for documents by content or title.',
        {
          query: z.string().describe('Search query'),
          workspaceId: z.string().optional().describe('Optional workspace ID to limit search scope'),
        },
        async (args) => {
          const result = await toolsService.executeTool('search_documents', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // === File Tools ===
      tool(
        'file_read',
        'Read the contents of a file given its absolute path. Use this to read any file when you have the full path.',
        {
          path: z.string().describe('The absolute path to the file to read'),
        },
        async (args) => {
          try {
            if (!args.path.startsWith('/')) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({ error: 'Path must be absolute (start with /)' }, null, 2),
                }],
              };
            }

            if (!existsSync(args.path)) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({ error: `File not found: ${args.path}` }, null, 2),
                }],
              };
            }

            const stat = statSync(args.path);
            if (stat.isDirectory()) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({ error: `Path is a directory, not a file: ${args.path}. Use file_list to see directory contents.` }, null, 2),
                }],
              };
            }

            const content = readFileSync(args.path, 'utf-8');
            return {
              content: [{
                type: 'text' as const,
                text: content,
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to read file' }, null, 2),
              }],
            };
          }
        }
      ),

      tool(
        'file_list',
        'List files and directories in a given directory. Returns names, types (file/directory), and sizes.',
        {
          path: z.string().describe('The absolute path to the directory to list'),
        },
        async (args) => {
          try {
            if (!args.path.startsWith('/')) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({ error: 'Path must be absolute (start with /)' }, null, 2),
                }],
              };
            }

            if (!existsSync(args.path)) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({ error: `Directory not found: ${args.path}` }, null, 2),
                }],
              };
            }

            const stat = statSync(args.path);
            if (!stat.isDirectory()) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({ error: `Path is a file, not a directory: ${args.path}. Use file_read to read file contents.` }, null, 2),
                }],
              };
            }

            const entries = readdirSync(args.path, { withFileTypes: true });
            const items = entries.map(entry => {
              const fullPath = `${args.path}/${entry.name}`;
              try {
                const entryStat = statSync(fullPath);
                return {
                  name: entry.name,
                  type: entry.isDirectory() ? 'directory' : 'file',
                  size: entry.isFile() ? entryStat.size : undefined,
                };
              } catch {
                return {
                  name: entry.name,
                  type: entry.isDirectory() ? 'directory' : 'file',
                };
              }
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({ path: args.path, items }, null, 2),
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to list directory' }, null, 2),
              }],
            };
          }
        }
      ),

      // === Idea Tools ===
      tool(
        'idea_create',
        'Create a new idea, optionally attached to Topics. Use for project scaffolding, capturing new concepts, or follow-up work.',
        {
          title: z.string().describe('Title of the idea'),
          summary: z.string().describe('Brief summary of the idea'),
          description: z.string().optional().describe('Detailed description of the idea (markdown)'),
          topicIds: z.string().optional().describe('Comma-separated list of Topic IDs to attach this idea to'),
          tags: z.string().optional().describe('Comma-separated list of tags'),
          workspaceId: z.string().optional().describe('Workspace ID to create the idea in (defaults to current workspace)'),
        },
        async (args) => {
          // Auto-inject workspaceId from context if not explicitly provided
          const toolArgs = {
            ...args,
            workspaceId: args.workspaceId || workspaceId,
          };
          const result = await toolsService.executeTool('idea_create', toolArgs, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'idea_list',
        'List ideas, optionally filtered by Topic ID, status, or workspace.',
        {
          topicId: z.string().optional().describe('Filter ideas by Topic ID'),
          status: z.enum(['new', 'exploring', 'executing', 'archived']).optional().describe('Filter by status'),
          workspaceId: z.string().optional().describe('Filter by workspace ID'),
        },
        async (args) => {
          const result = await toolsService.executeTool('idea_list', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'idea_get',
        'Get detailed information about a specific idea by ID.',
        {
          ideaId: z.string().describe('The ID of the idea to retrieve'),
        },
        async (args) => {
          const result = await toolsService.executeTool('idea_get', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      // === Navigation Action Tools ===
      tool(
        'navigate_to_topic',
        'Navigate the user to view a Topic in the Topics page. Returns a navigation action that the client will execute.',
        {
          topicId: z.string().describe('The Topic ID to navigate to'),
        },
        async (args) => {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                __action: 'navigate',
                target: 'topic',
                topicId: args.topicId,
              }),
            }],
          };
        }
      ),

      tool(
        'open_idea_workspace',
        'Open the idea workspace overlay. Can open an existing idea by ID, or open in "new" mode to create a new idea with an initial prompt for the idea agent.',
        {
          ideaId: z.string().optional().describe('The Idea ID to open (omit for new idea mode)'),
          topicId: z.string().optional().describe('Topic ID to attach the idea to (required for new idea mode)'),
          initialTitle: z.string().optional().describe('Initial title for the new idea (shown immediately in the card while agent processes)'),
          initialPrompt: z.string().optional().describe('Initial prompt to seed the idea agent when creating a new idea'),
          initialGreeting: z.string().optional().describe('Initial greeting from the agent (e.g., "I\'m crafting an Idea doc for your Spotify clone! Give me a sec...")'),
          closeFacilitator: z.boolean().optional().describe('Whether to close the Facilitator after opening (default: true)'),
          focusInput: z.boolean().optional().describe('Whether to focus the chat input (default: true)'),
        },
        async (args) => {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                __action: 'open_idea_workspace',
                ideaId: args.ideaId,
                topicId: args.topicId,
                initialTitle: args.initialTitle,
                initialPrompt: args.initialPrompt,
                initialGreeting: args.initialGreeting,
                closeFacilitator: args.closeFacilitator ?? true,
                focusInput: args.focusInput ?? true,
              }),
            }],
          };
        }
      ),

      tool(
        'close_facilitator',
        'Close the Facilitator overlay.',
        {},
        async () => {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ __action: 'close_facilitator' }),
            }],
          };
        }
      ),

      // === Memory/Facts Tools ===
      tool(
        'remember_fact',
        'Remember an important fact about the user for future conversations. Use this proactively when the user shares preferences, locations, workflow details, technical setup, or other persistent information.',
        {
          subject: z.string().describe('Short subject/title for the fact (3-6 words), e.g., "Work Projects Location"'),
          detail: z.string().describe('The full fact to remember, including relevant context'),
        },
        async (args) => {
          const result = await toolsService.executeTool('remember_fact', args, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'recall_facts',
        'List all remembered facts about the user. Use this to check what you already know.',
        {},
        async () => {
          const result = await toolsService.executeTool('recall_facts', {}, userId);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(result.data || { error: result.error }, null, 2),
            }],
          };
        }
      ),

      tool(
        'forget_fact',
        'Forget a specific fact about the user.',
        {
          factId: z.string().describe('The ID of the fact to forget (from recall_facts)'),
        },
        async (args) => {
          const result = await toolsService.executeTool('forget_fact', args, userId);
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
