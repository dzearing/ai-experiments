import { WorkspaceService } from './WorkspaceService.js';
import { DocumentService, type Document } from './DocumentService.js';
import { ThingService, type ThingIcon, type ThingColor } from './ThingService.js';
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
  private thingService: ThingService;

  constructor() {
    this.workspaceService = new WorkspaceService();
    this.documentService = new DocumentService();
    this.thingService = new ThingService();
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

      // Thing tools
      {
        name: 'thing_get',
        description: 'Get full details about a Thing including its properties, links, and documents. Use this to learn about a project, feature, or any entity the user has defined.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing to retrieve',
            },
            name: {
              type: 'string',
              description: 'The display name of the Thing (for UI display purposes)',
            },
          },
          required: ['thingId'],
        },
      },
      {
        name: 'thing_read_linked_files',
        description: 'Read the contents of local files linked to a Thing. Returns the file contents for all file-type links.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing whose linked files to read',
            },
          },
          required: ['thingId'],
        },
      },
      {
        name: 'thing_list',
        description: 'List all Things accessible to the user. Optionally filter by workspace.',
        input_schema: {
          type: 'object',
          properties: {
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to filter Things',
            },
          },
        },
      },
      {
        name: 'thing_search',
        description: 'Search for Things by name, tags, or description.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find in Thing names, descriptions, and tags',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to limit search scope',
            },
          },
          required: ['query'],
        },
      },

      // Thing CRUD tools
      {
        name: 'thing_create',
        description: 'Create a new Thing (project, feature, category, item, etc). Returns the created Thing.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the Thing',
            },
            type: {
              type: 'string',
              description: 'Type of the Thing (e.g., category, project, feature, item, package, component)',
            },
            description: {
              type: 'string',
              description: 'Optional description of the Thing',
            },
            parentId: {
              type: 'string',
              description: 'ID of the parent Thing. If not provided, creates at root level.',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to create the Thing in',
            },
            tags: {
              type: 'string',
              description: 'Comma-separated list of tags',
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
        name: 'thing_update',
        description: 'Update an existing Thing. Only update fields that need to change.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing to update',
            },
            name: {
              type: 'string',
              description: 'New name for the Thing',
            },
            type: {
              type: 'string',
              description: 'New type for the Thing',
            },
            description: {
              type: 'string',
              description: 'New description for the Thing',
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
          },
          required: ['thingId'],
        },
      },
      {
        name: 'thing_delete',
        description: 'Delete a Thing. This will also delete all child Things.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing to delete',
            },
          },
          required: ['thingId'],
        },
      },
      {
        name: 'thing_move',
        description: 'Move a Thing to a different parent. Use to reorganize the Thing hierarchy.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing to move',
            },
            newParentId: {
              type: 'string',
              description: 'The ID of the new parent Thing. Use "root" to move to root level.',
            },
          },
          required: ['thingId', 'newParentId'],
        },
      },
      {
        name: 'thing_add_link',
        description: 'Add a link to a Thing. Links can be files, URLs, GitHub repos, or packages.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing to add the link to',
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
          required: ['thingId', 'type', 'label', 'target'],
        },
      },
      {
        name: 'thing_remove_link',
        description: 'Remove a link from a Thing by its ID.',
        input_schema: {
          type: 'object',
          properties: {
            thingId: {
              type: 'string',
              description: 'The ID of the Thing containing the link',
            },
            linkId: {
              type: 'string',
              description: 'The ID of the link to remove',
            },
          },
          required: ['thingId', 'linkId'],
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

        // Thing tools
        case 'thing_get':
          return await this.thingGet(
            input.thingId as string,
            userId
          );

        case 'thing_read_linked_files':
          return await this.thingReadLinkedFiles(
            input.thingId as string,
            userId
          );

        case 'thing_list':
          return await this.thingList(
            userId,
            input.workspaceId as string | undefined
          );

        case 'thing_search':
          return await this.thingSearch(
            userId,
            input.query as string,
            input.workspaceId as string | undefined
          );

        case 'thing_create':
          return await this.thingCreate(
            userId,
            input.name as string,
            input.type as string | undefined,
            input.description as string | undefined,
            input.parentId as string | undefined,
            input.workspaceId as string | undefined,
            input.tags as string | undefined,
            input.icon as string | undefined,
            input.color as string | undefined
          );

        case 'thing_update':
          return await this.thingUpdate(
            input.thingId as string,
            userId,
            input.name as string | undefined,
            input.type as string | undefined,
            input.description as string | undefined,
            input.tags as string | undefined,
            input.icon as string | undefined,
            input.color as string | undefined
          );

        case 'thing_delete':
          return await this.thingDelete(
            input.thingId as string,
            userId
          );

        case 'thing_move':
          return await this.thingMove(
            input.thingId as string,
            userId,
            input.newParentId as string
          );

        case 'thing_add_link':
          return await this.thingAddLink(
            input.thingId as string,
            userId,
            input.type as 'file' | 'url' | 'github' | 'package',
            input.label as string,
            input.target as string,
            input.description as string | undefined
          );

        case 'thing_remove_link':
          return await this.thingRemoveLink(
            input.thingId as string,
            userId,
            input.linkId as string
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
          memberCount: ws.memberIds.length + 1, // +1 for owner
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
        memberCount: workspace.memberIds.length + 1,
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
    const workspace = await this.workspaceService.createWorkspace(
      userId,
      name,
      description
    );

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

    const workspace = await this.workspaceService.updateWorkspace(
      workspaceId,
      userId,
      updates
    );

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found or you do not have permission to update it',
      };
    }

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
    const success = await this.workspaceService.deleteWorkspace(workspaceId, userId);

    if (!success) {
      return {
        success: false,
        error: 'Workspace not found or you do not have permission to delete it',
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
  // Thing Tools
  // =========================================================================

  private async thingGet(
    thingId: string,
    userId: string
  ): Promise<ToolResult> {
    const thing = await this.thingService.getThing(thingId, userId);

    if (!thing) {
      return {
        success: false,
        error: 'Thing not found or access denied',
      };
    }

    // Build path hierarchy by traversing parents
    const path: { id: string; name: string }[] = [];
    if (thing.parentIds.length > 0) {
      // Build path from first parent (primary path)
      let currentParentId: string | undefined = thing.parentIds[0];
      const visited = new Set<string>();

      while (currentParentId && !visited.has(currentParentId)) {
        visited.add(currentParentId);
        const parent = await this.thingService.getThing(currentParentId, userId);
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

    return {
      success: true,
      data: {
        id: thing.id,
        name: thing.name,
        type: thing.type,
        description: thing.description,
        tags: thing.tags,
        path: pathString,
        pathHierarchy: path,
        parentIds: thing.parentIds,
        icon: thing.icon,
        color: thing.color,
        properties: thing.properties,
        links: thing.links?.map(link => ({
          type: link.type,
          label: link.label,
          target: link.target,
          description: link.description,
        })),
        documents: thing.documents?.map(doc => ({
          title: doc.title,
          content: doc.content,
        })),
        ideaCounts: thing.ideaCounts,
        createdAt: thing.createdAt,
        updatedAt: thing.updatedAt,
      },
    };
  }

  private async thingReadLinkedFiles(
    thingId: string,
    userId: string
  ): Promise<ToolResult> {
    const thing = await this.thingService.getThing(thingId, userId);

    if (!thing) {
      return {
        success: false,
        error: 'Thing not found or access denied',
      };
    }

    // Get all file-type links
    const fileLinks = (thing.links || []).filter(link => link.type === 'file');

    if (fileLinks.length === 0) {
      return {
        success: true,
        data: {
          thingId: thing.id,
          thingName: thing.name,
          files: [],
          message: 'No file links found for this Thing',
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
        thingId: thing.id,
        thingName: thing.name,
        files,
      },
    };
  }

  private async thingList(
    userId: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    const things = await this.thingService.listThings(userId, workspaceId);

    return {
      success: true,
      data: {
        count: things.length,
        things: things.map(thing => ({
          id: thing.id,
          name: thing.name,
          type: thing.type,
          description: thing.description,
          tags: thing.tags,
          parentIds: thing.parentIds,
          icon: thing.icon,
          color: thing.color,
        })),
      },
    };
  }

  private async thingSearch(
    userId: string,
    query: string,
    workspaceId?: string
  ): Promise<ToolResult> {
    const things = await this.thingService.searchThings(userId, query, workspaceId);

    return {
      success: true,
      data: {
        query,
        count: things.length,
        things: things.map(thing => ({
          id: thing.id,
          name: thing.name,
          type: thing.type,
          description: thing.description,
          tags: thing.tags,
          icon: thing.icon,
          color: thing.color,
        })),
      },
    };
  }

  private async thingCreate(
    userId: string,
    name: string,
    type?: string,
    description?: string,
    parentId?: string,
    workspaceId?: string,
    tags?: string,
    icon?: string,
    color?: string
  ): Promise<ToolResult> {
    const input = {
      name,
      type: type || 'item',
      description,
      parentIds: parentId ? [parentId] : [],
      workspaceId,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      icon: icon as ThingIcon | undefined,
      color: color as ThingColor | undefined,
    };

    const thing = await this.thingService.createThing(userId, input);

    // Notify workspace if applicable
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, thing.id, 'thing', thing);
    }

    return {
      success: true,
      data: {
        id: thing.id,
        name: thing.name,
        type: thing.type,
        description: thing.description,
        message: `Thing "${name}" created successfully`,
      },
    };
  }

  private async thingUpdate(
    thingId: string,
    userId: string,
    name?: string,
    type?: string,
    description?: string,
    tags?: string,
    icon?: string,
    color?: string
  ): Promise<ToolResult> {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;

    const thing = await this.thingService.updateThing(thingId, userId, updates);

    if (!thing) {
      return {
        success: false,
        error: 'Thing not found or access denied',
      };
    }

    // Notify workspace if applicable
    if (thing.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(thing.workspaceId, thing.id, 'thing', thing);
    }

    return {
      success: true,
      data: {
        id: thing.id,
        name: thing.name,
        type: thing.type,
        message: 'Thing updated successfully',
      },
    };
  }

  private async thingDelete(
    thingId: string,
    userId: string
  ): Promise<ToolResult> {
    // Get the thing first to know its workspace
    const existingThing = await this.thingService.getThing(thingId, userId);
    const workspaceId = existingThing?.workspaceId;

    const success = await this.thingService.deleteThing(thingId, userId);

    if (!success) {
      return {
        success: false,
        error: 'Thing not found or you do not have permission to delete it',
      };
    }

    // Notify workspace if applicable
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, thingId, 'thing');
    }

    return {
      success: true,
      data: {
        message: 'Thing deleted successfully',
      },
    };
  }

  private async thingMove(
    thingId: string,
    userId: string,
    newParentId: string
  ): Promise<ToolResult> {
    // Handle "root" as a special case for moving to root level
    const parentIds = newParentId === 'root' ? [] : [newParentId];

    const thing = await this.thingService.updateThing(thingId, userId, { parentIds });

    if (!thing) {
      return {
        success: false,
        error: 'Thing not found or access denied',
      };
    }

    // Notify workspace if applicable
    if (thing.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(thing.workspaceId, thing.id, 'thing', thing);
    }

    const destination = newParentId === 'root' ? 'root level' : `parent ${newParentId}`;
    return {
      success: true,
      data: {
        id: thing.id,
        name: thing.name,
        parentIds: thing.parentIds,
        message: `Thing "${thing.name}" moved to ${destination}`,
      },
    };
  }

  private async thingAddLink(
    thingId: string,
    userId: string,
    type: 'file' | 'url' | 'github' | 'package',
    label: string,
    target: string,
    description?: string
  ): Promise<ToolResult> {
    const link = await this.thingService.addLink(thingId, userId, {
      type,
      label,
      target,
      description,
    });

    if (!link) {
      return {
        success: false,
        error: 'Thing not found or access denied',
      };
    }

    return {
      success: true,
      data: {
        linkId: link.id,
        type: link.type,
        label: link.label,
        target: link.target,
        message: `Link "${label}" added to Thing`,
      },
    };
  }

  private async thingRemoveLink(
    thingId: string,
    userId: string,
    linkId: string
  ): Promise<ToolResult> {
    const success = await this.thingService.removeLink(thingId, userId, linkId);

    if (!success) {
      return {
        success: false,
        error: 'Thing or link not found, or access denied',
      };
    }

    return {
      success: true,
      data: {
        message: 'Link removed successfully',
      },
    };
  }
}
