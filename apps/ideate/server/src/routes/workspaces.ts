import { Router, type Request, type Response } from 'express';
import { WorkspaceService } from '../services/WorkspaceService.js';

export const workspacesRouter = Router();
const workspaceService = new WorkspaceService();

// List workspaces
workspacesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const workspaces = await workspaceService.listWorkspaces(userId);
    res.json(workspaces);
  } catch (error) {
    console.error('List workspaces error:', error);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

// Create workspace
workspacesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, description } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const workspace = await workspaceService.createWorkspace(
      userId,
      name,
      description || ''
    );
    res.status(201).json(workspace);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get workspace
workspacesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const workspace = await workspaceService.getWorkspace(id, userId);

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

// Update workspace
workspacesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const workspace = await workspaceService.updateWorkspace(id, userId, updates);

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json(workspace);
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Delete workspace
workspacesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await workspaceService.deleteWorkspace(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});
