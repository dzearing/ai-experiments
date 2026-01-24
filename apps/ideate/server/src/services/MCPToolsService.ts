import { WorkspaceService } from './WorkspaceService.js';
import { DocumentService, type Document } from './DocumentService.js';
import { TopicService, type TopicIcon, type TopicColor } from './TopicService.js';
import { IdeaService, type IdeaStatus } from './IdeaService.js';
import { factsService } from './FactsService.js';
import type { WorkspaceWebSocketHandler } from '../websocket/WorkspaceWebSocketHandler.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Tool definition for Claude SDK
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * Result from executing a tool
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * MCPToolsService
 *
 * Provides tool definitions and execution for the AI facilitator.
 * Allows Claude to interact with workspaces, documents, and search.
 */
// Module-level workspace handler reference
let workspaceWsHandler: WorkspaceWebSocketHandler | null = null;

/**
 * Set the workspace WebSocket handler for broadcasting updates
 */
export function setWorkspaceHandler(handler: WorkspaceWebSocketHandler): void {
  workspaceWsHandler = handler;
}

export class MCPToolsService {
  private workspaceService: WorkspaceService;
  private documentService: DocumentService;
  private topicService: TopicService;
  private ideaService: IdeaService;

  constructor() {
    this.workspaceService = new WorkspaceService();
    this.documentService = new DocumentService();
    this.topicService = new TopicService();
    this.ideaService = new IdeaService();
  }

  /**
   * Get all available tool definitions.
   */
  getToolDefinitions(): ToolDefinition[] {
    return [
      // Workspace tools
      {
        name: 'workspace_list',
        description: 'List all workspaces accessible to the user. Returns workspace names, descriptions, and IDs.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'workspace_get',
        description: 'Get details about a specific workspace by ID.',
        input_schema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'The ID of the workspace to retrieve',
            },
          },
          required: ['workspaceId'],
        },
      },
      {
        name: 'workspace_create',
        description: 'Create a new workspace with a name and optional description.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the new workspace',
            },
            description: {
              type: 'string',
              description: 'Optional description of the workspace',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'workspace_update',
        description: 'Update an existing workspace name or description.',
        input_schema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'The ID of the workspace to update',
            },
            name: {
              type: 'string',
              description: 'New name for the workspace',
            },
            description: {
              type: 'string',
              description: 'New description for the workspace',
            },
          },
          required: ['workspaceId'],
        },
      },
      {
        name: 'workspace_delete',
        description: 'Delete a workspace by ID. Only the workspace owner can delete. This will also delete all documents in the workspace.',
        input_schema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'The ID of the workspace to delete',
            },
          },
          required: ['workspaceId'],
        },
      },

      // Document tools
      {
        name: 'document_list',
        description: 'List all documents in a workspace or all documents accessible to the user.',
        input_schema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to filter documents. If not provided, lists all accessible documents.',
            },
          },
        },
      },
      {
        name: 'document_get',
        description: 'Get the full content of a document by ID.',
        input_schema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'The ID of the document to retrieve',
            },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'document_create',
        description: 'Create a new document with a title and optional initial content. IMPORTANT: If creating documents for a specific workspace, you MUST provide the workspaceId parameter.',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the new document',
            },
            workspaceId: {
              type: 'string',
              description: 'The workspace ID to create the document in. Required when creating documents within a workspace. If omitted, the document will be created in global scope.',
            },
            content: {
              type: 'string',
              description: 'Optional initial content for the document (markdown)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'document_update',
        description: 'Update an existing document title or content.',
        input_schema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'The ID of the document to update',
            },
            title: {
              type: 'string',
              description: 'New title for the document',
            },
            content: {
              type: 'string',
              description: 'New content for the document (markdown)',
            },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'document_delete',
        description: 'Delete a document by ID. Only the document owner can delete.',
        input_schema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'The ID of the document to delete',
            },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'document_move',
        description: 'Move a document to a different workspace, or move it to global scope (outside any workspace).',
        input_schema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'The ID of the document to move',
            },
            workspaceId: {
              type: 'string',
              description: 'The target workspace ID to move the document to. Use null or omit to move to global scope.',
            },
          },
          required: ['documentId'],
        },
      },

      // Search tools
      {
        name: 'search_documents',
        description: 'Search for documents by title or content. Returns matching documents with snippets.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find in document titles and content',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to limit search scope',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'summarize_document',
        description: 'Get a summary of a document. Returns the first few paragraphs and key headings.',
        input_schema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'The ID of the document to summarize',
            },
          },
          required: ['documentId'],
        },
      },

      // Topic tools
      {
        name: 'topic_get',
        description: 'Get full details about a Topic including its properties, links, and documents. Use this to learn about a project, feature, or any entity the user has defined.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic to retrieve',
            },
            name: {
              type: 'string',
              description: 'The display name of the Topic (for UI display purposes)',
            },
          },
          required: ['topicId'],
        },
      },
      {
        name: 'topic_read_linked_files',
        description: 'Read the contents of local files linked to a Topic. Returns the file contents for all file-type links.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic whose linked files to read',
            },
          },
          required: ['topicId'],
        },
      },
      {
        name: 'topic_list',
        description: 'List all Topics accessible to the user. Optionally filter by workspace.',
        input_schema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to filter Topics',
            },
          },
        },
      },
      {
        name: 'topic_search',
        description: 'Search for Topics by name, tags, or description.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find in Topic names, descriptions, and tags',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to limit search scope',
            },
          },
          required: ['query'],
        },
      },

      // Topic CRUD tools
      {
        name: 'topic_create',
        description: 'Create a new Topic (project, feature, category, item, etc). Returns the created Topic.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the Topic',
            },
            type: {
              type: 'string',
              description: 'Type of the Topic (e.g., folder, git-repo, project, feature, category, item)',
            },
            description: {
              type: 'string',
              description: 'Optional description of the Topic',
            },
            parentId: {
              type: 'string',
              description: 'ID of the parent Topic. If not provided, creates at root level.',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to create the Topic in',
            },
            tags: {
              type: 'string',
              description: 'Comma-separated list of tags',
            },
            properties: {
              type: 'object',
              description: 'Key-value properties for the Topic (e.g., localPath for folders, remoteUrl for git repos)',
            },
            icon: {
              type: 'string',
              description: 'Icon identifier (folder, file, code, gear, package, etc.)',
            },
            color: {
              type: 'string',
              description: 'Color identifier (blue, green, purple, orange, red, teal, pink, yellow, gray)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'topic_update',
        description: 'Update an existing Topic. Only update fields that need to change.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic to update',
            },
            name: {
              type: 'string',
              description: 'New name for the Topic',
            },
            type: {
              type: 'string',
              description: 'New type for the Topic',
            },
            description: {
              type: 'string',
              description: 'New description for the Topic',
            },
            tags: {
              type: 'string',
              description: 'Comma-separated list of tags (replaces existing tags)',
            },
            icon: {
              type: 'string',
              description: 'New icon identifier',
            },
            color: {
              type: 'string',
              description: 'New color identifier',
            },
            properties: {
              type: 'object',
              description: 'Custom key-value properties to set on the Topic (replaces all existing properties). Use this to store metadata like localPath, url, etc. Pass as JSON object, e.g., {"localPath": "/path/to/folder"}',
            },
          },
          required: ['topicId'],
        },
      },
      {
        name: 'topic_delete',
        description: 'Delete a Topic. This will also delete all child Topics.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic to delete',
            },
          },
          required: ['topicId'],
        },
      },
      {
        name: 'topic_move',
        description: 'Move a Topic to a different parent. Use to reorganize the Topic hierarchy.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic to move',
            },
            newParentId: {
              type: 'string',
              description: 'The ID of the new parent Topic. Use "root" to move to root level.',
            },
          },
          required: ['topicId', 'newParentId'],
        },
      },
      {
        name: 'topic_add_link',
        description: 'Add a link to a Topic. Links can be files, URLs, GitHub repos, or packages.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic to add the link to',
            },
            type: {
              type: 'string',
              description: 'Type of link: file, url, github, or package',
              enum: ['file', 'url', 'github', 'package'],
            },
            label: {
              type: 'string',
              description: 'Display label for the link',
            },
            target: {
              type: 'string',
              description: 'The link target (file path, URL, etc.)',
            },
            description: {
              type: 'string',
              description: 'Optional description of what the link points to',
            },
          },
          required: ['topicId', 'type', 'label', 'target'],
        },
      },
      {
        name: 'topic_remove_link',
        description: 'Remove a link from a Topic by its ID.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'The ID of the Topic containing the link',
            },
            linkId: {
              type: 'string',
              description: 'The ID of the link to remove',
            },
          },
          required: ['topicId', 'linkId'],
        },
      },

      // Idea tools
      {
        name: 'idea_create',
        description: 'Create a new idea, optionally attached to Topics. Use for project scaffolding, capturing new concepts, or follow-up work.',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the idea',
            },
            summary: {
              type: 'string',
              description: 'Brief summary of the idea',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the idea (markdown)',
            },
            topicIds: {
              type: 'string',
              description: 'Comma-separated list of Topic IDs to attach this idea to',
            },
            tags: {
              type: 'string',
              description: 'Comma-separated list of tags',
            },
            workspaceId: {
              type: 'string',
              description: 'Workspace ID to create the idea in',
            },
          },
          required: ['title', 'summary'],
        },
      },
      {
        name: 'idea_list',
        description: 'List ideas, optionally filtered by Topic ID, status, or workspace.',
        input_schema: {
          type: 'object',
          properties: {
            topicId: {
              type: 'string',
              description: 'Filter ideas by Topic ID',
            },
            status: {
              type: 'string',
              description: 'Filter by status: new, exploring, executing, or archived',
              enum: ['new', 'exploring', 'executing', 'archived'],
            },
            workspaceId: {
              type: 'string',
              description: 'Filter by workspace ID',
            },
          },
        },
      },
      {
        name: 'idea_get',
        description: 'Get detailed information about a specific idea by ID.',
        input_schema: {
          type: 'object',
          properties: {
            ideaId: {
              type: 'string',
              description: 'The ID of the idea to retrieve',
            },
          },
          required: ['ideaId'],
        },
      },

      // Memory/Facts tools
      {
        name: 'remember_fact',
        description: 'Remember an important fact about the user for future conversations. Use this proactively when the user shares preferences, locations, workflow details, technical setup, or other persistent information that would be useful to know in future conversations.',
        input_schema: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Short subject/title for the fact (3-6 words), e.g., "Work Projects Location", "Preferred Editor"',
            },
            detail: {
              type: 'string',
              description: 'The full fact to remember, including relevant context',
            },
          },
          required: ['subject', 'detail'],
        },
      },
      {
        name: 'recall_facts',
        description: 'List all remembered facts about the user. Use this to check what you already know about the user.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'forget_fact',
        description: 'Forget a specific fact about the user. Use when the user asks to remove remembered information or when information is outdated.',
        input_schema: {
          type: 'object',
          properties: {
            factId: {
              type: 'string',
              description: 'The ID of the fact to forget (from recall_facts)',
            },
          },
          required: ['factId'],
        },
      },
    ];
  }

  /**
   * Execute a tool with given input.
   */
  async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    userId: string
  ): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'workspace_list':
          return await this.workspaceList(userId);

        case 'workspace_get':
          return await this.workspaceGet(
            input.workspaceId as string,
            userId
          );

        case 'workspace_create':
          return await this.workspaceCreate(
            userId,
            input.name as string,
            input.description as string | undefined
          );

        case 'workspace_update':
          return await this.workspaceUpdate(
            input.workspaceId as string,
            userId,
            input.name as string | undefined,
            input.description as string | undefined
          );

        case 'workspace_delete':
          return await this.workspaceDelete(
            input.workspaceId as string,
            userId
          );

        case 'document_list':
          return await this.documentList(
            userId,
            input.workspaceId as string | undefined
          );

        case 'document_get':
          return await this.documentGet(
            input.documentId as string,
            userId
          );

        case 'document_create':
          return await this.documentCreate(
            userId,
            input.title as string,
            input.workspaceId as string | undefined,
            input.content as string | undefined
          );

        case 'document_update':
          return await this.documentUpdate(
            input.documentId as string,
            userId,
            input.title as string | undefined,
            input.content as string | undefined
          );

        case 'document_delete':
          return await this.documentDelete(
            input.documentId as string,
            userId
          );

        case 'document_move':
          return await this.documentMove(
            input.documentId as string,
            userId,
            input.workspaceId as string | undefined
          );

        case 'search_documents':
          return await this.searchDocuments(
            userId,
            input.query as string,
            input.workspaceId as string | undefined
          );

        case 'summarize_document':
          return await this.summarizeDocument(
            input.documentId as string,
            userId
          );

        // Topic tools
        case 'topic_get':
          return await this.topicGet(
            input.topicId as string,
            userId
          );

        case 'topic_read_linked_files':
          return await this.topicReadLinkedFiles(
            input.topicId as string,
            userId
          );

        case 'topic_list':
          return await this.topicList(
            userId,
            input.workspaceId as string | undefined
          );

        case 'topic_search':
          return await this.topicSearch(
            userId,
            input.query as string,
            input.workspaceId as string | undefined
          );

        case 'topic_create':
          return await this.topicCreate(
            userId,
            input.name as string,
            input.type as string | undefined,
            input.description as string | undefined,
            input.parentId as string | undefined,
            input.workspaceId as string | undefined,
            input.tags as string | undefined,
            input.icon as string | undefined,
            input.color as string | undefined,
            input.properties as Record<string, string> | undefined
          );

        case 'topic_update':
          return await this.topicUpdate(
            input.topicId as string,
            userId,
            input.name as string | undefined,
            input.type as string | undefined,
            input.description as string | undefined,
            input.tags as string | undefined,
            input.icon as string | undefined,
            input.color as string | undefined,
            input.properties as Record<string, string> | undefined
          );

        case 'topic_delete':
          return await this.topicDelete(
            input.topicId as string,
            userId
          );

        case 'topic_move':
          return await this.topicMove(
            input.topicId as string,
            userId,
            input.newParentId as string
          );

        case 'topic_add_link':
          return await this.topicAddLink(
            input.topicId as string,
            userId,
            input.type as 'file' | 'url' | 'github' | 'package',
            input.label as string,
            input.target as string,
            input.description as string | undefined
          );

        case 'topic_remove_link':
          return await this.topicRemoveLink(
            input.topicId as string,
            userId,
            input.linkId as string
          );

        // Idea tools
        case 'idea_create':
          return await this.ideaCreate(
            userId,
            input.title as string,
            input.summary as string,
            input.description as string | undefined,
            input.topicIds as string | undefined,
            input.tags as string | undefined,
            input.workspaceId as string | undefined
          );

        case 'idea_list':
          return await this.ideaList(
            userId,
            input.topicId as string | undefined,
            input.status as IdeaStatus | undefined,
            input.workspaceId as string | undefined
          );

        case 'idea_get':
          return await this.ideaGet(
            input.ideaId as string,
            userId
          );

        // Memory/Facts tools
        case 'remember_fact':
          return await this.rememberFact(
            userId,
            input.subject as string,
            input.detail as string
          );

        case 'recall_facts':
          return await this.recallFacts(userId);

        case 'forget_fact':
          return await this.forgetFact(
            userId,
            input.factId as string
          );

        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MCPToolsService] Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // =========================================================================
  // Workspace Tools
  // =========================================================================

  private async workspaceList(userId: string): Promise<ToolResult> {
    const workspaces = await this.workspaceService.listWorkspaces(userId);

    return {
      success: true,
      data: {
        count: workspaces.length,
        workspaces: workspaces.map((ws) => ({
          id: ws.id,
          name: ws.name,
          description: ws.description,
          isOwner: ws.ownerId === userId,
          memberCount: ws.members.length,
          updatedAt: ws.updatedAt,
        })),
      },
    };
  }

  private async workspaceGet(
    workspaceId: string,
    userId: string
  ): Promise<ToolResult> {
    const workspace = await this.workspaceService.getWorkspace(workspaceId, userId);

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found or access denied',
      };
    }

    return {
      success: true,
      data: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        isOwner: workspace.ownerId === userId,
        memberCount: workspace.members.length,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    };
  }

  private async workspaceCreate(
    userId: string,
    name: string,
    description?: string
  ): Promise<ToolResult> {
    const result = await this.workspaceService.createWorkspace(
      userId,
      name,
      description
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error?.message || 'Failed to create workspace',
      };
    }

    const workspace = result.data;

    // Notify user about the new workspace
    workspaceWsHandler?.notifyWorkspaceCreated(userId, workspace.id, {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
    });

    return {
      success: true,
      data: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        message: `Workspace "${name}" created successfully`,
      },
    };
  }

  private async workspaceUpdate(
    workspaceId: string,
    userId: string,
    name?: string,
    description?: string
  ): Promise<ToolResult> {
    const updates: { name?: string; description?: string } = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    const result = await this.workspaceService.updateWorkspace(
      workspaceId,
      userId,
      updates
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error?.message || 'Workspace not found or you do not have permission to update it',
      };
    }

    const workspace = result.data;

    // Notify subscribers about the workspace update
    workspaceWsHandler?.notifyWorkspaceUpdated(workspaceId, {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
    });

    // Also notify the user that their workspace list has changed
    workspaceWsHandler?.notifyUserWorkspacesChanged(userId);

    return {
      success: true,
      data: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        message: 'Workspace updated successfully',
      },
    };
  }

  private async workspaceDelete(
    workspaceId: string,
    userId: string
  ): Promise<ToolResult> {
    const result = await this.workspaceService.deleteWorkspace(workspaceId, userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || 'Workspace not found or you do not have permission to delete it',
      };
    }

    // Notify subscribers that the workspace was deleted
    workspaceWsHandler?.notifyWorkspaceDeleted(workspaceId);

    // Notify the user that their workspace list has changed
    workspaceWsHandler?.notifyUserWorkspacesChanged(userId);

    return {
      success: true,
      data: {
        message: 'Workspace deleted successfully',
      },
    };
  }

  // =========================================================================
  // Document Tools
  // =========================================================================

  private async documentList(
    userId: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    const documents = await this.documentService.listDocuments(userId, workspaceId);

    return {
      success: true,
      data: {
        count: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          workspaceId: doc.workspaceId,
          isOwner: doc.ownerId === userId,
          isPublic: doc.isPublic,
          updatedAt: doc.updatedAt,
        })),
      },
    };
  }

  private async documentGet(
    documentId: string,
    userId: string
  ): Promise<ToolResult> {
    const document = await this.documentService.getDocument(documentId, userId);

    if (!document) {
      return {
        success: false,
        error: 'Document not found or access denied',
      };
    }

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        workspaceId: document.workspaceId,
        isOwner: document.ownerId === userId,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    };
  }

  private async documentCreate(
    userId: string,
    title: string,
    workspaceId?: string,
    content?: string
  ): Promise<ToolResult> {
    const document = await this.documentService.createDocument(userId, title, workspaceId);

    // If initial content provided, update the document
    if (content) {
      await this.documentService.updateDocument(document.id, userId, { content });
    }

    // Notify about document creation
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, document.id, 'document', document);
    }

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        workspaceId: document.workspaceId,
        message: `Document "${title}" created successfully`,
      },
    };
  }

  private async documentUpdate(
    documentId: string,
    userId: string,
    title?: string,
    content?: string
  ): Promise<ToolResult> {
    const updates: Partial<Document> = {};
    if (title) updates.title = title;
    if (content) updates.content = content;

    const document = await this.documentService.updateDocument(documentId, userId, updates);

    if (!document) {
      return {
        success: false,
        error: 'Document not found or access denied',
      };
    }

    // Notify about document update
    console.log(`[MCPToolsService] Document updated: ${document.id}, workspaceId: ${document.workspaceId}, handler: ${!!workspaceWsHandler}`);
    if (document.workspaceId && workspaceWsHandler) {
      console.log(`[MCPToolsService] Sending notification for document update in workspace ${document.workspaceId}`);
      workspaceWsHandler.notifyResourceUpdated(document.workspaceId, document.id, 'document', document);
    } else {
      console.log(`[MCPToolsService] Skipping notification - workspaceId: ${document.workspaceId}, handler: ${!!workspaceWsHandler}`);
    }

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        message: 'Document updated successfully',
      },
    };
  }

  private async documentDelete(
    documentId: string,
    userId: string
  ): Promise<ToolResult> {
    // Get the document first to know its workspace for notification
    const existingDoc = await this.documentService.getDocument(documentId, userId);
    const workspaceId = existingDoc?.workspaceId;

    const success = await this.documentService.deleteDocument(documentId, userId);

    if (!success) {
      return {
        success: false,
        error: 'Document not found or you do not have permission to delete it',
      };
    }

    // Notify about document deletion
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, documentId, 'document');
    }

    return {
      success: true,
      data: {
        message: 'Document deleted successfully',
      },
    };
  }

  private async documentMove(
    documentId: string,
    userId: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    // Get current document to know source workspace
    const existingDoc = await this.documentService.getDocument(documentId, userId);
    const sourceWorkspaceId = existingDoc?.workspaceId;

    // Update the document's workspaceId (undefined means global scope)
    const document = await this.documentService.updateDocument(documentId, userId, {
      workspaceId: workspaceId,
    });

    if (!document) {
      return {
        success: false,
        error: 'Document not found or access denied',
      };
    }

    // Notify workspaces about the move
    if (workspaceWsHandler) {
      // Notify source workspace that document was removed
      if (sourceWorkspaceId) {
        workspaceWsHandler.notifyResourceDeleted(sourceWorkspaceId, documentId, 'document');
      }
      // Notify destination workspace that document was added
      if (workspaceId) {
        workspaceWsHandler.notifyResourceCreated(workspaceId, document.id, 'document', document);
      }
    }

    const destination = workspaceId ? `workspace ${workspaceId}` : 'global scope';

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        workspaceId: document.workspaceId,
        message: `Document "${document.title}" moved to ${destination}`,
      },
    };
  }

  // =========================================================================
  // Search Tools
  // =========================================================================

  private async searchDocuments(
    userId: string,
    query: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    // Get all documents the user can access
    const documents = await this.documentService.listDocuments(userId, workspaceId);

    const queryLower = query.toLowerCase();
    const results: Array<{
      id: string;
      title: string;
      snippet: string;
      workspaceId?: string;
      relevance: 'title' | 'content';
    }> = [];

    for (const docMeta of documents) {
      // Check title match
      if (docMeta.title.toLowerCase().includes(queryLower)) {
        results.push({
          id: docMeta.id,
          title: docMeta.title,
          snippet: `Title matches: "${docMeta.title}"`,
          workspaceId: docMeta.workspaceId,
          relevance: 'title',
        });
        continue;
      }

      // Check content match
      const doc = await this.documentService.getDocument(docMeta.id, userId);
      if (doc && doc.content.toLowerCase().includes(queryLower)) {
        // Extract snippet around match
        const lowerContent = doc.content.toLowerCase();
        const matchIndex = lowerContent.indexOf(queryLower);
        const snippetStart = Math.max(0, matchIndex - 50);
        const snippetEnd = Math.min(doc.content.length, matchIndex + query.length + 50);
        const snippet = (snippetStart > 0 ? '...' : '') +
          doc.content.slice(snippetStart, snippetEnd) +
          (snippetEnd < doc.content.length ? '...' : '');

        results.push({
          id: doc.id,
          title: doc.title,
          snippet,
          workspaceId: doc.workspaceId,
          relevance: 'content',
        });
      }
    }

    // Sort: title matches first, then content matches
    results.sort((a, b) => {
      if (a.relevance === 'title' && b.relevance !== 'title') return -1;
      if (a.relevance !== 'title' && b.relevance === 'title') return 1;
      return 0;
    });

    return {
      success: true,
      data: {
        query,
        count: results.length,
        results: results.slice(0, 10), // Limit to top 10
      },
    };
  }

  private async summarizeDocument(
    documentId: string,
    userId: string
  ): Promise<ToolResult> {
    const document = await this.documentService.getDocument(documentId, userId);

    if (!document) {
      return {
        success: false,
        error: 'Document not found or access denied',
      };
    }

    // Extract summary from content
    const lines = document.content.split('\n');
    const headings: string[] = [];
    const paragraphs: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        headings.push(trimmed);
      } else if (trimmed.length > 0 && paragraphs.length < 3) {
        paragraphs.push(trimmed);
      }
    }

    return {
      success: true,
      data: {
        id: document.id,
        title: document.title,
        headings: headings.slice(0, 5),
        preview: paragraphs.join('\n\n'),
        wordCount: document.content.split(/\s+/).length,
        characterCount: document.content.length,
      },
    };
  }

  // =========================================================================
  // Topic Tools
  // =========================================================================

  private async topicGet(
    topicId: string,
    userId: string
  ): Promise<ToolResult> {
    const topic = await this.topicService.getTopic(topicId, userId);

    if (!topic) {
      return {
        success: false,
        error: 'Topic not found or access denied',
      };
    }

    // Build path hierarchy by traversing parents
    const path: { id: string; name: string }[] = [];
    if (topic.parentIds.length > 0) {
      // Build path from first parent (primary path)
      let currentParentId: string | undefined = topic.parentIds[0];
      const visited = new Set<string>();

      while (currentParentId && !visited.has(currentParentId)) {
        visited.add(currentParentId);
        const parent = await this.topicService.getTopic(currentParentId, userId);
        if (parent) {
          path.unshift({ id: parent.id, name: parent.name });
          currentParentId = parent.parentIds[0];
        } else {
          break;
        }
      }
    }

    // Build path string (e.g., "Root > Parent > Child")
    const pathString = path.length > 0
      ? path.map(p => p.name).join(' > ')
      : '(root)';

    // Resolve key properties for execution context
    const keyProperties = await this.topicService.resolveKeyProperties(topicId, userId);

    return {
      success: true,
      data: {
        id: topic.id,
        name: topic.name,
        type: topic.type,
        description: topic.description,
        tags: topic.tags,
        path: pathString,
        pathHierarchy: path,
        parentIds: topic.parentIds,
        icon: topic.icon,
        color: topic.color,
        properties: topic.properties,
        // Resolved key properties for execution context (localPath, remoteUrl, etc.)
        keyProperties,
        links: topic.links?.map(link => ({
          type: link.type,
          label: link.label,
          target: link.target,
          description: link.description,
        })),
        documents: topic.documents?.map(doc => ({
          title: doc.title,
          content: doc.content,
        })),
        ideaCounts: topic.ideaCounts,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
    };
  }

  private async topicReadLinkedFiles(
    topicId: string,
    userId: string
  ): Promise<ToolResult> {
    const topic = await this.topicService.getTopic(topicId, userId);

    if (!topic) {
      return {
        success: false,
        error: 'Topic not found or access denied',
      };
    }

    // Get all file-type links
    const fileLinks = (topic.links || []).filter(link => link.type === 'file');

    if (fileLinks.length === 0) {
      return {
        success: true,
        data: {
          topicId: topic.id,
          topicName: topic.name,
          files: [],
          message: 'No file links found for this Topic',
        },
      };
    }

    // Read each linked file
    const files: Array<{
      path: string;
      label: string;
      content?: string;
      error?: string;
    }> = [];

    for (const link of fileLinks) {
      const filePath = link.target;

      try {
        if (!existsSync(filePath)) {
          files.push({
            path: filePath,
            label: link.label,
            error: 'File not found',
          });
          continue;
        }

        const content = await readFile(filePath, 'utf-8');
        files.push({
          path: filePath,
          label: link.label,
          content,
        });
      } catch (err) {
        files.push({
          path: filePath,
          label: link.label,
          error: err instanceof Error ? err.message : 'Failed to read file',
        });
      }
    }

    return {
      success: true,
      data: {
        topicId: topic.id,
        topicName: topic.name,
        files,
      },
    };
  }

  private async topicList(
    userId: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    const topics = await this.topicService.listTopics(userId, workspaceId);

    // Resolve key properties for each topic
    const topicsWithKeys = await Promise.all(
      topics.map(async (topic) => {
        const keyProperties = await this.topicService.resolveKeyProperties(topic.id, userId);
        return {
          id: topic.id,
          name: topic.name,
          type: topic.type,
          description: topic.description,
          tags: topic.tags,
          parentIds: topic.parentIds,
          icon: topic.icon,
          color: topic.color,
          // Include resolved key properties so agents always know physical locations
          keyProperties,
        };
      })
    );

    return {
      success: true,
      data: {
        count: topics.length,
        topics: topicsWithKeys,
      },
    };
  }

  private async topicSearch(
    userId: string,
    query: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    const topics = await this.topicService.searchTopics(userId, query, workspaceId);

    // Resolve key properties for each topic
    const topicsWithKeys = await Promise.all(
      topics.map(async (topic) => {
        const keyProperties = await this.topicService.resolveKeyProperties(topic.id, userId);
        return {
          id: topic.id,
          name: topic.name,
          type: topic.type,
          description: topic.description,
          tags: topic.tags,
          parentIds: topic.parentIds,
          icon: topic.icon,
          color: topic.color,
          // Include resolved key properties so agents always know physical locations
          keyProperties,
        };
      })
    );

    return {
      success: true,
      data: {
        query,
        count: topics.length,
        topics: topicsWithKeys,
      },
    };
  }

  private async topicCreate(
    userId: string,
    name: string,
    type?: string,
    description?: string,
    parentId?: string,
    workspaceId?: string,
    tags?: string,
    icon?: string,
    color?: string,
    properties?: Record<string, string>
  ): Promise<ToolResult> {
    const input = {
      name,
      type: type || 'item',
      description,
      parentIds: parentId ? [parentId] : [],
      workspaceId,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      icon: icon as TopicIcon | undefined,
      color: color as TopicColor | undefined,
      properties,
    };

    const topic = await this.topicService.createTopic(userId, input);

    // Notify workspace if applicable (for other connected clients)
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, topic.id, 'topic', topic);
    }

    // Return full TopicMetadata so the client can immediately add it to state
    // This ensures the Topic appears in the UI before the success checkmark shows
    return {
      success: true,
      data: {
        topic: {
          id: topic.id,
          name: topic.name,
          type: topic.type,
          description: topic.description,
          parentIds: topic.parentIds,
          workspaceId: topic.workspaceId,
          tags: topic.tags,
          icon: topic.icon,
          color: topic.color,
          properties: topic.properties,
          createdAt: topic.createdAt,
          updatedAt: topic.updatedAt,
        },
        message: `Topic "${name}" created successfully`,
      },
    };
  }

  private async topicUpdate(
    topicId: string,
    userId: string,
    name?: string,
    type?: string,
    description?: string,
    tags?: string,
    icon?: string,
    color?: string,
    properties?: Record<string, string>
  ): Promise<ToolResult> {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (properties !== undefined) updates.properties = properties;

    const topic = await this.topicService.updateTopic(topicId, userId, updates);

    if (!topic) {
      return {
        success: false,
        error: 'Topic not found or access denied',
      };
    }

    // Notify workspace if applicable
    if (topic.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    return {
      success: true,
      data: {
        id: topic.id,
        name: topic.name,
        type: topic.type,
        message: 'Topic updated successfully',
      },
    };
  }

  private async topicDelete(
    topicId: string,
    userId: string
  ): Promise<ToolResult> {
    // Get the topic first to know its workspace
    const existingTopic = await this.topicService.getTopic(topicId, userId);
    const workspaceId = existingTopic?.workspaceId;

    const success = await this.topicService.deleteTopic(topicId, userId);

    if (!success) {
      return {
        success: false,
        error: 'Topic not found or you do not have permission to delete it',
      };
    }

    // Notify workspace if applicable
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, topicId, 'topic');
    }

    return {
      success: true,
      data: {
        message: 'Topic deleted successfully',
      },
    };
  }

  private async topicMove(
    topicId: string,
    userId: string,
    newParentId: string
  ): Promise<ToolResult> {
    // Handle "root" as a special case for moving to root level
    const parentIds = newParentId === 'root' ? [] : [newParentId];

    const topic = await this.topicService.updateTopic(topicId, userId, { parentIds });

    if (!topic) {
      return {
        success: false,
        error: 'Topic not found or access denied',
      };
    }

    // Notify workspace if applicable
    if (topic.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    const destination = newParentId === 'root' ? 'root level' : `parent ${newParentId}`;
    return {
      success: true,
      data: {
        id: topic.id,
        name: topic.name,
        parentIds: topic.parentIds,
        message: `Topic "${topic.name}" moved to ${destination}`,
      },
    };
  }

  private async topicAddLink(
    topicId: string,
    userId: string,
    type: 'file' | 'url' | 'github' | 'package',
    label: string,
    target: string,
    description?: string
  ): Promise<ToolResult> {
    const link = await this.topicService.addLink(topicId, userId, {
      type,
      label,
      target,
      description,
    });

    if (!link) {
      return {
        success: false,
        error: 'Topic not found or access denied',
      };
    }

    return {
      success: true,
      data: {
        linkId: link.id,
        type: link.type,
        label: link.label,
        target: link.target,
        message: `Link "${label}" added to Topic`,
      },
    };
  }

  private async topicRemoveLink(
    topicId: string,
    userId: string,
    linkId: string
  ): Promise<ToolResult> {
    const success = await this.topicService.removeLink(topicId, userId, linkId);

    if (!success) {
      return {
        success: false,
        error: 'Topic or link not found, or access denied',
      };
    }

    return {
      success: true,
      data: {
        message: 'Link removed successfully',
      },
    };
  }

  // =========================================================================
  // Idea Tools
  // =========================================================================

  private async ideaCreate(
    userId: string,
    title: string,
    summary: string,
    description?: string,
    topicIds?: string,
    tags?: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    const input = {
      title,
      summary,
      description,
      topicIds: topicIds ? topicIds.split(',').map(t => t.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      workspaceId,
      source: 'ai' as const,
    };

    const idea = await this.ideaService.createIdea(userId, input);

    // Notify workspace if applicable
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, idea.id, 'idea', idea);
    }

    return {
      success: true,
      data: {
        id: idea.id,
        title: idea.title,
        summary: idea.summary,
        topicIds: idea.topicIds,
        message: `Idea "${title}" created successfully`,
      },
    };
  }

  private async ideaList(
    userId: string,
    topicId?: string,
    status?: IdeaStatus,
    workspaceId?: string
  ): Promise<ToolResult> {
    let ideas = await this.ideaService.listIdeas(userId, workspaceId, status);

    // Filter by topicId if provided
    if (topicId) {
      ideas = ideas.filter(idea => idea.topicIds.includes(topicId));
    }

    return {
      success: true,
      data: {
        count: ideas.length,
        ideas: ideas.map(idea => ({
          id: idea.id,
          title: idea.title,
          summary: idea.summary,
          status: idea.status,
          topicIds: idea.topicIds,
          tags: idea.tags,
          rating: idea.rating,
          updatedAt: idea.updatedAt,
        })),
      },
    };
  }

  private async ideaGet(
    ideaId: string,
    userId: string
  ): Promise<ToolResult> {
    const idea = await this.ideaService.getIdea(ideaId, userId);

    if (!idea) {
      return {
        success: false,
        error: 'Idea not found or access denied',
      };
    }

    return {
      success: true,
      data: {
        id: idea.id,
        title: idea.title,
        summary: idea.summary,
        description: idea.description,
        status: idea.status,
        topicIds: idea.topicIds,
        tags: idea.tags,
        rating: idea.rating,
        source: idea.source,
        plan: idea.plan,
        execution: idea.execution,
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt,
      },
    };
  }

  // =========================================================================
  // Memory/Facts Tools
  // =========================================================================

  private async rememberFact(
    userId: string,
    subject: string,
    detail: string
  ): Promise<ToolResult> {
    const fact = await factsService.addFact(userId, subject, detail, 'inferred');

    return {
      success: true,
      data: {
        fact: {
          id: fact.id,
          subject: fact.subject,
          detail: fact.detail,
          createdAt: fact.createdAt,
        },
        message: `Remembered: "${subject}"`,
      },
    };
  }

  private async recallFacts(userId: string): Promise<ToolResult> {
    const facts = await factsService.getFacts(userId);

    return {
      success: true,
      data: {
        count: facts.length,
        facts: facts.map(f => ({
          id: f.id,
          subject: f.subject,
          detail: f.detail,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })),
      },
    };
  }

  private async forgetFact(
    userId: string,
    factId: string
  ): Promise<ToolResult> {
    const deleted = await factsService.deleteFact(userId, factId);

    if (!deleted) {
      return {
        success: false,
        error: 'Fact not found',
      };
    }

    return {
      success: true,
      data: {
        message: 'Fact forgotten successfully',
      },
    };
  }
}
