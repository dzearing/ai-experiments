import { Router, type Request, type Response } from 'express';
import { TopicService, type TopicType } from '../services/TopicService.js';
import { WorkspaceService } from '../services/WorkspaceService.js';
import { AgentTopicsService } from '../services/AgentTopicsService.js';
import type { WorkspaceWebSocketHandler } from '../websocket/WorkspaceWebSocketHandler.js';

const topicService = new TopicService();
const agentTopicsService = new AgentTopicsService();
const workspaceService = new WorkspaceService();

// Store the workspace handler reference for notifications
let workspaceWsHandler: WorkspaceWebSocketHandler | null = null;

export function setTopicsWorkspaceHandler(handler: WorkspaceWebSocketHandler): void {
  workspaceWsHandler = handler;
}

export const topicsRouter = Router();

// =========================================================================
// List & Read
// =========================================================================

// List topics (filter by workspaceId, parentId, type)
topicsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;
    const parentId = req.query.parentId as string | undefined;
    const type = req.query.type as TopicType | undefined;

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

    let topics = await topicService.listTopics(userId, workspaceId, isWorkspaceMember);

    // Filter by parentId if provided
    if (parentId !== undefined) {
      if (parentId === '') {
        // Empty string means root topics (no parents)
        topics = topics.filter(t => t.parentIds.length === 0);
      } else {
        topics = topics.filter(t => t.parentIds.includes(parentId));
      }
    }

    // Filter by type if provided
    if (type) {
      topics = topics.filter(t => t.type === type);
    }

    res.json(topics);
  } catch (error) {
    console.error('[Topics] List topics error:', error);
    res.status(500).json({ error: 'Failed to list topics' });
  }
});

// Get full graph for tree building
topicsRouter.get('/graph', async (req: Request, res: Response) => {
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

    const topics = await topicService.getTopicsGraph(userId, workspaceId, isWorkspaceMember);
    res.json(topics);
  } catch (error) {
    console.error('[Topics] Get graph error:', error);
    res.status(500).json({ error: 'Failed to get topics graph' });
  }
});

// Get recently accessed topics
topicsRouter.get('/recent', async (req: Request, res: Response) => {
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

    const topics = await topicService.getRecentTopics(userId, workspaceId, isWorkspaceMember, limit);
    res.json(topics);
  } catch (error) {
    console.error('[Topics] Get recent topics error:', error);
    res.status(500).json({ error: 'Failed to get recent topics' });
  }
});

// Search topics by name/tags
topicsRouter.get('/search', async (req: Request, res: Response) => {
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

    const topics = await topicService.searchTopics(userId, query, workspaceId, isWorkspaceMember);
    res.json(topics);
  } catch (error) {
    console.error('[Topics] Search topics error:', error);
    res.status(500).json({ error: 'Failed to search topics' });
  }
});

// Get single topic with content
topicsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get topic first to check workspace access
    const topic = await topicService.getTopic(id, userId, false);

    if (!topic) {
      // Try with workspace member check
      const topicInternal = await topicService.getTopicInternal(id);
      if (topicInternal?.workspaceId) {
        const workspace = await workspaceService.getWorkspace(topicInternal.workspaceId, userId);
        if (workspace) {
          const topicWithAccess = await topicService.getTopic(id, userId, true);
          if (topicWithAccess) {
            // Update last accessed
            await topicService.updateLastAccessed(id, userId);
            res.json(topicWithAccess);
            return;
          }
        }
      }
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    // Update last accessed
    await topicService.updateLastAccessed(id, userId);

    res.json(topic);
  } catch (error) {
    console.error('[Topics] Get topic error:', error);
    res.status(500).json({ error: 'Failed to get topic' });
  }
});

// =========================================================================
// Create & Update
// =========================================================================

// Create topic
topicsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, description, type, tags, parentIds, workspaceId, content, insertAfterId, links, properties, icon, color } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const topic = await topicService.createTopic(userId, {
      name,
      description,
      type,
      tags,
      parentIds,
      workspaceId,
      content,
      insertAfterId,
      links,
      properties,
      icon,
      color,
    });

    // Notify workspace subscribers of new topic
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, topic.id, 'topic', topic);
    }

    res.status(201).json(topic);
  } catch (error) {
    console.error('[Topics] Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Update topic
topicsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Only include fields that were actually sent in the request body
    // This ensures 'in' checks work correctly in updateTopic
    const updates: Record<string, unknown> = {};
    const allowedFields = ['name', 'description', 'type', 'tags', 'parentIds', 'workspaceId', 'content', 'links', 'properties', 'icon', 'color'];
    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    const topic = await topicService.updateTopic(id, userId, updates);

    if (!topic) {
      res.status(404).json({ error: 'Topic not found or access denied' });
      return;
    }

    // Notify workspace subscribers of updated topic
    if (topic.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.json(topic);
  } catch (error) {
    console.error('[Topics] Update topic error:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// Delete topic
topicsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get topic metadata before deletion for notification
    const topic = await topicService.getTopic(id, userId, false);
    const workspaceId = topic?.workspaceId;

    const success = await topicService.deleteTopic(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Topic not found or access denied' });
      return;
    }

    // Notify workspace subscribers of deleted topic
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, id, 'topic');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Topics] Delete topic error:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// =========================================================================
// Attachments
// =========================================================================

// Add attachment (link)
topicsRouter.post('/:id/attachments', async (req: Request, res: Response) => {
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

    const attachment = await topicService.addAttachment(id, userId, {
      filename,
      mimeType,
      url,
    });

    if (!attachment) {
      res.status(404).json({ error: 'Topic not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', {
        ...topic,
        _updateType: 'attachment',
      });
    }

    res.status(201).json(attachment);
  } catch (error) {
    console.error('[Topics] Add attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

// Remove attachment
topicsRouter.delete('/:id/attachments/:attachmentId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, attachmentId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await topicService.removeAttachment(id, userId, attachmentId);

    if (!success) {
      res.status(404).json({ error: 'Attachment not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', {
        ...topic,
        _updateType: 'attachment',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Topics] Remove attachment error:', error);
    res.status(500).json({ error: 'Failed to remove attachment' });
  }
});

// Download attachment
topicsRouter.get('/:id/attachments/:attachmentId/download', async (req: Request, res: Response) => {
  try {
    const { id, attachmentId } = req.params;

    const filePath = await topicService.getAttachmentPath(id, attachmentId);

    if (!filePath) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    res.download(filePath);
  } catch (error) {
    console.error('[Topics] Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// =========================================================================
// Links
// =========================================================================

// Add link
topicsRouter.post('/:id/links', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { type, label, target, description } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!type || !label || !target) {
      res.status(400).json({ error: 'Type, label, and target are required' });
      return;
    }

    const link = await topicService.addLink(id, userId, {
      type,
      label,
      target,
      description,
    });

    if (!link) {
      res.status(404).json({ error: 'Topic not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.status(201).json(link);
  } catch (error) {
    console.error('[Topics] Add link error:', error);
    res.status(500).json({ error: 'Failed to add link' });
  }
});

// Update link
topicsRouter.patch('/:id/links/:linkId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, linkId } = req.params;
    const { type, label, target, description } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const link = await topicService.updateLink(id, userId, linkId, {
      type,
      label,
      target,
      description,
    });

    if (!link) {
      res.status(404).json({ error: 'Link not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.json(link);
  } catch (error) {
    console.error('[Topics] Update link error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// Remove link
topicsRouter.delete('/:id/links/:linkId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, linkId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await topicService.removeLink(id, userId, linkId);

    if (!success) {
      res.status(404).json({ error: 'Link not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Topics] Remove link error:', error);
    res.status(500).json({ error: 'Failed to remove link' });
  }
});

// =========================================================================
// Properties
// =========================================================================

// Set properties (replaces all properties)
topicsRouter.put('/:id/properties', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { properties } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await topicService.setProperties(id, userId, properties);

    if (!success) {
      res.status(404).json({ error: 'Topic not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.json({ success: true, properties: topic?.properties });
  } catch (error) {
    console.error('[Topics] Set properties error:', error);
    res.status(500).json({ error: 'Failed to set properties' });
  }
});

// =========================================================================
// Documents (inline documents stored with the Topic)
// =========================================================================

// Get documents
topicsRouter.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const documents = await topicService.getDocuments(id, userId);
    res.json(documents);
  } catch (error) {
    console.error('[Topics] Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Add document
topicsRouter.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { title, content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const document = await topicService.addDocument(id, userId, {
      title,
      content: content || '',
    });

    if (!document) {
      res.status(404).json({ error: 'Topic not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.status(201).json(document);
  } catch (error) {
    console.error('[Topics] Add document error:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Update document
topicsRouter.patch('/:id/documents/:docId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, docId } = req.params;
    const { title, content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const document = await topicService.updateDocument(id, userId, docId, {
      title,
      content,
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.json(document);
  } catch (error) {
    console.error('[Topics] Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Remove document
topicsRouter.delete('/:id/documents/:docId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, docId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await topicService.removeDocument(id, userId, docId);

    if (!success) {
      res.status(404).json({ error: 'Document not found or access denied' });
      return;
    }

    // Get updated topic for notification
    const topic = await topicService.getTopic(id, userId, false);
    if (topic?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(topic.workspaceId, topic.id, 'topic', topic);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Topics] Remove document error:', error);
    res.status(500).json({ error: 'Failed to remove document' });
  }
});

// =========================================================================
// Bulk Operations (for agent use)
// =========================================================================

// Create multiple topics
topicsRouter.post('/bulk', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { topics: topicsInput } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!Array.isArray(topicsInput) || topicsInput.length === 0) {
      res.status(400).json({ error: 'Array of topics is required' });
      return;
    }

    const createdTopics = await topicService.createTopicsBulk(userId, topicsInput);

    // Notify workspace subscribers for each workspace-scoped topic
    if (workspaceWsHandler) {
      for (const topic of createdTopics) {
        if (topic.workspaceId) {
          workspaceWsHandler.notifyResourceCreated(topic.workspaceId, topic.id, 'topic', topic);
        }
      }
    }

    res.status(201).json(createdTopics);
  } catch (error) {
    console.error('[Topics] Create topics bulk error:', error);
    res.status(500).json({ error: 'Failed to create topics' });
  }
});

// Delete multiple topics
topicsRouter.delete('/bulk', async (req: Request, res: Response) => {
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

    // Get topics before deletion for notifications
    const topicsToDelete: { id: string; workspaceId?: string }[] = [];
    for (const id of ids) {
      const topic = await topicService.getTopicInternal(id);
      if (topic) {
        topicsToDelete.push({ id: topic.id, workspaceId: topic.workspaceId });
      }
    }

    const deletedCount = await topicService.deleteTopicsBulk(userId, ids);

    // Notify workspace subscribers for each workspace-scoped topic
    if (workspaceWsHandler) {
      for (const topic of topicsToDelete) {
        if (topic.workspaceId) {
          workspaceWsHandler.notifyResourceDeleted(topic.workspaceId, topic.id, 'topic');
        }
      }
    }

    res.json({ deleted: deletedCount });
  } catch (error) {
    console.error('[Topics] Delete topics bulk error:', error);
    res.status(500).json({ error: 'Failed to delete topics' });
  }
});

// =========================================================================
// Agent Operations
// =========================================================================

// Bulk delete children of a topic
topicsRouter.delete('/agent/bulk-delete-children', async (req: Request, res: Response) => {
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

    const result = await agentTopicsService.bulkDeleteChildren({
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
    console.error('[Topics] Agent bulk delete children error:', error);
    res.status(500).json({ error: 'Failed to bulk delete children' });
  }
});

// Split a topic into multiple topics
topicsRouter.post('/agent/split', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { topicId, newTopicNames } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!topicId || !newTopicNames || !Array.isArray(newTopicNames)) {
      res.status(400).json({ error: 'Topic ID and array of new topic names are required' });
      return;
    }

    const result = await agentTopicsService.split({
      topicId,
      newTopicNames,
      ownerId: userId,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Notify workspace subscribers for each created topic
    if (workspaceWsHandler && result.data) {
      for (const topic of result.data) {
        if (topic.workspaceId) {
          workspaceWsHandler.notifyResourceCreated(topic.workspaceId, topic.id, 'topic', topic);
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('[Topics] Agent split error:', error);
    res.status(500).json({ error: 'Failed to split topic' });
  }
});

// Reparent a topic
topicsRouter.post('/agent/reparent', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { topicId, fromParentId, toParentId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!topicId || !toParentId) {
      res.status(400).json({ error: 'Topic ID and target parent ID are required' });
      return;
    }

    const result = await agentTopicsService.reparent({
      topicId,
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
      workspaceWsHandler.notifyResourceUpdated(result.data.workspaceId, result.data.id, 'topic', result.data);
    }

    res.json(result);
  } catch (error) {
    console.error('[Topics] Agent reparent error:', error);
    res.status(500).json({ error: 'Failed to reparent topic' });
  }
});

// Merge topics
topicsRouter.post('/agent/merge', async (req: Request, res: Response) => {
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

    const result = await agentTopicsService.merge({
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
      workspaceWsHandler.notifyResourceUpdated(result.data.workspaceId, result.data.id, 'topic', result.data);
    }

    res.json(result);
  } catch (error) {
    console.error('[Topics] Agent merge error:', error);
    res.status(500).json({ error: 'Failed to merge topics' });
  }
});

// Execute a natural language command
topicsRouter.post('/agent/execute', async (req: Request, res: Response) => {
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

    const result = await agentTopicsService.parseAndExecute(command, userId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[Topics] Agent execute error:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// =========================================================================
// Utilities
// =========================================================================

// Open a file or folder with the system's default application
topicsRouter.post('/open-path', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    // Accept both 'path' and 'filePath' for backwards compatibility
    const filePath = req.body.path || req.body.filePath;
    const { editor = 'vscode' } = req.body; // 'vscode', 'finder', or 'default'

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!filePath || typeof filePath !== 'string') {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    // Expand tilde to home directory
    let expandedPath = filePath;
    if (filePath === '~' || filePath.startsWith('~/')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      expandedPath = filePath === '~' ? homeDir : filePath.replace(/^~/, homeDir);
    }

    // Security: Only allow absolute paths and basic validation
    if (!expandedPath.startsWith('/') && !expandedPath.match(/^[A-Za-z]:\\/)) {
      res.status(400).json({ error: 'Invalid path format' });
      return;
    }

    // Use the appropriate command based on platform and editor preference
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const platform = process.platform;
    let command: string;

    if (editor === 'vscode') {
      // Open in VS Code (works on all platforms if code is in PATH)
      command = `code "${expandedPath}"`;
    } else if (editor === 'finder' || editor === 'default') {
      if (platform === 'darwin') {
        // macOS
        command = `open "${expandedPath}"`;
      } else if (platform === 'win32') {
        // Windows
        command = `start "" "${expandedPath}"`;
      } else {
        // Linux and others
        command = `xdg-open "${expandedPath}"`;
      }
    } else {
      // Default to VS Code
      command = `code "${expandedPath}"`;
    }

    await execAsync(command);
    res.json({ success: true });
  } catch (error) {
    console.error('[Topics] Open path error:', error);
    res.status(500).json({ error: 'Failed to open path' });
  }
});
