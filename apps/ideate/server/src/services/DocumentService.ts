import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

export interface DocumentMetadata {
  id: string;
  title: string;
  ownerId: string;
  workspaceId?: string;
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

export class DocumentService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create documents directory:', error);
    }
  }

  private getDocumentPath(id: string): string {
    return path.join(DOCUMENTS_DIR, `${id}.md`);
  }

  private getMetadataPath(id: string): string {
    return path.join(DOCUMENTS_DIR, `${id}.meta.json`);
  }

  /**
   * List all documents for a user (owned or collaborated).
   * Optionally filter by workspaceId.
   */
  async listDocuments(userId: string, workspaceId?: string): Promise<DocumentMetadata[]> {
    try {
      const files = await fs.readdir(DOCUMENTS_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      const documents: DocumentMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(DOCUMENTS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: DocumentMetadata = JSON.parse(content);

        // Include if user is owner or collaborator
        const hasAccess = metadata.ownerId === userId ||
          metadata.collaboratorIds.includes(userId);

        if (!hasAccess) continue;

        // Filter by workspaceId if provided
        if (workspaceId !== undefined) {
          if (metadata.workspaceId !== workspaceId) continue;
        }

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
   */
  async createDocument(userId: string, title: string, workspaceId?: string): Promise<Document> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: DocumentMetadata = {
      id,
      title,
      ownerId: userId,
      workspaceId,
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

    // Save content
    await fs.writeFile(this.getDocumentPath(id), content, 'utf-8');

    return { ...metadata, content };
  }

  /**
   * Get a document by ID.
   */
  async getDocument(id: string, userId: string): Promise<Document | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // Check access
      if (
        metadata.ownerId !== userId &&
        !metadata.collaboratorIds.includes(userId) &&
        !metadata.isPublic
      ) {
        return null;
      }

      const content = await fs.readFile(this.getDocumentPath(id), 'utf-8');

      return { ...metadata, content };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a document.
   */
  async updateDocument(
    id: string,
    userId: string,
    updates: Partial<Document>
  ): Promise<Document | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: DocumentMetadata = JSON.parse(metaContent);

      // Check access (only owner or collaborator can update)
      if (
        metadata.ownerId !== userId &&
        !metadata.collaboratorIds.includes(userId)
      ) {
        return null;
      }

      const now = new Date().toISOString();

      // Update metadata
      const updatedMetadata: DocumentMetadata = {
        ...metadata,
        title: updates.title ?? metadata.title,
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
}
