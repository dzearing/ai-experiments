import { Router, type Request, type Response } from 'express';
import { WorkspaceService } from '../services/WorkspaceService.js';
import type { WorkspaceWebSocketHandler } from '../websocket/WorkspaceWebSocketHandler.js';
import type { WorkspaceApiError, WorkspaceRole } from '../types/workspace.js';

export const workspacesRouter = Router();
const workspaceService = new WorkspaceService();

// WebSocket handler for real-time notifications (injected from main server)
let workspaceWsHandler: WorkspaceWebSocketHandler | null = null;

export function setWorkspaceHandler(handler: WorkspaceWebSocketHandler): void {
  workspaceWsHandler = handler;
}

/**
 * Map error codes to HTTP status codes.
 */
function getStatusForError(error: WorkspaceApiError): number {
  switch (error.code) {
    case 'WORKSPACE_NOT_FOUND':
      return 404;
    case 'WORKSPACE_ACCESS_DENIED':
    case 'PERSONAL_WORKSPACE_IMMUTABLE':
    case 'INVALID_ROLE_CHANGE':
    case 'CANNOT_REMOVE_OWNER':
      return 403;
    case 'WORKSPACE_LIMIT_REACHED':
    case 'MEMBER_LIMIT_REACHED':
    case 'INVALID_WORKSPACE_TYPE':
    case 'COPY_TARGET_CONFLICT':
      return 400;
    default:
      return 500;
  }
}

// Get workspace preview by share token (no auth required)
workspacesRouter.get('/join/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

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
    const token = req.params.token as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    const result = await workspaceService.joinWorkspaceByToken(token, userId);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    res.json(result.data);
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Failed to join workspace' });
  }
});

// Get personal workspace (auto-creates if missing)
workspacesRouter.get('/personal', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    const workspace = await workspaceService.getOrCreatePersonalWorkspace(userId);

    res.json(workspace);
  } catch (error) {
    console.error('Get personal workspace error:', error);
    res.status(500).json({ error: 'Failed to get personal workspace' });
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

    const result = await workspaceService.createWorkspace(userId, name, description || '');

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    // Notify the user via WebSocket that a workspace was created
    if (workspaceWsHandler) {
      workspaceWsHandler.notifyWorkspaceCreated(userId, result.data!.id, result.data!);
    }

    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get workspace
workspacesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id as string;

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
    const id = req.params.id as string;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    const result = await workspaceService.updateWorkspace(id, userId, updates);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    // Notify subscribers via WebSocket that the workspace was updated
    if (workspaceWsHandler) {
      workspaceWsHandler.notifyWorkspaceUpdated(id, result.data!);
      // Also notify the owner in case they're on the workspaces list page
      workspaceWsHandler.notifyUserWorkspacesChanged(userId, result.data!);
    }

    res.json(result.data);
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Delete workspace
workspacesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    const result = await workspaceService.deleteWorkspace(id, userId);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    // Notify subscribers via WebSocket that the workspace was deleted
    if (workspaceWsHandler) {
      workspaceWsHandler.notifyWorkspaceDeleted(id);
      // Also notify the user in case they're on the workspaces list page
      workspaceWsHandler.notifyUserWorkspacesChanged(userId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

// Add member to workspace
workspacesRouter.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id as string;
    const { memberId, role } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    if (!memberId) {
      res.status(400).json({ error: 'Member ID is required' });

      return;
    }

    const result = await workspaceService.addMember(id, userId, memberId, role as WorkspaceRole);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    // Notify via WebSocket
    if (workspaceWsHandler) {
      workspaceWsHandler.notifyWorkspaceUpdated(id, result.data!);
      // Notify the new member that they now have access
      workspaceWsHandler.notifyUserWorkspacesChanged(memberId, result.data!);
    }

    res.json(result.data);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from workspace
workspacesRouter.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    const result = await workspaceService.removeMember(id, userId, memberId);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    // Notify via WebSocket
    if (workspaceWsHandler) {
      workspaceWsHandler.notifyWorkspaceUpdated(id, result.data!);
      // Notify the removed member that they lost access
      workspaceWsHandler.notifyUserWorkspacesChanged(memberId);
    }

    res.json(result.data);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Update member role
workspacesRouter.patch('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    if (!role) {
      res.status(400).json({ error: 'Role is required' });

      return;
    }

    const result = await workspaceService.updateMemberRole(id, userId, memberId, role as WorkspaceRole);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    // Notify via WebSocket
    if (workspaceWsHandler) {
      workspaceWsHandler.notifyWorkspaceUpdated(id, result.data!);
    }

    res.json(result.data);
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Get share token for workspace (owner only)
workspacesRouter.get('/:id/share', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id as string;

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
    const id = req.params.id as string;
    const { regenerate } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });

      return;
    }

    const result = await workspaceService.generateShareToken(id, userId, regenerate === true);

    if (!result.success) {
      res.status(getStatusForError(result.error!)).json({ error: result.error!.message, code: result.error!.code });

      return;
    }

    res.json({ token: result.data });
  } catch (error) {
    console.error('Generate share token error:', error);
    res.status(500).json({ error: 'Failed to generate share token' });
  }
});
