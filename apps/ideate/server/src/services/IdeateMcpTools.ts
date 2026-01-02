/**
 * IdeateMcpTools
 *
 * MCP tools for the Execution Agent to interact with Ideate.
 * These allow the agent to create, list, and update ideas during execution.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { IdeaService, IdeaStatus } from './IdeaService.js';

/**
 * Create the Ideate MCP server with idea management tools.
 * Pass `userId` and optionally `workspaceId` at creation time.
 */
export function createIdeateMcpServer(
  ideaService: IdeaService,
  userId: string,
  workspaceId?: string
) {
  return createSdkMcpServer({
    name: 'ideate',
    version: '1.0.0',
    tools: [
      // === Idea Creation ===
      tool(
        'create_idea',
        'Create a new idea in Ideate. Use this for follow-up work, improvements, or related features discovered during execution.',
        {
          title: z.string().describe('Title of the new idea'),
          summary: z.string().describe('Brief summary of the idea'),
          tags: z.array(z.string()).optional().describe('Tags for categorization'),
          description: z.string().optional().describe('Detailed description of the idea'),
        },
        async (args) => {
          try {
            const idea = await ideaService.createIdea(userId, {
              title: args.title,
              summary: args.summary,
              tags: args.tags || [],
              description: args.description,
              workspaceId,
              source: 'ai',
              thingIds: [],
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  message: `Created idea: "${idea.title}" (${idea.id})`,
                  idea: {
                    id: idea.id,
                    title: idea.title,
                    summary: idea.summary,
                    status: idea.status,
                  },
                }, null, 2),
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : 'Failed to create idea',
                }, null, 2),
              }],
            };
          }
        }
      ),

      // === List Ideas ===
      tool(
        'list_ideas',
        'List existing ideas in the current workspace. Optionally filter by status.',
        {
          status: z.enum(['new', 'exploring', 'executing', 'archived']).optional()
            .describe('Filter by idea status'),
        },
        async (args) => {
          try {
            const status = args.status as IdeaStatus | undefined;
            const ideas = await ideaService.listIdeas(userId, workspaceId, status, true);

            const summary = ideas.map(idea => ({
              id: idea.id,
              title: idea.title,
              summary: idea.summary,
              status: idea.status,
              tags: idea.tags,
            }));

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  count: summary.length,
                  ideas: summary,
                }, null, 2),
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  error: err instanceof Error ? err.message : 'Failed to list ideas',
                }, null, 2),
              }],
            };
          }
        }
      ),

      // === Get Idea Details ===
      tool(
        'get_idea',
        'Get detailed information about a specific idea by ID.',
        {
          ideaId: z.string().describe('The ID of the idea to retrieve'),
        },
        async (args) => {
          try {
            const idea = await ideaService.getIdea(args.ideaId, userId, true);

            if (!idea) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: `Idea not found: ${args.ideaId}`,
                  }, null, 2),
                }],
              };
            }

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  id: idea.id,
                  title: idea.title,
                  summary: idea.summary,
                  description: idea.description,
                  status: idea.status,
                  tags: idea.tags,
                  plan: idea.plan ? {
                    phases: idea.plan.phases.length,
                    workingDirectory: idea.plan.workingDirectory,
                    branch: idea.plan.branch,
                  } : null,
                  createdAt: idea.createdAt,
                  updatedAt: idea.updatedAt,
                }, null, 2),
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  error: err instanceof Error ? err.message : 'Failed to get idea',
                }, null, 2),
              }],
            };
          }
        }
      ),

      // === Update Idea ===
      tool(
        'update_idea',
        'Update an existing idea. Use this to add details or refine discovered during execution.',
        {
          ideaId: z.string().describe('ID of the idea to update'),
          title: z.string().optional().describe('New title'),
          summary: z.string().optional().describe('New summary'),
          tags: z.array(z.string()).optional().describe('New tags (replaces existing)'),
          description: z.string().optional().describe('New description'),
        },
        async (args) => {
          try {
            const { ideaId, ...updates } = args;

            // Filter out undefined values
            const cleanUpdates: Record<string, string | string[] | undefined> = {};
            if (updates.title) cleanUpdates.title = updates.title;
            if (updates.summary) cleanUpdates.summary = updates.summary;
            if (updates.tags) cleanUpdates.tags = updates.tags;
            if (updates.description) cleanUpdates.description = updates.description;

            const idea = await ideaService.updateIdea(ideaId, userId, cleanUpdates);

            if (!idea) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    success: false,
                    error: `Idea not found or access denied: ${ideaId}`,
                  }, null, 2),
                }],
              };
            }

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  message: `Updated idea: "${idea.title}" (${idea.id})`,
                  idea: {
                    id: idea.id,
                    title: idea.title,
                    summary: idea.summary,
                    status: idea.status,
                  },
                }, null, 2),
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : 'Failed to update idea',
                }, null, 2),
              }],
            };
          }
        }
      ),

      // === Add Tags to Idea ===
      tool(
        'add_idea_tags',
        'Add tags to an existing idea without replacing existing ones.',
        {
          ideaId: z.string().describe('ID of the idea'),
          tags: z.array(z.string()).describe('Tags to add'),
        },
        async (args) => {
          try {
            const idea = await ideaService.getIdea(args.ideaId, userId, true);
            if (!idea) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: `Idea not found: ${args.ideaId}`,
                  }, null, 2),
                }],
              };
            }

            // Merge existing tags with new ones (no duplicates)
            const allTags = [...new Set([...idea.tags, ...args.tags])];
            const updated = await ideaService.updateIdea(args.ideaId, userId, { tags: allTags });

            if (!updated) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    success: false,
                    error: 'Failed to update tags',
                  }, null, 2),
                }],
              };
            }

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  message: `Added tags to idea: ${args.tags.join(', ')}`,
                  currentTags: updated.tags,
                }, null, 2),
              }],
            };
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : 'Failed to add tags',
                }, null, 2),
              }],
            };
          }
        }
      ),
    ],
  });
}
