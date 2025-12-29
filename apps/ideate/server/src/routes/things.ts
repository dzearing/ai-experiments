import { Router, type Request, type Response } from 'express';
import { ThingService, type ThingType } from '../services/ThingService.js';
import { WorkspaceService } from '../services/WorkspaceService.js';
import { AgentThingsService } from '../services/AgentThingsService.js';
import type { WorkspaceWebSocketHandler } from '../websocket/WorkspaceWebSocketHandler.js';

const thingService = new ThingService();
const agentThingsService = new AgentThingsService();
const workspaceService = new WorkspaceService();

// Store the workspace handler reference for notifications
let workspaceWsHandler: WorkspaceWebSocketHandler | null = null;

export function setThingsWorkspaceHandler(handler: WorkspaceWebSocketHandler): void {
  workspaceWsHandler = handler;
}

export const thingsRouter = Router();

// =========================================================================
// List & Read
// =========================================================================

// List things (filter by workspaceId, parentId, type)
thingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;
    const parentId = req.query.parentId as string | undefined;
    const type = req.query.type as ThingType | undefined;

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

    let things = await thingService.listThings(userId, workspaceId, isWorkspaceMember);

    // Filter by parentId if provided
    if (parentId !== undefined) {
      if (parentId === '') {
        // Empty string means root things (no parents)
        things = things.filter(t => t.parentIds.length === 0);
      } else {
        things = things.filter(t => t.parentIds.includes(parentId));
      }
    }

    // Filter by type if provided
    if (type) {
      things = things.filter(t => t.type === type);
    }

    res.json(things);
  } catch (error) {
    console.error('[Things] List things error:', error);
    res.status(500).json({ error: 'Failed to list things' });
  }
});

// Get full graph for tree building
thingsRouter.get('/graph', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;

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

    const things = await thingService.getThingsGraph(userId, workspaceId, isWorkspaceMember);
    res.json(things);
  } catch (error) {
    console.error('[Things] Get graph error:', error);
    res.status(500).json({ error: 'Failed to get things graph' });
  }
});

// Get recently accessed things
thingsRouter.get('/recent', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;

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

    const things = await thingService.getRecentThings(userId, workspaceId, isWorkspaceMember, limit);
    res.json(things);
  } catch (error) {
    console.error('[Things] Get recent things error:', error);
    res.status(500).json({ error: 'Failed to get recent things' });
  }
});

// Search things by name/tags
thingsRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const query = req.query.q as string;
    const workspaceId = req.query.workspaceId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // If filtering by workspace, check if user has workspace access
    let isWorkspaceMember = false;
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      isWorkspaceMember = workspace !== null;
    }

    const things = await thingService.searchThings(userId, query, workspaceId, isWorkspaceMember);
    res.json(things);
  } catch (error) {
    console.error('[Things] Search things error:', error);
    res.status(500).json({ error: 'Failed to search things' });
  }
});

// Get single thing with content
thingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get thing first to check workspace access
    const thing = await thingService.getThing(id, userId, false);

    if (!thing) {
      // Try with workspace member check
      const thingInternal = await thingService.getThingInternal(id);
      if (thingInternal?.workspaceId) {
        const workspace = await workspaceService.getWorkspace(thingInternal.workspaceId, userId);
        if (workspace) {
          const thingWithAccess = await thingService.getThing(id, userId, true);
          if (thingWithAccess) {
            // Update last accessed
            await thingService.updateLastAccessed(id, userId);
            res.json(thingWithAccess);
            return;
          }
        }
      }
      res.status(404).json({ error: 'Thing not found' });
      return;
    }

    // Update last accessed
    await thingService.updateLastAccessed(id, userId);

    res.json(thing);
  } catch (error) {
    console.error('[Things] Get thing error:', error);
    res.status(500).json({ error: 'Failed to get thing' });
  }
});

// =========================================================================
// Create & Update
// =========================================================================

// Create thing
thingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, description, type, tags, parentIds, workspaceId, content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const thing = await thingService.createThing(userId, {
      name,
      description,
      type,
      tags,
      parentIds,
      workspaceId,
      content,
    });

    // Notify workspace subscribers of new thing
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, thing.id, 'thing', thing);
    }

    res.status(201).json(thing);
  } catch (error) {
    console.error('[Things] Create thing error:', error);
    res.status(500).json({ error: 'Failed to create thing' });
  }
});

// Update thing
thingsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { name, description, type, tags, parentIds, workspaceId, content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const thing = await thingService.updateThing(id, userId, {
      name,
      description,
      type,
      tags,
      parentIds,
      workspaceId,
      content,
    });

    if (!thing) {
      res.status(404).json({ error: 'Thing not found or access denied' });
      return;
    }

    // Notify workspace subscribers of updated thing
    if (thing.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(thing.workspaceId, thing.id, 'thing', thing);
    }

    res.json(thing);
  } catch (error) {
    console.error('[Things] Update thing error:', error);
    res.status(500).json({ error: 'Failed to update thing' });
  }
});

// Delete thing
thingsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get thing metadata before deletion for notification
    const thing = await thingService.getThing(id, userId, false);
    const workspaceId = thing?.workspaceId;

    const success = await thingService.deleteThing(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Thing not found or access denied' });
      return;
    }

    // Notify workspace subscribers of deleted thing
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, id, 'thing');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Things] Delete thing error:', error);
    res.status(500).json({ error: 'Failed to delete thing' });
  }
});

// =========================================================================
// Attachments
// =========================================================================

// Add attachment (link)
thingsRouter.post('/:id/attachments', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { filename, mimeType, url } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!filename || !mimeType) {
      res.status(400).json({ error: 'Filename and mimeType are required' });
      return;
    }

    const attachment = await thingService.addAttachment(id, userId, {
      filename,
      mimeType,
      url,
    });

    if (!attachment) {
      res.status(404).json({ error: 'Thing not found or access denied' });
      return;
    }

    // Get updated thing for notification
    const thing = await thingService.getThing(id, userId, false);
    if (thing?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(thing.workspaceId, thing.id, 'thing', {
        ...thing,
        _updateType: 'attachment',
      });
    }

    res.status(201).json(attachment);
  } catch (error) {
    console.error('[Things] Add attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

// Remove attachment
thingsRouter.delete('/:id/attachments/:attachmentId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, attachmentId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await thingService.removeAttachment(id, userId, attachmentId);

    if (!success) {
      res.status(404).json({ error: 'Attachment not found or access denied' });
      return;
    }

    // Get updated thing for notification
    const thing = await thingService.getThing(id, userId, false);
    if (thing?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(thing.workspaceId, thing.id, 'thing', {
        ...thing,
        _updateType: 'attachment',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Things] Remove attachment error:', error);
    res.status(500).json({ error: 'Failed to remove attachment' });
  }
});

// Download attachment
thingsRouter.get('/:id/attachments/:attachmentId/download', async (req: Request, res: Response) => {
  try {
    const { id, attachmentId } = req.params;

    const filePath = await thingService.getAttachmentPath(id, attachmentId);

    if (!filePath) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    res.download(filePath);
  } catch (error) {
    console.error('[Things] Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// =========================================================================
// Bulk Operations (for agent use)
// =========================================================================

// Create multiple things
thingsRouter.post('/bulk', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { things: thingsInput } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!Array.isArray(thingsInput) || thingsInput.length === 0) {
      res.status(400).json({ error: 'Array of things is required' });
      return;
    }

    const createdThings = await thingService.createThingsBulk(userId, thingsInput);

    // Notify workspace subscribers for each workspace-scoped thing
    if (workspaceWsHandler) {
      for (const thing of createdThings) {
        if (thing.workspaceId) {
          workspaceWsHandler.notifyResourceCreated(thing.workspaceId, thing.id, 'thing', thing);
        }
      }
    }

    res.status(201).json(createdThings);
  } catch (error) {
    console.error('[Things] Create things bulk error:', error);
    res.status(500).json({ error: 'Failed to create things' });
  }
});

// Delete multiple things
thingsRouter.delete('/bulk', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { ids } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Array of IDs is required' });
      return;
    }

    // Get things before deletion for notifications
    const thingsToDelete: { id: string; workspaceId?: string }[] = [];
    for (const id of ids) {
      const thing = await thingService.getThingInternal(id);
      if (thing) {
        thingsToDelete.push({ id: thing.id, workspaceId: thing.workspaceId });
      }
    }

    const deletedCount = await thingService.deleteThingsBulk(userId, ids);

    // Notify workspace subscribers for each workspace-scoped thing
    if (workspaceWsHandler) {
      for (const thing of thingsToDelete) {
        if (thing.workspaceId) {
          workspaceWsHandler.notifyResourceDeleted(thing.workspaceId, thing.id, 'thing');
        }
      }
    }

    res.json({ deleted: deletedCount });
  } catch (error) {
    console.error('[Things] Delete things bulk error:', error);
    res.status(500).json({ error: 'Failed to delete things' });
  }
});

// =========================================================================
// Agent Operations
// =========================================================================

// Bulk delete children of a thing
thingsRouter.delete('/agent/bulk-delete-children', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { parentId, excludeIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!parentId) {
      res.status(400).json({ error: 'Parent ID is required' });
      return;
    }

    const result = await agentThingsService.bulkDeleteChildren({
      parentId,
      excludeIds,
      ownerId: userId,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[Things] Agent bulk delete children error:', error);
    res.status(500).json({ error: 'Failed to bulk delete children' });
  }
});

// Split a thing into multiple things
thingsRouter.post('/agent/split', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { thingId, newThingNames } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!thingId || !newThingNames || !Array.isArray(newThingNames)) {
      res.status(400).json({ error: 'Thing ID and array of new thing names are required' });
      return;
    }

    const result = await agentThingsService.split({
      thingId,
      newThingNames,
      ownerId: userId,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Notify workspace subscribers for each created thing
    if (workspaceWsHandler && result.data) {
      for (const thing of result.data) {
        if (thing.workspaceId) {
          workspaceWsHandler.notifyResourceCreated(thing.workspaceId, thing.id, 'thing', thing);
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('[Things] Agent split error:', error);
    res.status(500).json({ error: 'Failed to split thing' });
  }
});

// Reparent a thing
thingsRouter.post('/agent/reparent', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { thingId, fromParentId, toParentId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!thingId || !toParentId) {
      res.status(400).json({ error: 'Thing ID and target parent ID are required' });
      return;
    }

    const result = await agentThingsService.reparent({
      thingId,
      fromParentId,
      toParentId,
      ownerId: userId,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Notify workspace subscribers
    if (workspaceWsHandler && result.data?.workspaceId) {
      workspaceWsHandler.notifyResourceUpdated(result.data.workspaceId, result.data.id, 'thing', result.data);
    }

    res.json(result);
  } catch (error) {
    console.error('[Things] Agent reparent error:', error);
    res.status(500).json({ error: 'Failed to reparent thing' });
  }
});

// Merge things
thingsRouter.post('/agent/merge', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { sourceIds, targetId, deleteSource } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!sourceIds || !Array.isArray(sourceIds) || !targetId) {
      res.status(400).json({ error: 'Source IDs array and target ID are required' });
      return;
    }

    const result = await agentThingsService.merge({
      sourceIds,
      targetId,
      deleteSource,
      ownerId: userId,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Notify workspace subscribers
    if (workspaceWsHandler && result.data?.workspaceId) {
      workspaceWsHandler.notifyResourceUpdated(result.data.workspaceId, result.data.id, 'thing', result.data);
    }

    res.json(result);
  } catch (error) {
    console.error('[Things] Agent merge error:', error);
    res.status(500).json({ error: 'Failed to merge things' });
  }
});

// Execute a natural language command
thingsRouter.post('/agent/execute', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { command } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!command) {
      res.status(400).json({ error: 'Command is required' });
      return;
    }

    const result = await agentThingsService.parseAndExecute(command, userId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[Things] Agent execute error:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});
