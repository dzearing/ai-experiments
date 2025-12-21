import { Router, type Request, type Response } from 'express';
import { ChatRoomService } from '../services/ChatRoomService.js';
import { WorkspaceService } from '../services/WorkspaceService.js';

export const chatroomsRouter = Router();
const chatRoomService = new ChatRoomService();
const workspaceService = new WorkspaceService();

// List chat rooms (requires workspaceId query param)
chatroomsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: 'Workspace ID required' });
      return;
    }

    // Check if user has workspace access
    const workspace = await workspaceService.getWorkspace(workspaceId, userId);
    const isWorkspaceMember = workspace !== null;

    const chatRooms = await chatRoomService.listChatRooms(userId, workspaceId, isWorkspaceMember);
    res.json(chatRooms);
  } catch (error) {
    console.error('List chat rooms error:', error);
    res.status(500).json({ error: 'Failed to list chat rooms' });
  }
});

// Create chat room
chatroomsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ error: 'Workspace ID is required' });
      return;
    }

    const chatRoom = await chatRoomService.createChatRoom(userId, name, workspaceId);
    res.status(201).json(chatRoom);
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// Helper to check if user is a workspace member for a chat room
async function isWorkspaceMemberForChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
  const chatRoomMeta = await chatRoomService.getChatRoomInternal(chatRoomId);
  if (!chatRoomMeta) return false;

  const workspace = await workspaceService.getWorkspace(chatRoomMeta.workspaceId, userId);
  return workspace !== null;
}

// Get chat room
chatroomsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Check workspace membership for access
    const isWorkspaceMember = await isWorkspaceMemberForChatRoom(id, userId);
    const chatRoom = await chatRoomService.getChatRoom(id, userId, isWorkspaceMember);

    if (!chatRoom) {
      res.status(404).json({ error: 'Chat room not found' });
      return;
    }

    res.json(chatRoom);
  } catch (error) {
    console.error('Get chat room error:', error);
    res.status(500).json({ error: 'Failed to get chat room' });
  }
});

// Update chat room
chatroomsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const chatRoom = await chatRoomService.updateChatRoom(id, userId, updates);

    if (!chatRoom) {
      res.status(404).json({ error: 'Chat room not found' });
      return;
    }

    res.json(chatRoom);
  } catch (error) {
    console.error('Update chat room error:', error);
    res.status(500).json({ error: 'Failed to update chat room' });
  }
});

// Delete chat room
chatroomsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await chatRoomService.deleteChatRoom(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Chat room not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat room error:', error);
    res.status(500).json({ error: 'Failed to delete chat room' });
  }
});

// Get messages from a chat room
chatroomsRouter.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Verify access to chat room (check workspace membership)
    const isWorkspaceMember = await isWorkspaceMemberForChatRoom(id, userId);
    const chatRoom = await chatRoomService.getChatRoom(id, userId, isWorkspaceMember);
    if (!chatRoom) {
      res.status(404).json({ error: 'Chat room not found' });
      return;
    }

    const messages = await chatRoomService.getMessages(id, limit, before);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message to a chat room (REST fallback for when WebSocket is not available)
chatroomsRouter.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userName = req.headers['x-user-name'] as string || 'Anonymous';
    const userColor = req.headers['x-user-color'] as string || '#888888';
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Verify access to chat room (check workspace membership)
    const isWorkspaceMember = await isWorkspaceMemberForChatRoom(id, userId);
    const chatRoom = await chatRoomService.getChatRoom(id, userId, isWorkspaceMember);
    if (!chatRoom) {
      res.status(404).json({ error: 'Chat room not found' });
      return;
    }

    const message = await chatRoomService.addMessage(id, userId, userName, userColor, content.trim());
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
