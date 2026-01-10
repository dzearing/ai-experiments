import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import * as Y from 'yjs';

export interface DocumentMetadata {
  id: string;
  title: string;
  ownerId: string;
  workspaceId?: string;
  /** Associated Topic ID (if document belongs to a Topic) */
  topicId?: string;
  collaboratorIds: string[];
  isPublic: boolean;
  shareCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document extends DocumentMetadata {
  content: string;
}

export interface Collaborator {
  userId: string;
  name: string;
  avatarUrl: string;
  addedAt: string;
}

// Base directory for document storage
const DOCUMENTS_DIR = path.join(homedir(), 'Ideate', 'documents');

// Directory for Yjs binary state (CRDT data)
const YJS_DIR = path.join(homedir(), 'Ideate', 'yjs-state');

export class DocumentService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
      await fs.mkdir(YJS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create documents directories:', error);
    }
  }

  private getDocumentPath(id: string): string {
    return path.join(DOCUMENTS_DIR, `${id}.md`);
  }

  private getMetadataPath(id: string): string {
    return path.join(DOCUMENTS_DIR, `${id}.meta.json`);
  }

  private getYjsPath(id: string): string {
    return path.join(YJS_DIR, `${id}.yjs`);
  }

  /**
   * List all documents for a user (owned or collaborated).
   * Optionally filter by workspaceId or topicId.
   * If isWorkspaceMember is true, include all documents in the workspace.
   *
   * When topicId is provided, only returns documents for that Topic.
   * When topicId is not provided, excludes Topic documents (they only appear in Topic detail).
   */
  async listDocuments(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false,
    topicId?: string
  ): Promise<DocumentMetadata[]> {
    try {
      const files = await fs.readdir(DOCUMENTS_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      const documents: DocumentMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(DOCUMENTS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: DocumentMetadata = JSON.parse(content);

        // Filter by topicId
        if (topicId !== undefined) {
          // Only include documents for this specific Topic
          if (metadata.topicId !== topicId) continue;
        } else {
          // Exclude Topic documents from main document list
          if (metadata.topicId) continue;
        }

        // Filter by workspaceId if provided
        if (workspaceId !== undefined) {
          if (metadata.workspaceId !== workspaceId) continue;
        }

        // Include if user is owner, collaborator, or workspace member
        const hasDirectAccess = metadata.ownerId === userId ||
          metadata.collaboratorIds.includes(userId);
        const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId === workspaceId;

        if (!hasDirectAccess && !hasWorkspaceAccess) continue;

        documents.push(metadata);
      }

      // Sort by updated date, newest first
      documents.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return documents;
    } catch (error) {
      console.error('List documents error:', error);
      return [];
    }
  }

  /**
   * Create a new document.
   * @param topicId - Optional Topic ID to associate this document with
   */
  async createDocument(
    userId: string,
    title: string,
    workspaceId?: string,
    topicId?: string
  ): Promise<Document> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: DocumentMetadata = {
      id,
      title,
      ownerId: userId,
      workspaceId,
      topicId,
      collaboratorIds: [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };

    const content = `# ${title}\n\n`;

    // Save metadata
    await fs.writeFile(
      this.getMetadataPath(id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Save content (markdown is the source of truth)
    // The YjsCollaborationHandler will initialize the Y.Doc from this markdown
    // when the first client connects
    await fs.writeFile(this.getDocumentPath(id), content, 'utf-8');

    return { ...metadata, content };
  }

  /**
   * Get a document by ID.
   *
   * Access is allowed for:
   * - Document owner
   * - Collaborators
   * - Anyone with the direct link (for real-time collaboration)
   *
   * Note: For this demo app, we allow anyone with the document ID to access it.
   * This enables seamless collaboration when sharing document URLs.
   */
  async getDocument(id: string, _userId: string): Promise<Document | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // For demo/collaboration purposes, allow anyone with the link to access
      // In production, you'd want proper access control here
      const content = await fs.readFile(this.getDocumentPath(id), 'utf-8');

      return { ...metadata, content };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get document content by ID (server-side, no auth check).
   * Used by Yjs collaboration handler to initialize documents.
   */
  async getDocumentContent(id: string): Promise<string | null> {
    try {
      const content = await fs.readFile(this.getDocumentPath(id), 'utf-8');
      return content;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a document.
   *
   * For this demo app, anyone with the document ID can update it.
   * This enables seamless real-time collaboration.
   */
  async updateDocument(
    id: string,
    _userId: string,
    updates: Partial<Document>
  ): Promise<Document | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // For demo/collaboration purposes, allow anyone with the link to update
      // In production, you'd want proper access control here

      const now = new Date().toISOString();

      // Update metadata (workspaceId can be set to undefined to move to global scope)
      const updatedMetadata: DocumentMetadata = {
        ...metadata,
        title: updates.title ?? metadata.title,
        workspaceId: 'workspaceId' in updates ? updates.workspaceId : metadata.workspaceId,
        isPublic: updates.isPublic ?? metadata.isPublic,
        collaboratorIds: updates.collaboratorIds ?? metadata.collaboratorIds,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Update content if provided
      if (updates.content !== undefined) {
        await fs.writeFile(this.getDocumentPath(id), updates.content, 'utf-8');
      }

      const content =
        updates.content ??
        (await fs.readFile(this.getDocumentPath(id), 'utf-8'));

      return { ...updatedMetadata, content };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a document.
   */
  async deleteDocument(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      await fs.unlink(this.getMetadataPath(id));
      await fs.unlink(this.getDocumentPath(id));

      // Also delete Yjs state if it exists
      await this.deleteYjsState(id);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a share code for a document.
   */
  async generateShareCode(id: string, userId: string): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // Only owner can generate share code
      if (metadata.ownerId !== userId) {
        return null;
      }

      const shareCode = uuidv4().slice(0, 8).toUpperCase();

      const updatedMetadata: DocumentMetadata = {
        ...metadata,
        shareCode,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return shareCode;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get collaborators for a document.
   */
  async getCollaborators(
    id: string,
    userId: string
  ): Promise<Collaborator[] | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // Check access
      if (
        metadata.ownerId !== userId &&
        !metadata.collaboratorIds.includes(userId)
      ) {
        return null;
      }

      // TODO: Fetch actual collaborator details from user service
      // For now, return placeholder data
      return metadata.collaboratorIds.map((collabId) => ({
        userId: collabId,
        name: 'Collaborator',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${collabId}`,
        addedAt: metadata.createdAt,
      }));
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all public documents (for network discovery).
   */
  async getPublicDocuments(): Promise<DocumentMetadata[]> {
    try {
      const files = await fs.readdir(DOCUMENTS_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      const documents: DocumentMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(DOCUMENTS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: DocumentMetadata = JSON.parse(content);

        if (metadata.isPublic) {
          documents.push(metadata);
        }
      }

      return documents;
    } catch (error) {
      return [];
    }
  }

  // =========================================================================
  // Yjs CRDT Integration Methods
  // =========================================================================

  /**
   * Get the Yjs binary state for a document.
   * Returns null if no Yjs state exists yet.
   */
  async getYjsState(id: string): Promise<Uint8Array | null> {
    try {
      const yjsPath = this.getYjsPath(id);
      const state = await fs.readFile(yjsPath);
      return new Uint8Array(state);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error(`[DocumentService] Failed to read Yjs state for ${id}:`, error);
      return null;
    }
  }

  /**
   * Save Yjs binary state for a document.
   */
  async saveYjsState(id: string, state: Uint8Array): Promise<boolean> {
    try {
      const yjsPath = this.getYjsPath(id);
      await fs.writeFile(yjsPath, state);
      return true;
    } catch (error) {
      console.error(`[DocumentService] Failed to save Yjs state for ${id}:`, error);
      return false;
    }
  }

  /**
   * Initialize a Y.Doc for a document.
   * If Yjs state exists, load it. Otherwise, initialize from markdown content.
   * Returns the Y.Doc with the document content in a Y.Text named 'content'.
   */
  async initializeYjsDoc(id: string): Promise<Y.Doc | null> {
    try {
      const doc = new Y.Doc();
      const yText = doc.getText('content');

      // Try to load existing Yjs state first
      const existingState = await this.getYjsState(id);
      if (existingState) {
        Y.applyUpdate(doc, existingState);
        console.log(`[DocumentService] Loaded Yjs state for document ${id}`);
        return doc;
      }

      // No Yjs state, initialize from markdown
      const mdPath = this.getDocumentPath(id);
      try {
        const mdContent = await fs.readFile(mdPath, 'utf-8');
        // Insert markdown content into Y.Text
        yText.insert(0, mdContent);
        console.log(`[DocumentService] Initialized Yjs doc from markdown for ${id}`);

        // Save the initial Yjs state
        const initialState = Y.encodeStateAsUpdate(doc);
        await this.saveYjsState(id, initialState);

        return doc;
      } catch (mdError) {
        if ((mdError as NodeJS.ErrnoException).code === 'ENOENT') {
          // No markdown file either, return empty doc
          console.log(`[DocumentService] Created new empty Yjs doc for ${id}`);
          return doc;
        }
        throw mdError;
      }
    } catch (error) {
      console.error(`[DocumentService] Failed to initialize Yjs doc for ${id}:`, error);
      return null;
    }
  }

  /**
   * Sync markdown file from Yjs state.
   * This extracts the text content from the Y.Doc and saves it as markdown.
   */
  async syncMarkdownFromYjs(id: string): Promise<boolean> {
    try {
      const state = await this.getYjsState(id);
      if (!state) {
        console.warn(`[DocumentService] No Yjs state to sync for ${id}`);
        return false;
      }

      // Create a temporary doc to extract content
      const doc = new Y.Doc();
      Y.applyUpdate(doc, state);

      const yText = doc.getText('content');
      const content = yText.toString();

      // Save to markdown file
      const mdPath = this.getDocumentPath(id);
      await fs.writeFile(mdPath, content, 'utf-8');

      // Update metadata timestamp
      try {
        const metaPath = this.getMetadataPath(id);
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        const metadata: DocumentMetadata = JSON.parse(metaContent);
        metadata.updatedAt = new Date().toISOString();
        await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
      } catch {
        // Metadata update is optional
      }

      console.log(`[DocumentService] Synced markdown from Yjs for ${id}`);
      doc.destroy();
      return true;
    } catch (error) {
      console.error(`[DocumentService] Failed to sync markdown from Yjs for ${id}:`, error);
      return false;
    }
  }

  /**
   * Sync Yjs state from markdown content.
   * This loads the markdown file and updates the Yjs state.
   * Useful when markdown is edited directly.
   */
  async syncYjsFromMarkdown(id: string): Promise<boolean> {
    try {
      const mdPath = this.getDocumentPath(id);
      const mdContent = await fs.readFile(mdPath, 'utf-8');

      // Create a new doc with the markdown content
      const doc = new Y.Doc();
      const yText = doc.getText('content');
      yText.insert(0, mdContent);

      // Save Yjs state
      const state = Y.encodeStateAsUpdate(doc);
      await this.saveYjsState(id, state);

      console.log(`[DocumentService] Synced Yjs from markdown for ${id}`);
      doc.destroy();
      return true;
    } catch (error) {
      console.error(`[DocumentService] Failed to sync Yjs from markdown for ${id}:`, error);
      return false;
    }
  }

  /**
   * Check if Yjs state exists for a document.
   */
  async hasYjsState(id: string): Promise<boolean> {
    try {
      await fs.access(this.getYjsPath(id));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete Yjs state for a document.
   */
  async deleteYjsState(id: string): Promise<boolean> {
    try {
      await fs.unlink(this.getYjsPath(id));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return true; // Already doesn't exist
      }
      console.error(`[DocumentService] Failed to delete Yjs state for ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete all documents associated with a Topic.
   * Used for cascade delete when a Topic is deleted.
   */
  async deleteDocumentsByTopicId(topicId: string): Promise<number> {
    try {
      const files = await fs.readdir(DOCUMENTS_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      let deletedCount = 0;

      for (const file of metaFiles) {
        const metaPath = path.join(DOCUMENTS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: DocumentMetadata = JSON.parse(content);

        if (metadata.topicId === topicId) {
          // Delete all files for this document
          try {
            await fs.unlink(this.getMetadataPath(metadata.id));
          } catch { /* ignore */ }
          try {
            await fs.unlink(this.getDocumentPath(metadata.id));
          } catch { /* ignore */ }
          try {
            await fs.unlink(this.getYjsPath(metadata.id));
          } catch { /* ignore */ }

          deletedCount++;
          console.log(`[DocumentService] Deleted document ${metadata.id} for Topic ${topicId}`);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error(`[DocumentService] Failed to delete documents for Topic ${topicId}:`, error);
      return 0;
    }
  }
}
