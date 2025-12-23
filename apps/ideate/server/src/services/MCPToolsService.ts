import { WorkspaceService } from './WorkspaceService.js';
import { DocumentService, type Document } from './DocumentService.js';

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
export class MCPToolsService {
  private workspaceService: WorkspaceService;
  private documentService: DocumentService;

  constructor() {
    this.workspaceService = new WorkspaceService();
    this.documentService = new DocumentService();
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
        description: 'Create a new document with a title and optional initial content.',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the new document',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to create the document in',
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
    const success = await this.documentService.deleteDocument(documentId, userId);

    if (!success) {
      return {
        success: false,
        error: 'Document not found or you do not have permission to delete it',
      };
    }

    return {
      success: true,
      data: {
        message: 'Document deleted successfully',
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
}
