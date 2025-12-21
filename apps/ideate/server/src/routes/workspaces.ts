import { Router, type Request, type Response } from 'express';
import { WorkspaceService } from '../services/WorkspaceService.js';

export const workspacesRouter = Router();
const workspaceService = new WorkspaceService();

// Get workspace preview by share token (no auth required)
workspacesRouter.get('/join/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const preview = await workspaceService.getWorkspaceByShareToken(token);

    if (!preview) {
      res.status(404).json({ error: 'Invalid or expired share link' });
      return;
    }

    res.json(preview);
  } catch (error) {
    console.error('Get workspace preview error:', error);
    res.status(500).json({ error: 'Failed to get workspace preview' });
  }
});

// Join workspace using share token
workspacesRouter.post('/join/:token', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { token } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const workspace = await workspaceService.joinWorkspaceByToken(token, userId);

    if (!workspace) {
      res.status(404).json({ error: 'Invalid or expired share link' });
      return;
    }

    res.json(workspace);
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Failed to join workspace' });
  }
});

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

// Get share token for workspace (owner only)
workspacesRouter.get('/:id/share', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const token = await workspaceService.getShareToken(id, userId);

    if (token === null) {
      // Could be no permission or no token exists yet
      res.json({ token: null });
      return;
    }

    res.json({ token });
  } catch (error) {
    console.error('Get share token error:', error);
    res.status(500).json({ error: 'Failed to get share token' });
  }
});

// Generate or regenerate share token (owner only)
workspacesRouter.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { regenerate } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const token = await workspaceService.generateShareToken(
      id,
      userId,
      regenerate === true
    );

    if (!token) {
      res.status(403).json({ error: 'Not authorized to generate share token' });
      return;
    }

    res.json({ token });
  } catch (error) {
    console.error('Generate share token error:', error);
    res.status(500).json({ error: 'Failed to generate share token' });
  }
});
