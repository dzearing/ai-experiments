import { Router, type Request, type Response } from 'express';
import { DocumentService } from '../services/DocumentService.js';
import { WorkspaceService } from '../services/WorkspaceService.js';
import type { WorkspaceWebSocketHandler } from '../websocket/WorkspaceWebSocketHandler.js';

const documentService = new DocumentService();
const workspaceService = new WorkspaceService();

// Store the workspace handler reference for notifications
let workspaceWsHandler: WorkspaceWebSocketHandler | null = null;

export function setWorkspaceHandler(handler: WorkspaceWebSocketHandler): void {
  workspaceWsHandler = handler;
}

export const documentsRouter = Router();

// List documents (optionally filter by workspaceId or thingId query param)
documentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;
    const thingId = req.query.thingId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // If filtering by workspace, check if user has workspace access
    let isWorkspaceMember = false;
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      isWorkspaceMember = workspace !== null;
    }

    const documents = await documentService.listDocuments(userId, workspaceId, isWorkspaceMember, thingId);
    res.json(documents);
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Create document
documentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { title, workspaceId, thingId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const document = await documentService.createDocument(userId, title, workspaceId, thingId);

    // Notify workspace subscribers of new document
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, document.id, 'document', document);
    }

    res.status(201).json(document);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Get document
documentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const document = await documentService.getDocument(id, userId);

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// Update document
documentsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const document = await documentService.updateDocument(id, userId, updates);

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Notify workspace subscribers of updated document
    if (document.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(document.workspaceId, document.id, 'document', document);
    }

    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
documentsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get document metadata before deletion for notification
    const document = await documentService.getDocument(id, userId);
    const workspaceId = document?.workspaceId;

    const success = await documentService.deleteDocument(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Notify workspace subscribers of deleted document
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, id, 'document');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Generate share link
documentsRouter.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const shareCode = await documentService.generateShareCode(id, userId);

    if (!shareCode) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ shareCode });
  } catch (error) {
    console.error('Generate share code error:', error);
    res.status(500).json({ error: 'Failed to generate share code' });
  }
});

// List collaborators
documentsRouter.get('/:id/collaborators', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const collaborators = await documentService.getCollaborators(id, userId);

    if (!collaborators) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(collaborators);
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ error: 'Failed to get collaborators' });
  }
});
