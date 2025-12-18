import { Router, type Request, type Response } from 'express';
import { DocumentService } from '../services/DocumentService.js';

export const documentsRouter = Router();
const documentService = new DocumentService();

// List documents
documentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const documents = await documentService.listDocuments(userId);
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
    const { title } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const document = await documentService.createDocument(userId, title);
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

    const success = await documentService.deleteDocument(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Document not found' });
      return;
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
